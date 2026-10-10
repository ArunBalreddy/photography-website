"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { blurProps } from "@/content/blur";
import { heroSlides, site } from "@/content/site";

const INTERVAL_MS = 6000;
const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;
const pad = (n: number) => String(n).padStart(2, "0");

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0); // bumps on manual navigation to restart the autoplay timer
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % heroSlides.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [cycle]);

  const go = (i: number) => {
    setIndex((i + heroSlides.length) % heroSlides.length);
    setCycle((c) => c + 1);
  };

  const words = site.tagline.split(" ");
  const lead = words.slice(0, -2).join(" ");
  const accent = words.slice(-2).join(" ");

  return (
    <section
      id="top"
      className="relative h-svh min-h-[600px] overflow-hidden"
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        // Horizontal swipe changes slide; vertical scrolling is left alone.
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {heroSlides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ${i === index ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="100vw"
            preload={i === 0}
            style={{ objectPosition: slide.position }}
            className={`object-cover ${i === index ? "animate-[kenburns_8s_ease-out_forwards]" : ""}`}
            {...blurProps(slide.src)}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-background" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-28 md:pb-32">
        <p
          style={delay(0)}
          className="hero-fade mb-6 text-[10px] uppercase tracking-[0.25em] text-accent md:text-xs md:tracking-[0.4em]"
        >
          {site.location}
        </p>
        {/* Each line rises out of its own mask. */}
        <h1 className="max-w-4xl font-serif text-5xl font-light leading-[1.05] md:text-8xl">
          <span className="block overflow-hidden pb-1 pr-2">
            <span style={delay(0.12)} className="hero-line block">
              {lead}
            </span>
          </span>
          <span className="block overflow-hidden pb-3 pr-4">
            <em style={delay(0.26)} className="hero-line block text-accent">
              {accent}
            </em>
          </span>
        </h1>
        <div style={delay(0.55)} className="hero-fade mt-10 flex flex-wrap items-center gap-6">
          <a
            href="#work"
            className="bg-foreground px-8 py-4 text-xs uppercase tracking-[0.25em] text-background transition-colors hover:bg-accent"
          >
            View gallery
          </a>
          <a href="#contact" className="text-xs uppercase tracking-[0.25em] underline-offset-8 hover:underline">
            Check availability →
          </a>
        </div>

        {/* Slide counter + caption, and the slide dots */}
        <div style={delay(0.7)} className="hero-fade absolute bottom-10 right-6 hidden flex-col items-end gap-4 md:flex">
          <p className="flex items-baseline gap-3 text-[10px] uppercase tracking-[0.3em] text-foreground/80">
            <span className="font-serif text-2xl tracking-normal text-foreground">{pad(index + 1)}</span>
            <span>/ {pad(heroSlides.length)}</span>
            <span key={index} className="hero-caption text-accent">
              — {heroSlides[index].caption}
            </span>
          </p>
          <div className="flex gap-3">
            {heroSlides.map((s, i) => (
              <button
                key={s.src}
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${s.caption}`}
                className="group py-2"
              >
                <span
                  className={`block h-px w-12 transition-colors ${
                    i === index ? "bg-accent" : "bg-foreground/30 group-hover:bg-foreground/70"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#work"
        aria-label="Scroll to the gallery"
        style={delay(0.85)}
        className="hero-fade absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-foreground/70 hover:text-accent"
      >
        Scroll
        <span className="relative h-10 w-px overflow-hidden bg-foreground/20">
          <span className="scroll-cue absolute inset-x-0 top-0 h-1/2 bg-accent" />
        </span>
      </a>
    </section>
  );
}
