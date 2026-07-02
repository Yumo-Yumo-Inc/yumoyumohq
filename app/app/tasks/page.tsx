"use client";

import dynamic from "next/dynamic";
import { AppShell } from "@/components/app/app-shell";
import { useAppProfile } from "@/lib/app/profile-context";

// Dynamic import, kept consistent with dashboard/page.tsx.
// Loading the same module via both a static import and a dynamic import in
// different chunks made Turbopack HMR lose the framer-motion factory.
const QuestsScreen = dynamic(
  () => import("@/components/app/quests-screen").then((m) => ({ default: m.QuestsScreen })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-48 rounded-2xl animate-pulse border"
        style={{
          background: "var(--app-bg-elevated)",
          borderColor: "var(--app-border)",
        }}
      />
    ),
  }
);

export default function TasksPage() {
  const { profile } = useAppProfile();
  const accountLevel = profile?.accountLevel ?? 1;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[430px] px-4 py-5 pb-24 lg:max-w-[1180px] lg:px-6 lg:py-6 lg:pb-8">
        <QuestsScreen accountLevel={accountLevel} />
      </div>
    </AppShell>
  );
}
