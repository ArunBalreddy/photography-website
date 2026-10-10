import CursorLabel from "@/components/CursorLabel";
import Intro from "@/components/Intro";
import MobileBar from "@/components/MobileBar";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import About from "@/components/About";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
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
        <Hero />
        <Gallery folders={gallery.folders} works={gallery.works} />
        <About />
        <Services />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <FloatingContact />
      <MobileBar />
      <CursorLabel />
    </>
  );
}
