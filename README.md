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
