"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { shootTypes, site } from "@/content/site";
import { sendWhatsAppAlert } from "@/lib/callmebot";
import { checkReview, type ReviewField } from "@/lib/review-shared";
import { submitReview } from "@/lib/reviews";
import { storageMode } from "@/lib/storage";

export type ReviewFormState = { ok?: boolean; name?: string; error?: string; field?: ReviewField };

const HOUR = 60 * 60 * 1000;
const PER_IP = 3;
const PER_INSTANCE = 40;
// Best-effort per-instance limits — enough to stop one person or bot flooding the inbox.
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (key: string) => (recent.get(key) ?? []).filter((t) => now - t < HOUR);
  const mine = hits(ip);
  const all = hits("*");
  if (mine.length >= PER_IP || all.length >= PER_INSTANCE) return true;
  recent.set(ip, [...mine, now]);
  recent.set("*", [...all, now]);
  return false;
}

export async function submitReviewAction(_: ReviewFormState, form: FormData): Promise<ReviewFormState> {
  const get = (key: string) => String(form.get(key) ?? "");

  // Honeypot: hidden from people, filled in by bots. Pretend it worked.
  if (get("company")) return { ok: true, name: "" };

  const checked = checkReview(
    { name: get("name"), rating: Number(get("rating")), text: get("text"), shoot: get("shoot") },
    shootTypes,
  );
  if (!checked.ok) return { error: checked.error, field: checked.field };

  if (storageMode() === "none") return { error: "Reviews open very soon — please try again in a little while." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) return { error: "Thanks! We've already received your review — please try again later if you'd like to send another." };

  try {
    const review = await submitReview(checked.value);
    const stars = "⭐".repeat(review.rating);
    after(() =>
      sendWhatsAppAlert(
        [
          `${stars} *New review* — website`,
          "",
          `*From:* ${review.name}`,
          review.shoot ? `*Shoot:* ${review.shoot}` : null,
          "",
          `“${review.text.length > 400 ? `${review.text.slice(0, 400)}…` : review.text}”`,
          "",
          `Approve it: ${site.url}/admin?tab=reviews`,
        ]
          .filter((line) => line !== null)
          .join("\n"),
      ),
    );
    return { ok: true, name: review.name };
  } catch (err) {
    console.error("Review submit failed:", err);
    return { error: "Sorry — your review couldn't be sent just now. Please try again in a minute." };
  }
}
