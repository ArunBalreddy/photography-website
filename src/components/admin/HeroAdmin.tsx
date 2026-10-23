"use client";

import Image from "next/image";
import { useState, type MouseEvent } from "react";
import { blurProps } from "@/content/blur";
import type { Manifest } from "@/lib/gallery";
import { CENTER, MAX_HERO, builtInHero, defaultHeroPicks, resolvePick, type HeroPick } from "@/lib/hero";

const btn =
  "inline-flex h-9 items-center justify-center border border-line px-3 text-[11px] uppercase tracking-[0.15em] text-foreground/80 transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-35";
const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center border border-line text-sm text-foreground/75 transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30";
const eyebrow = "text-[10px] uppercase tracking-[0.3em] text-accent";

/** A screen-sized copy for the admin's previews (via the site's image optimizer). */
const preview = (src: string) => `/_next/image?url=${encodeURIComponent(src)}&w=828&q=75`;

type Option = { id: string; src: string; alt: string; blur?: string; group: string; caption: string; width?: number; height?: number };

export default function HeroAdmin({
  m,
  mutate,
  readOnly,
}: {
  m: Manifest;
  mutate: (fn: (cur: Manifest) => Manifest) => void;
  readOnly: boolean;
}) {
  const [filter, setFilter] = useState("all");
  const usingDefault = !m.hero;
  const picks = m.hero ?? defaultHeroPicks();
  const set = (fn: (p: HeroPick[]) => HeroPick[]) => mutate((cur) => ({ ...cur, hero: fn(cur.hero ?? defaultHeroPicks()) }));

  const folderTitle = (id: string) => m.folders.find((f) => f.id === id)?.title ?? "";
  const options: Option[] = [
    ...builtInHero.map((h) => ({ id: h.id, src: h.src, alt: h.alt, group: "built-in", caption: h.caption })),
    ...m.items
      .filter((i) => i.kind === "photo")
      .map((i) => ({ id: i.id, src: i.src, alt: i.alt, blur: i.blur, group: i.folder, caption: folderTitle(i.folder), width: i.width, height: i.height })),
  ];
  const sizeOf = (id: string) => options.find((o) => o.id === id);
  const groups = [
    { id: "all", title: "All photos" },
    { id: "built-in", title: "Original backgrounds" },
    ...m.folders.filter((f) => m.items.some((i) => i.folder === f.id && i.kind === "photo")),
  ];
  const shown = options.filter((o) => filter === "all" || o.group === filter);
  const chosen = new Set(picks.map((p) => p.id));
  const slides = picks.flatMap((pick) => {
    const slide = resolvePick(pick, m.items);
    return slide ? [{ pick, slide }] : [];
  });

  const add = (o: Option) =>
    set((p) => (p.length >= MAX_HERO || p.some((x) => x.id === o.id) ? p : [...p, { id: o.id, position: CENTER, caption: o.caption.slice(0, 40) }]));
  const remove = (id: string) => set((p) => (p.length <= 1 ? p : p.filter((x) => x.id !== id)));
  const update = (id: string, patch: Partial<HeroPick>) => set((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const move = (id: string, dir: -1 | 1) =>
    set((p) => {
      const i = p.findIndex((x) => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const setFocus = (id: string, e: MouseEvent<HTMLImageElement>) => {
    if (readOnly) return;
    const r = e.currentTarget.getBoundingClientRect();
    const pct = (v: number) => Math.round(Math.min(100, Math.max(0, v * 100)));
    update(id, { position: `${pct((e.clientX - r.left) / r.width)}% ${pct((e.clientY - r.top) / r.height)}%` });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-12 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl">Home background</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            These photos play full-screen behind the title at the top of the homepage, in a random order on every visit.
            Choose 3–8 of your strongest photos, then tap each one on the part that must stay in view — phones show a
            narrow slice of it.
          </p>
        </div>
        {!usingDefault && (
          <button
            className={btn}
            disabled={readOnly}
            onClick={() => confirm("Go back to the original six background photos?") && mutate((cur) => ({ ...cur, hero: undefined }))}
          >
            Restore the original set
          </button>
        )}
      </div>

      <section>
        <p className={`${eyebrow} mb-4`}>
          Playing on the homepage · {slides.length} of up to {MAX_HERO}
          {usingDefault && <span className="ml-2 normal-case tracking-normal text-muted">(the original set — any change saves your own)</span>}
        </p>
        <ul className="space-y-4">
          {slides.map(({ pick, slide }, idx) => {
            const meta = sizeOf(pick.id);
            const [x, y] = pick.position.split(" ");
            const small = meta?.width !== undefined && meta.width < 1600;
            return (
              <li key={pick.id} className="grid gap-5 border border-line bg-surface p-4 lg:grid-cols-[auto_minmax(0,1fr)]">
                {/* focus point picker: the whole photo, tap to move the dot */}
                <div>
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- needs the photo's natural shape for tap-to-focus */}
                    <img
                      src={preview(slide.src)}
                      alt={slide.alt}
                      onClick={(e) => setFocus(pick.id, e)}
                      className={`block h-auto max-h-60 w-auto max-w-full ${readOnly ? "" : "cursor-crosshair"}`}
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent/70 shadow-[0_0_0_2px_rgba(0,0,0,0.5)]"
                      style={{ left: x, top: y }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">
                    Tap the photo to set the focus ·{" "}
                    <button className="underline underline-offset-2 hover:text-accent" disabled={readOnly} onClick={() => update(pick.id, { position: CENTER })}>
                      centre
                    </button>
                  </p>
                </div>

                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex flex-wrap items-end gap-4">
                    <figure>
                      <div className="relative aspect-video w-56 overflow-hidden border border-line bg-background">
                        <Image src={slide.src} alt="" fill sizes="224px" className="object-cover" style={{ objectPosition: pick.position }} {...blurProps(slide.src, slide.blur)} />
                      </div>
                      <figcaption className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted">Computer</figcaption>
                    </figure>
                    <figure>
                      <div className="relative aspect-[9/19] w-[60px] overflow-hidden border border-line bg-background">
                        <Image src={slide.src} alt="" fill sizes="60px" className="object-cover" style={{ objectPosition: pick.position }} {...blurProps(slide.src, slide.blur)} />
                      </div>
                      <figcaption className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted">Phone</figcaption>
                    </figure>
                  </div>
                  {small && (
                    <p className="text-xs text-[#e5b573]">This photo is under 1600px wide, so it may look a little soft on big screens.</p>
                  )}
                  <label className="block max-w-sm">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-muted">Caption beside the slide counter</span>
                    <input
                      key={`${pick.id}-${pick.caption}`}
                      defaultValue={pick.caption}
                      maxLength={40}
                      disabled={readOnly}
                      placeholder="e.g. Weddings"
                      onBlur={(e) => e.target.value.trim() !== pick.caption && update(pick.id, { caption: e.target.value.trim() })}
                      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                      className="w-full border-b border-line bg-transparent py-2 text-sm focus:border-accent focus:outline-none"
                    />
                  </label>
                  <div className="mt-auto flex items-center gap-1">
                    <button className={iconBtn} aria-label="Move up" disabled={readOnly || idx === 0} onClick={() => move(pick.id, -1)}>
                      ↑
                    </button>
                    <button className={iconBtn} aria-label="Move down" disabled={readOnly || idx === slides.length - 1} onClick={() => move(pick.id, 1)}>
                      ↓
                    </button>
                    <button
                      className={`${btn} ml-auto hover:!border-[#e57373] hover:!text-[#e57373]`}
                      disabled={readOnly || slides.length <= 1}
                      title={slides.length <= 1 ? "Keep at least one background photo" : undefined}
                      onClick={() => remove(pick.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          The order is only a starting point: visitors see these in a random order. Removing a photo here keeps it in your gallery.
        </p>
      </section>

      <section>
        <p className={`${eyebrow} mb-4`}>Add from your photos</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className={`border px-3 py-1.5 text-xs transition-colors ${
                filter === g.id ? "border-accent bg-accent/10 text-foreground" : "border-line text-muted hover:text-foreground"
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
        {picks.length >= MAX_HERO && <p className="mb-4 text-sm text-accent">You&apos;ve chosen the maximum of {MAX_HERO}. Remove one to add another.</p>}
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {shown.map((o) => {
            const on = chosen.has(o.id);
            return (
              <li key={o.id}>
                <button
                  onClick={() => add(o)}
                  disabled={readOnly || on || picks.length >= MAX_HERO}
                  aria-label={on ? `${o.alt} (already playing)` : `Add ${o.alt}`}
                  className={`group relative block aspect-square w-full overflow-hidden border ${
                    on ? "border-accent" : "border-line hover:border-accent"
                  } disabled:cursor-default`}
                >
                  <Image src={o.src} alt="" fill sizes="(min-width: 1024px) 15vw, 30vw" className={`object-cover transition-opacity ${on ? "opacity-40" : "group-hover:opacity-80"}`} {...blurProps(o.src, o.blur)} />
                  <span
                    className={`absolute right-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center px-1 text-xs ${
                      on ? "bg-accent text-background" : "bg-black/70 text-foreground opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {on ? "✓" : "+ Add"}
                  </span>
                  {o.height !== undefined && o.width !== undefined && o.height > o.width && (
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.15em] text-muted">
                      Portrait
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Landscape photos fill computer screens best; portrait photos work too but are cropped top and bottom. To use a new
          photo, upload it in the Gallery tab first.
        </p>
      </section>
    </div>
  );
}
