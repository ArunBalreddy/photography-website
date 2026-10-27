// The "Services & pricing" cards. Editable in the admin (stored with the gallery); until then the
// built-in list from site.ts is shown.
import { services as builtInList, shootTypes } from "@/content/site";

export type ServiceDef = {
  id: string;
  name: string;
  /** Free text, e.g. "₹25,000" or "On request". */
  price: string;
  /** Shown before the price, e.g. "per session", "starting from". */
  unit: string;
  /** A gallery photo id, or "svc:<name>" for one of the original card photos. */
  imageId?: string;
  /** Preselected shoot type when the visitor taps "Book this". */
  bookAs: string;
  features: string[];
  /** Non-empty → the card is highlighted with this label (e.g. "Most booked"). */
  badge: string;
  /** Kept in the admin but not shown on the site. */
  hidden: boolean;
};

/** What a card on the site needs. */
export type ServiceCardData = Omit<ServiceDef, "imageId" | "hidden"> & { image?: { src: string; blur?: string } };

export const MAX_SERVICES = 12;
export const MAX_FEATURES = 10;
export const LIMITS = { name: 60, price: 30, unit: 30, feature: 80, badge: 24 };

const basename = (src: string) => src.split("/").pop()!.replace(/\.\w+$/, "");

/** The photos the original cards used, selectable alongside gallery photos. */
export const builtInServiceImages = [...new Set(builtInList.map((s) => s.image))].map((src) => ({ id: `svc:${basename(src)}`, src }));

export const serviceId = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "service";

export function defaultServices(): ServiceDef[] {
  return builtInList.map((s) => ({
    id: serviceId(s.name),
    name: s.name,
    price: s.price,
    unit: s.unit,
    imageId: `svc:${basename(s.image)}`,
    bookAs: s.bookAs,
    features: [...s.features],
    badge: (s as { featured?: boolean }).featured ? "Most booked" : "",
    hidden: false,
  }));
}

type PhotoLike = { id: string; kind: string; src: string; blur?: string };

export function resolveServiceImage(imageId: string | undefined, items: PhotoLike[]) {
  if (!imageId) return undefined;
  const builtIn = builtInServiceImages.find((i) => i.id === imageId);
  if (builtIn) return { src: builtIn.src };
  const item = items.find((i) => i.id === imageId && i.kind === "photo");
  return item ? { src: item.src, ...(item.blur ? { blur: item.blur } : {}) } : undefined;
}

/** The cards the site shows: the admin's list (or the built-ins), without hidden ones. */
export function resolveServices(defs: ServiceDef[] | undefined, items: PhotoLike[]): ServiceCardData[] {
  return (defs ?? defaultServices())
    .filter((s) => !s.hidden)
    .map((s) => {
      const image = resolveServiceImage(s.imageId, items);
      const { id, name, price, unit, bookAs, features, badge } = s;
      return { id, name, price, unit, bookAs, features, badge, ...(image ? { image } : {}) };
    });
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Cleans what the admin saved. Throws only for problems the admin must fix; quietly drops broken photo links. */
export function validateServices(input: unknown, knownPhotoIds: Set<string>): ServiceDef[] {
  if (!Array.isArray(input)) throw new Error("Invalid services.");
  if (input.length > MAX_SERVICES) throw new Error(`Up to ${MAX_SERVICES} services.`);
  const out: ServiceDef[] = [];
  for (const raw of input as Partial<ServiceDef>[]) {
    const id = typeof raw?.id === "string" && /^[a-z0-9-]{1,60}$/.test(raw.id) ? raw.id : null;
    const name = text(raw?.name, LIMITS.name);
    if (!id || out.some((s) => s.id === id)) throw new Error("Duplicate or missing service id.");
    if (!name) throw new Error("Every service needs a name.");
    const price = text(raw.price, LIMITS.price);
    if (!price) throw new Error(`"${name}" needs a price (or write "On request").`);
    const features = (Array.isArray(raw.features) ? raw.features : [])
      .map((f) => text(f, LIMITS.feature))
      .filter(Boolean)
      .slice(0, MAX_FEATURES);
    const imageId = typeof raw.imageId === "string" && (knownPhotoIds.has(raw.imageId) || builtInServiceImages.some((i) => i.id === raw.imageId)) ? raw.imageId : undefined;
    out.push({
      id,
      name,
      price,
      unit: text(raw.unit, LIMITS.unit),
      ...(imageId ? { imageId } : {}),
      bookAs: typeof raw.bookAs === "string" && shootTypes.includes(raw.bookAs) ? raw.bookAs : "Other",
      features,
      badge: text(raw.badge, LIMITS.badge),
      hidden: raw.hidden === true,
    });
  }
  return out;
}
