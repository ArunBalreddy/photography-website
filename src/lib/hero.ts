// The homepage's full-screen background photos. The admin picks them from the gallery's photos (or the
// built-in backgrounds in public/hero); until then the built-in set from site.ts plays.
import { heroSlides, type HeroSlide } from "@/content/site";

/** One chosen background: a gallery photo id (or "hero:<name>" for a built-in), its focus point and caption. */
export type HeroPick = { id: string; position: string; caption: string };

export const MAX_HERO = 12;
export const CENTER = "50% 50%";
export const POSITION = /^\d{1,3}% \d{1,3}%$/;

/** Built-in backgrounds, selectable in the admin alongside gallery photos. */
export const builtInHero = heroSlides.map((s) => ({ ...s, id: `hero:${s.src.split("/").pop()!.replace(/\.\w+$/, "")}` }));

export const defaultHeroPicks = (): HeroPick[] => builtInHero.map(({ id, position, caption }) => ({ id, position, caption }));

type PhotoLike = { id: string; kind: string; src: string; alt: string; blur?: string };

/** The slide for one pick, or null if its photo no longer exists. */
export function resolvePick(pick: HeroPick, items: PhotoLike[]): (HeroSlide & { id: string }) | null {
  const builtIn = builtInHero.find((h) => h.id === pick.id);
  if (builtIn) return { ...builtIn, position: pick.position, caption: pick.caption };
  const item = items.find((i) => i.id === pick.id && i.kind === "photo");
  if (!item) return null;
  return {
    id: item.id,
    src: item.src,
    alt: item.alt,
    position: pick.position,
    caption: pick.caption,
    ...(item.blur ? { blur: item.blur } : {}),
  };
}

/** The slides the homepage plays: the admin's picks, or the built-in set if none are chosen (or all were deleted). */
export function resolveHero(picks: HeroPick[] | undefined, items: PhotoLike[]): HeroSlide[] {
  const slides = (picks ?? []).map((p) => resolvePick(p, items)).filter((s) => s !== null);
  return (slides.length ? slides : builtInHero).map(({ src, alt, position, caption, blur }) => ({
    src,
    alt,
    position,
    caption,
    ...(blur ? { blur } : {}),
  }));
}
