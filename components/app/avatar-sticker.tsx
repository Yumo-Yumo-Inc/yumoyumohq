"use client";

import { cn } from "@/lib/utils";
import { getSeasonCosmetic } from "@/config/season-cosmetics";
import { RewardArt, rewardArtFor } from "@/components/app/season/reward-art";
import { resolveAvatarStickerEmoji } from "@/config/avatar-stickers";

/**
 * Avatar-sticker overlay — a small badge pinned to the corner of an avatar.
 * Season stickers render their hand-drawn illustration; base (account-level)
 * stickers stay emoji. Pass the stored sticker KEY; renders nothing when there
 * is no sticker. Independent of the profile-frame ring.
 */
export function AvatarSticker({
  stickerKey,
  emoji,
  className,
}: {
  stickerKey?: string | null;
  emoji?: string | null;
  className?: string;
}) {
  const cosmetic = stickerKey ? getSeasonCosmetic(stickerKey) : null;
  const seasonSticker = cosmetic && cosmetic.kind === "sticker" ? cosmetic : null;
  const em = emoji ?? (stickerKey ? resolveAvatarStickerEmoji(stickerKey) : null);
  if (!seasonSticker && !em) return null;

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute -bottom-1 -right-1 z-10 flex items-center justify-center rounded-full leading-none",
        className,
      )}
      style={{
        width: 20,
        height: 20,
        fontSize: 12,
        background: "var(--app-bg-base, #0f1117)",
        border: "1px solid var(--app-border, rgba(255,255,255,0.16))",
        boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
      }}
    >
      {seasonSticker ? (
        <RewardArt name={rewardArtFor(seasonSticker.glyph, "sticker")} tint={seasonSticker.dark} size={16} />
      ) : (
        em
      )}
    </span>
  );
}
