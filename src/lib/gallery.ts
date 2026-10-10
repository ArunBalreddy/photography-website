// The public gallery's folders and items, editable from /admin. Until the admin first saves, it's
// built from the photos/films defined in src/content/site.ts.
import { cacheLife, cacheTag } from "next/cache";
import { categories, works as builtInWorks, type Work } from "@/content/site";
import { cloudinaryConfig } from "./cloudinary";
import { readDoc, writeDoc } from "./storage";

export const GALLERY_TAG = "gallery";

export type GalleryFolder = { id: string; title: string };
export type StoredItem = Omit<Work, "category" | "folder"> & { folder: string };
export type Manifest = { version: 1; updatedAt: string; folders: GalleryFolder[]; items: StoredItem[] };
export type GalleryData = { folders: GalleryFolder[]; works: Work[] };

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "folder";

const DEFAULT_ORDER = ["Weddings", "Kids", "Portraits", "Couples", "Maternity", "Food & Commercial"];

export function defaultManifest(): Manifest {
  const titles = [...DEFAULT_ORDER, ...categories.filter((c) => !DEFAULT_ORDER.includes(c))];
  const folders = titles.map((title) => ({ id: slugify(title), title }));
  const idFor = (title: string) => folders.find((f) => f.title === title)!.id;
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    folders,
    items: builtInWorks.map(({ category, ...w }) => ({ ...w, folder: idFor(category) })),
  };
}

export function toGallery(m: Manifest): GalleryData {
  const title = new Map(m.folders.map((f) => [f.id, f.title]));
  return {
    folders: m.folders,
    works: m.items
      .filter((i) => title.has(i.folder))
      .map((i) => ({ ...i, category: title.get(i.folder)!, folder: i.folder })),
  };
}

// ── validation: everything the admin saves is checked before it's stored ──
const LOCAL_MEDIA = /^\/(photos|films|instagram|hero|uploads)\/[\w./-]+$/;
function isMediaUrl(u: unknown): u is string {
  if (typeof u !== "string" || u.length > 600) return false;
  if (LOCAL_MEDIA.test(u)) return true;
  const cloud = cloudinaryConfig()?.cloud;
  return !!cloud && u.startsWith(`https://res.cloudinary.com/${cloud}/`);
}
const str = (v: unknown, max: number, min = 1) =>
  typeof v === "string" && v.trim().length >= min && v.length <= max ? v.trim() : null;

export function validateManifest(input: unknown): Manifest {
  const m = input as Partial<Manifest>;
  if (!m || !Array.isArray(m.folders) || !Array.isArray(m.items)) throw new Error("Invalid gallery data.");
  if (m.folders.length < 1 || m.folders.length > 50) throw new Error("A gallery needs 1–50 folders.");
  if (m.items.length > 2000) throw new Error("Too many items.");

  const folders: GalleryFolder[] = [];
  for (const f of m.folders) {
    const id = typeof f?.id === "string" && /^[a-z0-9-]{1,60}$/.test(f.id) ? f.id : null;
    const title = str(f?.title, 60);
    if (!id || !title) throw new Error("Every folder needs a name (up to 60 characters).");
    if (folders.some((x) => x.id === id || x.title.toLowerCase() === title.toLowerCase()))
      throw new Error(`Two folders can't share the name "${title}".`);
    folders.push({ id, title });
  }

  const ids = new Set<string>();
  const items: StoredItem[] = m.items.map((raw) => {
    const i = raw as StoredItem;
    const id = str(i?.id, 160);
    const title = str(i?.title, 120);
    if (!id || ids.has(id)) throw new Error("Duplicate or missing item id.");
    ids.add(id);
    if (!title) throw new Error("Every photo or film needs a title (up to 120 characters).");
    if (!["photo", "video", "reel"].includes(i.kind)) throw new Error(`Unknown item type for "${title}".`);
    if (!folders.some((f) => f.id === i.folder)) throw new Error(`"${title}" is in a folder that doesn't exist.`);
    if (!isMediaUrl(i.src) || (i.kind === "video" && !isMediaUrl(i.video))) throw new Error(`"${title}" has an invalid file link.`);
    const dim = (n: unknown) => (Number.isInteger(n) && (n as number) > 0 && (n as number) <= 20000 ? (n as number) : null);
    const width = dim(i.width);
    const height = dim(i.height);
    if (!width || !height) throw new Error(`"${title}" is missing its size.`);
    return {
      id,
      kind: i.kind,
      folder: i.folder,
      title,
      alt: str(i.alt, 200) ?? title,
      src: i.src,
      width,
      height,
      ...(i.kind === "video" ? { video: i.video } : {}),
      ...(typeof i.blur === "string" && i.blur.startsWith("data:image/") && i.blur.length < 4000 ? { blur: i.blur } : {}),
      ...(typeof i.publicId === "string" && i.publicId.length <= 200 ? { publicId: i.publicId } : {}),
    };
  });

  return { version: 1, updatedAt: new Date().toISOString(), folders, items };
}

// ── reading & writing ──

/** Public site: cached, refreshed on every admin save (updateTag in the save action). */
export async function getGallery(): Promise<GalleryData> {
  "use cache";
  cacheLife("max");
  cacheTag(GALLERY_TAG);
  let m: Manifest | null = null;
  try {
    const raw = await readDoc("gallery", false);
    if (raw) m = validateManifest(raw);
  } catch (err) {
    console.error("Gallery: falling back to the built-in photos —", err);
  }
  return toGallery(m ?? defaultManifest());
}

/** Admin: always the latest saved version. */
export async function getManifestForAdmin(): Promise<Manifest> {
  const raw = await readDoc("gallery", true);
  return raw ? validateManifest(raw) : defaultManifest();
}

export async function saveManifest(input: unknown): Promise<Manifest> {
  const m = validateManifest(input);
  await writeDoc("gallery", m);
  return m;
}
