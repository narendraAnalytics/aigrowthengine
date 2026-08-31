import { CtaBanner } from "@/components/landing/cta-banner";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { IntroVideo } from "@/components/landing/intro-video";
import { Navbar } from "@/components/landing/navbar";
import { Platform } from "@/components/landing/platform";
import { SiteFooter } from "@/components/landing/site-footer";
import { SuccessStories } from "@/components/landing/success-stories";
import { Transformations } from "@/components/landing/transformations";
import { PwaPrompt } from "@/components/pwa-prompt";

export default function HomePage() {
  return (
    <>
      <a
        href="#platform"
        className="focus:bg-plum-800 focus:text-cream sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
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
      <IntroVideo />
    </>
  );
}
