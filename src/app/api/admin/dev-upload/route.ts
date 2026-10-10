// Development only: stands in for Cloudinary so the admin can be tried locally. Saves to public/uploads/.
import { promises as fs } from "node:fs";
import path from "node:path";
import { isAdmin } from "@/lib/admin-auth";
import { storageMode } from "@/lib/storage";

export async function POST(request: Request) {
  if (storageMode() !== "dev") return new Response("Not found", { status: 404 });
  if (!(await isAdmin())) return Response.json({ error: "Not signed in" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "misc").replace(/[^a-z0-9-]/g, "") || "misc";
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });

  const ext = (file.name.match(/\.[a-z0-9]{2,5}$/i)?.[0] ?? (file.type.startsWith("video/") ? ".mp4" : ".jpg")).toLowerCase();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));

  const url = `/uploads/${folder}/${name}`;
  return Response.json({ secure_url: url, public_id: `dev/${folder}/${name}` });
}
