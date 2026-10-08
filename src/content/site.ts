// All editable site content lives here — swap names, copy, and photos without touching components.

const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const site = {
  name: "PICTURESQUE",
  fullName: "PICTURESQUE by Nikhil Sonu",
  tagline: "Photography that remembers how it felt.",
  photographer: "Nikhil Sonu",
  location: "Hyderabad, India · Available worldwide",
  email: "hello@lumenstudio.example",
  phone: "+91 81438 24214",
  instagram: "https://www.instagram.com/__picturesque__1/",
  social: [
    { label: "Instagram", href: "https://www.instagram.com/__picturesque__1/" },
    { label: "Pinterest", href: "https://pinterest.com" },
    { label: "Behance", href: "https://behance.net" },
  ],
};

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

export type Category = "Weddings" | "Portraits" | "Landscapes" | "Urban";
export const categories: Category[] = ["Weddings", "Portraits", "Landscapes", "Urban"];

export type Photo = {
  src: string;
  alt: string;
  category: Category;
  title: string;
  /** Tall photos span two rows in the masonry grid. */
  tall?: boolean;
};

export const photos: Photo[] = [
  { src: unsplash("1511285560929-80b456fea0bc"), alt: "Couple holding hands", category: "Weddings", title: "Vows in Udaipur", tall: true },
  { src: unsplash("1494790108377-be9c29b29330"), alt: "Smiling woman portrait", category: "Portraits", title: "Meera" },
  { src: unsplash("1501785888041-af3ef285b470"), alt: "Lake reflecting mountains", category: "Landscapes", title: "Still Water" },
  { src: unsplash("1449824913935-59a10b8d2000"), alt: "City street from above", category: "Urban", title: "Grid Lines", tall: true },
  { src: unsplash("1465495976277-4387d4b0b4c6"), alt: "Wedding ceremony details", category: "Weddings", title: "The Quiet Before" },
  { src: unsplash("1507003211169-0a1dd7228f2d"), alt: "Man in natural light portrait", category: "Portraits", title: "Kabir", tall: true },
  { src: unsplash("1470071459604-3b5ec3a7fe05"), alt: "Misty green hills", category: "Landscapes", title: "Monsoon Hills" },
  { src: unsplash("1480714378408-67cf0d13bc1b"), alt: "Skyscrapers at night", category: "Urban", title: "After Hours" },
  { src: unsplash("1524504388940-b1c1722653e1"), alt: "Editorial portrait", category: "Portraits", title: "Editorial No. 7" },
  { src: unsplash("1519681393784-d120267933ba"), alt: "Starry sky over snowy peaks", category: "Landscapes", title: "Night Watch", tall: true },
  { src: unsplash("1438761681033-6461ffad8d80"), alt: "Portrait of a woman outdoors", category: "Portraits", title: "Ananya" },
  { src: unsplash("1507525428034-b723cf961d3e"), alt: "Turquoise beach shoreline", category: "Landscapes", title: "Tidewater" },
  { src: unsplash("1517841905240-472988babdf9"), alt: "Fashion portrait", category: "Portraits", title: "Studio Light", tall: true },
  { src: unsplash("1469474968028-56623f02e42e"), alt: "Sun rays over mountains", category: "Landscapes", title: "First Light" },
  { src: unsplash("1531746020798-e6953c6e8e04"), alt: "Portrait with dramatic shadows", category: "Portraits", title: "Contrast" },
  { src: unsplash("1472214103451-9374bd1c798e"), alt: "Meadow at sunset", category: "Landscapes", title: "Long Grass" },
];

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
    name: "Portrait Session",
    price: "₹15,000",
    unit: "per session",
    image: unsplash("1529156069898-49953e39b3ac"),
    features: ["2 hours, one location", "40+ edited images", "Online gallery", "Print release"],
  },
  {
    name: "Wedding Story",
    price: "₹1,50,000",
    unit: "starting from",
    image: unsplash("1519741497674-611481863552"),
    features: ["Full-day coverage", "Two photographers", "600+ edited images", "Heirloom album"],
    featured: true,
  },
  {
    name: "Commercial & Travel",
    price: "₹40,000",
    unit: "per day",
    image: unsplash("1477959858617-67f85cf4f1df"),
    features: ["Brand & editorial shoots", "Location scouting", "Commercial licence", "48-hour previews"],
  },
];

export const testimonials = [
  {
    quote: "We've looked at our wedding album a hundred times and still find new details. It feels exactly like the day did.",
    name: "Priya & Rohan",
    role: "Wedding, Jaipur",
  },
  {
    quote: "I usually hate being photographed. Nikhil made it feel like a conversation — the portraits are the most 'me' I've ever looked.",
    name: "Neha Sharma",
    role: "Portrait session",
  },
  {
    quote: "Delivered a full travel campaign ahead of schedule. Every frame was usable, and the light was unreal.",
    name: "Wanderlane Travel",
    role: "Commercial client",
  },
];
