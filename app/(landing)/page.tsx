"use client"

import React from "react";
import { HeroSection } from "@/components/hero-section";
import { WhatIsYumo } from "@/components/what-is-yumo";
import { HowItWorks } from "@/components/how-it-works";
import { TechnologyStackSection } from "@/components/technology-stack-section";
import { RoadmapSection } from "@/components/roadmap-section";
import { TokenomicsSection } from "@/components/tokenomics-section";
import { PapersSection } from "@/components/papers-section";

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <WhatIsYumo />
      <HowItWorks />
      <TechnologyStackSection />
      <RoadmapSection />
      <TokenomicsSection />
      <PapersSection />
    </div>
  );
}

