"use client";

import { AppShell } from "@/components/app/app-shell";
import { ProfileWorkspace } from "@/components/app/profile-workspace";

export default function ProfilePage() {
  return (
    <AppShell
      className="max-w-[430px] lg:max-w-[860px]"
      topbarTitle="Profile"
      topbarMode="profile"
      topbarHomeVariant={false}
      topbarShowBack={true}
      onTopbarSettingsClick={() =>
        window.requestAnimationFrame(() =>
          document.getElementById("profile-preferences")?.scrollIntoView({ behavior: "smooth", block: "start" }),
        )
      }
    >
      <ProfileWorkspace variant="page" />
    </AppShell>
  );
}
