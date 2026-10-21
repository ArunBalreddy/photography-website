"use client";

import { useState } from "react";
import { site } from "@/content/site";
import { reviewMonth, type PublicReview } from "@/lib/review-shared";
import Reveal from "../Reveal";
import Stars from "./Stars";

const PAGE = 6;
const LONG = 360; // characters before "Read more"

const initials = (name: string) =>
  name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

export default function ReviewList({ reviews }: { reviews: PublicReview[] }) {
  const [shown, setShown] = useState(PAGE);
  return (
    <>
      <div className="grid items-start gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
        {reviews.slice(0, shown).map((r, i) => (
          <Reveal key={r.id} delay={(i % 3) * 120}>
            <ReviewCard review={r} />
          </Reveal>
        ))}
      </div>
      {shown < reviews.length && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setShown((n) => n + PAGE)}
            className="text-xs uppercase tracking-[0.25em] text-foreground/80 underline-offset-8 hover:text-accent hover:underline"
          >
            Show more reviews ({reviews.length - shown})
          </button>
        </div>
      )}
    </>
  );
}

function ReviewCard({ review: r }: { review: PublicReview }) {
  const [open, setOpen] = useState(false);
  const long = r.text.length > LONG;
  return (
    <figure className="relative border border-line bg-background/50 p-7 md:p-8">
      <span aria-hidden className="absolute right-6 top-3 font-serif text-7xl leading-none text-accent/25">
        ”
      </span>
      <Stars value={r.rating} />
      <blockquote
        className={`mt-5 whitespace-pre-line font-serif text-xl font-light leading-relaxed md:text-[1.35rem] ${
          long && !open ? "line-clamp-[7]" : ""
        }`}
      >
        {r.text}
      </blockquote>
      {long && (
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-3 text-[11px] uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
      <figcaption className="mt-7 flex items-center gap-3">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/50 font-serif text-base text-accent"
        >
          {initials(r.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm">{r.name}</span>
          <span className="block text-[10px] uppercase tracking-[0.2em] text-muted">
            {r.shoot ? `${r.shoot} · ` : ""}
            {reviewMonth(r.createdAt)}
          </span>
        </span>
      </figcaption>
      {r.reply && (
        <div className="mt-6 border-l border-accent/60 pl-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-accent">Reply from {site.photographer.split(" ")[0]}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{r.reply}</p>
        </div>
      )}
    </figure>
  );
}
