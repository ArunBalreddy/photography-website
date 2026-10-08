import Reveal from "./Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  className = "",
}: {
  eyebrow: string;
  title: string;
  className?: string;
}) {
  return (
    <Reveal className={className}>
      <p className="mb-4 text-xs uppercase tracking-[0.4em] text-accent">{eyebrow}</p>
      <h2 className="font-serif text-4xl font-light md:text-6xl">{title}</h2>
    </Reveal>
  );
}
