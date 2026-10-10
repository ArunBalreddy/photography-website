import { about, site } from "@/content/site";
import Reveal from "./Reveal";
import Showreel from "./Showreel";

export default function About() {
  return (
    <section
      id="about"
      className="relative isolate flex min-h-[90svh] items-center overflow-hidden border-y border-line bg-surface"
    >
      <Showreel />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-32 pt-28 md:pb-40 md:pt-36">
        <div className="max-w-2xl">
          <Reveal>
            <p className="mb-4 text-xs uppercase tracking-[0.4em] text-accent">About {site.photographer}</p>
            <h2 className="font-serif text-4xl font-light leading-tight md:text-6xl">{about.heading}</h2>
          </Reveal>
          {about.body.map((p, i) => (
            <Reveal key={i} delay={100 * (i + 1)}>
              <p className="mt-6 text-lg leading-relaxed text-foreground/80">{p}</p>
            </Reveal>
          ))}
          <Reveal delay={300}>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-foreground/15 pt-10">
              {about.stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-serif text-4xl text-accent md:text-5xl">{s.value}</dd>
                  <dd className="mt-2 text-xs uppercase tracking-[0.15em] text-foreground/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
