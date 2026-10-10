"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { showreel } from "@/content/site";

/**
 * Full-bleed section background: crossfading photos (slow zoom) and muted film clips, darkened
 * on the text side, with a story-style progress bar. Plays only while on screen; reduced-motion
 * visitors get the first frame, still.
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
        // Zoom the incoming photo and let the outgoing one keep its zoom while it fades.
        const zoom = running && (i === index || i === prev);
        return (
          <div
            key={item.src}
            aria-hidden
            className={`absolute inset-0 transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"}`}
          >
            {item.type === "photo" ? (
              <Image
                src={item.src}
                alt=""
                fill
                sizes="100vw"
                style={{ objectPosition: item.position ?? "50% 40%" }}
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

      {/* Legibility: an even dim on phones; on wider screens dark where the text sits, clear on the right. */}
      <div className="absolute inset-0 bg-background/70 md:bg-transparent md:bg-gradient-to-r md:from-background/95 md:via-background/70 md:to-background/10" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background/90 to-transparent" />

      <p className="absolute right-6 top-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-foreground/90 md:right-10">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Showreel
      </p>
      <div className="absolute inset-x-0 bottom-8">
        <div className="mx-auto flex max-w-7xl gap-1.5 px-6">
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
    </div>
  );
}
