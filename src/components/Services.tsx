import Image from "next/image";
import { services } from "@/content/site";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import SectionLogo from "./SectionLogo";

export default function Services() {
  return (
    <section id="services" className="relative isolate mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionLogo side="left" align="center" />
      <SectionHeading eyebrow="Services & pricing" title="Ways to work together" className="mb-16 text-center" />

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
        {services.map((s, i) => (
          <Reveal key={s.name} delay={i * 120}>
            <article
              className={`flex h-full flex-col border bg-surface ${s.featured ? "border-accent" : "border-line"}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={s.image.startsWith("/") ? s.image : `${s.image}?w=900&q=75`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                {s.featured && (
                  <span className="absolute left-4 top-4 bg-accent px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-background">
                    Most booked
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-8">
                <h3 className="font-serif text-3xl">{s.name}</h3>
                <p className="mt-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-muted">{s.unit} </span>
                  <span className="font-serif text-2xl text-accent">{s.price}</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6 text-sm text-foreground/80">
                  {s.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <span className="text-accent">—</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`#book=${encodeURIComponent(s.bookAs)}`}
                  className={`mt-8 block py-3 text-center text-xs uppercase tracking-[0.25em] transition-colors ${
                    s.featured
                      ? "bg-accent text-background hover:bg-foreground"
                      : "border border-line hover:border-accent hover:text-accent"
                  }`}
                >
                  Book this
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
