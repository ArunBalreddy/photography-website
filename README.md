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

## Admin (`/admin`)

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

### Home background

**Admin → Home background** chooses the photos that play full-screen at the top of the homepage (random order on
every visit). Pick from any gallery photo or the original backgrounds, tap a photo to set the point that must stay in
view (previews show the computer and phone crops), edit the caption, reorder or remove. Saved in the gallery data
(`hero` in `picturesque/gallery.json`); with nothing chosen, the original set in `site.ts` plays.

## Client reviews

Clients write a review at `/review` (star rating, name, optional shoot type, their words). By default a review is
**live on the site the moment it's sent**, and the homepage's "Kind words" section and average rating update straight
away. In **Admin → Reviews**, new reviews are listed first, and Nikhil can hide or show, reply, or delete any review, or
copy/WhatsApp the review link to clients. The "Publish new reviews instantly" switch can be turned off so new reviews
wait for approval instead (reviews already live stay live).

- Storage: the same `CLOUDINARY_URL`. The inbox is one small JSON file per review under `picturesque/reviews/inbox/`,
  so reviews sent at the same moment never overwrite each other. Published reviews live in `picturesque/reviews.json`.
- Spam guards: a honeypot field, links rejected, 3 reviews per IP per hour, plus the approval switch if spam shows up.
- With `CALLMEBOT_APIKEY` set, Nikhil gets a WhatsApp alert for each new review with a link to the admin.
