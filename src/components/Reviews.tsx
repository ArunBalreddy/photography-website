import Link from "next/link";
import { getPublicReviews } from "@/lib/reviews";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import SectionLogo from "./SectionLogo";
import ReviewList from "./reviews/ReviewList";
import Stars from "./reviews/Stars";

const cta =
  "inline-block border border-foreground/40 px-8 py-4 text-xs uppercase tracking-[0.25em] transition-colors hover:border-accent hover:bg-accent hover:text-background";

export default async function Reviews() {
  const { reviews } = await getPublicReviews();
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;

  return (
    <section id="reviews" className="relative isolate border-y border-line bg-surface">
      <SectionLogo side="right" align="bottom" />
      <div className="mx-auto max-w-7xl px-6 py-28 md:py-36">
        <div className="mb-16 flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <SectionHeading eyebrow="Kind words" title="From the people in the frame" />
          {count > 0 && (
            <Reveal className="flex items-center gap-8">
              <div>
                <p className="font-serif text-6xl font-light leading-none">{average.toFixed(1)}</p>
                <div className="mt-3">
                  <Stars value={Math.round(average * 10) / 10} />
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-muted">
                  {count} review{count === 1 ? "" : "s"}
                </p>
              </div>
              <ul className="w-40 space-y-1.5" aria-label="Ratings breakdown">
                {[5, 4, 3, 2, 1].map((n) => {
                  const k = reviews.filter((r) => r.rating === n).length;
                  return (
                    <li key={n} className="flex items-center gap-2 text-[10px] text-muted">
                      <span className="w-2">{n}</span>
                      <span className="h-px flex-1 bg-line">
                        <span className="block h-px bg-accent" style={{ width: `${(k / count) * 100}%` }} />
                      </span>
                      <span className="w-4 text-right">{k}</span>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          )}
        </div>

        {count > 0 ? (
          <>
            <ReviewList reviews={reviews} />
            <Reveal className="mt-20 flex flex-col items-center gap-5 text-center">
              <p className="font-serif text-2xl italic text-accent">Had a shoot with us?</p>
              <Link href="/review" className={cta}>
                Write a review
              </Link>
            </Reveal>
          </>
        ) : (
          <Reveal className="mx-auto max-w-2xl border border-line bg-background/40 px-8 py-14 text-center md:px-14">
            <Stars value={5} size="h-5 w-5" />
            <p className="mt-6 font-serif text-3xl font-light md:text-4xl">Be the first to tell your story.</p>
            <p className="mx-auto mt-4 max-w-md text-muted">
              Had a shoot with us? A few words about how it felt helps other families and couples find their photographer.
            </p>
            <Link href="/review" className={`${cta} mt-10`}>
              Write a review
            </Link>
          </Reveal>
        )}
      </div>
    </section>
  );
}
