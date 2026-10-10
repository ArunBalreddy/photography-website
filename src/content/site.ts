// All editable site content lives here — swap names, copy, and photos without touching components.

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const site = {
  name: "PICTURESQUE",
  fullName: "PICTURESQUE by Nikhil Sonu",
  tagline: "Photography that remembers how it felt.",
  photographer: "Nikhil Sonu",
  location: "Hyderabad, India · Available worldwide",
  phone: "+91 81438 24214",
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

export const heroSlides = [
  { src: unsplash("1519741497674-611481863552"), alt: "Bride and groom at golden hour" },
  { src: unsplash("1506744038136-46273834b3fb"), alt: "Valley with mountains and a river at dusk" },
  { src: unsplash("1534528741775-53994a69daeb"), alt: "Close portrait of a woman in soft light" },
  { src: unsplash("1477959858617-67f85cf4f1df"), alt: "City skyline at blue hour" },
];

export type Category = "Weddings" | "Couples" | "Maternity" | "Kids" | "Portraits";
export const categories: Category[] = ["Weddings", "Couples", "Maternity", "Kids", "Portraits"];

export type Work = {
  /** Instagram shortcode — the image lives at /instagram/<id>.jpg. */
  id: string;
  kind: "photo" | "reel";
  category: Category;
  title: string;
  alt: string;
  width: number;
  height: number;
};

// Latest posts from @__picturesque__1. Reels play through Instagram's official embed.
export const works: Work[] = [
  { id: "Dbs2DimycCx", kind: "reel", category: "Maternity", title: "Seemantham", alt: "Couple at a traditional seemantham ceremony", width: 360, height: 640 },
  { id: "DaBJZbAD19O", kind: "photo", category: "Weddings", title: "Groom Visuals", alt: "Groom in a turban beside his bride", width: 480, height: 640 },
  { id: "Db7-S_-SNOS", kind: "reel", category: "Kids", title: "Little Ones", alt: "Smiling baby girl in a traditional dress", width: 360, height: 640 },
  { id: "DNguFppzyvo", kind: "photo", category: "Couples", title: "Mallikarjun & Shivani", alt: "Black and white silhouette of a couple", width: 480, height: 640 },
  { id: "DGMh6oESx1b", kind: "photo", category: "Weddings", title: "Haldi", alt: "Bride laughing during the haldi ceremony", width: 512, height: 640 },
  { id: "DWO6lVvDxFs", kind: "reel", category: "Weddings", title: "Sita Kalyanam", alt: "Wedding invitation among green leaves", width: 360, height: 640 },
  { id: "DTVbWRyD1Mb", kind: "photo", category: "Portraits", title: "Rithika — Classical Collection", alt: "Classical dance portraits of a young girl", width: 640, height: 640 },
  { id: "DbOoxyzEjJ2", kind: "photo", category: "Couples", title: "Abhilash & Pratyusha", alt: "Couple sitting together outdoors", width: 512, height: 640 },
  { id: "Dcgy58XDwaj", kind: "photo", category: "Kids", title: "Happy Birthday Rithanshi", alt: "Mother holding her baby at a birthday celebration", width: 480, height: 640 },
  { id: "DYIzefyPyyY", kind: "reel", category: "Weddings", title: "Wedding Film", alt: "Bride and groom during wedding rituals", width: 360, height: 640 },
  { id: "DTEYtFtkr9e", kind: "photo", category: "Kids", title: "Drithivamika", alt: "Little girl in traditional attire", width: 512, height: 640 },
  { id: "Dc1ODw8PwVF", kind: "reel", category: "Weddings", title: "Behind the Lens", alt: "Camera held up above wedding garlands", width: 361, height: 640 },
];

export const workImage = (w: Work) => `/instagram/${w.id}.jpg`;
export const workUrl = (w: Work) => `https://www.instagram.com/${w.kind === "reel" ? "reel" : "p"}/${w.id}/`;

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
    image: "/instagram/DTVbWRyD1Mb.jpg",
    bookAs: "Portraits",
    features: ["Birthdays & classical portraits", "2 hours, one location", "40+ edited images", "Online gallery"],
  },
  {
    name: "Wedding Story",
    price: "₹1,50,000",
    unit: "starting from",
    image: "/instagram/DaBJZbAD19O.jpg",
    bookAs: "Wedding",
    features: ["Full-day coverage", "Two photographers", "600+ edited images", "Heirloom album"],
    featured: true,
  },
  {
    name: "Maternity & Seemantham",
    price: "₹25,000",
    unit: "per session",
    image: "/instagram/Dbs2DimycCx.jpg",
    bookAs: "Seemantham / Srimantham",
    features: ["Home or outdoor shoot", "Ceremony coverage", "50+ edited images", "Short highlight reel"],
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
