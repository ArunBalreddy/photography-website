// Client reviews: visitors send them into an inbox (one file each, so simultaneous reviews never clash).
// By default inbox reviews are live on the site straight away and the admin hides or deletes bad ones;
// with "require approval" switched on, they wait in the inbox until the admin approves them.
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

/** Reviews the admin has acted on (kept, hidden, replied to), plus the publishing setting. */
type ReviewsDoc = { version: 1; updatedAt: string; requireApproval: boolean; reviews: ModeratedReview[] };
type State = Pick<ReviewsDoc, "requireApproval" | "reviews">;

function parseDoc(raw: unknown): State {
  const doc = raw && typeof raw === "object" ? (raw as Partial<Record<keyof ReviewsDoc, unknown>>) : {};
  const list = Array.isArray(doc.reviews) ? doc.reviews : [];
  return {
    requireApproval: doc.requireApproval === true,
    reviews: list.map(asModerated).filter((r): r is ModeratedReview => r !== null),
  };
}

const inboxReviews = async () => (await inboxList()).map(asReview).filter((r): r is Review => r !== null);

const toPublic = ({ id, name, rating, text, shoot, createdAt, reply }: Review & { reply?: string }): PublicReview => ({
  id,
  name,
  rating,
  text,
  createdAt,
  ...(shoot ? { shoot } : {}),
  ...(reply ? { reply } : {}),
});

/** The reviews shown on the site, newest first. Cached until a review arrives or the admin changes something. */
export async function getPublicReviews(): Promise<{ reviews: PublicReview[]; requireApproval: boolean }> {
  "use cache";
  cacheTag(REVIEWS_TAG);
  try {
    const { reviews, requireApproval } = parseDoc(await readDoc("reviews", false));
    const handled = new Set(reviews.map((r) => r.id));
    const live: (Review & { reply?: string })[] = reviews.filter((r) => !r.hidden);
    if (!requireApproval) live.push(...(await inboxReviews()).filter((r) => !handled.has(r.id)));
    cacheLife("max");
    return { reviews: live.sort(newestFirst).map(toPublic), requireApproval };
  } catch (err) {
    console.error("Reviews: couldn't load, showing none for now —", err);
    cacheLife("minutes"); // try again soon rather than caching the failure
    return { reviews: [], requireApproval: false };
  }
}

/** Stores a new (already validated) review in the inbox. */
export async function submitReview(value: Omit<Review, "id" | "createdAt">): Promise<Review> {
  const review: Review = { id: randomBytes(12).toString("base64url"), createdAt: new Date().toISOString(), ...value };
  await inboxAdd(review.id, review);
  return review;
}

async function readState() {
  return parseDoc(await readDoc("reviews")); // throws if storage can't be read — never save over what we couldn't see
}

async function saveState(state: State) {
  const doc: ReviewsDoc = {
    version: 1,
    updatedAt: new Date().toISOString(),
    requireApproval: state.requireApproval,
    reviews: state.reviews.slice(0, MAX_PUBLISHED),
  };
  await writeDoc("reviews", doc);
}

const kept = (r: Review): ModeratedReview => ({ ...r, hidden: false, approvedAt: new Date().toISOString() });

const clearInbox = (ids: string[]) =>
  Promise.all(ids.map((id) => inboxRemove(id).catch((err) => console.error("Reviews: couldn't clear inbox copy —", err))));

export async function loadReviewsForAdmin(): Promise<ReviewsAdminData> {
  const [inbox, state] = await Promise.all([inboxReviews(), readState()]);
  const handled = new Set(state.reviews.map((r) => r.id));
  return {
    pending: inbox.filter((r) => !handled.has(r.id)).sort(newestFirst),
    moderated: state.reviews.sort(newestFirst),
    requireApproval: state.requireApproval,
  };
}

function assertId(id: string) {
  if (!REVIEW_ID.test(id)) throw new Error("Unknown review.");
}

/** Approve (approval mode) or "mark as seen" (instant mode): moves an inbox review into the kept list. */
export async function approveReview(id: string) {
  assertId(id);
  const review = asReview(await inboxRead(id));
  const state = await readState();
  if (!state.reviews.some((r) => r.id === id)) {
    if (!review) throw new Error("That review is no longer new — refresh to see the latest.");
    await saveState({ ...state, reviews: [kept(review), ...state.reviews] });
  }
  await clearInbox([id]);
}

/** Keeps every inbox review at once (they stay on the site). */
export async function approveAllReviews() {
  const { pending, ...state } = await loadReviewsForAdmin();
  if (!pending.length) return;
  await saveState({ requireApproval: state.requireApproval, reviews: [...pending.map(kept), ...state.moderated] });
  await clearInbox(pending.map((r) => r.id));
}

export async function discardPendingReview(id: string) {
  assertId(id);
  await inboxRemove(id);
}

export async function updateReview(id: string, change: { hidden?: boolean; reply?: string } | "delete") {
  assertId(id);
  const state = await readState();
  let reviews = state.reviews;
  let fromInbox = false;
  if (!reviews.some((r) => r.id === id)) {
    // A new review that's live without approval: take it out of the inbox to change it.
    const review = asReview(await inboxRead(id));
    if (!review) throw new Error("That review no longer exists — refresh to see the latest.");
    reviews = [kept(review), ...reviews];
    fromInbox = true;
  }
  const next =
    change === "delete"
      ? reviews.filter((r) => r.id !== id)
      : reviews.map((r) => {
          if (r.id !== id) return r;
          const updated: ModeratedReview = { ...r, ...(change.hidden !== undefined ? { hidden: change.hidden } : {}) };
          if (change.reply !== undefined) {
            if (change.reply) updated.reply = change.reply;
            else delete updated.reply;
          }
          return updated;
        });
  await saveState({ ...state, reviews: next });
  if (fromInbox) await clearInbox([id]);
}

/** Switches between instant publishing and approval first. */
export async function setRequireApproval(requireApproval: boolean) {
  const { pending, moderated } = await loadReviewsForAdmin();
  // Turning approval on: whatever is live now stays live (only reviews from now on wait).
  const reviews = requireApproval ? [...pending.map(kept), ...moderated] : moderated;
  await saveState({ requireApproval, reviews });
  if (requireApproval) await clearInbox(pending.map((r) => r.id));
}
