import Image from "next/image";
import { blurProps } from "@/content/blur";
import { site, works } from "@/content/site";
import Reveal from "./Reveal";

async function currentYear() {
  "use cache";
  return new Date().getFullYear();
}

export default async function Footer() {
  return (
    <footer className="border-t border-line">
      <a
        href={site.instagram}
        target="_blank"
        rel="noreferrer"
        data-cursor="Follow"
        aria-label="Follow on Instagram"
        className="group grid grid-cols-3 md:grid-cols-6"
      >
        {works.filter((w) => w.kind === "photo").slice(0, 6).map((w, i) => (
          <Reveal key={w.id} variant="curtain" delay={i * 90} className="relative aspect-square overflow-hidden">
            <Image
              src={w.src}
              alt=""
              fill
              sizes="(min-width: 768px) 17vw, 33vw"
              className="object-cover opacity-70 transition-opacity duration-500 hover:opacity-100"
              {...blurProps(w.src)}
            />
          </Reveal>
        ))}
      </a>
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-10 text-sm text-muted md:flex-row md:pb-10">
        <p className="text-foreground">
          <span className="font-serif text-2xl tracking-[0.2em]">{site.name}</span>{" "}
          <span className="font-serif italic text-accent">by {site.photographer}</span>
        </p>
        <nav className="flex gap-8">
          {site.social.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className="hover:text-accent">
              {s.label}
            </a>
          ))}
        </nav>
        <p>© {await currentYear()} {site.fullName}. All rights reserved.</p>
      </div>
    </footer>
  );
}
