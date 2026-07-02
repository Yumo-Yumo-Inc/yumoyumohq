import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { TraitKey } from "@/lib/insights/identity/identity-types";
import { getShareCardByToken } from "@/lib/insights/identity/share-card-storage";
import {
  className as classNameOf,
  classTagline,
  tx,
  UI,
} from "@/app/app/patterns/identity-copy";

export const runtime = "nodejs";

interface PageProps {
  params: Promise<{ token: string }>;
}

function classKeysOf(card: {
  classPrimary: string | null;
  classSecondary: string | null;
}): [TraitKey, TraitKey] | null {
  if (!card.classPrimary || !card.classSecondary) return null;
  return [card.classPrimary as TraitKey, card.classSecondary as TraitKey];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const card = await getShareCardByToken(token);
  if (!card) return { title: "Yumo Yumo" };

  const keys = classKeysOf(card);
  const locale = card.locale ?? "en";
  const cls = keys ? classNameOf(keys, locale) : "Yumo Yumo";
  const desc = keys ? classTagline(keys, locale) : tx(locale, UI.sharePageLead);
  // `<title>` gets the root layout's "| Yumo Yumo" suffix, so keep it just the
  // class. Social cards read og:title verbatim, so brand it there.
  const ogTitle = `${cls} · Yumo Yumo`;

  return {
    title: cls,
    description: desc,
    openGraph: {
      title: ogTitle,
      description: desc,
      type: "website",
      images: [{ url: card.imageUrl, width: 760, height: 990, alt: cls }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc,
      images: [card.imageUrl],
    },
  };
}

export default async function IdentitySharePage({ params }: PageProps) {
  const { token } = await params;
  const card = await getShareCardByToken(token);
  if (!card) notFound();

  const keys = classKeysOf(card);
  const locale = card.locale ?? "en";
  const cls = keys ? classNameOf(keys, locale) : "Yumo Yumo";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "40px 20px",
        background: "linear-gradient(165deg,#12131A,#0A0C10)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#5A6680",
          textAlign: "center",
        }}
      >
        {tx(locale, UI.sharePageLead)}
      </p>

      {/* The card PNG — the exact image shared to social. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={card.imageUrl}
        alt={cls}
        width={380}
        style={{ width: "100%", maxWidth: 380, height: "auto", borderRadius: 28 }}
      />

      <Link
        href="/"
        style={{
          marginTop: 4,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "13px 22px",
          borderRadius: 13,
          fontSize: 14,
          fontWeight: 600,
          color: "#0A0C10",
          background: "#E8C97A",
          textDecoration: "none",
        }}
      >
        {tx(locale, UI.sharePageCta)} →
      </Link>
    </main>
  );
}
