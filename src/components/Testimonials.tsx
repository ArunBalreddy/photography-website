import { testimonials } from "@/content/site";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import SectionLogo from "./SectionLogo";

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative isolate border-y border-line bg-surface">
      <SectionLogo side="right" align="bottom" />
      <div className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <SectionHeading eyebrow="Kind words" title="From the people in the frame" className="mb-16" />
        <div className="grid gap-12 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 120}>
              <figure className="border-l border-accent pl-8">
                <span className="font-serif text-6xl leading-none text-accent">“</span>
                <blockquote className="font-serif text-2xl font-light italic leading-snug">{t.quote}</blockquote>
                <figcaption className="mt-6">
                  <p className="text-sm">{t.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">{t.role}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
