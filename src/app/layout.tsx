import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const SITE_URL = site.url;

// Dark browser chrome on phones; let the bottom action bar sit above the iPhone home indicator.
export const viewport: Viewport = { themeColor: "#0e0d0c", viewportFit: "cover" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${site.fullName} — Wedding, Kids, Portrait & Food Photography`,
  description: site.description,
  openGraph: {
    title: `${site.fullName} — ${site.tagline}`,
    description: site.description,
    images: ["/hero/wedding-garlands.jpg"],
  },
};

// Tells search engines who and where the studio is (shown in rich results / knowledge panels).
const structuredData = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: site.fullName,
  slogan: site.tagline,
  description: site.description,
  url: SITE_URL,
  image: `${SITE_URL}/hero/wedding-garlands.jpg`,
  logo: `${SITE_URL}/brand/logo-white.png`,
  telephone: site.phone.replace(/\s/g, ""),
  email: site.email,
  address: { "@type": "PostalAddress", addressLocality: "Hyderabad", addressRegion: "Telangana", addressCountry: "IN" },
  areaServed: "Worldwide",
  sameAs: [site.instagram],
  founder: {
    "@type": "Person",
    name: site.photographer,
    jobTitle: "Photographer",
    alumniOf: { "@type": "EducationalOrganization", name: "Hamstech College" },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Before first paint: skip the intro if it already played this session, or for a shared photo link. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("intro-seen")||location.hash.indexOf("#photo=")===0)document.documentElement.dataset.intro="seen"}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
      </body>
    </html>
  );
}
