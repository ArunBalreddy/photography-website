import Image from "next/image";

/**
 * Faint PICTURESQUE watermark behind a section — the brush ring turns slowly, the camera
 * emblem stays still. The section needs `relative isolate` so this sits under its content.
 */
export default function SectionLogo({ side = "right" }: { side?: "left" | "right" }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-1/2 -z-10 aspect-square w-[min(88vw,620px)] -translate-y-1/2 overflow-hidden opacity-[0.07] ${
        side === "right" ? "right-0" : "left-0"
      }`}
    >
      <Image src="/brand/logo-ring.png" alt="" fill sizes="620px" className="logo-turn" />
      <Image src="/brand/logo-emblem.png" alt="" fill sizes="620px" />
    </div>
  );
}
