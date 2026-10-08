"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { categories, site, workImage, works, workUrl, type Category } from "@/content/site";
import SectionHeading from "./SectionHeading";

type Filter = "All" | "Films" | Category;

export default function Gallery() {
  const [filter, setFilter] = useState<Filter>("All");
  const [active, setActive] = useState<number | null>(null);

  const visible =
    filter === "All"
      ? works
      : filter === "Films"
        ? works.filter((w) => w.kind === "reel")
        : works.filter((w) => w.category === filter);

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
  const filters: Filter[] = ["All", ...categories, "Films"];

  return (
    <section id="work" className="mx-auto max-w-7xl px-6 py-28 md:py-36">
      <div className="mb-14 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <SectionHeading eyebrow="Selected work" title="Portfolio" />
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter portfolio">
          {filters.map((c) => (
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

      <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
        {visible.map((work, i) => (
          <button
            key={work.id}
            onClick={() => setActive(i)}
            className="group relative block w-full break-inside-avoid overflow-hidden bg-surface text-left"
            aria-label={`Open ${work.title}`}
          >
            <Image
              src={workImage(work)}
              alt={work.alt}
              width={work.width}
              height={work.height}
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="h-auto w-full transition-transform duration-700 group-hover:scale-105"
            />
            {work.kind === "reel" && (
              <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-foreground" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            )}
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="text-[10px] uppercase tracking-[0.3em] text-accent">
                {work.kind === "reel" ? `Film · ${work.category}` : work.category}
              </span>
              <span className="font-serif text-xl">{work.title}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-14 text-center">
        <a
          href={site.instagram}
          target="_blank"
          rel="noreferrer"
          className="inline-block border border-foreground/40 px-8 py-4 text-xs uppercase tracking-[0.25em] transition-colors hover:border-accent hover:bg-accent hover:text-background"
        >
          See more on Instagram →
        </a>
      </div>

      {current && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 pb-24 md:p-12 md:pb-28"
          role="dialog"
          aria-modal="true"
          aria-label={current.title}
          onClick={close}
        >
          <div className="relative flex h-full w-full items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {current.kind === "reel" ? (
              <iframe
                key={current.id}
                src={`https://www.instagram.com/reel/${current.id}/embed`}
                title={current.title}
                className="h-full max-h-[760px] w-full max-w-[400px] rounded bg-white"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <Image
                src={workImage(current)}
                alt={current.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            )}
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
            <p className="font-serif text-2xl">{current.title}</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
              {current.category} · {active! + 1} / {visible.length} ·{" "}
              <a href={workUrl(current)} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                View on Instagram
              </a>
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
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-4 text-4xl font-light hover:text-accent md:left-6"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-4 text-4xl font-light hover:text-accent md:right-6"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
