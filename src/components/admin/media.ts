// Browser-side media prep + upload for the admin. Photos are resized and re-encoded here, which also
// strips EXIF/GPS before anything leaves the device; videos get a cover frame and blur preview.
import type { UploadTicket } from "@/app/admin/actions";

const MAX_PHOTO_EDGE = 2400;
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // Cloudinary's single-request upload limit

export type Prepared = { blob: Blob; width: number; height: number; blur?: string; poster?: Blob };
export type Uploaded = { url: string; publicId: string; width?: number; height?: number };

const toBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't process the file."))), "image/jpeg", quality),
  );

function draw(source: CanvasImageSource, w: number, h: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0e0d0c"; // behind any transparency
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

const tinyBlur = (source: CanvasImageSource, w: number, h: number) => draw(source, w, h, 14).toDataURL("image/jpeg", 0.55);

export async function preparePhoto(file: File): Promise<Prepared> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const heic = /hei[cf]/i.test(file.type + file.name);
    throw new Error(heic ? "HEIC photos only open in Safari — use Safari or export as JPEG." : "This browser can't read that image. Try JPEG or PNG.");
  }
  try {
    const canvas = draw(bitmap, bitmap.width, bitmap.height, MAX_PHOTO_EDGE);
    return {
      blob: await toBlob(canvas, 0.86),
      width: canvas.width,
      height: canvas.height,
      blur: tinyBlur(bitmap, bitmap.width, bitmap.height),
    };
  } finally {
    bitmap.close();
  }
}

/** Cover frame + size for a video. Returns null if this browser can't decode it (e.g. some iPhone .mov). */
export async function prepareVideo(file: File): Promise<Prepared | null> {
  if (file.size > MAX_VIDEO_BYTES) throw new Error("Videos must be under 100 MB — please compress it first.");
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  v.src = url;
  try {
    await new Promise<void>((resolve, reject) => {
      v.onloadeddata = () => resolve();
      v.onerror = () => reject(new Error("unreadable"));
      setTimeout(() => reject(new Error("timeout")), 15000);
    });
    await new Promise<void>((resolve) => {
      v.onseeked = () => resolve();
      v.currentTime = Math.min(1, (v.duration || 2) / 2);
    });
    const w = v.videoWidth;
    const h = v.videoHeight;
    if (!w || !h) return null;
    return { blob: file, width: w, height: h, blur: tinyBlur(v, w, h), poster: await toBlob(draw(v, w, h, 1280), 0.85) };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function post(url: string, body: FormData, onProgress: (p: number) => void): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      const err = data.error as { message?: string } | string | undefined;
      reject(new Error((typeof err === "string" ? err : err?.message) || `Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Network problem during upload — check the connection and try again."));
    xhr.send(body);
  });
}

export async function uploadFile(
  ticket: Exclude<UploadTicket, { mode: "none" }>,
  folderId: string,
  file: Blob,
  resourceType: "image" | "video",
  onProgress: (p: number) => void,
): Promise<Uploaded> {
  const body = new FormData();
  body.set("file", file, file instanceof File ? file.name : resourceType === "video" ? "video.mp4" : "photo.jpg");
  if (ticket.mode === "cloudinary") {
    body.set("api_key", ticket.apiKey);
    body.set("timestamp", String(ticket.timestamp));
    body.set("folder", ticket.folder);
    body.set("signature", ticket.signature);
    const r = await post(`https://api.cloudinary.com/v1_1/${ticket.cloud}/${resourceType}/upload`, body, onProgress);
    return { url: String(r.secure_url), publicId: String(r.public_id), width: Number(r.width), height: Number(r.height) };
  }
  body.set("folder", folderId);
  const r = await post("/api/admin/dev-upload", body, onProgress);
  return { url: String(r.secure_url), publicId: String(r.public_id) };
}

/** Cloudinary derived URLs: an optimised MP4 and a cover frame for an uploaded video. */
const derived = (secureUrl: string, transformation: string, ext: string) =>
  secureUrl.replace("/upload/", `/upload/${transformation}/`).replace(/\.[a-z0-9]+$/i, `.${ext}`);
export const cloudinaryVideo = (url: string) => derived(url, "q_auto", "mp4");
export const cloudinaryPoster = (url: string) => derived(url, "so_1,c_limit,w_1280", "jpg");

export const titleFromFilename = (name: string) =>
  name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
    .slice(0, 120) || "Untitled";
