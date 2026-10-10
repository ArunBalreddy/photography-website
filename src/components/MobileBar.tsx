"use client";

import { useEffect, useState } from "react";
import { emailLink, site, whatsappLink } from "@/content/site";
import InstagramIcon from "./InstagramIcon";
import MailIcon from "./MailIcon";
import WhatsAppIcon from "./WhatsAppIcon";

const icon =
  "flex h-12 w-12 shrink-0 items-center justify-center border border-line transition-colors active:bg-foreground/10";

/** Phone-only bottom action bar (replaces the floating bubbles there), shown once past the hero. */
export default function MobileBar() {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/90 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-md transition-transform duration-500 md:hidden ${
        shown ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-2">
        <a
          href="#contact"
          tabIndex={shown ? 0 : -1}
          className="flex h-12 flex-1 items-center justify-center bg-accent text-xs font-medium uppercase tracking-[0.25em] text-background active:bg-foreground"
        >
          Book a shoot
        </a>
        <a
          href={whatsappLink(`Hi ${site.photographer.split(" ")[0]}! I have a question about a photoshoot.`)}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          tabIndex={shown ? 0 : -1}
          className={`${icon} text-[#25D366]`}
        >
          <WhatsAppIcon className="h-5 w-5" />
        </a>
        <a
          href={site.instagramDM}
          target="_blank"
          rel="noreferrer"
          aria-label="Message on Instagram"
          tabIndex={shown ? 0 : -1}
          className={`${icon} text-[#E1306C]`}
        >
          <InstagramIcon className="h-5 w-5" />
        </a>
        {site.email && (
          <a href={emailLink("Photoshoot enquiry")} aria-label="Email us" tabIndex={shown ? 0 : -1} className={`${icon} text-accent`}>
            <MailIcon className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}
