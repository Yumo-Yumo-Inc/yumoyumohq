"use client";

import { AppShell } from "@/components/app/app-shell";
import { AccountWorkspace } from "@/components/app/account/account-workspace";
import { useAppLocale } from "@/lib/i18n/app-context";

export default function AccountPage() {
  const { locale } = useAppLocale();
  const title = locale === "tr" ? "Hesabım" : "Account";
  return (
    <AppShell
      className="max-w-[430px] lg:max-w-[1040px]"
      topbarTitle={title}
      topbarMode="profile"
      topbarHomeVariant={false}
      topbarShowBack
    >
      <AccountWorkspace />
    </AppShell>
  );
}
