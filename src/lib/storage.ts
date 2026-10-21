// Where the admin's data lives: Cloudinary in production; local .data/ files during development
// (so the admin can be tried without a Cloudinary account). Production without Cloudinary is read-only.
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  addFolderJson,
  cloudinaryConfig,
  listFolderJson,
  readFolderJson,
  readPrivateJson,
  readPublicJson,
  removeFolderJson,
  writePrivateJson,
  writePublicJson,
} from "./cloudinary";

export type StorageMode = "cloudinary" | "dev" | "none";

export function storageMode(): StorageMode {
  if (cloudinaryConfig()) return "cloudinary";
  return process.env.NODE_ENV === "production" ? "none" : "dev";
}

const DEV_DIR = path.join(process.cwd(), ".data");
const NOT_CONNECTED = "Storage isn't connected yet — add CLOUDINARY_URL in Vercel to enable saving.";

type Doc = "gallery" | "admin" | "reviews";
// gallery and reviews are shown on the public site; admin (the password hash) is private.
const DOC_ID: Record<Doc, string> = {
  gallery: "picturesque/gallery.json",
  admin: "picturesque/admin.json",
  reviews: "picturesque/reviews.json",
};

export async function readDoc(doc: Doc, fresh = true): Promise<unknown | null> {
  const cfg = cloudinaryConfig();
  if (cfg) return doc === "admin" ? readPrivateJson(cfg, DOC_ID.admin) : readPublicJson(cfg, DOC_ID[doc], fresh);
  if (storageMode() === "dev") {
    try {
      return JSON.parse(await fs.readFile(path.join(DEV_DIR, `${doc}.json`), "utf8"));
    } catch {
      return null;
    }
  }
  return null;
}

export async function writeDoc(doc: Doc, data: unknown) {
  const json = JSON.stringify(data);
  const cfg = cloudinaryConfig();
  if (cfg) return doc === "admin" ? writePrivateJson(cfg, DOC_ID.admin, json) : writePublicJson(cfg, DOC_ID[doc], json);
  if (storageMode() === "dev") {
    await fs.mkdir(DEV_DIR, { recursive: true });
    return fs.writeFile(path.join(DEV_DIR, `${doc}.json`), json);
  }
  throw new Error(NOT_CONNECTED);
}

// The review inbox: one file per submitted review, waiting for the admin's approval.
const INBOX = "picturesque/reviews/inbox";
const DEV_INBOX = path.join(DEV_DIR, "reviews-inbox");

export async function inboxAdd(id: string, data: unknown) {
  const json = JSON.stringify(data);
  const cfg = cloudinaryConfig();
  if (cfg) return addFolderJson(cfg, INBOX, id, json);
  if (storageMode() === "dev") {
    await fs.mkdir(DEV_INBOX, { recursive: true });
    return fs.writeFile(path.join(DEV_INBOX, `${id}.json`), json);
  }
  throw new Error(NOT_CONNECTED);
}

export async function inboxList(): Promise<unknown[]> {
  const cfg = cloudinaryConfig();
  if (cfg) return listFolderJson(cfg, INBOX);
  if (storageMode() !== "dev") return [];
  const names = await fs.readdir(DEV_INBOX).catch(() => []);
  const files = await Promise.all(
    names
      .filter((n) => n.endsWith(".json"))
      .map((n) => fs.readFile(path.join(DEV_INBOX, n), "utf8").then(JSON.parse).catch(() => null)),
  );
  return files.filter((f) => f !== null);
}

export async function inboxRead(id: string): Promise<unknown | null> {
  const cfg = cloudinaryConfig();
  if (cfg) return readFolderJson(cfg, INBOX, id);
  if (storageMode() !== "dev") return null;
  return fs
    .readFile(path.join(DEV_INBOX, `${id}.json`), "utf8")
    .then(JSON.parse)
    .catch(() => null);
}

export async function inboxRemove(id: string) {
  const cfg = cloudinaryConfig();
  if (cfg) return removeFolderJson(cfg, INBOX, id);
  if (storageMode() === "dev") return fs.rm(path.join(DEV_INBOX, `${id}.json`), { force: true });
  throw new Error(NOT_CONNECTED);
}
