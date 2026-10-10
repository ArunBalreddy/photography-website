# PICTURESQUE by Nikhil Sonu — Photography Website

A dark, editorial photography portfolio built with Next.js 16, React 19 and Tailwind CSS v4.

**Sections:** full-screen hero slideshow · filterable portfolio grid with lightbox (keyboard ←/→/Esc) · about & stats · services & pricing · testimonials · contact/booking form · Instagram-style footer strip.

## Editing content

Everything — studio name, copy, photos, prices, testimonials — lives in [`src/content/site.ts`](src/content/site.ts). Photos currently come from Unsplash; replace the URLs with your own (or drop files in `public/` and use `/your-photo.jpg`).

After adding or replacing photos in `public/`, regenerate the blur-up previews (needs Python + Pillow):

```bash
python3 scripts/blur.py
```

The contact form opens the visitor's email app pre-filled to `site.email` (no backend needed).

## Develop

```bash
npm install
npm run dev
```

## Gallery admin (`/admin`)

Sign in at `/admin/login` to manage the gallery: create, rename, reorder and delete folders; upload photos and videos
(photos are resized and stripped of location data in the browser; videos up to 100 MB); rename, move, reorder and
delete items; change the admin password. Changes save automatically and the public gallery updates right away.

Environment variables (Vercel → Settings → Environment Variables):

| Variable | What it is |
| --- | --- |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | First sign-in. After the password is changed in the admin, the stored (hashed) password takes over. |
| `CLOUDINARY_URL` | `cloudinary://<api_key>:<api_secret>@<cloud_name>` from the Cloudinary dashboard. Stores uploads, the gallery list and the password hash. Without it the live admin is read-only and the site shows the built-in photos. |

Locally (`npm run dev`) without `CLOUDINARY_URL`, the admin saves to `.data/` and uploads to `public/uploads/` so it can
be tried end to end.
