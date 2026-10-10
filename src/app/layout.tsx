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

// Dark browser chrome on phones; let the bottom action bar sit above the iPhone home indicator.
export const viewport: Viewport = { themeColor: "#0e0d0c", viewportFit: "cover" };

export const metadata: Metadata = {
  metadataBase: new URL("https://picturesque-by-nikhil-sonu.vercel.app"),
  title: `${site.fullName} — Wedding, Kids, Portrait & Food Photography`,
  description: site.tagline,
  openGraph: {
    title: site.fullName,
    description: site.tagline,
    images: ["/hero/wedding-garlands.jpg"],
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
