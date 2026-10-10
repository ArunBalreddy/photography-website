"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { site, works, type Category } from "@/content/site";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import Folder, { type FolderData } from "./portfolio/Folder";
import Album from "./portfolio/Album";
import Lightbox, { type Direction } from "./portfolio/Lightbox";
import SectionLogo from "./SectionLogo";

const FOLDER_ORDER: Category[] = ["Weddings", "Kids", "Portraits", "Couples", "Food & Commercial"];
const OPEN_DELAY_MS = 420; // let the flap swing open before the prints fly out
const CLOSE_MS = 300;

// One folder per category, plus Films. A category with a single item (e.g. Maternity's one reel)
// gets no folder of its own — it still lives in Films.
const folders: FolderData[] = [
  ...FOLDER_ORDER.map((c) => ({ key: c, title: c, items: works.filter((w) => w.category === c) })),
  { key: "Films", title: "Films", items: works.filter((w) => w.kind !== "photo") },
].filter((f) => f.items.length >= 2);

export default function Gallery() {
  const [opening, setOpening] = useState<string | null>(null);
  const [album, setAlbum] = useState<{ folder: FolderData; origin: DOMRect } | null>(null);
  const [closing, setClosing] = useState(false);
  const [lightbox, setLightbox] = useState<{ index: number; direction: Direction } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const openFolder = (folder: FolderData, origin: DOMRect) => {
    if (opening || album) return;
    setOpening(folder.key);
    timer.current = setTimeout(() => {
      setAlbum({ folder, origin });
      setOpening(null);
      // A history entry so the phone's back button closes the folder instead of leaving the page.
      history.pushState({ album: folder.key }, "");
    }, OPEN_DELAY_MS);
  };

  const finishClose = useCallback(() => {
    setLightbox(null);
    setClosing(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setAlbum(null);
      setClosing(false);
    }, CLOSE_MS);
  }, []);

  const requestClose = useCallback(() => {
    if (history.state?.album) history.back(); // popstate → finishClose
    else finishClose();
  }, [finishClose]);

  const step = useCallback(
    (dir: 1 | -1) =>
      setLightbox((lb) =>
        lb && album
          ? { index: (lb.index + dir + album.folder.items.length) % album.folder.items.length, direction: dir === 1 ? "next" : "prev" }
          : lb,
      ),
    [album],
  );

  useEffect(() => {
    if (!album) return;
    const onPop = () => finishClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightbox) setLightbox(null);
        else requestClose();
      }
      if (lightbox && e.key === "ArrowRight") step(1);
      if (lightbox && e.key === "ArrowLeft") step(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, [album, lightbox, finishClose, requestClose, step]);

  return (
    <section id="work" className="relative isolate mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionLogo side="right" />
      <div className="mb-20 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading eyebrow="Selected work" title="Portfolio" />
        <Reveal>
          <p className="max-w-sm text-muted">Open a folder to explore each collection.</p>
        </Reveal>
      </div>

      <div className="grid gap-x-10 gap-y-20 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder, i) => (
          <Reveal key={folder.key} delay={(i % 3) * 120}>
            <Folder folder={folder} opening={opening === folder.key} onOpen={(rect) => openFolder(folder, rect)} />
          </Reveal>
        ))}
      </div>

      <div className="mt-20 text-center">
        <a
          href={site.instagram}
          target="_blank"
          rel="noreferrer"
          className="inline-block border border-foreground/40 px-8 py-4 text-xs uppercase tracking-[0.25em] transition-colors hover:border-accent hover:bg-accent hover:text-background"
        >
          See more on Instagram →
        </a>
      </div>

      {/* Rendered at page level so the section's stacking context (needed for the watermark)
          can't trap the overlays beneath the fixed header. */}
      {album &&
        createPortal(
          <>
            <Album
              key={album.folder.key}
              folder={album.folder}
              origin={album.origin}
              closing={closing}
              onClose={requestClose}
              onOpenItem={(index) => setLightbox({ index, direction: "open" })}
            />
            {lightbox && (
              <Lightbox
                items={album.folder.items}
                index={lightbox.index}
                direction={lightbox.direction}
                onClose={() => setLightbox(null)}
                onStep={step}
              />
            )}
          </>,
          document.body,
        )}
    </section>
  );
}
