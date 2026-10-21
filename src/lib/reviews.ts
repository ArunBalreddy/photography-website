// Client reviews: visitors send them into an inbox (one file each, so simultaneous reviews never clash);
// the admin approves them into the published list that the site shows.
import { randomBytes } from "node:crypto";
import { cacheLife, cacheTag } from "next/cache";
import {
  REVIEW_ID,
  asModerated,
  asReview,
  newestFirst,
  type ModeratedReview,
  type PublicReview,
  type Review,
  type ReviewsAdminData,
} from "./review-shared";
import { inboxAdd, inboxList, inboxRead, inboxRemove, readDoc, writeDoc } from "./storage";

export const REVIEWS_TAG = "reviews";
const MAX_PUBLISHED = 1000;

type ReviewsDoc = { version: 1; updatedAt: string; reviews: ModeratedReview[] };

function parseDoc(raw: unknown): ModeratedReview[] {
  const list = raw && typeof raw === "object" ? (raw as { reviews?: unknown }).reviews : null;
  if (!Array.isArray(list)) return [];
  return list.map(asModerated).filter((r): r is ModeratedReview => r !== null);
}

/** The reviews shown on the site, newest first. Cached until the admin changes something. */
export async function getPublicReviews(): Promise<PublicReview[]> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  try {
    const reviews = parseDoc(await readDoc("reviews", false));
    cacheLife("max");
    return reviews
      .filter((r) => !r.hidden)
      .sort(newestFirst)
      .map(({ id, name, rating, text, shoot, createdAt, reply }) => ({
        id,
        name,
        rating,
        text,
        createdAt,
        ...(shoot ? { shoot } : {}),
        ...(reply ? { reply } : {}),
      }));
  } catch (err) {
    console.error("Reviews: couldn't load, showing none for now —", err);
    cacheLife("minutes"); // try again soon rather than caching the failure
    return [];
  }
}

/** Stores a new (already validated) review in the inbox. */
export async function submitReview(value: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const review: Review = { id: randomBytes(12).toString("base64url"), createdAt: new Date().toISOString(), ...value };
  await inboxAdd(review.id, review);
  return review;
}

async function readModerated() {
  return parseDoc(await readDoc("reviews")); // throws if storage can't be read — never save over what we couldn't see
}

async function saveModerated(reviews: ModeratedReview[]) {
  const doc: ReviewsDoc = { version: 1, updatedAt: new Date().toISOString(), reviews: reviews.slice(0, MAX_PUBLISHED) };
  await writeDoc("reviews", doc);
}

export async function loadReviewsForAdmin(): Promise<ReviewsAdminData> {
  const [inbox, moderated] = await Promise.all([inboxList(), readModerated()]);
  const handled = new Set(moderated.map((r) => r.id));
  const pending = inbox.map(asReview).filter((r): r is Review => r !== null && !handled.has(r.id));
  return { pending: pending.sort(newestFirst), moderated: moderated.sort(newestFirst) };
}

function assertId(id: string) {
  if (!REVIEW_ID.test(id)) throw new Error("Unknown review.");
}

export async function approveReview(id: string) {
  assertId(id);
  const review = asReview(await inboxRead(id));
  const moderated = await readModerated();
  if (!moderated.some((r) => r.id === id)) {
    if (!review) throw new Error("That review is no longer waiting — refresh to see the latest.");
    await saveModerated([{ ...review, hidden: false, approvedAt: new Date().toISOString() }, ...moderated]);
  }
  await inboxRemove(id).catch((err) => console.error("Reviews: approved but couldn't clear the inbox copy —", err));
}

export async function discardPendingReview(id: string) {
  assertId(id);
  await inboxRemove(id);
}

export async function updateReview(id: string, change: { hidden?: boolean; reply?: string } | "delete") {
  assertId(id);
  const moderated = await readModerated();
  if (!moderated.some((r) => r.id === id)) throw new Error("That review no longer exists — refresh to see the latest.");
  const next =
    change === "delete"
      ? moderated.filter((r) => r.id !== id)
      : moderated.map((r) => {
          if (r.id !== id) return r;
          const updated: ModeratedReview = { ...r, ...(change.hidden !== undefined ? { hidden: change.hidden } : {}) };
          if (change.reply !== undefined) {
            if (change.reply) updated.reply = change.reply;
            else delete updated.reply;
          }
          return updated;
        });
  await saveModerated(next);
}
