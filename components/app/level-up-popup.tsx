"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, animate } from "framer-motion";
import { useAppLocale } from "@/lib/i18n/app-context";
import { getTier } from "@/lib/theme/tiers";
import { useTheme } from "@/lib/theme/theme-context";

export interface LevelUpEvent {
  id: number;
  account?: {
    from: number;
    to: number;
  };
  season?: {
    from: number;
    to: number;
  };
}

interface LevelUpPopupProps {
  event: LevelUpEvent;
  onDismiss: () => void;
}

/** Count-up that eases from `from` to `to`. Respects reduced motion (jumps to `to`). */
function CountUp({ from, to, reduced }: { from: number; to: number; reduced: boolean | null }) {
  const [value, setValue] = useState(reduced ? to : from);
  useEffect(() => {
    if (reduced) {
      setValue(to);
      return;
    }
    const controls = animate(from, to, {
      duration: 0.9,
      delay: 0.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [from, to, reduced]);
  return <>{value}</>;
}

export function LevelUpPopup({ event, onDismiss }: LevelUpPopupProps) {
  const { locale } = useAppLocale();
  const { theme } = useTheme();
  const reduced = useReducedMotion();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const highestLevel = Math.max(event.account?.to ?? 1, event.season?.to ?? 1);
  const tier = useMemo(() => getTier(highestLevel, theme), [highestLevel, theme]);
  const panelSurface =
    theme === "light"
      ? "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(246,248,252,0.99))"
      : "linear-gradient(135deg, rgba(18,23,34,0.99), rgba(9,12,20,0.99))";
  const primaryEvent = event.account ?? event.season;

  // Haptic punch on arrival (mobile). Replaces confetti as the "felt" celebration.
  useEffect(() => {
    if (reduced) return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate([0, 38, 26, 60]);
    }
  }, [reduced]);

  const rows = [
    event.account
      ? {
          label: l("Hesap seviyesi", "Account level", "Уровень аккаунта", "ระดับบัญชี", "Nivel de cuenta", "账户等级"),
          from: event.account.from,
          to: event.account.to,
        }
      : null,
    event.season
      ? {
          label: l("Sezon seviyesi", "Season level", "Сезонный уровень", "ระดับซีซัน", "Nivel de temporada", "赛季等级"),
          from: event.season.from,
          to: event.season.to,
        }
      : null,
  ].filter((row): row is { label: string; from: number; to: number } => row !== null);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-5 py-8">
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background:
            theme === "light"
              ? "rgba(8,10,16,0.58)"
              : "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.08), rgba(5,7,12,0.88) 42%, rgba(3,5,10,0.96))",
          backdropFilter: "blur(14px)",
        }}
        onClick={onDismiss}
      />
      <motion.section
        role="status"
        aria-live="polite"
        className="relative w-full max-w-[390px] overflow-hidden border px-5 py-6 text-center shadow-2xl"
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.82, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 260, damping: 18, mass: 0.9 }}
        style={{
          background: panelSurface,
          borderColor: tier.cardBorder,
          borderRadius: 8,
          boxShadow: `0 28px 90px ${tier.outerGlow}, 0 0 0 1px ${tier.topLine}`,
        }}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center border text-[18px] leading-none transition-opacity hover:opacity-75"
          style={{
            borderColor: "var(--app-border)",
            borderRadius: 8,
            color: "var(--app-text-muted)",
            background: "rgba(255,255,255,0.04)",
          }}
          aria-label={l("Seviye atlama ekranını kapat", "Close level up popup", "Закрыть окно повышения уровня", "ปิดหน้าต่างเลเวลอัป", "Cerrar ventana de subida de nivel", "关闭升级弹窗")}
        >
          ×
        </button>

        <div className="mx-auto flex min-h-[360px] flex-col items-center justify-center gap-5">
          <div className="relative grid h-36 w-36 place-items-center">
            {/* Shockwave rings — centered on the number (inset-0 + m-auto) and kept
                tight: they expand only just past the level disc, never out of the panel. */}
            {!reduced &&
              [0, 1].map((i) => (
                <motion.span
                  key={i}
                  className="pointer-events-none absolute inset-0 m-auto rounded-full"
                  style={{ height: 88, width: 88, border: `1px solid ${tier.accent}` }}
                  initial={{ scale: 0.74, opacity: 0.3 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
                />
              ))}

            {/* Soft glow hugging the number only (centered, small, low blur). */}
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 m-auto rounded-full"
              style={{ height: 92, width: 92, background: tier.accent, filter: "blur(12px)" }}
              initial={{ opacity: reduced ? 0.14 : 0.08 }}
              animate={reduced ? { opacity: 0.14 } : { opacity: [0.08, 0.18, 0.08] }}
              transition={reduced ? undefined : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />

            <div
              className="absolute inset-3 rounded-full"
              style={{
                border: `1px solid ${tier.topLine}`,
                boxShadow: `inset 0 0 30px ${tier.outerGlow}, 0 0 38px ${tier.outerGlow}`,
              }}
            />
            {/* Level disc slams in, then the number counts up. */}
            <motion.div
              className="absolute inset-7 flex flex-col items-center justify-center rounded-full border"
              initial={reduced ? { scale: 1 } : { scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduced ? { duration: 0.2 } : { type: "spring", stiffness: 320, damping: 14, delay: 0.12 }}
              style={{
                borderColor: tier.cardBorder,
                background: `linear-gradient(160deg, rgba(255,255,255,0.10), ${tier.cardBg})`,
              }}
            >
              <span className="text-[11px] font-semibold" style={{ color: tier.accent2, letterSpacing: 0 }}>
                {l("SEVİYE", "LEVEL", "УРОВЕНЬ", "ระดับ", "NIVEL", "等级")}
              </span>
              <span className="font-mono text-[46px] font-black leading-none tabular-nums" style={{ color: tier.accent }}>
                {primaryEvent ? (
                  <CountUp from={primaryEvent.from} to={primaryEvent.to} reduced={reduced} />
                ) : (
                  highestLevel
                )}
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.42, duration: 0.4 }}
          >
            <p className="text-[12px] font-bold" style={{ color: tier.accent2, letterSpacing: 0 }}>
              {l("SEVİYE ATLADIN", "LEVEL UP", "НОВЫЙ УРОВЕНЬ", "เลเวลอัป", "SUBISTE DE NIVEL", "升级啦")}
            </p>
            <h2 className="mt-2 text-[30px] font-black leading-tight" style={{ color: "var(--app-text-primary)" }}>
              {l("Seviye atladın", "You leveled up", "Ты повысил(а) уровень", "คุณเลเวลอัปแล้ว", "Subiste de nivel", "你升级了")}
            </h2>
            <p className="mx-auto mt-2 max-w-[280px] text-[14px] leading-6" style={{ color: "var(--app-text-muted)" }}>
              {l(
                "Yeni seviyen aktif. Görev ritmin güçleniyor.",
                "Your new level is active. Your quest rhythm is getting stronger.",
                "Новый уровень уже активен. Твой темп в квестах растет.",
                "เลเวลใหม่ของคุณเปิดใช้งานแล้ว จังหวะการทำภารกิจกำลังดีขึ้น!",
                "Tu nuevo nivel ya está activo. Tu ritmo de misiones va en aumento.",
                "你的新等级已生效，任务节奏更稳了。",
              )}
            </p>
          </motion.div>

          <div className="grid w-full gap-2">
            {rows.map((row, i) => (
              <motion.div
                key={row.label}
                className="flex items-center justify-between gap-3 border px-3 py-3 text-left"
                initial={reduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduced ? 0 : 0.55 + i * 0.08, duration: 0.35 }}
                style={{
                  borderColor: "rgba(255,255,255,0.09)",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.045)",
                }}
              >
                <span className="text-[12px] font-semibold" style={{ color: "var(--app-text-secondary)" }}>
                  {row.label}
                </span>
                <span className="font-mono text-[14px] font-bold tabular-nums" style={{ color: tier.accent }}>
                  {l("Seviye", "Lv", "Ур.", "เลเวล", "Nv.", "等级")} {row.from} -&gt; {row.to}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.button
            type="button"
            onClick={onDismiss}
            className="mt-1 w-full border px-4 py-3 text-[13px] font-bold"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : 0.7, duration: 0.35 }}
            whileHover={reduced ? undefined : { scale: 1.02 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            style={{
              borderColor: tier.cardBorder,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${tier.accent}, ${tier.accent2})`,
              color: theme === "light" ? "#111827" : "#0F1117",
            }}
          >
            {l("Devam et", "Continue", "Продолжить", "ไปต่อ", "Continuar", "继续")}
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
}
