"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { submitReviewAction, type ReviewFormState } from "@/app/review/actions";
import { shootTypes, site, whatsappLink } from "@/content/site";
import { LIMITS, RATING_WORDS } from "@/lib/review-shared";
import { StarIcon } from "./Stars";

const label = "text-[10px] uppercase tracking-[0.25em] text-muted";
const field =
  "w-full border-b border-line bg-transparent py-3 text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none";
const errorText = "mt-2 text-sm text-[#e57373]";

export default function ReviewForm({ open }: { open: boolean }) {
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(submitReviewAction, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [shoot, setShoot] = useState("");
  const [text, setText] = useState("");

  if (!open) {
    return (
      <div className="border border-line bg-surface/90 p-8 backdrop-blur md:p-10">
        <p className="font-serif text-3xl">Reviews open very soon.</p>
        <p className="mt-4 text-muted">Until then, we&apos;d love to hear from you on WhatsApp.</p>
        <a
          href={whatsappLink(`Hi ${site.photographer.split(" ")[0]}! Here's a few words about our shoot: `)}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block bg-accent px-8 py-4 text-xs font-medium uppercase tracking-[0.25em] text-background hover:bg-foreground"
        >
          Send on WhatsApp
        </a>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="border border-line bg-surface/90 p-8 text-center backdrop-blur md:p-12" role="status">
        <span className="mx-auto flex w-fit gap-1 text-accent">
          {[1, 2, 3, 4, 5].map((n) => (
            <StarIcon key={n} className="h-6 w-6" />
          ))}
        </span>
        <p className="mt-6 font-serif text-4xl font-light">Thank you{state.name ? `, ${state.name.split(" ")[0]}` : ""}!</p>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-muted">
          Your review is with {site.photographer.split(" ")[0]} now and will appear on the site once it&apos;s approved.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/#reviews"
            className="bg-accent px-8 py-4 text-xs font-medium uppercase tracking-[0.25em] text-background hover:bg-foreground"
          >
            Back to the site
          </Link>
          <a
            href={site.instagram}
            target="_blank"
            rel="noreferrer"
            className="border border-foreground/40 px-8 py-4 text-xs uppercase tracking-[0.25em] hover:border-accent hover:text-accent"
          >
            Follow on Instagram
          </a>
        </div>
      </div>
    );
  }

  const shown = hover || rating;
  const err = (f: ReviewFormState["field"]) => (state.field === f ? state.error : undefined);

  return (
    <form
      // Submitted by hand rather than via `action`, so React doesn't reset the form (and the chosen stars) after an error.
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="space-y-8 border border-line bg-surface/90 p-8 backdrop-blur md:p-10"
    >
      <fieldset>
        <legend className={label}>Your rating</legend>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="-ml-1 flex" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} onMouseEnter={() => setHover(n)} className="cursor-pointer p-1">
                <input
                  type="radio"
                  name="rating"
                  value={n}
                  checked={rating === n}
                  onChange={() => setRating(n)}
                  className="peer sr-only"
                />
                <StarIcon
                  className={`h-9 w-9 rounded-sm transition-[color,transform] duration-200 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent md:h-10 md:w-10 ${
                    n <= shown ? "scale-105 text-accent" : "text-foreground/20 hover:text-foreground/40"
                  }`}
                />
                <span className="sr-only">
                  {n} star{n > 1 ? "s" : ""} — {RATING_WORDS[n]}
                </span>
              </label>
            ))}
          </div>
          <span aria-hidden className="min-h-7 font-serif text-xl italic text-accent">
            {RATING_WORDS[shown]}
          </span>
        </div>
        {err("rating") && <p className={errorText}>{err("rating")}</p>}
      </fieldset>

      <div className="grid gap-8 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Your name</span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={LIMITS.nameMax}
            autoComplete="name"
            placeholder="e.g. Priya & Rohan"
            aria-invalid={Boolean(err("name"))}
            className={field}
          />
          {err("name") && <span className={`block ${errorText}`}>{err("name")}</span>}
        </label>
        <label className="block">
          <span className={label}>Your shoot (optional)</span>
          <select
            name="shoot"
            value={shoot}
            onChange={(e) => setShoot(e.target.value)}
            className={`${field} [&>option]:bg-surface ${shoot ? "" : "text-muted/70"}`}
          >
            <option value="">Choose…</option>
            {shootTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="flex items-baseline justify-between gap-4">
          <span className={label}>Your review</span>
          <span className={`text-[10px] tabular-nums ${text.length > LIMITS.textMax ? "text-[#e57373]" : "text-muted/70"}`}>
            {text.length}/{LIMITS.textMax}
          </span>
        </span>
        <textarea
          name="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          maxLength={LIMITS.textMax + 50}
          placeholder="How did the shoot feel? What do you love about the photos?"
          aria-invalid={Boolean(err("text"))}
          className={`${field} resize-none leading-relaxed`}
        />
        {err("text") && <span className={`block ${errorText}`}>{err("text")}</span>}
      </label>

      {/* Honeypot for bots — hidden from people and screen readers. */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-px w-px opacity-0" />

      {state.error && !state.field && (
        <p role="alert" className="text-sm text-[#e57373]">
          {state.error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-accent py-4 text-xs font-medium uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground disabled:opacity-60"
        >
          {pending ? "Sending…" : "Post my review"}
        </button>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted">
          Only your name, rating and words are shown. Reviews appear once {site.photographer.split(" ")[0]} approves them.
        </p>
      </div>
    </form>
  );
}
