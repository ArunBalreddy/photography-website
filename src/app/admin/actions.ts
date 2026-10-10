"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { changeCredentials, requireAdmin, signIn, signOut } from "@/lib/admin-auth";
import { cloudinaryConfig, destroyAsset, signUploadParams } from "@/lib/cloudinary";
import { GALLERY_TAG, saveManifest, type Manifest } from "@/lib/gallery";
import { storageMode } from "@/lib/storage";

export type FormState = { error?: string; ok?: string };

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const error = await signIn(String(form.get("username") ?? ""), String(form.get("password") ?? ""));
  if (error) return { error };
  redirect("/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/admin/login");
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  if (storageMode() === "none") return { error: "Connect Cloudinary first — the new password needs somewhere to be stored." };
  const next = String(form.get("next") ?? "");
  if (next !== String(form.get("confirm") ?? "")) return { error: "The new passwords don't match." };
  try {
    const error = await changeCredentials(String(form.get("current") ?? ""), String(form.get("username") ?? ""), next);
    return error ? { error } : { ok: "Password changed. Other devices have been signed out." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Couldn't change the password." };
  }
}

/** Saves the whole gallery (folders + items) and refreshes the public site. */
export async function saveGalleryAction(manifest: Manifest): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  try {
    await requireAdmin();
    const saved = await saveManifest(manifest);
    updateTag(GALLERY_TAG);
    return { ok: true, updatedAt: saved.updatedAt };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't save." };
  }
}

export type UploadTicket =
  | { mode: "cloudinary"; cloud: string; apiKey: string; folder: string; timestamp: number; signature: string }
  | { mode: "dev" }
  | { mode: "none"; error: string };

/** Permission for the browser to upload one file into a gallery folder. */
export async function uploadTicketAction(folderId: string): Promise<UploadTicket> {
  await requireAdmin();
  const cfg = cloudinaryConfig();
  if (cfg) {
    const folder = `picturesque/${folderId.replace(/[^a-z0-9-]/g, "")}`;
    return { mode: "cloudinary", ...signUploadParams(cfg, folder) };
  }
  if (storageMode() === "dev") return { mode: "dev" };
  return { mode: "none", error: "Uploads need Cloudinary — add CLOUDINARY_URL in Vercel." };
}

/** Deletes an uploaded file from Cloudinary (built-in photos have no publicId and are only unlisted). */
export async function deleteAssetAction(publicId: string, kind: "photo" | "video"): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const cfg = cloudinaryConfig();
    if (cfg && publicId) await destroyAsset(cfg, publicId, kind === "video" ? "video" : "image");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't delete the file." };
  }
}
