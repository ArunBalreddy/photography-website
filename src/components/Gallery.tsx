"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { categories, photos, type Category } from "@/content/site";
import SectionHeading from "./SectionHeading";

type Filter = "All" | Category;

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>("All");
  const [active, setActive] = useState<number | null>(null);

  const visible = filter === "All" ? photos : photos.filter((p) => p.category === filter);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) => setActive((i) => (i === null ? i : (i + dir + visible.length) % visible.length)),
    [visible.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, step]);

  const current = active === null ? null : visible[active];

  return (
    <section id="work" className="mx-auto max-w-7xl px-6 py-28 md:py-36">
      <div className="mb-14 flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <SectionHeading eyebrow="Selected work" title="Portfolio" />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter portfolio">
          {(["All", ...categories] as Filter[]).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              onClick={() => setFilter(c)}
              className={`border px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                filter === c
                  ? "border-accent bg-accent text-background"
                  : "border-line text-foreground/70 hover:border-foreground/50 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid auto-rows-[260px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((photo, i) => (
          <button
            key={photo.src}
            onClick={() => setActive(i)}
            className={`group relative overflow-hidden bg-surface text-left ${photo.tall ? "sm:row-span-2" : ""}`}
            aria-label={`Open ${photo.title}`}
          >
            <Image
              src={`${photo.src}?w=1000&q=75`}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-6 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="text-[10px] uppercase tracking-[0.3em] text-accent">{photo.category}</span>
              <span className="font-serif text-2xl">{photo.title}</span>
            </div>
          </button>
        ))}
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 md:p-12"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          onClick={close}
        >
          <div className="relative h-full w-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={`${current.src}?w=2400&q=85`}
              alt={current.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <p className="font-serif text-2xl">{current.title}</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
              {current.category} · {active! + 1} / {visible.length}
            </p>
          </div>
          <button onClick={close} aria-label="Close" className="absolute right-6 top-6 text-3xl font-light hover:text-accent">
            ×
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-4 text-4xl font-light hover:text-accent md:left-6"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-4 text-4xl font-light hover:text-accent md:right-6"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
