"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop-only gold cursor label ("View", "Open", "Play") that follows the mouse with a little lag
 * over any element marked `data-cursor="…"`. Touch devices and reduced-motion visitors never see it.
 */
export default function CursorLabel() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [label, setLabel] = useState(""); // kept while fading out

  useEffect(() => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const target = { x: -200, y: -200 };
    const pos = { x: -200, y: -200 };
    let frame = 0;
    const tick = () => {
      pos.x += (target.x - pos.x) * 0.2;
      pos.y += (target.y - pos.y) * 0.2;
      if (ref.current) ref.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      frame = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor]");
      if (el?.dataset.cursor) setLabel(el.dataset.cursor);
      setShown(Boolean(el));
    };
    const onLeave = () => setShown(false);
    frame = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[80]">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-full bg-accent/90 text-[10px] font-medium uppercase tracking-[0.25em] text-background shadow-lg shadow-black/40 backdrop-blur-sm transition-[opacity,scale] duration-300 ${
          shown ? "scale-100 opacity-100" : "scale-50 opacity-0"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
