"use client";

import Image from "next/image";
import { useState } from "react";
import { blurProps } from "@/content/blur";
import { shootTypes } from "@/content/site";
import type { Manifest } from "@/lib/gallery";
import {
  LIMITS,
  MAX_FEATURES,
  MAX_SERVICES,
  builtInServiceImages,
  defaultServices,
  resolveServiceImage,
  serviceId,
  type ServiceDef,
} from "@/lib/services";
import ServiceCard from "../ServiceCard";

const btn =
  "inline-flex h-9 items-center justify-center border border-line px-3 text-[11px] uppercase tracking-[0.15em] text-foreground/80 transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-35";
const iconBtn =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center border border-line text-sm text-foreground/75 transition-colors hover:border-accent hover:text-accent disabled:pointer-events-none disabled:opacity-30";
const input =
  "w-full border-b border-line bg-transparent py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none disabled:opacity-60";
const label = "text-[10px] uppercase tracking-[0.25em] text-muted";
const chip = "border border-line px-2 py-0.5 text-[11px] text-muted hover:border-accent hover:text-accent disabled:opacity-40";

let seq = 0;
const uniqueSuffix = () => `${Date.now().toString(36).slice(-4)}${(seq++).toString(36)}`;

const UNITS = ["starting from", "per session", "per hour", "per day", "per event", "pricing"];

export default function ServicesAdmin({
  m,
  mutate,
  readOnly,
}: {
  m: Manifest;
  mutate: (fn: (cur: Manifest) => Manifest) => void;
  readOnly: boolean;
}) {
  const list = m.services ?? defaultServices();
  const usingDefault = !m.services;
  const [activeId, setActiveId] = useState(list[0]?.id ?? "");
  const [picking, setPicking] = useState(false);
  const [filter, setFilter] = useState("all");
  const active = list.find((s) => s.id === activeId) ?? list[0];

  const set = (fn: (l: ServiceDef[]) => ServiceDef[]) => mutate((cur) => ({ ...cur, services: fn(cur.services ?? defaultServices()) }));
  const update = (id: string, patch: Partial<ServiceDef>) => set((l) => l.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const move = (id: string, dir: -1 | 1) =>
    set((l) => {
      const i = l.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= l.length) return l;
      const next = [...l];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = () => {
    const s: ServiceDef = {
      id: `${serviceId("new service")}-${uniqueSuffix()}`,
      name: "New service",
      price: "On request",
      unit: "starting from",
      bookAs: "Other",
      features: ["What's included"],
      badge: "",
      hidden: false,
    };
    set((l) => (l.length >= MAX_SERVICES ? l : [...l, s]));
    setActiveId(s.id);
  };
  const remove = (s: ServiceDef) => {
    if (!confirm(`Delete the service "${s.name}"? It disappears from the website.`)) return;
    const rest = list.filter((x) => x.id !== s.id);
    set((l) => l.filter((x) => x.id !== s.id));
    setActiveId(rest[0]?.id ?? "");
  };

  // photo choices: the original card photos + every gallery photo
  const folderTitle = (id: string) => m.folders.find((f) => f.id === id)?.title ?? "";
  const options = [
    ...builtInServiceImages.map((i) => ({ id: i.id, src: i.src, blur: undefined as string | undefined, group: "original" })),
    ...m.items.filter((i) => i.kind === "photo").map((i) => ({ id: i.id, src: i.src, blur: i.blur, group: i.folder })),
  ];
  const groups = [
    { id: "all", title: "All photos" },
    { id: "original", title: "Original card photos" },
    ...m.folders.filter((f) => m.items.some((i) => i.folder === f.id && i.kind === "photo")).map((f) => ({ id: f.id, title: folderTitle(f.id) })),
  ];

  const preview = active && {
    ...active,
    ...(resolveServiceImage(active.imageId, m.items) ? { image: resolveServiceImage(active.imageId, m.items) } : {}),
    features: active.features.filter((f) => f.trim()),
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl">Services & pricing</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            The cards in the homepage&apos;s &ldquo;Ways to work together&rdquo; section. Changes save automatically and
            appear on the site straight away. Hide a service to take it off the site without losing it.
          </p>
        </div>
        {!usingDefault && (
          <button
            className={btn}
            disabled={readOnly}
            onClick={() => confirm("Replace your services with the original four?") && mutate((cur) => ({ ...cur, services: undefined }))}
          >
            Restore the original services
          </button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside>
          <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-accent">
            Services · {list.filter((s) => !s.hidden).length} on the site
          </p>
          <ul className="space-y-2">
            {list.map((s, i) => (
              <li
                key={s.id}
                className={`flex items-center gap-1 border pl-3 pr-1 transition-colors ${
                  s.id === active?.id ? "border-accent bg-accent/10" : "border-line hover:border-foreground/30"
                }`}
              >
                <button
                  onClick={() => {
                    setActiveId(s.id);
                    setPicking(false);
                  }}
                  className="min-w-0 flex-1 py-2.5 text-left"
                >
                  <span className={`block truncate font-serif text-lg ${s.hidden ? "text-muted line-through" : ""}`}>{s.name || "Untitled"}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {s.hidden ? "Hidden · " : ""}
                    {s.price}
                  </span>
                </button>
                <button className={iconBtn} aria-label={`Move ${s.name} up`} disabled={readOnly || i === 0} onClick={() => move(s.id, -1)}>
                  ↑
                </button>
                <button className={iconBtn} aria-label={`Move ${s.name} down`} disabled={readOnly || i === list.length - 1} onClick={() => move(s.id, 1)}>
                  ↓
                </button>
              </li>
            ))}
          </ul>
          <button className={`${btn} mt-4 w-full`} disabled={readOnly || list.length >= MAX_SERVICES} onClick={add}>
            + Add a service
          </button>
          {list.length >= MAX_SERVICES && <p className="mt-2 text-xs text-muted">Up to {MAX_SERVICES} services.</p>}
        </aside>

        {active && preview ? (
          <div className="grid min-w-0 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-w-0 space-y-6">
              <label className="block">
                <span className={label}>Service name</span>
                <input
                  value={active.name}
                  maxLength={LIMITS.name}
                  disabled={readOnly}
                  onChange={(e) => update(active.id, { name: e.target.value })}
                  className={`${input} font-serif !text-3xl`}
                />
              </label>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className={label}>Price</span>
                  <input
                    value={active.price}
                    maxLength={LIMITS.price}
                    disabled={readOnly}
                    placeholder="e.g. ₹25,000"
                    onChange={(e) => update(active.id, { price: e.target.value })}
                    className={input}
                  />
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {["On request", "₹"].map((v) => (
                      <button
                        key={v}
                        type="button"
                        className={chip}
                        disabled={readOnly}
                        onClick={() => update(active.id, { price: v === "₹" ? `₹${active.price.replace(/^₹/, "")}` : v })}
                      >
                        {v === "₹" ? "Add ₹" : v}
                      </button>
                    ))}
                  </span>
                </label>
                <label className="block">
                  <span className={label}>Shown before the price</span>
                  <input
                    value={active.unit}
                    maxLength={LIMITS.unit}
                    disabled={readOnly}
                    placeholder="e.g. per session"
                    onChange={(e) => update(active.id, { unit: e.target.value })}
                    className={input}
                  />
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {UNITS.map((u) => (
                      <button key={u} type="button" className={chip} disabled={readOnly} onClick={() => update(active.id, { unit: u })}>
                        {u}
                      </button>
                    ))}
                  </span>
                </label>
              </div>

              <div>
                <span className={label}>What&apos;s included</span>
                <ul className="mt-1 space-y-1">
                  {active.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-accent">—</span>
                      <input
                        value={f}
                        maxLength={LIMITS.feature}
                        disabled={readOnly}
                        placeholder="e.g. 50+ edited images"
                        onChange={(e) => update(active.id, { features: active.features.map((x, k) => (k === i ? e.target.value : x)) })}
                        className={input}
                      />
                      <button
                        className={iconBtn}
                        aria-label="Remove this line"
                        disabled={readOnly}
                        onClick={() => update(active.id, { features: active.features.filter((_, k) => k !== i) })}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  className={`${btn} mt-3`}
                  disabled={readOnly || active.features.length >= MAX_FEATURES}
                  onClick={() => update(active.id, { features: [...active.features, ""] })}
                >
                  + Add a line
                </button>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="block">
                  <span className={label}>Highlight label (optional)</span>
                  <input
                    value={active.badge}
                    maxLength={LIMITS.badge}
                    disabled={readOnly}
                    placeholder="Empty = no highlight"
                    onChange={(e) => update(active.id, { badge: e.target.value })}
                    className={input}
                  />
                  <span className="mt-2 flex flex-wrap gap-1.5">
                    {["Most booked", "New", "Festive offer"].map((b) => (
                      <button key={b} type="button" className={chip} disabled={readOnly} onClick={() => update(active.id, { badge: b })}>
                        {b}
                      </button>
                    ))}
                  </span>
                </label>
                <label className="block">
                  <span className={label}>&ldquo;Book this&rdquo; opens the booking form as</span>
                  <select
                    value={active.bookAs}
                    disabled={readOnly}
                    onChange={(e) => update(active.id, { bookAs: e.target.value })}
                    className={`${input} [&>option]:bg-surface`}
                  >
                    {shootTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <span className={label}>Photo</span>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button className={btn} disabled={readOnly} onClick={() => setPicking((p) => !p)}>
                    {picking ? "Close photos" : "Change photo"}
                  </button>
                  {active.imageId && (
                    <button className={btn} disabled={readOnly} onClick={() => update(active.id, { imageId: undefined })}>
                      No photo
                    </button>
                  )}
                </div>
                {picking && (
                  <div className="mt-4 border border-line p-4">
                    <div className="mb-4 flex flex-wrap gap-2">
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
                    <ul className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4 lg:grid-cols-5">
                      {options
                        .filter((o) => filter === "all" || o.group === filter)
                        .map((o) => (
                          <li key={o.id}>
                            <button
                              onClick={() => {
                                update(active.id, { imageId: o.id });
                                setPicking(false);
                              }}
                              aria-label="Use this photo"
                              className={`relative block aspect-[4/3] w-full overflow-hidden border ${
                                o.id === active.imageId ? "border-accent" : "border-line hover:border-accent"
                              }`}
                            >
                              <Image src={o.src} alt="" fill sizes="160px" className="object-cover" {...blurProps(o.src, o.blur)} />
                            </button>
                          </li>
                        ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted">To use a new photo, upload it in the Gallery tab first.</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={!active.hidden}
                    disabled={readOnly}
                    onChange={(e) => update(active.id, { hidden: !e.target.checked })}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-5 w-9 shrink-0 rounded-full bg-foreground/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-foreground after:transition-transform peer-checked:bg-accent peer-checked:after:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                  />
                  Show on the website
                </label>
                <button className={`${btn} hover:!border-[#e57373] hover:!text-[#e57373]`} disabled={readOnly} onClick={() => remove(active)}>
                  Delete service
                </button>
              </div>
            </section>

            <aside>
              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-accent">
                Live preview{active.hidden && <span className="ml-2 normal-case tracking-normal text-muted">(hidden from the site)</span>}
              </p>
              <div className={`pointer-events-none ${active.hidden ? "opacity-50" : ""}`}>
                <ServiceCard service={preview} />
              </div>
            </aside>
          </div>
        ) : (
          <p className="text-sm text-muted">No services yet — add one to show prices on the site.</p>
        )}
      </div>
    </div>
  );
}
