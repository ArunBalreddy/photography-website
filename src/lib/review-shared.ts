// Review types, limits and validation shared by the review form (client) and the server.

export type Review = {
  id: string;
  name: string;
  /** 1–5 stars */
  rating: number;
  text: string;
  /** One of shootTypes, when the reviewer picked one. */
  shoot?: string;
  /** ISO time the review was sent. */
  createdAt: string;
};

/** A review the admin has dealt with: on the site, or hidden from it. */
export type ModeratedReview = Review & { hidden: boolean; approvedAt: string; reply?: string };

/** What the public site receives. */
export type PublicReview = Omit<ModeratedReview, "hidden" | "approvedAt">;

/** pending = the inbox: live on the site already when publishing is instant, otherwise waiting for approval. */
export type ReviewsAdminData = { pending: Review[]; moderated: ModeratedReview[]; requireApproval: boolean };

export const LIMITS = { nameMin: 2, nameMax: 60, textMin: 20, textMax: 1200, reply: 600 };

export const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Loved it"];

const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩﻿]/g;

/** Single line: control/bidi characters removed, whitespace collapsed. */
export const cleanLine = (s: string) => s.normalize("NFC").replace(INVISIBLE, "").replace(/\s+/g, " ").trim();

/** Paragraphs kept (at most one blank line between them), everything else as cleanLine. */
export const cleanText = (s: string) =>
  s
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(INVISIBLE, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

// Spam nearly always carries a link; real reviews don't. (Short list of TLDs so "great.In the end" isn't caught.)
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|xyz|ru)\b)/i;

export type ReviewField = "name" | "rating" | "text" | "shoot";

/** Validates a submitted review. Returns the cleaned values, or the first problem found. */
export function checkReview(
  input: { name: string; rating: number; text: string; shoot: string },
  shootTypes: readonly string[],
): { ok: true; value: Omit<Review, "id" | "createdAt"> } | { ok: false; field: ReviewField; error: string } {
  const name = cleanLine(input.name);
  const text = cleanText(input.text);
  const shoot = cleanLine(input.shoot);
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5)
    return { ok: false, field: "rating", error: "Please choose a star rating." };
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax)
    return { ok: false, field: "name", error: "Please add your name." };
  if (shoot && !shootTypes.includes(shoot)) return { ok: false, field: "shoot", error: "Please pick a shoot type from the list." };
  if (text.length < LIMITS.textMin)
    return { ok: false, field: "text", error: `Please write a little more (at least ${LIMITS.textMin} characters).` };
  if (text.length > LIMITS.textMax) return { ok: false, field: "text", error: `Please keep it under ${LIMITS.textMax} characters.` };
  if (LINK.test(text) || LINK.test(name)) return { ok: false, field: "text", error: "Please leave out links and web addresses." };
  return { ok: true, value: { name, rating: input.rating, text, ...(shoot ? { shoot } : {}) } };
}

const isStr = (v: unknown, max: number): v is string => typeof v === "string" && v.length <= max;
export const REVIEW_ID = /^[A-Za-z0-9_-]{16,32}$/;

/** Accepts a stored review only if every field has the right shape (storage is never trusted blindly). */
export function asReview(x: unknown): Review | null {
  if (!x || typeof x !== "object") return null;
  const r = x as Record<string, unknown>;
  if (
    !isStr(r.id, 32) ||
    !REVIEW_ID.test(r.id) ||
    !isStr(r.name, LIMITS.nameMax) ||
    !isStr(r.text, LIMITS.textMax) ||
    !Number.isInteger(r.rating) ||
    (r.rating as number) < 1 ||
    (r.rating as number) > 5 ||
    !isStr(r.createdAt, 40) ||
    Number.isNaN(Date.parse(r.createdAt)) ||
    (r.shoot !== undefined && !isStr(r.shoot, 60))
  )
    return null;
  return {
    id: r.id,
    name: r.name,
    rating: r.rating as number,
    text: r.text,
    createdAt: r.createdAt,
    ...(r.shoot ? { shoot: r.shoot as string } : {}),
  };
}

export function asModerated(x: unknown): ModeratedReview | null {
  const base = asReview(x);
  if (!base) return null;
  const r = x as Record<string, unknown>;
  if (typeof r.hidden !== "boolean" || !isStr(r.approvedAt, 40) || (r.reply !== undefined && !isStr(r.reply, LIMITS.reply)))
    return null;
  return { ...base, hidden: r.hidden, approvedAt: r.approvedAt, ...(r.reply ? { reply: r.reply as string } : {}) };
}

/** "2026-10-21T…" → "October 2026" */
export const reviewMonth = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" });

export const newestFirst = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
