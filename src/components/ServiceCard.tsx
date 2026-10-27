import Image from "next/image";
import { blurProps } from "@/content/blur";
import type { ServiceCardData } from "@/lib/services";
import Reveal from "./Reveal";

/** One "Services & pricing" card — used on the site and as the admin's live preview. */
export default function ServiceCard({ service: s, revealDelay }: { service: ServiceCardData; revealDelay?: number }) {
  const highlighted = Boolean(s.badge);
  const photo = s.image ? (
    <Image
      src={s.image.src}
      alt=""
      fill
      sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
      className="object-cover transition-transform duration-700 hover:scale-105"
      {...blurProps(s.image.src, s.image.blur)}
    />
  ) : (
    // No photo chosen: the logo mark on a soft surface keeps the card's shape.
    <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent/15 to-transparent">
      <span className="relative aspect-square w-20 opacity-60">
        <Image src="/brand/logo-ring.png" alt="" fill sizes="80px" />
        <Image src="/brand/logo-camera.png" alt="" fill sizes="80px" />
      </span>
    </span>
  );
  const badge = highlighted && (
    <span className="absolute left-4 top-4 bg-accent px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-background">{s.badge}</span>
  );

  return (
    <article className={`flex h-full flex-col border bg-surface ${highlighted ? "border-accent" : "border-line"}`}>
      {revealDelay === undefined ? (
        <div className="relative aspect-[4/3] overflow-hidden">
          {photo}
          {badge}
        </div>
      ) : (
        <Reveal variant="curtain" delay={revealDelay} className="relative aspect-[4/3] overflow-hidden">
          {photo}
          {badge}
        </Reveal>
      )}
      <div className="flex flex-1 flex-col p-8">
        <h3 className="font-serif text-3xl">{s.name}</h3>
        <p className="mt-3">
          {s.unit && <span className="text-xs uppercase tracking-[0.2em] text-muted">{s.unit} </span>}
          <span className="font-serif text-2xl text-accent">{s.price}</span>
        </p>
        <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6 text-sm text-foreground/80">
          {s.features.map((f, i) => (
            <li key={`${i}-${f}`} className="flex gap-3">
              <span className="text-accent">—</span>
              {f}
            </li>
          ))}
        </ul>
        <a
          href={`#book=${encodeURIComponent(s.bookAs)}`}
          className={`mt-8 block py-3 text-center text-xs uppercase tracking-[0.25em] transition-colors ${
            highlighted ? "bg-accent text-background hover:bg-foreground" : "border border-line hover:border-accent hover:text-accent"
          }`}
        >
          Book this
        </a>
      </div>
    </article>
  );
}
