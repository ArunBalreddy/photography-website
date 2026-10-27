import type { ServiceCardData } from "@/lib/services";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import SectionLogo from "./SectionLogo";
import ServiceCard from "./ServiceCard";

// Columns that suit how many cards there are (4 in a row at most).
const GRID: Record<number, string> = {
  1: "mx-auto max-w-md",
  2: "mx-auto max-w-4xl md:grid-cols-2",
  3: "md:grid-cols-2 xl:grid-cols-3",
};

export default function Services({ services }: { services: ServiceCardData[] }) {
  return (
    <section id="services" className="relative isolate mx-auto max-w-7xl px-6 py-28 md:py-36">
      <SectionLogo side="left" align="center" />
      <SectionHeading eyebrow="Services & pricing" title="Ways to work together" className="mb-16 text-center" />

      {services.length > 0 ? (
        <div className={`grid gap-8 ${GRID[services.length] ?? "md:grid-cols-2 xl:grid-cols-4"}`}>
          {services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 4) * 120}>
              <ServiceCard service={s} revealDelay={(i % 4) * 120 + 150} />
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal className="text-center">
          <p className="mx-auto max-w-lg text-muted">Every shoot is planned around you — tell us what you have in mind for a quote.</p>
          <a
            href="#contact"
            className="mt-8 inline-block bg-accent px-8 py-4 text-xs font-medium uppercase tracking-[0.25em] text-background hover:bg-foreground"
          >
            Ask for a quote
          </a>
        </Reveal>
      )}
    </section>
  );
}
