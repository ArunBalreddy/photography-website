"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { site } from "@/content/site";

const TOTAL_MS = 2700;

/**
 * First-visit intro: the brush ring draws itself around the camera, the name settles in, then the
 * whole screen lifts away like a curtain. Skipped for the rest of the session (and for
 * reduced-motion visitors) via the `data-intro="seen"` flag the layout sets before first paint.
 */
export default function Intro() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem("intro-seen", "1");
    } catch {}
    const t = setTimeout(() => setDone(true), TOTAL_MS);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div aria-hidden className="intro fixed inset-0 z-[90] flex flex-col items-center justify-center bg-background">
      <div className="intro-content flex flex-col items-center">
        <div className="relative aspect-square w-[min(52vw,240px)]">
          <Image src="/brand/logo-ring.png" alt="" fill sizes="240px" preload className="intro-ring" />
          <Image src="/brand/logo-camera.png" alt="" fill sizes="240px" preload className="intro-camera" />
        </div>
        <p className="intro-word mt-8 font-serif text-3xl font-semibold tracking-[0.35em] md:text-4xl">{site.name}</p>
        <p className="intro-by mt-2 font-serif text-lg italic text-accent">by {site.photographer}</p>
      </div>
    </div>
  );
}
