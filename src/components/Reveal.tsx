"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reveals children the first time they scroll on screen: a fade-up by default, or a curtain
 * wipe (clip from the bottom, image settling from a slight zoom) for photos — the curtain variant
 * fills its frame, so give it a positioned, sized `className` (e.g. "relative aspect-square").
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "fade",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade" | "curtain";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (variant === "curtain") {
    // Observe an unclipped frame: a fully clipped element reports zero intersection, so it never fires.
    return (
      <div ref={ref} className={className}>
        <div className="reveal-curtain absolute inset-0" style={{ transitionDelay: `${delay}ms` }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
