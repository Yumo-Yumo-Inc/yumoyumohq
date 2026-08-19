import { landingMetadata } from "./metadata";
import { HeroSection } from "@/components/hero-section";
import { WhatIsYumo } from "@/components/what-is-yumo";
import { HowItWorks } from "@/components/how-it-works";
import { FounderSection } from "@/components/founder-section";
import { TechnologyStackSection } from "@/components/technology-stack-section";
import { RoadmapSection } from "@/components/roadmap-section";
import { TokenomicsSection } from "@/components/tokenomics-section";
import { PapersSection } from "@/components/papers-section";

export const metadata = landingMetadata;

// Product-first composition (plan: visitor sees the working product, real
// usage, and the person behind the company before the token layer).
export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <WhatIsYumo />
      <HowItWorks />
      <FounderSection />
      <TechnologyStackSection />
      <RoadmapSection />
      <TokenomicsSection />
      <PapersSection />
    </div>
  );
}
