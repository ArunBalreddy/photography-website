"use client";

import { useState, type FormEvent } from "react";
import { services, site } from "@/content/site";
import SectionHeading from "./SectionHeading";
import Reveal from "./Reveal";

const field =
  "w-full border-b border-line bg-transparent py-3 text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none";

export default function Contact() {
  const [sent, setSent] = useState(false);

  // No backend: hand the enquiry to the visitor's mail client, pre-filled.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = `${data.get("service")} enquiry — ${data.get("name")}`;
    const body = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Date: ${data.get("date") || "Flexible"}`,
      "",
      `${data.get("message")}`,
    ].join("\n");
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  }

  return (
    <section id="contact" className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-[1fr_1.3fr] md:py-36">
      <div>
        <SectionHeading eyebrow="Get in touch" title="Let's make something worth keeping." />
        <Reveal delay={100}>
          <p className="mt-6 text-lg text-muted">
            Tell me about your date, your story, or your project. I reply to every enquiry within 48 hours.
          </p>
          <dl className="mt-10 space-y-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-accent">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${site.email}`} className="hover:text-accent">{site.email}</a>
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-accent">Phone</dt>
              <dd className="mt-1">{site.phone}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.25em] text-accent">Studio</dt>
              <dd className="mt-1">{site.location}</dd>
            </div>
          </dl>
        </Reveal>
      </div>

      <Reveal delay={150}>
        <form onSubmit={onSubmit} className="grid gap-8 sm:grid-cols-2">
          <input name="name" required placeholder="Your name" className={field} aria-label="Your name" />
          <input name="email" type="email" required placeholder="Email address" className={field} aria-label="Email address" />
          <select name="service" className={`${field} [&>option]:bg-surface`} aria-label="Service" defaultValue={services[1].name}>
            {services.map((s) => (
              <option key={s.name}>{s.name}</option>
            ))}
            <option>Something else</option>
          </select>
          <input name="date" type="date" className={`${field} [color-scheme:dark]`} aria-label="Event date" />
          <textarea
            name="message"
            required
            rows={5}
            placeholder="Tell me a little about what you have in mind…"
            className={`${field} resize-none sm:col-span-2`}
            aria-label="Message"
          />
          <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
            <button
              type="submit"
              className="bg-accent px-10 py-4 text-xs uppercase tracking-[0.25em] text-background transition-colors hover:bg-foreground"
            >
              Send enquiry
            </button>
            {sent && <p className="text-sm text-muted">Opening your email app — thank you!</p>}
          </div>
        </form>
      </Reveal>
    </section>
  );
}
