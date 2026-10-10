import { site, whatsappLink } from "@/content/site";
import WhatsAppIcon from "./WhatsAppIcon";

export default function WhatsAppButton() {
  return (
    <a
      href={whatsappLink(`Hi ${site.photographer.split(" ")[0]}! I found ${site.name} online and have a question about a photoshoot.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 md:bottom-8 md:right-8"
    >
      <span className="hidden rounded-full bg-surface/95 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 md:block">
        Chat on WhatsApp
      </span>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition-transform duration-300 group-hover:scale-110">
        <WhatsAppIcon className="h-7 w-7" />
      </span>
    </a>
  );
}
