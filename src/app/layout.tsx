import type { Metadata } from "next";
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
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
