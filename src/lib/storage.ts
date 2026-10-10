// Where the admin's data lives: Cloudinary in production; local .data/ files during development
// (so the admin can be tried without a Cloudinary account). Production without Cloudinary is read-only.
import { promises as fs } from "node:fs";
import path from "node:path";
import { cloudinaryConfig, readManifestJson, readPrivateJson, writeManifestJson, writePrivateJson } from "./cloudinary";

export type StorageMode = "cloudinary" | "dev" | "none";

export function storageMode(): StorageMode {
  if (cloudinaryConfig()) return "cloudinary";
  return process.env.NODE_ENV === "production" ? "none" : "dev";
}

const DEV_DIR = path.join(process.cwd(), ".data");
const ADMIN_ID = "picturesque/admin.json";

type Doc = "gallery" | "admin";

export async function readDoc(doc: Doc, fresh = true): Promise<unknown | null> {
  const cfg = cloudinaryConfig();
  if (cfg) return doc === "gallery" ? readManifestJson(cfg, fresh) : readPrivateJson(cfg, ADMIN_ID);
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
  if (cfg) return doc === "gallery" ? writeManifestJson(cfg, json) : writePrivateJson(cfg, ADMIN_ID, json);
  if (storageMode() === "dev") {
    await fs.mkdir(DEV_DIR, { recursive: true });
    return fs.writeFile(path.join(DEV_DIR, `${doc}.json`), json);
  }
  throw new Error("Storage isn't connected yet — add CLOUDINARY_URL in Vercel to enable saving.");
}
