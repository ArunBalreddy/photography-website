"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { blurProps } from "@/content/blur";
import { site, workUrl, type Work } from "@/content/site";

export type Direction = "open" | "next" | "prev";

const pad = (n: number) => String(n).padStart(2, "0");
const MAX_ZOOM = 4;

/** A photo you can pinch, double-tap/double-click to zoom, and drag to pan while zoomed. */
function ZoomablePhoto({ work, onZoomChange }: { work: Work; onZoomChange: (zoomed: boolean) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const t = useRef({ s: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const lastTap = useRef(0);
  const zoomedRef = useRef(false);
  const [zoomed, setZoomed] = useState(false);

  const apply = (animate: boolean) => {
    const { s, x, y } = t.current;
    if (layer.current) {
      layer.current.style.transition = animate ? "transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)" : "none";
      layer.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
    }
    const z = s > 1.01;
    if (z !== zoomedRef.current) {
      zoomedRef.current = z;
      setZoomed(z);
      onZoomChange(z);
    }
  };

  // Keep the point under the finger/cursor fixed while scaling, then keep the photo on screen.
  const zoomAt = (clientX: number, clientY: number, scale: number) => {
    const r = box.current!.getBoundingClientRect();
    const cx = clientX - (r.left + r.width / 2);
    const cy = clientY - (r.top + r.height / 2);
    const s = Math.min(MAX_ZOOM, Math.max(1, scale));
    if (s === 1) {
      t.current = { s: 1, x: 0, y: 0 };
      return;
    }
    const k = s / t.current.s;
    t.current = { s, x: (t.current.x - cx) * k + cx, y: (t.current.y - cy) * k + cy };
    clampPan();
  };
  const clampPan = () => {
    const r = box.current!.getBoundingClientRect();
    const mx = (r.width * (t.current.s - 1)) / 2;
    const my = (r.height * (t.current.s - 1)) / 2;
    t.current.x = Math.max(-mx, Math.min(mx, t.current.x));
    t.current.y = Math.max(-my, Math.min(my, t.current.y));
  };

  const dist = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const mid = () => {
    const [a, b] = [...pointers.current.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      pinch.current = { d: dist(), s: t.current.s };
      return;
    }
    const now = performance.now();
    if (now - lastTap.current < 300) {
      if (t.current.s > 1.01) t.current = { s: 1, x: 0, y: 0 };
      else zoomAt(e.clientX, e.clientY, 2.5);
      apply(true);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return; // only while pressed
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size === 2) {
      const m = mid();
      zoomAt(m.x, m.y, (pinch.current.s * dist()) / pinch.current.d);
      apply(false);
    } else if (pointers.current.size === 1 && t.current.s > 1.01) {
      t.current.x += e.clientX - prev.x;
      t.current.y += e.clientY - prev.y;
      clampPan();
      apply(false);
    }
  };
  const onUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  return (
    <div
      ref={box}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className={`relative h-full w-full touch-none select-none overflow-hidden ${zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
    >
      <div ref={layer} className="absolute inset-0 will-change-transform">
        <Image
          src={work.src}
          alt={work.alt}
          fill
          sizes="100vw"
          draggable={false}
          className="object-contain"
          {...blurProps(work.src)}
        />
      </div>
    </div>
  );
}

export default function Lightbox({
  items,
  index,
  direction,
  onClose,
  onStep,
  onJump,
}: {
  items: Work[];
  index: number;
  direction: Direction;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
  onJump: (index: number) => void;
}) {
  const current = items[index];
  const url = workUrl(current);
  const touch = useRef<{ x: number; multi: boolean } | null>(null);
  const zoomed = useRef(false);
  const thumbs = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Keep the active thumbnail in view.
  useEffect(() => {
    thumbs.current?.children[index]?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [index]);

  const share = async () => {
    const link = `${location.origin}/#photo=${encodeURIComponent(current.id)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${current.title} — ${site.fullName}`, url: link });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label={current.title}
      onClick={onClose}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, multi: e.touches.length > 1 })}
      onTouchMove={(e) => {
        if (touch.current && e.touches.length > 1) touch.current.multi = true;
      }}
      onTouchEnd={(e) => {
        // Swipe left/right between items — not while zoomed in or pinching.
        const start = touch.current;
        touch.current = null;
        if (!start || start.multi || zoomed.current || items.length < 2) return;
        const dx = e.changedTouches[0].clientX - start.x;
        if (Math.abs(dx) > 60) onStep(dx < 0 ? 1 : -1);
      }}
    >
      {/* top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 md:px-8" onClick={stop}>
        <p className="flex items-baseline gap-2 text-[10px] uppercase tracking-[0.3em] text-foreground/70">
          <span className="font-serif text-xl tracking-normal text-foreground">{pad(index + 1)}</span>/ {pad(items.length)}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={share}
            aria-label="Share"
            className="flex h-10 items-center gap-2 px-3 text-[10px] uppercase tracking-[0.25em] text-foreground/80 hover:text-accent"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
            </svg>
            <span className="hidden sm:inline">{copied ? "Link copied" : "Share"}</span>
          </button>
          <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center text-3xl font-light hover:text-accent">
            ×
          </button>
        </div>
      </div>

      {/* media — keyed by item so each step replays the 3D turn */}
      <div className="relative min-h-0 flex-1 px-2 md:px-20" style={{ perspective: 1800 }}>
        <div key={current.id} className={`lightbox-${direction} relative flex h-full w-full items-center justify-center`} onClick={stop}>
          {current.kind === "reel" ? (
            <iframe
              src={`https://www.instagram.com/reel/${current.id}/embed`}
              title={current.title}
              className="h-full max-h-[760px] w-full max-w-[400px] rounded bg-white"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : current.kind === "video" ? (
            <video src={current.video} poster={current.src} controls autoPlay playsInline className="h-full max-h-full w-auto max-w-full bg-black" />
          ) : (
            <ZoomablePhoto work={current} onZoomChange={(z) => (zoomed.current = z)} />
          )}
        </div>

        {items.length > 1 && (
          <>
            <button
              onClick={(e) => {
                stop(e);
                onStep(-1);
              }}
              aria-label="Previous"
              className="absolute left-1 top-1/2 hidden -translate-y-1/2 p-4 text-4xl font-light hover:text-accent sm:block md:left-4"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                stop(e);
                onStep(1);
              }}
              aria-label="Next"
              className="absolute right-1 top-1/2 hidden -translate-y-1/2 p-4 text-4xl font-light hover:text-accent sm:block md:right-4"
            >
              ›
            </button>
          </>
        )}
      </div>

      {/* caption */}
      <div className="shrink-0 px-6 py-4 text-center" onClick={stop}>
        <p className="font-serif text-2xl">{current.title}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted">
          {current.category}
          {current.kind === "photo" && <span className="sm:hidden"> · pinch or double-tap to zoom</span>}
          {url && (
            <>
              {" · "}
              <a href={url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                View on Instagram
              </a>
            </>
          )}
        </p>
      </div>

      {/* thumbnails (tablet and up) */}
      {items.length > 1 && (
        <div
          ref={thumbs}
          onClick={stop}
          className="hidden shrink-0 gap-2 overflow-x-auto px-8 pb-6 [scrollbar-width:none] md:flex md:justify-start lg:justify-center"
        >
          {items.map((w, i) => (
            <button
              key={w.id}
              onClick={() => onJump(i)}
              aria-label={`Show ${w.title}`}
              aria-current={i === index}
              className={`relative h-16 w-12 shrink-0 overflow-hidden transition-[opacity,outline-color] duration-300 ${
                i === index ? "opacity-100 outline outline-1 outline-offset-2 outline-accent" : "opacity-45 hover:opacity-80"
              }`}
            >
              <Image src={w.src} alt="" fill sizes="48px" className="object-cover" {...blurProps(w.src)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
