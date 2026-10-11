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
            <Reveal key={i} delay={Math.min(80 * (i + 1), 320)}>
              <p className="mt-6 text-lg leading-relaxed text-foreground/80">{p}</p>
            </Reveal>
          ))}
          <Reveal delay={360}>
            <blockquote className="mt-10 border-l-2 border-accent pl-6 font-serif text-2xl font-light italic leading-snug text-accent md:text-3xl">
              {about.closing}
            </blockquote>
          </Reveal>
          <Reveal delay={420}>
            <dl className="mt-12 grid gap-8 border-t border-foreground/15 pt-10 sm:grid-cols-3 sm:gap-6">
              {about.stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  {/* numbers get the big treatment; word values stay readable */}
                  <dd
                    className={`font-serif leading-tight text-accent ${
                      s.value.length <= 4 ? "text-5xl" : "text-2xl md:text-[1.7rem]"
                    }`}
                  >
                    {s.value}
                  </dd>
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
