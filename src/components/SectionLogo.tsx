import Image from "next/image";

const VERTICAL = {
  top: "-top-[12%]",
  center: "top-1/2 -translate-y-1/2",
  bottom: "-bottom-[12%]",
};

/**
 * Brand watermark behind a section: a large brush ring (slowly turning) with the camera at its
 * centre, bleeding off the screen edge and fading toward the content so text stays crisp.
 * The section needs `relative isolate`; this layer spans the full viewport width.
 */
export default function SectionLogo({
  side = "right",
  align = "center",
}: {
  side?: "left" | "right";
  align?: keyof typeof VERTICAL;
}) {
  const right = side === "right";
  const fade = `linear-gradient(to ${right ? "left" : "right"}, black 50%, transparent 95%)`;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 overflow-hidden"
    >
      <div
        className={`logo-drift absolute aspect-square w-[min(140vw,900px)] ${VERTICAL[align]} ${
          right ? "right-0 translate-x-[32%]" : "left-0 -translate-x-[32%]"
        }`}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
      >
        <div className="absolute inset-[18%] rounded-full bg-[radial-gradient(circle,rgb(200_169_126/0.16),transparent_70%)] blur-3xl" />
        <Image src="/brand/logo-ring.png" alt="" fill sizes="900px" className="logo-turn opacity-[0.16]" />
        <Image src="/brand/logo-camera.png" alt="" fill sizes="900px" className="opacity-[0.12]" />
      </div>
    </div>
  );
}
