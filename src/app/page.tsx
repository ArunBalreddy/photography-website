import CursorLabel from "@/components/CursorLabel";
import Intro from "@/components/Intro";
import MobileBar from "@/components/MobileBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import About from "@/components/About";
import Services from "@/components/Services";
import Reviews from "@/components/Reviews";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingContact from "@/components/FloatingContact";
import { getGallery } from "@/lib/gallery";

export default async function Home() {
  const gallery = await getGallery();
  return (
    <>
      <Intro />
      <Navbar />
      <main>
        {/* Runs as the page is parsed, before the slides paint: picks the random photo to open on. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var n=Math.floor(Math.random()*${gallery.hero.length});document.documentElement.dataset.heroStart=n;document.head.insertAdjacentHTML("beforeend",'<style>html:not([data-hero-ready]) [data-hero-slide="'+n+'"]{opacity:1}</style>')}catch(e){}`,
          }}
        />
        <Hero slides={gallery.hero} />
        <Gallery folders={gallery.folders} works={gallery.works} />
        <About />
        <Services services={gallery.services} />
        <Reviews />
        <Contact />
      </main>
      <Footer />
      <FloatingContact />
      <MobileBar />
      <CursorLabel />
    </>
  );
}
