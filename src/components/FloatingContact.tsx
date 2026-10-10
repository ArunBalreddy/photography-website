import { emailLink, site, whatsappLink } from "@/content/site";
import InstagramIcon from "./InstagramIcon";
import MailIcon from "./MailIcon";
import WhatsAppIcon from "./WhatsAppIcon";

const label =
  "hidden rounded-full bg-surface/95 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 md:block";
const bubble =
  "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-110";

/** Floating email (when site.email is set) + Instagram + WhatsApp buttons, bottom-right (tablet and up; phones get MobileBar). */
export default function FloatingContact() {
  return (
    <div className="fixed bottom-8 right-8 z-40 hidden flex-col items-end gap-3 md:flex">
      {site.email && (
        <a href={emailLink("Photoshoot enquiry")} target="_blank" rel="noreferrer" aria-label="Email us" className="group flex items-center gap-3">
          <span className={label}>Email us</span>
          <span className={`${bubble} bg-accent`}>
            <MailIcon className="h-6 w-6 text-background" />
          </span>
        </a>
      )}
      <a
        href={site.instagramDM}
        target="_blank"
        rel="noreferrer"
        aria-label="Message on Instagram"
        className="group flex items-center gap-3"
      >
        <span className={label}>Message on Instagram</span>
        <span
          className={`${bubble} bg-[radial-gradient(circle_at_30%_107%,#fdf497_0%,#fdf497_5%,#fd5949_45%,#d6249f_60%,#285aeb_90%)]`}
        >
          <InstagramIcon className="h-7 w-7" />
        </span>
      </a>
      <a
        href={whatsappLink(`Hi ${site.photographer.split(" ")[0]}! I found ${site.name} online and have a question about a photoshoot.`)}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="group flex items-center gap-3"
      >
        <span className={label}>Chat on WhatsApp</span>
        <span className={`${bubble} bg-[#25D366]`}>
          <WhatsAppIcon className="h-7 w-7" />
        </span>
      </a>
    </div>
  );
}
