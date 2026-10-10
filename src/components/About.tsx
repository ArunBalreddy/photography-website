import Image from "next/image";
import { about, site } from "@/content/site";
import Reveal from "./Reveal";
import SectionLogo from "./SectionLogo";

export default function About() {
  return (
    <section id="about" className="relative isolate border-y border-line bg-surface">
      <SectionLogo side="right" align="center" />
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-28 md:grid-cols-2 md:py-36">
        <Reveal className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={`${about.image}?w=1200&q=80`}
            alt={`${site.photographer} with camera`}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </Reveal>

        <div>
          <Reveal>
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-accent">About {site.photographer}</p>
            <h2 className="font-serif text-4xl font-light leading-tight md:text-6xl">{about.heading}</h2>
          </Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} delay={100 * (i + 1)}>
              <p className="mt-6 text-lg leading-relaxed text-muted">{p}</p>
            </Reveal>
          ))}
          <Reveal delay={300}>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-line pt-10">
              {about.stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-serif text-4xl text-accent md:text-5xl">{s.value}</dd>
                  <dd className="mt-2 text-xs uppercase tracking-[0.15em] text-muted">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
