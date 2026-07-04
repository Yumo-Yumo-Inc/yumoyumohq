/**
 * Account-level unlock catalog — Kilit Yolculuğu (karar 2026-07-02).
 *
 * Permanent account-ladder unlocks (1→50). Season-ladder rewards live in the
 * season system; this catalog is only the persistent identity/feature/status
 * ladder. Copy is colocated tr/en (same pattern as config/season-content.ts);
 * other locales fall back to en.
 *
 * `phase: 2` entries are approved ladder content whose feature work needs a
 * separate go-ahead — the journey page renders them as "coming soon" and no
 * runtime behavior is attached to them yet.
 *
 * Numeric anti-abuse values (daily cPoints cap steps) live in
 * config/tokenomics.ts and are NOT repeated here (CLAUDE.md §9).
 */

import type { LocalizedLabel } from "@/config/season-content";

export type UnlockKind = "cosmetic" | "economic" | "status" | "feature";

export interface AccountUnlock {
  /** Account level at which the unlock opens. */
  level: number;
  /** Stable key — used for UI state, analytics and future persistence. */
  key: string;
  kind: UnlockKind[];
  /** Plays the full-screen reveal modal when reached. */
  reveal: boolean;
  /** Daily cPoints-cap decade step happens at this level. */
  capStep?: boolean;
  /** 1 = live now; 2 = approved ladder content, feature ships later. */
  phase: 1 | 2;
  title: LocalizedLabel;
  description: LocalizedLabel;
}

export const ACCOUNT_UNLOCKS: readonly AccountUnlock[] = [
  {
    level: 2, key: "profile_frame_basic", kind: ["cosmetic"], reveal: false, phase: 1,
    title: { tr: "İlk profil çerçevesi", en: "First profile frame" },
    description: { tr: "Profilini çevreleyen ilk çerçeve.", en: "Your first frame around your profile." },
  },
  {
    level: 3, key: "daily_quest_slot_2", kind: ["economic"], reveal: false, phase: 2,
    title: { tr: "İkinci günlük görev slotu", en: "Second daily quest slot" },
    description: { tr: "Günlük görev sayın artar.", en: "One more daily quest each day." },
  },
  {
    level: 4, key: "name_color", kind: ["cosmetic"], reveal: false, phase: 1,
    title: { tr: "İsim rengi", en: "Name color" },
    description: { tr: "Adını renkle öne çıkar.", en: "Highlight your name with color." },
  },
  {
    level: 5, key: "prediction_game", kind: ["feature"], reveal: true, phase: 2,
    title: { tr: "Tahmin Oyunu", en: "Prediction Game" },
    description: { tr: "Haftalık harcamanı tahmin et, tutarsa bonus kazan.", en: "Predict your weekly spend and earn a bonus when you hit it." },
  },
  {
    level: 6, key: "quest_reroll", kind: ["economic"], reveal: false, phase: 2,
    title: { tr: "Görev yenileme hakkı", en: "Quest reroll" },
    description: { tr: "Beğenmediğin günlük görevi bir kez yenile.", en: "Reroll a daily quest you don't like." },
  },
  {
    level: 7, key: "title_first", kind: ["status"], reveal: false, phase: 1,
    title: { tr: "İlk unvan", en: "First title" },
    description: { tr: "Profilinde taşıyacağın ilk unvan.", en: "The first title you carry on your profile." },
  },
  {
    level: 8, key: "streak_shield_1", kind: ["economic"], reveal: false, phase: 2,
    title: { tr: "Seri sigortası", en: "Streak shield" },
    description: { tr: "Serini bir gün dondurma hakkı.", en: "Freeze your streak for one day." },
  },
  {
    level: 9, key: "theme_accent_2", kind: ["cosmetic"], reveal: false, phase: 1,
    title: { tr: "İkinci tema aksanı", en: "Second theme accent" },
    description: { tr: "Uygulama aksan rengine yeni bir seçenek.", en: "A new accent color option for the app." },
  },
  {
    level: 10, key: "deep_insights", kind: ["feature", "economic"], reveal: true, capStep: true, phase: 2,
    title: { tr: "Derin Insights", en: "Deep Insights" },
    description: { tr: "Harcama geçmişinde derin analiz katmanı. Günlük kazanç tavanın ve sezon çarpanın yükselir.", en: "A deeper analysis layer on your spending history. Your daily earning ceiling and season multiplier rise." },
  },
  {
    level: 12, key: "badge_showcase", kind: ["cosmetic"], reveal: false, phase: 1,
    title: { tr: "Rozet vitrini", en: "Badge showcase" },
    description: { tr: "Seçtiğin rozetleri profilinde sergile.", en: "Showcase your chosen badges on your profile." },
  },
  {
    level: 14, key: "avatar_border_stickers", kind: ["cosmetic"], reveal: false, phase: 1,
    title: { tr: "Avatar kenarlığı + sticker paketi", en: "Avatar border + sticker pack" },
    description: { tr: "Avatarına kenarlık ve ilk sticker paketi.", en: "A border for your avatar and your first sticker pack." },
  },
  {
    level: 15, key: "weekly_report_theme_set", kind: ["feature", "cosmetic"], reveal: true, phase: 2,
    title: { tr: "Haftalık özet raporu + tam tema seti", en: "Weekly summary report + full theme set" },
    description: { tr: "Haftalık harcama özeti ve tema setinin tamamı.", en: "A weekly spending summary and the complete theme set." },
  },
  {
    level: 17, key: "daily_quest_slot_3", kind: ["economic"], reveal: false, phase: 2,
    title: { tr: "Üçüncü günlük görev slotu", en: "Third daily quest slot" },
    description: { tr: "Günlük görev sayın bir kez daha artar.", en: "One more daily quest each day." },
  },
  {
    level: 18, key: "title_set_2", kind: ["status"], reveal: false, phase: 1,
    title: { tr: "İkinci unvan seti", en: "Second title set" },
    description: { tr: "Yeni unvan seçenekleri.", en: "New title options." },
  },
  {
    level: 20, key: "leaderboard_highlight_prestige_intro", kind: ["economic", "status"], reveal: true, capStep: true, phase: 1,
    title: { tr: "Liderlikte öne çıkma + prestij çerçevesi", en: "Leaderboard highlight + prestige frame" },
    description: { tr: "Liderlik tablosunda öne çıkarsın; prestij çerçevesinin ilk hali açılır. Günlük kazanç tavanın ve sezon çarpanın yükselir.", en: "You stand out on the leaderboard; the first prestige frame opens. Your daily earning ceiling and season multiplier rise." },
  },
  {
    level: 22, key: "animated_profile_frame", kind: ["cosmetic"], reveal: false, phase: 1,
    title: { tr: "Animasyonlu profil çerçevesi", en: "Animated profile frame" },
    description: { tr: "Çerçeven artık hareketli.", en: "Your frame now moves." },
  },
  {
    level: 24, key: "price_alert_watchlist", kind: ["feature"], reveal: false, phase: 2,
    title: { tr: "Fiyat alarmı / izleme listesi", en: "Price alert / watchlist" },
    description: { tr: "Ürünleri izle, fiyat değişince haber al.", en: "Watch products and get notified on price changes." },
  },
  {
    level: 25, key: "prestige_frame_full_streak_shield_2", kind: ["status", "economic"], reveal: true, phase: 2,
    title: { tr: "Prestij çerçevesi (tam) + 2. seri sigortası", en: "Full prestige frame + 2nd streak shield" },
    description: { tr: "Prestij çerçevesinin tam hali ve ikinci dondurma hakkı.", en: "The complete prestige frame and a second streak freeze." },
  },
  {
    level: 28, key: "leaderboard_badge_special", kind: ["status"], reveal: false, phase: 1,
    title: { tr: "Özel liderlik rozeti", en: "Special leaderboard badge" },
    description: { tr: "Liderlik tablosunda görünen özel rozet.", en: "A special badge shown on the leaderboard." },
  },
  {
    level: 30, key: "city_explorer_advanced_basket", kind: ["economic", "feature", "status"], reveal: true, capStep: true, phase: 2,
    title: { tr: "Şehrin Kâşifi + gelişmiş sepet simülasyonu", en: "City Explorer + advanced basket simulation" },
    description: { tr: "Zirve rozeti ve gelişmiş sepet simülasyonu. Günlük kazanç tavanın yükselir.", en: "The summit badge and the advanced basket simulation. Your daily earning ceiling rises." },
  },
  {
    level: 33, key: "daily_quest_slot_4", kind: ["economic"], reveal: false, phase: 2,
    title: { tr: "Dördüncü günlük görev slotu", en: "Fourth daily quest slot" },
    description: { tr: "Günlük görev sayın son kez artar.", en: "Your daily quest count rises one last time." },
  },
  {
    level: 35, key: "season_multiplier_elite_rare_theme", kind: ["economic", "cosmetic"], reveal: true, phase: 1,
    title: { tr: "Elit sezon çarpanı + nadir tema", en: "Elite season multiplier + rare theme" },
    description: { tr: "Sezon çarpanın elit kademeye çıkar; nadir tema açılır.", en: "Your season multiplier reaches the elite tier; a rare theme opens." },
  },
  {
    level: 38, key: "title_master", kind: ["status"], reveal: false, phase: 1,
    title: { tr: "Kalıcı unvan: Usta", en: "Permanent title: Master" },
    description: { tr: "Kalıcı \"Usta\" unvanı.", en: "The permanent \"Master\" title." },
  },
  {
    level: 40, key: "profile_bg_early_access", kind: ["economic", "status", "feature"], reveal: true, capStep: true, phase: 2,
    title: { tr: "Özel profil arka planı + erken erişim", en: "Custom profile background + early access" },
    description: { tr: "Özel arka plan ve yeni özellikleri önce deneme hakkı. Günlük kazanç tavanın yükselir.", en: "A custom background and early access to new features. Your daily earning ceiling rises." },
  },
  {
    level: 42, key: "prestige_accent", kind: ["cosmetic"], reveal: false, phase: 1,
    title: { tr: "Prestij aksanı", en: "Prestige accent" },
    description: { tr: "Prestij serisinin aksan rengi.", en: "The prestige accent color." },
  },
  {
    level: 45, key: "legendary_frame_streak_shield_3", kind: ["cosmetic", "economic"], reveal: true, phase: 2,
    title: { tr: "Efsanevi çerçeve + 3. seri sigortası", en: "Legendary frame + 3rd streak shield" },
    description: { tr: "Efsanevi çerçeve ve üçüncü dondurma hakkı.", en: "The legendary frame and a third streak freeze." },
  },
  {
    level: 48, key: "permanent_reward_boost_minor", kind: ["economic"], reveal: false, phase: 2,
    title: { tr: "Küçük kalıcı ödül boost'u", en: "Minor permanent reward boost" },
    description: { tr: "Ödüllerine küçük, kalıcı bir artış.", en: "A small, permanent boost to your rewards." },
  },
  {
    level: 50, key: "citizen_of_the_world", kind: ["economic", "status"], reveal: true, capStep: true, phase: 1,
    title: { tr: "Citizen of the World", en: "Citizen of the World" },
    description: { tr: "Efsane rozet, kalıcı ödül boost'u ve prestij döngüsünün açılışı. Günlük kazanç tavanın en üst kademeye çıkar.", en: "The legend badge, a permanent reward boost and the opening of the prestige cycle. Your daily earning ceiling reaches the top tier." },
  },
];

/** Unlocks at exactly this level. */
export function getUnlocksForLevel(level: number): AccountUnlock[] {
  return ACCOUNT_UNLOCKS.filter((u) => u.level === level);
}

/** Unlocks gained when moving from `fromLevel` (exclusive) to `toLevel` (inclusive). */
export function getUnlocksBetween(fromLevel: number, toLevel: number): AccountUnlock[] {
  return ACCOUNT_UNLOCKS.filter((u) => u.level > fromLevel && u.level <= toLevel);
}
