"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { emailLink, nav, site, whatsappLink } from "@/content/site";
import InstagramIcon from "./InstagramIcon";
import MailIcon from "./MailIcon";
import WhatsAppIcon from "./WhatsAppIcon";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Background once scrolled; hide the bar while scrolling down, bring it back on any scroll up;
  // gold reading-progress line along the very top.
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > 40);
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 160);
        lastY = y;
      }
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Underline the link for whichever section is in the middle of the screen.
  useEffect(() => {
    const sections = nav
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((el): el is HTMLElement => el !== null);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Full-screen phone menu: lock page scroll, close on Escape or when the screen grows to desktop.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  const firstName = site.photographer.split(" ")[0];

  return (
    <>
      <div
        ref={progressRef}
        aria-hidden
        className="fixed inset-x-0 top-0 z-[41] h-0.5 origin-left scale-x-0 bg-gradient-to-r from-accent/70 to-accent"
      />

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[transform,background-color,border-color] duration-500 ${
          hidden && !open ? "-translate-y-full" : "translate-y-0"
        } ${scrolled || open ? "border-b border-line bg-background/90 backdrop-blur-md" : "border-b border-transparent bg-transparent"}`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <a href="#top" aria-label={site.fullName} onClick={() => setOpen(false)} className="flex items-center gap-2.5 md:gap-3">
            {/* logo mark: the brush ring turns slowly around the camera */}
            <span aria-hidden className="relative aspect-square w-9 shrink-0 sm:w-11 md:w-14 lg:w-11 xl:w-14">
              <Image src="/brand/logo-ring.png" alt="" fill sizes="56px" className="logo-turn-header" />
              <Image src="/brand/logo-camera.png" alt="" fill sizes="56px" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-serif text-[clamp(1.2rem,6vw,1.75rem)] font-semibold tracking-[0.2em] md:text-4xl lg:text-2xl xl:text-4xl">
                {site.name}
              </span>
              <span className="mt-1 font-serif text-[clamp(0.85rem,4vw,1.0625rem)] font-medium italic text-accent md:text-xl lg:text-base xl:text-xl">
                by {site.photographer}
              </span>
            </span>
          </a>

          <nav className="hidden gap-6 lg:flex xl:gap-10">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                aria-current={active === item.href ? "location" : undefined}
                className={`relative py-1 text-xs uppercase tracking-[0.25em] transition-colors after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-full after:origin-left after:bg-accent after:transition-transform after:duration-500 hover:text-accent hover:after:scale-x-100 ${
                  active === item.href ? "text-foreground after:scale-x-100" : "text-foreground/70 after:scale-x-0"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="#contact"
            className="hidden border border-foreground/40 px-5 py-2.5 text-xs uppercase tracking-[0.25em] transition-colors hover:border-accent hover:bg-accent hover:text-background lg:inline-block"
          >
            Book a shoot
          </a>

          <button
            className="relative flex h-11 w-11 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className={`h-px w-7 bg-foreground transition-transform duration-500 ${open ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`h-px w-7 bg-foreground transition-transform duration-500 ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      {/* Full-screen phone/tablet menu — outside the header so the header's slide transform can't re-anchor it. */}
      <div
        id="mobile-menu"
        aria-hidden={!open}
        className={`fixed inset-0 z-[35] flex flex-col bg-background/[0.97] px-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-28 backdrop-blur-xl transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav className="flex flex-1 flex-col justify-center gap-2">
          {nav.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              style={{ transitionDelay: open ? `${120 + i * 70}ms` : "0ms" }}
              className={`group flex items-baseline gap-5 border-b border-line py-4 transition-[opacity,transform] duration-700 ${
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
            >
              <span className="text-xs tracking-[0.2em] text-accent">{String(i + 1).padStart(2, "0")}</span>
              <span
                className={`font-serif text-4xl transition-colors sm:text-5xl ${
                  active === item.href ? "text-accent" : "group-hover:text-accent"
                }`}
              >
                {item.label}
              </span>
            </a>
          ))}
        </nav>

        <div
          style={{ transitionDelay: open ? `${120 + nav.length * 70}ms` : "0ms" }}
          className={`transition-[opacity,transform] duration-700 ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}
        >
          <a
            href="#contact"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            className="block bg-accent py-4 text-center text-sm font-medium uppercase tracking-[0.25em] text-background"
          >
            Book a shoot
          </a>
          <div className="mt-6 flex items-center justify-center gap-8 text-foreground/80">
            <a
              href={whatsappLink(`Hi ${firstName}! I have a question about a photoshoot.`)}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              tabIndex={open ? 0 : -1}
              className="hover:text-[#25D366]"
            >
              <WhatsAppIcon className="h-6 w-6" />
            </a>
            <a
              href={site.instagramDM}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              tabIndex={open ? 0 : -1}
              className="hover:text-[#E1306C]"
            >
              <InstagramIcon className="h-6 w-6" />
            </a>
            {site.email && (
              <a href={emailLink("Photoshoot enquiry")} aria-label="Email" tabIndex={open ? 0 : -1} className="hover:text-accent">
                <MailIcon className="h-6 w-6" />
              </a>
            )}
            <a
              href={`tel:${site.phone.replace(/\s/g, "")}`}
              tabIndex={open ? 0 : -1}
              className="text-sm tracking-[0.1em] hover:text-accent"
            >
              {site.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
