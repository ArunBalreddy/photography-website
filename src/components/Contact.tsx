"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { shootTypes, site, whatsappLink } from "@/content/site";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import WhatsAppIcon from "./WhatsAppIcon";

const field =
  "w-full border-b border-line bg-transparent py-3 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";

const firstName = site.photographer.split(" ")[0];
const timeSlots = ["Morning", "Afternoon", "Evening / Golden hour", "Full day", "Not sure yet"];

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function formatDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// No backend: the booking opens in the visitor's WhatsApp, pre-filled and addressed to the studio.
export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [shoot, setShoot] = useState("");
  const [sentLink, setSentLink] = useState<string | null>(null);

  useEffect(() => {
    // "Book this" buttons elsewhere link to #book=<shoot type> to preselect it here.
    const fromHash = () => {
      if (!location.hash.startsWith("#book=")) return;
      const type = decodeURIComponent(location.hash.slice("#book=".length));
      if (shootTypes.includes(type)) setShoot(type);
      setSentLink(null);
      history.replaceState(null, "", "#contact");
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();

    const lines = [
      `Hi ${firstName}! I'd like to book a photoshoot 📸`,
      "",
      `*Shoot:* ${get("shoot")}`,
      `*Date:* ${formatDate(get("date"))}`,
      `*Time:* ${get("time")}`,
      get("location") ? `*Location:* ${get("location")}` : null,
      `*Name:* ${get("name")}`,
      `*Phone:* ${get("phone")}`,
      get("message") ? `\n${get("message")}` : null,
    ].filter((line) => line !== null);

    const link = whatsappLink(lines.join("\n"));
    setSentLink(link);
    if (!window.open(link, "_blank", "noopener")) window.location.href = link;
  }

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="mx-auto grid max-w-7xl scroll-mt-20 gap-16 px-6 py-28 md:py-36 lg:grid-cols-[1fr_1.4fr]"
    >
      <div>
        <SectionHeading eyebrow="Book a shoot" title="Let's make something worth keeping." />
        <Reveal delay={100}>
          <p className="mt-6 text-lg text-muted">
            Pick what you&apos;d like to shoot and a date. Your booking request opens in WhatsApp, ready to send
            straight to {site.photographer}.
          </p>
          <a
            href={whatsappLink(`Hi ${firstName}! I have a question about a photoshoot.`)}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center gap-3 border border-[#25D366]/60 px-6 py-3 text-xs uppercase tracking-[0.25em] text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-background"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Chat on WhatsApp
          </a>
          <dl className="mt-10 space-y-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-accent">Phone / WhatsApp</dt>
              <dd className="mt-1">
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-accent">
                  {site.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-accent">Instagram</dt>
              <dd className="mt-1">
                <a href={site.instagram} target="_blank" rel="noreferrer" className="hover:text-accent">
                  @__picturesque__1
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-accent">Studio</dt>
              <dd className="mt-1">{site.location}</dd>
            </div>
          </dl>
        </Reveal>
      </div>

      <Reveal delay={150}>
        {sentLink ? (
          <div className="border border-line bg-surface p-10">
            <WhatsAppIcon className="h-10 w-10 text-[#25D366]" />
            <h3 className="mt-6 font-serif text-4xl">Almost done!</h3>
            <p className="mt-4 text-muted">
              Your booking details are ready in WhatsApp — just tap <strong className="text-foreground">Send</strong>{" "}
              to confirm your request. {site.photographer} will reply on WhatsApp to confirm availability.
            </p>
            <div className="mt-8 flex flex-wrap gap-6">
              <a
                href={sentLink}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] px-6 py-3 text-xs uppercase tracking-[0.25em] text-background hover:bg-foreground"
              >
                WhatsApp didn&apos;t open? Tap here
              </a>
              <button
                onClick={() => setSentLink(null)}
                className="text-xs uppercase tracking-[0.25em] underline-offset-8 hover:underline"
              >
                Make another booking
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-8 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className="mb-4 text-xs uppercase tracking-[0.25em] text-accent">What are we shooting?</legend>
              <div className="flex flex-wrap gap-2">
                {shootTypes.map((type) => (
                  <label key={type} className="cursor-pointer">
                    <input
                      type="radio"
                      name="shoot"
                      value={type}
                      required
                      checked={shoot === type}
                      onChange={() => setShoot(type)}
                      className="peer sr-only"
                    />
                    <span className="block border border-line px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/70 transition-colors hover:border-foreground/50 hover:text-foreground peer-checked:border-accent peer-checked:bg-accent peer-checked:text-background peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-accent">
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <input name="name" required autoComplete="name" placeholder="Your name" className={field} aria-label="Your name" />
            <input
              name="phone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              pattern="[0-9+\s\-]{10,16}"
              title="Enter a 10-digit mobile number"
              placeholder="Your WhatsApp number"
              className={field}
              aria-label="Your WhatsApp number"
            />
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Preferred date</span>
              <input
                name="date"
                type="date"
                required
                onFocus={(e) => (e.currentTarget.min = todayISO())}
                className={`${field} [color-scheme:dark]`} />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-[0.2em] text-muted">Preferred time</span>
              <select name="time" className={`${field} [&>option]:bg-surface`} defaultValue={timeSlots[0]}>
                {timeSlots.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <input
              name="location"
              placeholder="Venue / location (e.g. Hyderabad, Gachibowli)"
              className={`${field} sm:col-span-2`}
              aria-label="Venue or location"
            />
            <textarea
              name="message"
              rows={4}
              placeholder="Anything else? Number of days, guest count, ideas…"
              className={`${field} resize-none sm:col-span-2`}
              aria-label="Additional details"
            />
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center gap-3 bg-[#25D366] px-10 py-4 text-xs uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Book on WhatsApp
              </button>
            </div>
          </form>
        )}
      </Reveal>
    </section>
  );
}
