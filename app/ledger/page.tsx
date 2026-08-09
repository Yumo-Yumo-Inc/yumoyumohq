import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { FLAGS } from "@/config/feature-flags";
import { listSealedEpochs } from "@/lib/prices/epoch-list";
import { LedgerDocument } from "@/components/ledger/ledger-document";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readLocale(): Promise<"en" | "tr"> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("app_locale")?.value;
  return raw === "tr" ? "tr" : "en";
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  const messages =
    locale === "tr"
      ? (await import("@/messages/tr.json")).default
      : (await import("@/messages/en.json")).default;
  const ledger = messages.app?.ledger as Record<string, string> | undefined;
  return {
    title: ledger?.metaTitle ?? "Price Ledger",
    description:
      ledger?.metaDescription ??
      "Yumo Yumo price ledger — sealed, verifiable price observations anchored to Solana and Arweave.",
  };
}

export default async function LedgerPage() {
  // While FEATURE_PRICE_LEDGER is off the page 404s (like the API). The flag is
  // not toggled silently: if prod has it off, that is raised with Uğur (see the
  // decision note). Showing the page while disabled would publish data that the
  // API itself refuses to serve.
  if (!FLAGS.priceLedger) {
    notFound();
  }

  let epochs: Awaited<ReturnType<typeof listSealedEpochs>> = [];
  let loadError = false;
  try {
    epochs = await listSealedEpochs();
  } catch (e) {
    console.error("[ledger] Failed to load epochs:", e);
    loadError = true;
  }

  return <LedgerDocument epochs={epochs} loadError={loadError} />;
}
