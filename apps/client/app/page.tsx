import Features from "@/components/features";
import Footer from "@/components/footer";
import GetStartedSection from "@/components/get-started-section";
import HeroSection from "@/components/hero-section";
import HowItWorks from "@/components/how-it-works";
import Navbar from "@/components/navbar";
import OpenSource from "@/components/open-source";
import ParticleBackground from "@/components/particle-background";
import PrivacySection from "@/components/privacy-section";


export default function Home() {
  return (
    <main className="min-h-screen bg-[#121212] text-white overflow-hidden">
    <Navbar />
    <ParticleBackground />
    <HeroSection />
    <HowItWorks />
    <Features />
    <PrivacySection />
    <GetStartedSection />
    <OpenSource />
    <Footer />
  </main>
  );
}
