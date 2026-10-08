"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { heroSlides, site } from "@/content/site";

const INTERVAL_MS = 6000;

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % heroSlides.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="top" className="relative h-svh min-h-[600px] overflow-hidden">
      {heroSlides.map((slide, i) => (
        <div
          key={slide.src}
          className={`absolute inset-0 transition-opacity duration-[1500ms] ${i === index ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== index}
        >
          <Image
            src={`${slide.src}?w=2000&q=80`}
            alt={slide.alt}
            fill
            sizes="100vw"
            preload={i === 0}
            className={`object-cover ${i === index ? "animate-[kenburns_8s_ease-out_forwards]" : ""}`}
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-background" />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-6 pb-24 md:pb-32">
        <p className="mb-6 text-[10px] uppercase tracking-[0.25em] text-accent md:text-xs md:tracking-[0.4em]">{site.location}</p>
        <h1 className="max-w-4xl font-serif text-5xl font-light leading-[1.05] md:text-8xl">
          {site.tagline.split(" ").slice(0, -2).join(" ")}{" "}
          <em className="text-accent">{site.tagline.split(" ").slice(-2).join(" ")}</em>
        </h1>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <a
            href="#work"
            className="bg-foreground px-8 py-4 text-xs uppercase tracking-[0.25em] text-background transition-colors hover:bg-accent"
          >
            View portfolio
          </a>
          <a href="#contact" className="text-xs uppercase tracking-[0.25em] underline-offset-8 hover:underline">
            Check availability →
          </a>
        </div>

        <div className="absolute bottom-10 right-6 hidden gap-3 md:flex">
          {heroSlides.map((s, i) => (
            <button
              key={s.src}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-px w-12 transition-colors ${i === index ? "bg-accent" : "bg-foreground/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
