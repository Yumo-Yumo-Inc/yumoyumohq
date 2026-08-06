"use client";

/**
 * FounderMark — the "Genesis Founder" capability (season pass L29). A small gold
 * crest shown next to the viewer's own display name once they own the capability.
 * Renders nothing otherwise. Uses the shared grant cache so any name surface can
 * drop it in.
 */

import { useCosmeticGrants } from "@/lib/app/use-cosmetic-grants";
import { hasCapability } from "@/config/season-capabilities";

export function FounderMark({ size = 13, className }: { size?: number; className?: string }) {
  const grants = useCosmeticGrants();
  if (!hasCapability(grants, "founder_mark")) return null;
  return (
    <span className={className} title="Genesis Founder" aria-label="Genesis Founder" style={{ display: "inline-flex", flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <defs>
          <linearGradient id="fm-g" x1="6" y1="2" x2="18" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFF0C4" />
            <stop offset="0.5" stopColor="#FFD66B" />
            <stop offset="1" stopColor="#C9922E" />
          </linearGradient>
        </defs>
        <path d="M12 2 L20 4.6 V11 C20 16.4 16.6 20.4 12 22 C7.4 20.4 4 16.4 4 11 V4.6 Z" fill="url(#fm-g)" stroke="#8A5A16" strokeWidth="0.8" strokeLinejoin="round" />
        <path d="M12 2 L20 4.6 V6 L12 3.4 L4 6 V4.6 Z" fill="#fff" opacity="0.45" />
        <path d="M8.4 11.5 L11 14.2 L15.8 8.8" stroke="#5a3c0a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
