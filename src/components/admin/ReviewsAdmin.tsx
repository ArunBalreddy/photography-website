"use client";

import { useEffect, useRef, useState } from "react";
import {
  approveReviewAction,
  deleteReviewAction,
  discardReviewAction,
  loadReviewsAction,
  replyToReviewAction,
  setReviewHiddenAction,
  type ReviewsResult,
} from "@/app/admin/actions";
import { site } from "@/content/site";
import { LIMITS, type ModeratedReview, type Review, type ReviewsAdminData } from "@/lib/review-shared";
import Stars from "../reviews/Stars";

const btn =
  "inline-flex h-9 items-center justify-center border border-line px-3 text-[11px] uppercase tracking-[0.15em] text-foreground/80 transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-35";
const danger = `${btn} hover:!border-[#e57373] hover:!text-[#e57373]`;
const primary =
  "inline-flex h-9 items-center justify-center bg-accent px-4 text-[11px] font-medium uppercase tracking-[0.15em] text-background transition-colors hover:bg-foreground disabled:pointer-events-none disabled:opacity-40";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

const REVIEW_LINK = `${site.url}/review`;
const ASK_TEXT = `Hi! Thank you for choosing ${site.fullName} 🙏 If you have a minute, I'd love a few words about your shoot — it really helps: ${REVIEW_LINK}`;
const REFRESH_MS = 2 * 60 * 1000;

export default function ReviewsAdmin({
  data,
  setData,
  loadError,
  readOnly,
}: {
  data: ReviewsAdminData | null;
  setData: (d: ReviewsAdminData) => void;
  loadError?: string;
  readOnly: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>(loadError);
  const [copied, setCopied] = useState(false);
  const lastLoad = useRef(0);

  const run = async (key: string, call: () => Promise<ReviewsResult>) => {
    setBusy(key);
    const res = await call();
    setBusy(null);
    if (res.ok) {
      setData(res.data);
      setError(undefined);
      lastLoad.current = Date.now();
    } else setError(res.error);
    return res.ok;
  };

  // New reviews arrive while the dashboard is open: check every couple of minutes and when you come back to the tab.
  useEffect(() => {
    lastLoad.current = Date.now();
    const tick = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastLoad.current < 30_000) return;
      lastLoad.current = Date.now();
      loadReviewsAction().then((res) => (res.ok ? setData(res.data) : setError(res.error)));
    };
    const id = setInterval(tick, REFRESH_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [setData]);

  const pending = data?.pending ?? [];
  const moderated = data?.moderated ?? [];
  const live = moderated.filter((r) => !r.hidden);
  const average = live.length ? live.reduce((s, r) => s + r.rating, 0) / live.length : 0;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(REVIEW_LINK);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this link:", REVIEW_LINK);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-8">
      {/* summary + ask */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-wrap items-center gap-8 border border-line bg-surface p-6">
          <div>
            <p className="font-serif text-5xl font-light leading-none">{live.length ? average.toFixed(1) : "—"}</p>
            <div className="mt-2">
              <Stars value={Math.round(average * 10) / 10} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <dt className="text-muted">On the site</dt>
            <dd>{live.length}</dd>
            <dt className="text-muted">Waiting</dt>
            <dd className={pending.length ? "text-accent" : ""}>{pending.length}</dd>
            <dt className="text-muted">Hidden</dt>
            <dd>{moderated.length - live.length}</dd>
          </dl>
          <button
            className={`${btn} ml-auto`}
            disabled={busy !== null}
            onClick={() => run("refresh", loadReviewsAction)}
          >
            {busy === "refresh" ? "Checking…" : "Check for new"}
          </button>
        </div>

        <div className="border border-line bg-surface p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">Ask a client for a review</p>
          <p className="mt-2 text-sm text-muted">Send this link after a shoot — it opens the review form.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate border border-line px-3 py-2 text-xs">{REVIEW_LINK}</code>
            <button className={btn} onClick={copyLink}>
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(ASK_TEXT)}`} target="_blank" rel="noreferrer">
              Send on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="border border-[#e57373]/50 bg-[#e57373]/10 px-6 py-4 text-sm">
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 flex items-baseline gap-3 font-serif text-3xl">
          Waiting for approval
          <span className="font-sans text-sm text-muted">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <p className="border border-dashed border-line px-6 py-8 text-sm text-muted">
            No new reviews right now. New ones appear here first — nothing reaches the site until you approve it.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-col border border-accent/40 bg-surface p-6">
                <ReviewBody review={r} />
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    className={primary}
                    disabled={readOnly || busy !== null}
                    onClick={() => run(r.id, () => approveReviewAction(r.id))}
                  >
                    {busy === r.id ? "Publishing…" : "Approve & publish"}
                  </button>
                  <button
                    className={danger}
                    disabled={readOnly || busy !== null}
                    onClick={() =>
                      confirm(`Delete the review from ${r.name}? It won't appear on the site.`) &&
                      run(r.id, () => discardReviewAction(r.id))
                    }
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-baseline gap-3 font-serif text-3xl">
          Published reviews
          <span className="font-sans text-sm text-muted">{moderated.length}</span>
        </h2>
        {moderated.length === 0 ? (
          <p className="border border-dashed border-line px-6 py-8 text-sm text-muted">Approved reviews will be listed here.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {moderated.map((r) => (
              <ModeratedCard key={r.id} review={r} busy={busy} readOnly={readOnly} run={run} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReviewBody({ review: r }: { review: Review }) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars value={r.rating} />
        <span className="text-[11px] text-muted">{when(r.createdAt)}</span>
      </div>
      <p className="mt-4 whitespace-pre-line font-serif text-lg leading-relaxed">{r.text}</p>
      <p className="mt-4 text-sm">
        {r.name}
        {r.shoot && <span className="text-muted"> · {r.shoot}</span>}
      </p>
    </>
  );
}

function ModeratedCard({
  review: r,
  busy,
  readOnly,
  run,
}: {
  review: ModeratedReview;
  busy: string | null;
  readOnly: boolean;
  run: (key: string, call: () => Promise<ReviewsResult>) => Promise<boolean>;
}) {
  const [reply, setReply] = useState(r.reply ?? "");
  const changed = reply.trim() !== (r.reply ?? "");
  const disabled = readOnly || busy !== null;
  return (
    <li className={`flex flex-col border border-line bg-surface p-6 ${r.hidden ? "opacity-60" : ""}`}>
      <span
        className={`mb-4 w-fit px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
          r.hidden ? "bg-foreground/10 text-muted" : "bg-[#25D366]/15 text-[#25D366]"
        }`}
      >
        {r.hidden ? "Hidden" : "On the site"}
      </span>
      <ReviewBody review={r} />
      <label className="mt-5 block">
        <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Your reply (optional, shown under the review)</span>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          maxLength={LIMITS.reply}
          disabled={readOnly}
          placeholder="Thank you so much! It was a joy to photograph your day."
          className="mt-1 w-full resize-none border-b border-line bg-transparent py-2 text-sm placeholder:text-muted/50 focus:border-accent focus:outline-none"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        {changed && (
          <button className={primary} disabled={disabled} onClick={() => run(`${r.id}-reply`, () => replyToReviewAction(r.id, reply))}>
            {busy === `${r.id}-reply` ? "Saving…" : "Save reply"}
          </button>
        )}
        <button className={btn} disabled={disabled} onClick={() => run(r.id, () => setReviewHiddenAction(r.id, !r.hidden))}>
          {busy === r.id ? "Saving…" : r.hidden ? "Show on site" : "Hide from site"}
        </button>
        <button
          className={`${danger} ml-auto`}
          disabled={disabled}
          onClick={() => confirm(`Delete the review from ${r.name} permanently?`) && run(r.id, () => deleteReviewAction(r.id))}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
