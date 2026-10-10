"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { emailLink, shootTypes, site, whatsappLink } from "@/content/site";
import { formatShootDate, type Booking } from "@/lib/booking";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";
import WhatsAppIcon from "./WhatsAppIcon";
import InstagramIcon from "./InstagramIcon";
import MailIcon from "./MailIcon";
import SectionLogo from "./SectionLogo";

const field =
  "w-full border-b border-line bg-transparent py-3 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";

const firstName = site.photographer.split(" ")[0];
const timeSlots = ["Morning", "Afternoon", "Evening / Golden hour", "Full day", "Not sure yet"];

function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

type Via = "whatsapp" | "instagram" | "email";

// Each booking does two things at once: /api/booking sends the studio an instant WhatsApp alert
// (CallMeBot), and the visitor's chosen app opens so they can message the studio directly —
// WhatsApp or email pre-filled, or an Instagram DM with the booking copied to paste (Instagram has no pre-fill).
export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const [shoot, setShoot] = useState("");
  const [sent, setSent] = useState<{ via: Via; link: string; text: string } | null>(null);
  const [alerted, setAlerted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // "Book this" buttons elsewhere link to #book=<shoot type> to preselect it here.
    const fromHash = () => {
      if (!location.hash.startsWith("#book=")) return;
      const type = decodeURIComponent(location.hash.slice("#book=".length));
      if (shootTypes.includes(type)) setShoot(type);
      setSent(null);
      history.replaceState(null, "", "#contact");
      sectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const chosen = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
    const via: Via = chosen === "instagram" || chosen === "email" ? chosen : "whatsapp";
    const data = new FormData(e.currentTarget);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    const booking: Booking & { website: string } = {
      shoot: get("shoot"),
      date: get("date"),
      time: get("time"),
      location: get("location"),
      name: get("name"),
      phone: get("phone"),
      message: get("message"),
      website: get("website"),
    };

    setAlerted(false);
    // keepalive lets the alert finish even if WhatsApp replaces this page on mobile.
    fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
      keepalive: true,
    })
      .then((res) => setAlerted(res.ok))
      .catch(() => {});

    // WhatsApp renders *bold*; Instagram DMs and email don't, so keep those plain.
    const b = (label: string) => (via === "whatsapp" ? `*${label}:*` : `${label}:`);
    const text = [
      `Hi ${firstName}! I'd like to book a photoshoot 📸`,
      "",
      `${b("Shoot")} ${booking.shoot}`,
      `${b("Date")} ${formatShootDate(booking.date)}`,
      `${b("Time")} ${booking.time}`,
      booking.location ? `${b("Location")} ${booking.location}` : null,
      `${b("Name")} ${booking.name}`,
      `${b("Phone")} ${booking.phone}`,
      booking.message ? `\n${booking.message}` : null,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const link =
      via === "whatsapp"
        ? whatsappLink(text)
        : via === "email"
          ? emailLink(`Photoshoot booking — ${booking.shoot}`, text)
          : site.instagramDM;
    if (via === "instagram") {
      setCopied(false);
      navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {});
    }
    setSent({ via, link, text });
    // mailto: hands off to the mail app; opening it in a new tab would leave a blank tab behind.
    if (via === "email" || !window.open(link, "_blank", "noopener")) window.location.href = link;
  }

  function copyAgain() {
    if (!sent) return;
    navigator.clipboard?.writeText(sent.text).then(() => setCopied(true), () => {});
  }

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="relative isolate mx-auto grid max-w-7xl scroll-mt-20 gap-16 px-6 py-28 md:py-36 lg:grid-cols-[1fr_1.4fr]"
    >
      <SectionLogo side="left" align="center" />
      <div>
        <SectionHeading eyebrow="Book a shoot" title="Let's make something worth keeping." />
        <Reveal delay={100}>
          <p className="mt-6 text-lg text-muted">
            Pick what you&apos;d like to shoot and a date, then send your request to {site.photographer} on WhatsApp,
            Instagram{site.email ? " or email" : ""} — whichever you prefer.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappLink(`Hi ${firstName}! I have a question about a photoshoot.`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 border border-[#25D366]/60 px-6 py-3 text-xs uppercase tracking-[0.25em] text-[#25D366] transition-colors hover:bg-[#25D366] hover:text-background"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Chat on WhatsApp
            </a>
            <a
              href={site.instagramDM}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-3 border border-[#E1306C]/60 px-6 py-3 text-xs uppercase tracking-[0.25em] text-[#E1306C] transition-colors hover:bg-[#E1306C] hover:text-foreground"
            >
              <InstagramIcon className="h-4 w-4" />
              Message on Instagram
            </a>
            {site.email && (
              <a
                href={emailLink("Photoshoot enquiry")}
                className="inline-flex items-center gap-3 border border-accent/60 px-6 py-3 text-xs uppercase tracking-[0.25em] text-accent transition-colors hover:bg-accent hover:text-background"
              >
                <MailIcon className="h-4 w-4" />
                Email us
              </a>
            )}
          </div>
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
                  @{site.instagramHandle}
                </a>
              </dd>
            </div>
            {site.email && (
              <div>
                <dt className="text-xs uppercase tracking-[0.25em] text-accent">Email</dt>
                <dd className="mt-1">
                  <a href={emailLink("Photoshoot enquiry")} className="hover:text-accent">
                    {site.email}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-accent">Studio</dt>
              <dd className="mt-1">{site.location}</dd>
            </div>
          </dl>
        </Reveal>
      </div>

      <Reveal delay={150}>
        {sent ? (
          <div className="border border-line bg-surface p-10">
            {sent.via === "whatsapp" ? (
              <WhatsAppIcon className="h-10 w-10 text-[#25D366]" />
            ) : sent.via === "email" ? (
              <MailIcon className="h-10 w-10 text-accent" />
            ) : (
              <InstagramIcon className="h-10 w-10 text-[#E1306C]" />
            )}
            <h3 className="mt-6 font-serif text-4xl">{alerted ? "Request sent!" : "Almost done!"}</h3>
            {alerted && (
              <p className="mt-4 text-muted">
                {firstName} has received your booking and will get back to you to confirm availability.
              </p>
            )}
            {sent.via === "whatsapp" ? (
              <p className="mt-4 text-muted">
                Your booking details are ready in WhatsApp — tap <strong className="text-foreground">Send</strong>{" "}
                {alerted ? "there to chat with him directly." : "to confirm your request."}
              </p>
            ) : sent.via === "email" ? (
              <p className="mt-4 text-muted">
                Your booking email is ready in your mail app — tap <strong className="text-foreground">Send</strong>{" "}
                {alerted ? "to email him directly." : "to confirm your request."} You can also write to{" "}
                <span className="text-foreground">{site.email}</span>.
              </p>
            ) : (
              <>
                <p className="mt-4 text-muted">
                  {copied ? "Your booking details are copied. " : ""}In the Instagram chat with @{site.instagramHandle},{" "}
                  <strong className="text-foreground">paste</strong> {copied ? "them" : "the details below"} and tap{" "}
                  <strong className="text-foreground">Send</strong>.
                </p>
                <pre className="mt-6 max-h-48 overflow-auto whitespace-pre-wrap border border-line bg-background/60 p-4 font-sans text-sm text-foreground/80">
                  {sent.text}
                </pre>
              </>
            )}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <a
                href={sent.link}
                target={sent.via === "email" ? undefined : "_blank"}
                rel="noreferrer"
                className={`px-6 py-3 text-xs uppercase tracking-[0.25em] hover:bg-foreground hover:text-background ${
                  sent.via === "whatsapp"
                    ? "bg-[#25D366] text-background"
                    : sent.via === "email"
                      ? "bg-accent text-background"
                      : "bg-[#E1306C] text-foreground"
                }`}
              >
                {sent.via === "whatsapp"
                  ? "WhatsApp didn't open? Tap here"
                  : sent.via === "email"
                    ? "Mail app didn't open? Tap here"
                    : "Open Instagram chat"}
              </a>
              {sent.via === "instagram" && (
                <button onClick={copyAgain} className="text-xs uppercase tracking-[0.25em] underline-offset-8 hover:underline">
                  {copied ? "Copied ✓ Copy again" : "Copy details"}
                </button>
              )}
              <button
                onClick={() => setSent(null)}
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
            {/* Honeypot for bots — hidden from people and screen readers. */}
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute -left-[9999px] h-px w-px opacity-0"
            />
            <div className="flex flex-wrap gap-4 sm:col-span-2">
              <button
                type="submit"
                value="whatsapp"
                className="inline-flex items-center gap-3 bg-[#25D366] px-8 py-4 text-xs uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground"
              >
                <WhatsAppIcon className="h-4 w-4" />
                Book on WhatsApp
              </button>
              <button
                type="submit"
                value="instagram"
                className="inline-flex items-center gap-3 border border-[#E1306C] px-8 py-4 text-xs uppercase tracking-[0.25em] text-[#E1306C] transition-colors hover:bg-[#E1306C] hover:text-foreground"
              >
                <InstagramIcon className="h-4 w-4" />
                Book via Instagram
              </button>
              {site.email && (
                <button
                  type="submit"
                  value="email"
                  className="inline-flex items-center gap-3 border border-accent px-8 py-4 text-xs uppercase tracking-[0.25em] text-accent transition-colors hover:bg-accent hover:text-background"
                >
                  <MailIcon className="h-4 w-4" />
                  Book via Email
                </button>
              )}
            </div>
          </form>
        )}
      </Reveal>
    </section>
  );
}
