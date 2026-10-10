"use client";

import Image from "next/image";
import { blurProps } from "@/content/blur";
import { useLayoutEffect, useRef, type PointerEvent } from "react";
import { describe, type FolderData } from "./Folder";

/** 3D tilt + glare that follows the mouse (skipped for touch). */
function tilt(e: PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 12}deg) rotateY(${(x - 0.5) * 14}deg) scale(1.03)`;
  el.style.setProperty("--gx", `${x * 100}%`);
  el.style.setProperty("--gy", `${y * 100}%`);
}
function untilt(e: PointerEvent<HTMLElement>) {
  e.currentTarget.style.transform = "";
}

export default function Album({
  folder,
  origin,
  closing,
  onClose,
  onOpenItem,
}: {
  folder: FolderData;
  /** Where the folder sat on screen — the prints fly out from here. */
  origin: DOMRect;
  closing: boolean;
  onClose: () => void;
  onOpenItem: (index: number) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);

  // Before first paint: point every tile back at the folder, then let fly-in-3d carry it home.
  useLayoutEffect(() => {
    const ox = origin.left + origin.width / 2;
    const oy = origin.top + origin.height / 2;
    gridRef.current?.querySelectorAll<HTMLElement>("[data-tile]").forEach((tile, i) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--fx", `${ox - (r.left + r.width / 2)}px`);
      tile.style.setProperty("--fy", `${oy - (r.top + r.height / 2)}px`);
      tile.style.setProperty("--rz", `${(i % 2 ? 1 : -1) * (6 + ((i * 7) % 12))}deg`);
      tile.style.setProperty("--delay", `${Math.min(i, 16) * 55}ms`);
      tile.classList.add("fly-in");
    });
  }, [origin]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-background ${closing ? "album-closing" : "album-opening"}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${folder.title} folder`}
    >
      <header className="sticky top-0 z-10 border-b border-line bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6">
          <button
            onClick={onClose}
            className="text-xs uppercase tracking-[0.25em] text-foreground/80 transition-colors hover:text-accent"
          >
            ← All folders
          </button>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{describe(folder.items)}</p>
            <h2 className="font-serif text-2xl md:text-3xl">{folder.title}</h2>
          </div>
        </div>
      </header>

      <div ref={gridRef} className="mx-auto max-w-7xl columns-2 gap-4 px-6 py-10 md:columns-3 lg:columns-4 [&>*]:mb-4">
        {folder.items.map((work, i) => (
          <div key={work.id} data-tile className="break-inside-avoid">
            <button
              onClick={() => onOpenItem(i)}
              data-cursor={work.kind === "photo" ? "View" : "Play"}
              onPointerMove={tilt}
              onPointerLeave={untilt}
              aria-label={`Open ${work.title}`}
              className="tile group relative block w-full overflow-hidden bg-surface text-left shadow-lg shadow-black/40"
            >
              <Image
                src={work.src}
                alt={work.alt}
                width={work.width}
                height={work.height}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="h-auto w-full"
                {...blurProps(work.src, work.blur)}
              />
              <span className="tile-glare pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              {work.kind !== "photo" && (
                <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 fill-foreground" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
              )}
              <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent">
                  {work.kind === "photo" ? work.category : `Film · ${work.category}`}
                </span>
                <span className="font-serif text-xl">{work.title}</span>
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
