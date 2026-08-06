"use client";

import { cn } from "@/lib/utils";
import { resolveProfileFrame } from "@/config/profile-frames";

interface AvatarFrameProps {
  /** Stored profile-frame key; null/unknown renders children bare (no ring). */
  frameKey?: string | null;
  /** Avatar corner radius: "full" for circular avatars, or a px number. */
  radius?: "full" | number;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps an avatar with the user's profile-frame ring (avatar-ring cosmetic
 * unlocks). The ring is a gradient disk sitting behind the avatar, inset by the
 * frame width so only a `width`-thick border peeks out. Animated/legendary
 * frames rotate via the `yumo-frame-spin` class (disabled under reduced motion).
 * With no valid frame it renders children untouched — zero visual/layout cost.
 */
export function AvatarFrame({ frameKey, radius = "full", className, children }: AvatarFrameProps) {
  const frame = resolveProfileFrame(frameKey);
  if (!frame) return <>{children}</>;

  const br = radius === "full" ? "9999px" : `${radius}px`;

  return (
    <span className={cn("relative inline-flex", className)} style={{ borderRadius: br }}>
      <span
        aria-hidden
        className={cn("pointer-events-none absolute", frame.animated && "yumo-frame-spin")}
        style={{
          inset: -frame.width,
          borderRadius: br,
          background: frame.ring,
          boxShadow: frame.glow || undefined,
        }}
      />
      <span className="relative" style={{ borderRadius: br }}>
        {children}
      </span>
    </span>
  );
}
