"use client";

import { AppShell } from "@/components/app/app-shell";
import { ContributeScreen } from "@/components/app/contribute/contribute-screen";

export default function ContributePage() {
  return (
    <AppShell topbarShowBack>
      <ContributeScreen />
    </AppShell>
  );
}
