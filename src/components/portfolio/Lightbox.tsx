"use client";

import Image from "next/image";
import { useRef } from "react";
import { workUrl, type Work } from "@/content/site";

export type Direction = "open" | "next" | "prev";

export default function Lightbox({
  items,
  index,
  direction,
  onClose,
  onStep,
}: {
  items: Work[];
  index: number;
  direction: Direction;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}) {
  const current = items[index];
  const url = workUrl(current);
  const touchX = useRef<number | null>(null);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 pb-24 md:p-12 md:pb-28"
      style={{ perspective: 1800 }}
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        // Swipe left/right to move between items.
        const start = touchX.current;
        touchX.current = null;
        if (start === null || items.length < 2) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 50) onStep(dx < 0 ? 1 : -1);
      }}
    >
      {/* keyed by item so each step replays the 3D turn */}
      <div
        key={current.id}
        className={`lightbox-${direction} relative flex h-full w-full items-center justify-center`}
        onClick={(e) => e.stopPropagation()}
      >
        {current.kind === "reel" ? (
          <iframe
            src={`https://www.instagram.com/reel/${current.id}/embed`}
            title={current.title}
            className="h-full max-h-[760px] w-full max-w-[400px] rounded bg-white"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : current.kind === "video" ? (
          <video
            src={current.video}
            poster={current.src}
            controls
            autoPlay
            playsInline
            className="h-full max-h-full w-auto max-w-full bg-black"
          />
        ) : (
          <Image src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
        )}
      </div>

      <div className="absolute bottom-6 left-1/2 w-max max-w-[90vw] -translate-x-1/2 text-center">
        <p className="font-serif text-2xl">{current.title}</p>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted">
          {current.category} · {index + 1} / {items.length}
          {url && (
            <>
              {" · "}
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-accent hover:underline"
              >
                View on Instagram
              </a>
            </>
          )}
        </p>
      </div>
      <button onClick={onClose} aria-label="Close" className="absolute right-6 top-6 text-3xl font-light hover:text-accent">
        ×
      </button>
      {items.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStep(-1);
            }}
            aria-label="Previous"
            className="absolute left-2 top-1/2 -translate-y-1/2 p-4 text-4xl font-light hover:text-accent md:left-6"
          >
            ‹
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStep(1);
            }}
            aria-label="Next"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-4 text-4xl font-light hover:text-accent md:right-6"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
