import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Platform } from "@/components/landing/platform";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Transformations } from "@/components/landing/transformations";
import { SuccessStories } from "@/components/landing/success-stories";
import { CtaBanner } from "@/components/landing/cta-banner";
import { SiteFooter } from "@/components/landing/site-footer";
import { PwaPrompt } from "@/components/pwa-prompt";

export default function HomePage() {
  return (
    <>
      <a
        href="#platform"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-plum-800 focus:px-4 focus:py-2 focus:text-cream"
      >
        Skip to content
      </a>
      <Navbar />
      <main>
        <Hero />
        <Platform />
        <HowItWorks />
        <Transformations />
        <SuccessStories />
        <CtaBanner />
      </main>
      <SiteFooter />
      <PwaPrompt />
    </>
  );
}
