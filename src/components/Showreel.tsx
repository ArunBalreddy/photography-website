"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { showreel } from "@/content/site";

/**
 * Crossfading showreel of photos (slow zoom) and muted film clips, with story-style progress.
 * Plays only while on screen; reduced-motion visitors get the first frame, still.
 */
export default function Showreel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState(-1);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !rootRef.current) return;
    const io = new IntersectionObserver(([entry]) => setRunning(entry.isIntersecting), { threshold: 0.25 });
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    // Keep the outgoing clip moving through its crossfade; pause everything else.
    videos.current.forEach((v, i) => {
      if (v && i !== index && i !== prev) v.pause();
    });
    const item = showreel[index];
    const video = videos.current[index];
    if (!running) {
      video?.pause();
      return;
    }
    if (item.type === "video" && video) {
      video.muted = true;
      video.currentTime = item.start;
      video.play().catch(() => {});
    }
    const t = setTimeout(() => {
      setPrev(index);
      setIndex((index + 1) % showreel.length);
    }, item.duration * 1000);
    return () => clearTimeout(t);
  }, [index, prev, running]);

  const next = (index + 1) % showreel.length;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label="Showreel of Nikhil Sonu's photos and films"
      className="absolute inset-0 bg-black"
    >
      {showreel.map((item, i) => {
        const shown = i === index;
        // Zoom the incoming photo and let the outgoing one keep its zoom while it fades.
        const zoom = running && (i === index || i === prev);
        return (
          <div
            key={item.src}
            aria-hidden
            className={`absolute inset-0 transition-opacity duration-1000 ${shown ? "opacity-100" : "opacity-0"}`}
          >
            {item.type === "photo" ? (
              <Image
                src={item.src}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                style={{ objectPosition: item.position }}
                className={`object-cover ${zoom ? "animate-[kenburns_8s_ease-out_forwards]" : ""}`}
              />
            ) : (
              <video
                ref={(el) => {
                  videos.current[i] = el;
                }}
                src={item.src}
                poster={item.poster}
                muted
                loop
                playsInline
                preload={i === index || i === next ? "auto" : "none"}
                className="h-full w-full object-cover"
              />
            )}
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
      <p className="absolute left-5 top-5 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-foreground/90">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Showreel
      </p>
      <div className="absolute inset-x-5 bottom-5 flex gap-1.5">
        {showreel.map((item, i) => (
          <span key={item.src} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/25">
            <span
              // re-keyed per turn so the active bar restarts from empty
              key={i === index ? `active-${index}-${prev}` : "idle"}
              className={`block h-full bg-foreground ${
                i < index ? "w-full" : i === index && running ? "reel-progress" : "w-0"
              }`}
              style={i === index ? { animationDuration: `${item.duration}s` } : undefined}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
