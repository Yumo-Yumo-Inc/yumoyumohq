"use client";

/** Cosmetic-aware user avatar + name (frame + sticker + name color), shared by
 * the friends and messages surfaces. */

import { AvatarImage } from "@/components/app/avatar-image";
import { AvatarFrame } from "@/components/app/avatar-frame";
import { AvatarSticker } from "@/components/app/avatar-sticker";
import { resolveNameColorHex } from "@/config/name-colors";
import { useTheme } from "@/lib/theme/theme-context";

export interface IdentityUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  nameColor: string | null;
  profileFrame: string | null;
  avatarSticker: string | null;
}

export function UserAvatar({ u, size = 40 }: { u: IdentityUser; size?: number }) {
  const initials = (u.displayName || u.username || "?").slice(0, 2).toUpperCase();
  return (
    <span className="relative inline-flex shrink-0">
      <AvatarFrame frameKey={u.profileFrame}>
        <div className="grid place-items-center overflow-hidden rounded-full text-xs font-bold text-white"
          style={{ width: size, height: size, background: "linear-gradient(135deg,#ff7a1a,#ec4899,#3b82f6)" }}>
          {u.avatarUrl ? <AvatarImage src={u.avatarUrl} className="h-full w-full object-cover" /> : initials}
        </div>
      </AvatarFrame>
      <AvatarSticker stickerKey={u.avatarSticker} />
    </span>
  );
}

export function UserName({ u, className }: { u: IdentityUser; className?: string }) {
  const { theme } = useTheme();
  const color = resolveNameColorHex(u.nameColor, theme) ?? "var(--app-text-primary)";
  return <span className={className} style={{ color }}>{u.displayName || u.username}</span>;
}
