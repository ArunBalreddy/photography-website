// All editable site content lives here — swap names, copy, and photos without touching components.

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const site = {
  name: "PICTURESQUE",
  fullName: "PICTURESQUE by Nikhil Sonu",
  tagline: "Your Story, Our Perspective.",
  photographer: "Nikhil Sonu",
  location: "Hyderabad, India · Available worldwide",
  phone: "+91 81438 24214",
  /** Studio email — powers "Email us" and "Book via Email". Leave empty to hide them. */
  email: "",
  /** WhatsApp number, digits only with country code — bookings are sent here. */
  whatsapp: "918143824214",
  instagram: "https://www.instagram.com/__picturesque__1/",
  instagramHandle: "__picturesque__1",
  /** Opens a DM with the studio (official Instagram short link). */
  instagramDM: "https://ig.me/m/__picturesque__1",
  social: [
    { label: "Instagram", href: "https://www.instagram.com/__picturesque__1/" },
    { label: "Pinterest", href: "https://pinterest.com" },
    { label: "Behance", href: "https://behance.net" },
  ],
};

/** Click-to-chat link that opens WhatsApp with `text` pre-filled to the studio's number. */
export const whatsappLink = (text: string) => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;

/** mailto: link that opens the visitor's mail app with subject and body pre-filled. */
export const emailLink = (subject: string, body = "") =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

export const shootTypes = [
  "Wedding",
  "Pre-Wedding & Couples",
  "Engagement",
  "Haldi & Mehendi",
  "Seemantham / Srimantham",
  "Maternity",
  "Newborn",
  "Kids & Birthdays",
  "Portraits",
  "Commercial & Product",
  "Events",
  "Other",
];

export const nav = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Journal", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
];

export type HeroSlide = {
  src: string;
  alt: string;
  /** CSS object-position — keeps faces in frame on both wide desktops and tall phones. */
  position: string;
};

// High-resolution exports of Nikhil's originals (public/hero), shown full-screen with a slow zoom.
export const heroSlides: HeroSlide[] = [
  { src: "/hero/couple-petals.jpg", alt: "Couple embracing as rose petals fall around them", position: "60% 50%" },
  { src: "/hero/wedding-garlands.jpg", alt: "Bride and groom under a marigold mandap", position: "50% 45%" },
  { src: "/hero/kids-traditional-set.jpg", alt: "Little girl in a silk langa in a village-style set", position: "45% 50%" },
  { src: "/hero/bride-groom-smile.jpg", alt: "Groom in a turban smiling beside his bride", position: "50% 45%" },
  { src: "/hero/baby-temple-steps.jpg", alt: "Baby girl in a red silk dress on carved temple steps", position: "50% 45%" },
  { src: "/hero/smoke-and-spice.jpg", alt: "Smoking plate of spicy food on a black background", position: "50% 50%" },
];

export type Category = "Weddings" | "Couples" | "Maternity" | "Kids" | "Portraits" | "Food & Commercial";
export const categories: Category[] = ["Weddings", "Couples", "Maternity", "Kids", "Portraits", "Food & Commercial"];

export type Work = {
  id: string;
  /** photo: /photos · video: self-hosted film in /films · reel: Instagram reel (official embed). */
  kind: "photo" | "video" | "reel";
  category: Category;
  title: string;
  alt: string;
  /** The image, or the cover frame for videos and reels. */
  src: string;
  width: number;
  height: number;
  video?: string;
};

const photo = (slug: string, category: Category, title: string, alt: string, width: number, height: number): Work => ({
  id: slug, kind: "photo", category, title, alt, src: `/photos/${slug}.jpg`, width, height,
});
const film = (slug: string, category: Category, title: string, alt: string, width: number, height: number): Work => ({
  id: slug, kind: "video", category, title, alt, src: `/films/${slug}.jpg`, video: `/films/${slug}.mp4`, width, height,
});
const reel = (id: string, category: Category, title: string, alt: string, width: number, height: number): Work => ({
  id, kind: "reel", category, title, alt, src: `/instagram/${id}.jpg`, width, height,
});

// Nikhil's own photos and films (exported from the originals, metadata stripped) plus his Instagram reels.
// Order is the "All" view — mixed so every category shows up early.
export const works: Work[] = [
  photo("couple-petals", "Couples", "Falling Petals", "Couple embracing as rose petals fall around them", 1333, 2000),
  photo("kids-blue-door", "Kids", "The Blue Door", "Girl in a green silk dress sitting before a blue wooden door", 1333, 2000),
  photo("wedding-garlands", "Weddings", "Garlands & Vows", "Bride and groom holding hands under a marigold mandap", 1333, 2000),
  photo("masala-pot-smoke", "Food & Commercial", "Masala Pot — Smoked", "Smoke rising over a kebab platter", 1333, 2000),
  photo("classical-pillar", "Portraits", "Temple Pillar", "Woman in classical dance attire smiling beside a painted pillar", 1333, 2000),
  photo("baby-temple-steps", "Kids", "Temple Steps", "Baby girl in a red silk dress sitting on carved temple steps", 1333, 2000),
  photo("bride-groom-smile", "Weddings", "Together, Finally", "Groom in a turban smiling beside his bride", 1333, 2000),
  film("masala-pot", "Food & Commercial", "Masala Pot — Restaurant Film", "Promo film for Masala Pot restaurant", 720, 1280),
  photo("ketel-one-garden", "Food & Commercial", "Ketel One — Garden", "Ketel One bottle and cocktail resting among green leaves", 1333, 2000),
  photo("couple-back-to-back", "Couples", "Back to Back", "Couple sitting back to back, eyes closed, smiling", 1333, 2000),
  photo("kids-traditional-set", "Kids", "Little Traditions", "Little girl in a silk langa playing in a village-style set", 2000, 1333),
  photo("classical-parrot", "Portraits", "The Parrot & the Lotus", "Classical dancer holding a parrot and a lotus", 1333, 2000),
  photo("wedding-rituals", "Weddings", "The Sacred Fire", "Bride and groom seated together during the wedding rituals", 1136, 2000),
  reel("Dbs2DimycCx", "Maternity", "Maternity", "Couple at a traditional seemantham ceremony", 360, 640),
  photo("flaming-leg-pieces", "Food & Commercial", "Flaming Leg Pieces", "Gloved hand holding smoking chicken skewers", 1153, 2000),
  photo("baby-telephone", "Kids", "Pink Telephone", "Baby in a pink dress sitting by a pink telephone booth", 1333, 2000),
  photo("bride-coconut", "Weddings", "The Bride", "Bride in a red silk saree holding a decorated coconut", 1333, 2000),
  photo("kids-that-smile", "Kids", "That Smile", "Close-up of a smiling girl wearing a maang tikka", 1333, 2000),
  photo("talisker", "Food & Commercial", "Talisker 10", "Talisker single malt bottle with stone statues behind", 1333, 2000),
  photo("henna-portrait", "Portraits", "Henna & Sunlight", "Woman resting her chin on hennaed hands in soft light", 1333, 2000),
  photo("mother-baby-laughter", "Kids", "Bubbles & Laughter", "Mother laughing as she holds her baby among soap bubbles", 1333, 2000),
  film("cafe-stories", "Food & Commercial", "Café Stories", "Café promo film featuring mango éclairs", 720, 1270),
  photo("bride-groom-glance", "Weddings", "A Quiet Glance", "Bride looking down as the groom smiles behind her", 1333, 2000),
  photo("broccoli-feast", "Food & Commercial", "Broccoli Feast", "Creamy broccoli dish on lettuce against a blue backdrop", 1333, 2000),
  photo("baby-mango", "Kids", "Summer Mango", "Baby holding a mango beside a yellow painted wall", 1333, 2000),
  photo("classical-grace", "Portraits", "Classical Grace", "Classical dancer in full costume posing under trees", 1333, 2000),
  photo("wedding-silhouette", "Weddings", "Silhouette", "Silhouette of a bride and groom forehead to forehead", 1392, 2000),
  photo("masala-pot-green", "Food & Commercial", "Masala Pot — Green Kebabs", "Green kebabs in a dish with spices falling", 1333, 2000),
  photo("kids-garden", "Kids", "Garden Dreams", "Girl in a green silk langa sitting by a flowering wall", 1333, 2000),
  reel("Db7-S_-SNOS", "Kids", "Little Ones", "Smiling baby girl in a traditional dress", 360, 640),
  photo("smoke-and-spice", "Food & Commercial", "Smoke & Spice", "Smoking plate of spicy food on a black background", 2000, 1100),
  photo("baby-little-red", "Kids", "Little Red", "Close-up of a baby girl in a red silk dress", 1333, 2000),
  photo("expressions", "Portraits", "Expressions", "Dancer framing her face with her hands", 1080, 1080),
  photo("masala-pot-grill", "Food & Commercial", "Masala Pot — Grill", "Smoking grilled chicken with green chutney", 1333, 2000),
  photo("mother-baby-bubbles", "Kids", "Bubble Time", "Smiling baby in her mother's arms reaching for bubbles", 1333, 2000),
  film("glimpse", "Food & Commercial", "Glimpse", "Food highlights reel", 720, 1280),
  photo("kids-village-tales", "Kids", "Village Tales", "Little girl in traditional jewellery posing in a rustic set", 1333, 2000),
  photo("ketel-one-bar", "Food & Commercial", "Ketel One — Bar Series", "Ketel One vodka bottle beside a cocktail in a brass cup", 1333, 2000),
  reel("DWO6lVvDxFs", "Weddings", "Sita Kalyanam", "Wedding invitation among green leaves", 360, 640),
  photo("baby-basket", "Kids", "Basket Games", "Baby in a purple langa playing with a woven basket", 1333, 2000),
  photo("onion-rings", "Food & Commercial", "Crispy Onion Rings", "Stack of crispy onion rings with a dip", 1333, 2000),
  photo("baby-floral-set", "Kids", "In Full Bloom", "Baby sitting on a little cane chair in a floral set", 1235, 1854),
  photo("chilli-lime-fry", "Food & Commercial", "Chilli Lime Fry", "Spicy fry on a wooden board topped with lime slices", 1333, 2000),
  reel("DYIzefyPyyY", "Weddings", "Wedding Film", "Bride and groom during wedding rituals", 360, 640),
  photo("masala-pot-platter", "Food & Commercial", "Masala Pot — Kebab Platter", "Kebab platter on a slate for Masala Pot restaurant", 1333, 2000),
  photo("fresh-bowl", "Food & Commercial", "Fresh & Crunchy", "Salad bowl with tomato and crunchy toppings", 1333, 2000),
  photo("curry-bowl", "Food & Commercial", "Curry & Papad", "Curry in a black bowl with a papad", 1333, 2000),
  reel("Dc1ODw8PwVF", "Weddings", "Behind the Lens", "Camera held up above wedding garlands", 361, 640),
  photo("masala-pot-signature", "Food & Commercial", "Masala Pot — Signature", "Grilled dish on a board under the Masala Pot logo", 1333, 2000),
  photo("from-the-kadai", "Food & Commercial", "From the Kadai", "Smoke rising from a dish in an iron kadai", 1333, 2000),
  photo("creamy-rolls", "Food & Commercial", "Creamy Rolls", "Rolls in a creamy sauce on a wooden board", 1333, 2000),
  photo("mango-eclairs", "Food & Commercial", "Mango Éclairs", "Mango éclair topped with cream and mango cubes", 1333, 2000),
];

export const workUrl = (w: Work) => (w.kind === "reel" ? `https://www.instagram.com/reel/${w.id}/` : null);

export const about = {
  image: unsplash("1452587925148-ce544e77e70d"),
  heading: "I chase the in-between moments.",
  body: [
    "For over a decade I've photographed weddings, people, and places across India and beyond. My work is quiet, honest, and rooted in natural light — less posing, more presence.",
    "Whether it's the nervous laugh before a first look or fog lifting off a valley at dawn, I'm there to notice what you'll want to remember years from now.",
  ],
  stats: [
    { value: "12+", label: "Years behind the lens" },
    { value: "340", label: "Weddings & events" },
    { value: "18", label: "Countries shot" },
  ],
};

export const services = [
  {
    name: "Portraits & Kids",
    price: "₹15,000",
    unit: "per session",
    image: "/photos/kids-blue-door.jpg",
    bookAs: "Portraits",
    features: ["Birthdays & classical portraits", "2 hours, one location", "40+ edited images", "Online gallery"],
  },
  {
    name: "Wedding Story",
    price: "₹1,50,000",
    unit: "starting from",
    image: "/photos/bride-groom-smile.jpg",
    bookAs: "Wedding",
    features: ["Full-day coverage", "Two photographers", "600+ edited images", "Heirloom album"],
    featured: true,
  },
  {
    name: "Maternity",
    price: "₹25,000",
    unit: "per session",
    image: "/instagram/Dbs2DimycCx.jpg",
    bookAs: "Seemantham / Srimantham",
    features: ["Home or outdoor shoot", "Ceremony coverage", "50+ edited images", "Short highlight reel"],
  },
  {
    name: "Food & Commercial",
    price: "On request",
    unit: "pricing",
    image: "/photos/masala-pot-smoke.jpg",
    bookAs: "Commercial & Product",
    features: ["Restaurant menus & social media", "Styled food & product shots", "Short promo films", "Commercial usage licence"],
  },
];

export const testimonials = [
  {
    quote: "We've looked at our wedding album a hundred times and still find new details. It feels exactly like the day did.",
    name: "Priya & Rohan",
    role: "Wedding, Hyderabad",
  },
  {
    quote: "I usually hate being photographed. Nikhil made it feel like a conversation — the portraits are the most 'me' I've ever looked.",
    name: "Neha Sharma",
    role: "Portrait session",
  },
  {
    quote: "Our seemantham photos are so warm and natural. Nikhil caught every little moment with our families.",
    name: "Sowmya & Karthik",
    role: "Maternity, Hyderabad",
  },
];
