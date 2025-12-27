import Header from '@/components/landing/Header';
import HeroSection from '@/components/landing/HeroSection';
import TrustedBy from '@/components/landing/TrustedBy';
import BusinessResults from '@/components/landing/BusinessResults';
import CoreCapabilities from '@/components/landing/CoreCapabilities';
import Platform from '@/components/landing/Platform';
import AIModels from '@/components/landing/AIModels';
import Security from '@/components/landing/Security';
import Testimonials from '@/components/landing/Testimonials';
import PricingCTA from '@/components/landing/PricingCTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 antialiased">
      <Header />
      <HeroSection />
      <TrustedBy />
      <BusinessResults />
      <CoreCapabilities />
      <Platform />
      <AIModels />
      <Security />
      <Testimonials />
      <PricingCTA />
      <Footer />
    </div>
  );
}
