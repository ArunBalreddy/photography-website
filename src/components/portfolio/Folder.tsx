import Image from "next/image";
import { blurProps } from "@/content/blur";
import type { Work } from "@/content/site";

export type FolderData = { key: string; title: string; items: Work[] };

export function describe(items: Work[]) {
  const photos = items.filter((w) => w.kind === "photo").length;
  const films = items.length - photos;
  return [photos && `${photos} photo${photos > 1 ? "s" : ""}`, films && `${films} film${films > 1 ? "s" : ""}`]
    .filter(Boolean)
    .join(" · ");
}

/** A 3D folder: back panel + tab, a pile of prints peeking out, and a front flap. */
export default function Folder({
  folder,
  opening,
  onOpen,
}: {
  folder: FolderData;
  opening: boolean;
  onOpen: (rect: DOMRect) => void;
}) {
  const photos = folder.items.filter((w) => w.kind === "photo");
  const covers = (photos.length >= 2 ? photos : folder.items).slice(0, 3);

  return (
    <button
      onClick={(e) => onOpen(e.currentTarget.getBoundingClientRect())}
      data-cursor="Open"
      aria-label={`Open ${folder.title} folder — ${describe(folder.items)}`}
      className={`folder group relative block aspect-[5/4] w-full text-left ${opening ? "is-opening" : ""}`}
    >
      <div className="folder-scene absolute inset-0">
        {/* back panel with tab */}
        <div className="absolute left-0 top-[3%] flex h-[10%] w-[42%] items-start rounded-t-lg border border-b-0 border-foreground/10 bg-[#1f1c19] px-4 pt-2">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted">{folder.items.length} items</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 top-[10%] rounded-lg rounded-tl-none border border-foreground/10 bg-[#1f1c19] shadow-2xl shadow-black/60" />

        {/* prints */}
        {covers.map((w, i) => (
          <div
            key={w.id}
            className={`folder-paper folder-paper-${i} absolute bottom-[14%] left-[10%] right-[10%] top-[16%] overflow-hidden border-[5px] border-[#f2ede6] bg-surface shadow-xl shadow-black/50`}
          >
            <Image
              src={w.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 26vw, (min-width: 640px) 40vw, 80vw"
              className="object-cover"
              {...blurProps(w.src)}
            />
          </div>
        ))}

        {/* front flap */}
        <div className="folder-front absolute inset-x-0 bottom-0 flex h-[55%] flex-col justify-end rounded-lg border border-foreground/10 bg-gradient-to-b from-[#2c2824] to-[#181614] p-6 shadow-[0_-12px_30px_rgb(0_0_0/0.35)]">
          <span className="absolute inset-x-6 top-4 h-px bg-gradient-to-r from-accent/60 via-accent/20 to-transparent" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-accent">{describe(folder.items)}</p>
          <div className="mt-1 flex items-end justify-between gap-4">
            <h3 className="font-serif text-3xl leading-tight md:text-4xl">{folder.title}</h3>
            <span className="mb-1 shrink-0 text-xs uppercase tracking-[0.25em] text-foreground/60 transition-colors group-hover:text-accent">
              Open →
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
