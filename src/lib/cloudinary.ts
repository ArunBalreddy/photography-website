// Server-only Cloudinary access over its REST API (no SDK). Configure with the single
// CLOUDINARY_URL env var from the Cloudinary dashboard: cloudinary://<api_key>:<api_secret>@<cloud_name>
import { createHash } from "node:crypto";

export type CloudinaryConfig = { cloud: string; key: string; secret: string };

export function cloudinaryConfig(): CloudinaryConfig | null {
  const m = process.env.CLOUDINARY_URL?.trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  return m ? { key: m[1], secret: m[2], cloud: m[3] } : null;
}

/** Cloudinary request signature: sorted `k=v&…` of the signed params, API secret appended, SHA-1 hex. */
export function sign(params: Record<string, string | number>, secret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(payload + secret).digest("hex");
}

const now = () => Math.floor(Date.now() / 1000);
const api = (cfg: CloudinaryConfig, path: string) => `https://api.cloudinary.com/v1_1/${cfg.cloud}/${path}`;

async function signedPost(cfg: CloudinaryConfig, path: string, params: Record<string, string | number>, file?: Blob) {
  const body = new FormData();
  for (const [k, v] of Object.entries(params)) body.set(k, String(v));
  body.set("api_key", cfg.key);
  body.set("signature", sign(params, cfg.secret));
  if (file) body.set("file", file);
  const res = await fetch(api(cfg, path), { method: "POST", body, cache: "no-store" });
  if (!res.ok) throw new Error(`Cloudinary ${path} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

// The gallery's list of folders and items lives in Cloudinary as one JSON file.
const MANIFEST_ID = "picturesque/gallery.json";

export async function readManifestJson(cfg: CloudinaryConfig, fresh: boolean): Promise<unknown | null> {
  const init: RequestInit = fresh ? { cache: "no-store" } : {};
  const auth = Buffer.from(`${cfg.key}:${cfg.secret}`).toString("base64");
  const meta = await fetch(api(cfg, `resources/raw/upload/${MANIFEST_ID}`), {
    ...init,
    headers: { Authorization: `Basic ${auth}` },
  });
  if (meta.status === 404) return null;
  if (!meta.ok) throw new Error(`Cloudinary gallery lookup failed (${meta.status})`);
  const { secure_url } = (await meta.json()) as { secure_url: string };
  const file = await fetch(secure_url, init); // versioned URL, so always the latest save
  if (!file.ok) throw new Error(`Cloudinary gallery download failed (${file.status})`);
  return file.json();
}

export async function writeManifestJson(cfg: CloudinaryConfig, json: string) {
  await signedPost(
    cfg,
    "raw/upload",
    { invalidate: "true", overwrite: "true", public_id: MANIFEST_ID, timestamp: now() },
    new Blob([json], { type: "application/json" }),
  );
}

/** Signature the admin's browser uses to upload a file straight to Cloudinary (the secret never leaves the server). */
export function signUploadParams(cfg: CloudinaryConfig, folder: string) {
  const timestamp = now();
  return { cloud: cfg.cloud, apiKey: cfg.key, folder, timestamp, signature: sign({ folder, timestamp }, cfg.secret) };
}

export async function destroyAsset(cfg: CloudinaryConfig, publicId: string, resourceType: "image" | "video") {
  await signedPost(cfg, `${resourceType}/destroy`, { invalidate: "true", public_id: publicId, timestamp: now() });
}

// Private JSON (type "private": no public URL) — used for the admin's password hash.
export async function readPrivateJson(cfg: CloudinaryConfig, publicId: string): Promise<unknown | null> {
  const auth = Buffer.from(`${cfg.key}:${cfg.secret}`).toString("base64");
  const meta = await fetch(api(cfg, `resources/raw/private/${publicId}`), {
    cache: "no-store",
    headers: { Authorization: `Basic ${auth}` },
  });
  if (meta.status === 404) return null;
  if (!meta.ok) throw new Error(`Cloudinary private lookup failed (${meta.status})`);
  const { asset_id } = (await meta.json()) as { asset_id: string };
  const timestamp = now();
  const qs = new URLSearchParams({
    asset_id,
    timestamp: String(timestamp),
    api_key: cfg.key,
    signature: sign({ asset_id, timestamp }, cfg.secret),
  });
  const file = await fetch(api(cfg, `asset/download?${qs}`), { cache: "no-store" });
  if (!file.ok) throw new Error(`Cloudinary private download failed (${file.status})`);
  return file.json();
}

export async function writePrivateJson(cfg: CloudinaryConfig, publicId: string, json: string) {
  await signedPost(
    cfg,
    "raw/upload",
    { overwrite: "true", public_id: publicId, timestamp: now(), type: "private" },
    new Blob([json], { type: "application/json" }),
  );
}
