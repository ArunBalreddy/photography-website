import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ReviewForm from "@/components/reviews/ReviewForm";
import { blurProps } from "@/content/blur";
import { site } from "@/content/site";
import { getPublicReviews } from "@/lib/reviews";
import { storageMode } from "@/lib/storage";

export const metadata: Metadata = {
  title: `Write a review — ${site.fullName}`,
  description: `Had a shoot with ${site.photographer}? Share how it felt.`,
  robots: { index: false, follow: true },
};

const BACKDROP = "/hero/couple-petals.jpg";

export default async function ReviewPage() {
  const { requireApproval } = await getPublicReviews();
  const first = site.photographer.split(" ")[0];
  return (
    <main className="relative isolate min-h-svh overflow-hidden">
      <Image
        src={BACKDROP}
        alt=""
        fill
        sizes="100vw"
        preload
        className="-z-20 object-cover opacity-30"
        style={{ objectPosition: "60% 50%" }}
        {...blurProps(BACKDROP)}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background/70 via-background/85 to-background" />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-10 md:pt-14 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-20 lg:pb-24">
        <div>
          <Link href="/" className="inline-flex items-center gap-3" aria-label={`${site.fullName} — home`}>
            <span className="relative aspect-square w-11">
              <Image src="/brand/logo-ring.png" alt="" fill sizes="44px" className="logo-turn-header" />
              <Image src="/brand/logo-camera.png" alt="" fill sizes="44px" />
            </span>
            <span className="leading-tight">
              <span className="block font-serif text-xl font-semibold tracking-[0.18em]">{site.name}</span>
              <span className="block font-serif text-sm italic text-accent">by {site.photographer}</span>
            </span>
          </Link>

          <p className="mt-16 text-xs uppercase tracking-[0.4em] text-accent lg:mt-24">Share your experience</p>
          <h1 className="mt-5 font-serif text-5xl font-light leading-[1.05] md:text-7xl">
            How did it <em className="text-accent">feel?</em>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Your words help other families and couples find their photographer — and they mean the world to {first}.
          </p>
          <Link href="/#reviews" className="mt-10 inline-block text-xs uppercase tracking-[0.25em] text-foreground/70 hover:text-accent">
            ← Back to the site
          </Link>
        </div>

        <ReviewForm open={storageMode() !== "none"} instant={!requireApproval} />
      </div>
    </main>
  );
}
