"use client";

/**
 * SeasonRewardSheet — tap a reward node to see WHAT it is, what it does, that it
 * is season-exclusive, and (if earned) equip it right here. Answers "what do these
 * rewards actually do?" and removes the trip to settings. (karar 2026-07-09.)
 */

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Check } from "lucide-react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { patchCachedProfileFields } from "@/lib/offline/cache";
import { RewardArt, rewardArtFor } from "@/components/app/season/reward-art";
import { RARITY_META, type SeasonCosmetic } from "@/config/season-cosmetics";
import { featureOfKey, GENESIS_CAPABILITIES } from "@/config/season-capabilities";
import type { SeasonPassNode } from "@/config/season-pass";

/** Which profile column each cosmetic kind equips into. */
const EQUIP_FIELD: Record<string, string> = {
  frame: "profileFrame", crown: "profileFrame", accent: "themeAccent", theme: "themeAccent",
  name_color: "nameColor", background: "profileBg", sticker: "avatarSticker", seal: "seal",
};

export function SeasonRewardSheet({
  node,
  cosmetic,
  seasonLevel,
  onClose,
}: {
  node: SeasonPassNode;
  cosmetic: SeasonCosmetic | null;
  seasonLevel: number;
  onClose: () => void;
}) {
  const { locale } = useAppLocale();
  const { refresh } = useAppProfile();
  const reduced = useReducedMotion();
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [equipError, setEquipError] = useState<string | null>(null);
  const l = (tr: string, en: string) => (locale === "tr" ? tr : en);

  const earned = node.level <= seasonLevel;
  const rarity = cosmetic ? RARITY_META[cosmetic.rarity] : null;
  const isCapability = cosmetic?.kind === "capability";
  const capFeature = isCapability && cosmetic ? featureOfKey(cosmetic.key) : null;
  const capDesc = capFeature ? GENESIS_CAPABILITIES[capFeature].description : null;

  const kindLabel = (k: string) =>
    k === "frame" ? l("Çerçeve", "Frame")
    : k === "crown" ? l("Taç", "Crown")
    : k === "accent" ? l("Aksan", "Accent")
    : k === "theme" ? l("Tema", "Theme")
    : k === "name_color" ? l("İsim Rengi", "Name Color")
    : k === "background" ? l("Arka Plan", "Background")
    : k === "seal" ? l("Mühür", "Seal")
    : k === "capability" ? l("Yetenek", "Capability")
    : l("Sticker", "Sticker");

  const effect = (k: string) =>
    k === "frame" ? l("Avatarının çevresinde bir çerçeve olur — profilinde, liderlikte, her yerde görünür.", "A ring around your avatar — visible on your profile, the leaderboard, everywhere.")
    : k === "crown" ? l("Avatarının çevresinde efsanevi altın taç çerçevesi.", "A legendary golden crown ring around your avatar.")
    : k === "accent" || k === "theme" ? l("Uygulamanın vurgu rengini değiştirir.", "Recolours the app's accent.")
    : k === "name_color" ? l("Görünen adını renklendirir.", "Tints your display name.")
    : k === "background" ? l("Profil kartının arkasına geçer.", "Sits behind your profile card.")
    : k === "seal" ? l("Doğrulanmış fişlerinin köşesine sezon mührü basar — harcaman kanıtlı.", "Stamps a season seal on your verified receipts — proof of expense.")
    : l("Avatarının köşesine küçük bir rozet ekler.", "Pins a small badge to your avatar's corner.");

  const title = node.tier
    ? `${node.tier.cpoints.toLocaleString(locale)} ${l("puan", "points")}`
    : cosmetic
      ? (locale === "tr" ? cosmetic.label.tr : cosmetic.label.en)
      : l("Sezon ödülü", "Season reward");

  async function equip() {
    if (!cosmetic) return;
    const field = EQUIP_FIELD[cosmetic.kind];
    if (!field) return;
    setSaving(true);
    setEquipError(null);
    try {
      const r = await fetch("/api/user/cosmetic-equip", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, key: cosmetic.key }),
      });
      if (r.ok) {
        setDone(true);
        // Optimistic: write the equipped key into the cached profile right away so
        // the avatar (topbar/sidebar) updates instantly, independent of the sync
        // round-trip and its throttle. The forced sync in refresh() reconciles
        // with the server truth afterwards. The equip `field` names match the
        // cached-profile field names exactly.
        await patchCachedProfileFields({ [field]: cosmetic.key }).catch(() => {});
        await refresh();
        setTimeout(onClose, 900);
      } else {
        const body = (await r.json().catch(() => null)) as { error?: string } | null;
        setEquipError(
          body?.error === "Not owned"
            ? l("Bu ödül henüz hesabında görünmüyor. Sayfayı yenileyip tekrar dene.", "This reward is not on your account yet. Refresh and try again.")
            : l("Takılamadı. Biraz sonra tekrar dene.", "Could not equip. Try again in a moment."),
        );
      }
    } catch {
      setEquipError(l("Takılamadı. Biraz sonra tekrar dene.", "Could not equip. Try again in a moment."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="dialog" aria-modal>
        <motion.div
          className="absolute inset-0"
          style={{ background: "rgba(6,8,13,0.62)", backdropFilter: "blur(6px)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.section
          className="relative w-full max-w-[420px] overflow-hidden border px-5 pb-6 pt-5"
          style={{
            borderColor: "var(--app-border-strong, rgba(255,255,255,0.14))",
            borderRadius: "20px 20px 0 0",
            background: "linear-gradient(160deg, var(--app-bg-elevated, #181e2d), var(--app-bg-surface, #0f1117))",
          }}
          initial={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          <button
            type="button" onClick={onClose} aria-label={l("Kapat", "Close")}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border transition-opacity hover:opacity-70"
            style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-4">
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border"
              style={{ borderColor: rarity ? `${rarity.color}55` : "var(--app-border)", background: "var(--app-bg-surface, #141826)" }}
            >
              {cosmetic ? (
                <RewardArt name={rewardArtFor(cosmetic.glyph, cosmetic.kind)} tint={cosmetic.dark} size={56} />
              ) : (
                <RewardArt name="coin" tint="#FFD66B" size={56} />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-semibold" style={{ color: "var(--app-text-muted)" }}>
                  {l("Seviye", "Level")} {node.level}
                </span>
                {rarity && (
                  <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: rarity.color }}>
                    {locale === "tr" ? rarity.label.tr : rarity.label.en}
                  </span>
                )}
              </div>
              <h3 className="mt-0.5 text-lg font-bold leading-tight">{title}</h3>
              <p className="text-[12px]" style={{ color: "var(--app-text-secondary)" }}>
                {node.tier ? l("Sezon Ödülü · Puan", "Season Reward · Points") : `${l("Sezon", "Season")} ${kindLabel(cosmetic?.kind ?? "")}`}
              </p>
            </div>
          </div>

          <p className="mt-4 text-[14px] leading-relaxed" style={{ color: "var(--app-text-primary)" }}>
            {node.tier
              ? l("Ulaştığın en yüksek kademenin puanı sezon kapanışında hesabına geçer.", "The points for the highest tier you reach are credited at season close.")
              : capDesc
                ? (locale === "tr" ? capDesc.tr : capDesc.en)
                : effect(cosmetic?.kind ?? "")}
          </p>

          {!node.tier && (
            <p className="mt-2 text-[12px]" style={{ color: "var(--app-text-muted)" }}>
              {l("Sezona özel — Genesis bitince bir daha kazanılamaz.", "Season-exclusive — gone for good once Genesis ends.")}
            </p>
          )}

          {/* action */}
          <div className="mt-5">
            {node.tier ? null : isCapability ? (
              <div
                className="w-full rounded-full py-3 text-center text-[13px] font-semibold"
                style={
                  earned
                    ? { border: "1px solid rgba(167,124,255,0.5)", color: "#A78BFA" }
                    : { border: "1px solid var(--app-border)", color: "var(--app-text-muted)" }
                }
              >
                {earned
                  ? l("Açık — otomatik çalışır", "Unlocked — active automatically")
                  : l(`Seviye ${node.level}'te açılır`, `Unlocks at level ${node.level}`)}
              </div>
            ) : earned ? (
              <>
              <button
                type="button" onClick={equip} disabled={saving || done}
                className="w-full rounded-full py-3 text-[14px] font-bold transition-transform active:scale-[0.98] disabled:opacity-70"
                style={{ background: done ? "rgba(52,211,153,0.18)" : "linear-gradient(135deg, #FFD66B, #F5A623)", color: done ? "#34D399" : "#1a1206" }}
              >
                {done ? (
                  <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4" /> {l("Takıldı", "Equipped")}</span>
                ) : saving ? l("Takılıyor…", "Equipping…") : l("Tak", "Equip")}
              </button>
              {equipError ? (
                <p className="mt-2 text-center text-[12px]" style={{ color: "#F87171" }}>{equipError}</p>
              ) : null}
              </>
            ) : (
              <div
                className="w-full rounded-full py-3 text-center text-[13px] font-semibold"
                style={{ border: "1px solid var(--app-border)", color: "var(--app-text-muted)" }}
              >
                {l(`Seviye ${node.level}'te açılır`, `Unlocks at level ${node.level}`)}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </AnimatePresence>
  );
}
