"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  Lock,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { questXpToCPoints } from "@/config/contribution-config";
import { Surface } from "@/components/ui/surface";
import { StaggerReveal, Reveal } from "@/components/ui/stagger-reveal";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { QuestCompleteOverlay, type QuestCompleteData } from "@/components/app/quest-complete-overlay";
import { cn } from "@/lib/utils";
import { useAppLocale, type AppLocale } from "@/lib/i18n/app-context";
import { getQuestTitle } from "@/lib/quests/quest-pools";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { readCachedQuests } from "@/lib/offline/cache";
import { QUESTS_DAILY_QUERY_KEY, PROFILE_QUERY_KEY } from "@/lib/app/query-keys";
import { syncMobileData } from "@/lib/sync";
import { applyMobileActionResult } from "@/lib/mobile/action-result-client";
import type { MobileActionResult } from "@/lib/mobile/action-result-types";
import { useAppProfile } from "@/lib/app/profile-context";
import { getCountryByCode, normalizeCountryCode } from "@/lib/shared/countries";

/** Local currency symbol for a country code (฿ for TH, ₺ for TR); default ₺. */
function currencySymbolForCountry(country?: string | null): string {
  return getCountryByCode(normalizeCountryCode(country) ?? "")?.symbol ?? "₺";
}
interface CompleteApiResponse {
  ok: boolean;
  levelUp?: "account" | "season" | "both" | null;
  accountLevel?: number;
  seasonLevel?: number;
  alreadyCompleted?: boolean;
  actionResult?: MobileActionResult;
}

const QUEST_TONES = [
  { accent: "#D8B653", soft: "rgba(216,182,83,0.14)", bg: "#17150F", border: "#3E3520", labelEn: "Ritual", labelTr: "Rituel", icon: Flame },
  { accent: "#6CCB96", soft: "rgba(108,203,150,0.14)", bg: "#101713", border: "#254737", labelEn: "Discovery", labelTr: "Keşif", icon: Compass },
  { accent: "#C87968", soft: "rgba(200,121,104,0.14)", bg: "#181211", border: "#4A2926", labelEn: "Detector", labelTr: "Dedektor", icon: Search },
  { accent: "#7CC7C0", soft: "rgba(124,199,192,0.13)", bg: "#0F1717", border: "#244745", labelEn: "Receipt task", labelTr: "Fiş görevi", icon: ReceiptText },
  { accent: "#B99BE4", soft: "rgba(185,155,228,0.13)", bg: "#17131B", border: "#3F3150", labelEn: "Challenge", labelTr: "Meydan okuma", icon: Trophy },
] satisfies Array<{
  accent: string;
  soft: string;
  bg: string;
  border: string;
  labelEn: string;
  labelTr: string;
  icon: LucideIcon;
}>;

const WEEKLY_TYPE_ORDER = ["W1A", "W1B", "W1C", "W2", "W3", "W4", "W5", "W6"] as const;

// getQuestTitle is imported from @/lib/quests/quest-pools — all 6 locales covered

interface QuestCardData {
  id: string;
  questId: number | null;
  type: string;
  title: string;
  progress: number;
  target: number;
  status: string;
  rewardRyumo: number;
  rewardSeasonXp: number;
}

interface QuestsData {
  daily: QuestCardData[];
  // All active weekly quests for the current week (one per tier, up to 4). The
  // server assigns and rewards each of them, so the board shows each of them.
  weeklies: QuestCardData[];
  weeklyOptions: QuestCardData[];
  dailyTotalRyumo: number;
  dailyTotalSeasonXp: number;
  date: string;
  weekStart: string;
  weekEnd: string;
}

interface QuestVisualCardProps {
  quest: QuestCardData;
  tone: (typeof QUEST_TONES)[number];
  index?: number;
  footer?: React.ReactNode;
  justCompleted?: boolean;
  featured?: boolean;
}

interface WeeklyOptionCardProps {
  quest: QuestCardData;
  tone: (typeof QUEST_TONES)[number];
  loading?: boolean;
  onSelect: (questType: string) => void;
}

interface QuestsScreenProps {
  accountLevel?: number;
  className?: string;
  refreshKey?: number;
  preview?: boolean;
}

function L(locale: AppLocale, tr: string, en: string, ru: string, th: string, es: string, zh: string): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function getWeekBounds(dateStr: string): { start: string; end: string } {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function msUntilNextMidnightUTC(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

function parseQuestId(id: string, prefix: string): number | null {
  if (!id.startsWith(prefix)) return null;
  const raw = Number(id.slice(prefix.length));
  return Number.isInteger(raw) && raw > 0 ? raw : null;
}

function mapQuestRecord(record: {
  id: string;
  type: string;
  title: string;
  progress: number;
  target: number;
  status: string;
  rewardRyumo: number;
  rewardSeasonXp: number;
}): QuestCardData {
  const questId = parseQuestId(record.id, "daily:") ?? parseQuestId(record.id, "weekly:");
  return {
    id: record.id,
    questId,
    type: record.type,
    title: record.title,
    progress: record.progress,
    target: record.target,
    status: record.status,
    rewardRyumo: record.rewardRyumo,
    rewardSeasonXp: record.rewardSeasonXp,
  };
}

async function readQuestCacheSnapshot(locale: string = "en"): Promise<QuestsData> {
  await loadBootstrapSnapshot().catch(() => {});
  const records = await readCachedQuests();
  const today = getTodayUTC();
  const { start: currentWeekStart, end: currentWeekEnd } = getWeekBounds(today);

  // Apply locale-aware title translation on top of cached data
  const localizeTitle = (q: QuestCardData): QuestCardData => ({
    ...q,
    title: getQuestTitle(q.type, locale, q.title),
  });

  const daily = records
    .filter((r) => r.questKind === "daily" && r.questDate === today)
    .sort((a, b) => a.type.localeCompare(b.type))
    .map(mapQuestRecord)
    .map(localizeTitle);

  const weeklies = records
    .filter((r) => r.questKind === "weekly" && r.weekStart === currentWeekStart && r.weekEnd === currentWeekEnd)
    .sort((a, b) => a.type.localeCompare(b.type))
    .map(mapQuestRecord)
    .map(localizeTitle);

  const weeklyOptions = weeklies.length > 0
    ? []
    : records
        .filter((r) => r.questKind === "weekly_option" && r.weekStart === currentWeekStart && r.weekEnd === currentWeekEnd)
        .sort(
          (a, b) =>
            WEEKLY_TYPE_ORDER.indexOf(a.type as (typeof WEEKLY_TYPE_ORDER)[number]) -
            WEEKLY_TYPE_ORDER.indexOf(b.type as (typeof WEEKLY_TYPE_ORDER)[number])
        )
        .map(mapQuestRecord)
        .map(localizeTitle);

  return {
    daily,
    weeklies,
    weeklyOptions,
    dailyTotalRyumo: daily.reduce((s, q) => s + (q.status === "completed" ? 0 : questXpToCPoints(q.rewardSeasonXp)), 0),
    dailyTotalSeasonXp: daily.reduce((s, q) => s + (q.status === "completed" ? 0 : q.rewardSeasonXp), 0),
    date: today,
    weekStart: currentWeekStart,
    weekEnd: currentWeekEnd,
  };
}

function getQuestTone(quest: QuestCardData, index = 0) {
  if (quest.type.startsWith("W")) return QUEST_TONES[4];
  if (quest.type === "D1") return QUEST_TONES[0];
  if (quest.type === "D5" || quest.type === "D6") return QUEST_TONES[2];
  if (quest.type === "D7" || quest.type === "D8") return QUEST_TONES[1];
  if (quest.type === "D9") return QUEST_TONES[3];
  return QUEST_TONES[index % QUEST_TONES.length];
}

function statusCopy(status: string, locale: AppLocale) {
  if (status === "completed") return L(locale, "Tamamlandı", "Completed", "Выполнено", "สำเร็จแล้ว", "Completado", "已完成");
  if (status === "active") return L(locale, "Aktif", "Active", "Активно", "ใช้งาน", "Activo", "进行中");
  if (status === "available") return L(locale, "Seçilebilir", "Available", "Доступно", "เลือกได้", "Disponible", "可选择");
  return L(locale, "Kilitli", "Locked", "Заблокировано", "ล็อกอยู่", "Bloqueado", "已锁定");
}

function formatShortDate(dateStr: string, locale: AppLocale) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  const dateLocale = locale === "ru" ? "ru-RU" : locale === "th" ? "th-TH" : locale === "es" ? "es-ES" : locale === "zh" ? "zh-CN" : locale === "tr" ? "tr-TR" : "en-US";
  return new Intl.DateTimeFormat(dateLocale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function clampPct(progress: number, target: number) {
  if (target <= 0) return 1;
  return Math.max(0, Math.min(1, progress / target));
}

function StatusPill({ status, tone, locale }: { status: string; tone: (typeof QUEST_TONES)[number]; locale: AppLocale }) {
  const done = status === "completed";
  const locked = status === "locked";
  const Icon = done ? CheckCircle2 : locked ? Lock : Sparkles;

  return (
    <span
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-black"
      style={{
        background: done ? "rgba(108,203,150,0.12)" : locked ? "rgba(255,255,255,0.04)" : tone.soft,
        borderColor: done ? "rgba(108,203,150,0.28)" : locked ? "rgba(255,255,255,0.1)" : tone.border,
        color: done ? "#6CCB96" : locked ? "#84909A" : tone.accent,
      }}
    >
      <Icon className="h-3.5 w-3.5" />
      {statusCopy(status, locale)}
    </span>
  );
}

function ProgressDial({ pct, tone, done, locked }: { pct: number; tone: (typeof QUEST_TONES)[number]; done: boolean; locked: boolean }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const color = done ? "#77828D" : locked ? "#5F6872" : tone.accent;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.7s ease, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {done ? (
          <CheckCircle2 className="h-6 w-6" style={{ color }} />
        ) : locked ? (
          <Lock className="h-5 w-5" style={{ color }} />
        ) : (
          <span className="font-mono text-[12px] font-black tabular-nums" style={{ color }}>
            {Math.round(pct * 100)}%
          </span>
        )}
      </div>
    </div>
  );
}

function RewardRail({ quest, tone, done }: { quest: QuestCardData; tone: (typeof QUEST_TONES)[number]; done: boolean }) {
  const { locale } = useAppLocale();
  return (
    <div className="grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: done ? "rgba(154,165,175,0.08)" : "rgba(255,255,255,0.08)" }}>
      <div>
        <p className="text-[10px] font-bold uppercase" style={{ color: done ? "#4F5964" : "#84909A" }}>
          {L(locale, "Puan", "Points", "Поинты", "แต้ม", "Puntos", "积分")}
        </p>
        <p className="mt-0.5 font-mono text-[16px] font-black tabular-nums" style={{ color: done ? "#68727D" : tone.accent }}>
          +{questXpToCPoints(quest.rewardSeasonXp)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase" style={{ color: done ? "#4F5964" : "#84909A" }}>
          {L(locale, "Sezon XP", "Season XP", "Сезон XP", "ซีซัน XP", "XP de temporada", "赛季 XP")}
        </p>
        <p className="mt-0.5 font-mono text-[16px] font-black tabular-nums" style={{ color: done ? "#747D87" : "#F4EFE2" }}>
          +{quest.rewardSeasonXp}
        </p>
      </div>
    </div>
  );
}

function QuestVisualCard({ quest, tone, index = 0, footer, justCompleted = false, featured = false }: QuestVisualCardProps) {
  const { locale } = useAppLocale();
  const { profile } = useAppProfile();
  const curSymbol = currencySymbolForCountry(profile?.country);
  const pct = clampPct(quest.progress, quest.target);
  const done = quest.status === "completed";
  const locked = quest.status === "locked";
  const readyToClaim = quest.status === "active" && quest.progress >= quest.target;
  const Icon = tone.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border transition-transform duration-300 hover:-translate-y-0.5",
        justCompleted && "quest-complete-flash",
        readyToClaim && (quest.type.startsWith("W") ? "quest-weekly-pulse" : "quest-ready-pulse"),
        featured && "lg:min-h-[220px]"
      )}
      style={{
        background: done ? "linear-gradient(145deg, #0B0D0D, #090B0C 72%)" : `linear-gradient(145deg, ${tone.bg}, #101214 72%)`,
        borderColor: done ? "rgba(154,165,175,0.16)" : tone.border,
        boxShadow: done ? "0 8px 18px rgba(0,0,0,0.14)" : "0 14px 32px rgba(0,0,0,0.22)",
        filter: done ? "saturate(0.15)" : "none",
        animation: "questCardIn 0.28s ease both",
        animationDelay: `${index * 45}ms`,
      }}
    >
      {done ? <div className="absolute inset-0 bg-black/30" /> : null}
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: done ? "rgba(154,165,175,0.24)" : tone.accent }} />
      <div
        className="absolute right-3 top-4 h-16 w-16 opacity-[0.07]"
        style={{
          background:
            "linear-gradient(135deg, transparent 0 38%, currentColor 38% 44%, transparent 44% 56%, currentColor 56% 62%, transparent 62%)",
          color: done ? "#6CCB96" : tone.accent,
        }}
      />
      <div className="relative flex h-full flex-col gap-4 p-4" style={{ opacity: done ? 0.62 : 1 }}>
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border"
            style={{
              background: done ? "rgba(154,165,175,0.07)" : tone.soft,
              borderColor: done ? "rgba(154,165,175,0.12)" : tone.border,
              color: done ? "#68727D" : tone.accent,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <StatusPill status={quest.status} tone={tone} locale={locale} />
        </div>

        <div className="flex flex-1 items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase" style={{ color: done ? "#59636E" : tone.accent }}>
              {L(locale, tone.labelTr, tone.labelEn, tone.labelEn, tone.labelEn, tone.labelEn, tone.labelEn)} / {quest.type}
            </p>
            <h3 className="mt-2 text-[18px] font-black leading-tight" style={{ color: done ? "#6E7883" : locked ? "#9AA5AF" : "#F4EFE2" }}>
              {getQuestTitle(quest.type, locale, quest.title, curSymbol)}
            </h3>
            <p className="mt-2 text-[12px] font-semibold leading-5" style={{ color: done ? "#5B646E" : "#9AA5AF" }}>
              {done
                ? L(locale, "Ödül bakiyene eklendi.", "Reward added to your balance.", "Награда добавлена на баланс.", "เพิ่มรางวัลในยอดคงเหลือแล้ว", "Recompensa añadida a tu saldo.", "奖励已添加到余额。")
                : locked
                  ? L(locale, "Bu görev daha sonra açılacak.", "This task unlocks later.", "Это задание откроется позже.", "งานนี้จะเปิดใช้งานในภายหลัง", "Esta tarea se desbloquea más tarde.", "此任务稍后解锁。")
                  : L(locale, "İlerlemeni tamamla, ödülü anında al.", "Finish the progress and claim instantly.", "Завершите прогресс и получите награду.", "เสร็จสิ้นความคืบหน้าและรับรางวัลทันที", "Completa el progreso y reclama al instante.", "完成进度立即领取。")}
            </p>
          </div>
          <ProgressDial pct={pct} tone={tone} done={done} locked={locked} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-bold" style={{ color: done ? "#5B646E" : "#84909A" }}>
            <span>{L(locale, "İlerleme", "Progress", "Прогресс", "ความคืบหน้า", "Progreso", "进度")}</span>
            <span className="font-mono tabular-nums">
              {quest.progress} / {quest.target}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct * 100}%`,
                background: done ? "rgba(154,165,175,0.42)" : `linear-gradient(90deg, ${tone.accent}, #6CCB96)`,
                transition: "width 0.7s ease",
              }}
            />
          </div>
        </div>

        <RewardRail quest={quest} tone={tone} done={done} />
        {footer ? <div>{footer}</div> : null}
      </div>
    </div>
  );
}

function WeeklyOptionCard({ quest, tone, loading = false, onSelect }: WeeklyOptionCardProps) {
  const { locale } = useAppLocale();

  return (
    <button
      type="button"
      onClick={() => onSelect(quest.type)}
      disabled={loading}
      className="block w-full rounded-lg text-left transition-transform duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <QuestVisualCard
        quest={quest}
        tone={tone}
        footer={
          <div className="flex min-h-10 items-center justify-between gap-3 rounded-lg border px-3" style={{ borderColor: tone.border, color: tone.accent }}>
            <span className="text-[12px] font-black">
              {loading ? L(locale, "Seçiliyor...", "Selecting...", "Выбирается...", "กำลังเลือก...", "Seleccionando...", "选择中...") : L(locale, "Bu hedefi seç", "Choose this goal", "Выбрать эту цель", "เลือกเป้าหมายนี้", "Elegir este objetivo", "选择此目标")}
            </span>
            <ChevronRight className="h-4 w-4" />
          </div>
        }
      />
    </button>
  );
}

function SectionHeader({ eyebrow, title, meta }: { eyebrow: string; title: string; meta?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-black uppercase" style={{ color: "#84909A" }}>
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[20px] font-black leading-tight" style={{ color: "#F4EFE2" }}>
          {title}
        </h2>
      </div>
      {meta ? <div className="shrink-0">{meta}</div> : null}
    </div>
  );
}

function QuestBoardHero({
  daily,
  weeklies,
  dailyTotalRyumo,
  dailyTotalSeasonXp,
  weekStart,
  weekEnd,
  locale,
}: {
  daily: QuestCardData[];
  weeklies: QuestCardData[];
  dailyTotalRyumo: number;
  dailyTotalSeasonXp: number;
  weekStart: string;
  weekEnd: string;
  locale: AppLocale;
}) {
  const totalCount = daily.length + weeklies.length;
  const completedCount = daily.filter((q) => q.status === "completed").length + weeklies.filter((q) => q.status === "completed").length;
  const progressPct = totalCount > 0 ? completedCount / totalCount : 0;
  const allDone = totalCount > 0 && completedCount === totalCount;

  // Compact, action-first header: a slim value strip that states today's standing
  // and reward at a glance, then gets out of the way so the quest cards lead.
  return (
    <Surface variant="value" accent="gold" glow radius="lg" className="px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10.5px] font-black uppercase tracking-[0.16em]" style={{ color: "var(--app-gold)" }}>
            {L(locale, "Görev merkezi", "Task center", "Центр задач", "ศูนย์ภารกิจ", "Centro de tareas", "任务中心")}
          </p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="scanui-hero-num text-[34px] tabular-nums">{completedCount}</span>
            <span className="text-[15px] font-black" style={{ color: "var(--app-text-secondary)" }}>/ {totalCount || 0}</span>
            <span className="text-[13px] font-bold" style={{ color: "var(--app-text-muted)" }}>
              {allDone
                ? L(locale, "hepsi tamam", "all done", "все готово", "เสร็จทั้งหมด", "todo listo", "全部完成")
                : L(locale, "görev", "tasks", "задач", "งาน", "tareas", "任务")}
            </span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="rounded-full px-2.5 py-1 font-mono text-[13px] font-black tabular-nums" style={{ background: "var(--app-gold-glow)", color: "var(--app-gold)" }}>
            +{dailyTotalRyumo} {L(locale, "puan", "pts", "поинты", "แต้ม", "pts", "积分")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] font-black tabular-nums" style={{ color: "var(--app-text-secondary)" }}>
            <BadgeCheck className="h-3.5 w-3.5" style={{ color: "var(--app-success)" }} />
            +{dailyTotalSeasonXp} {L(locale, "Sezon XP", "Season XP", "Сезон XP", "ซีซัน XP", "XP temporada", "赛季 XP")}
          </span>
        </div>
      </div>

      <div className="mt-3.5 h-2 overflow-hidden rounded-full" style={{ background: "var(--app-border)" }}>
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${Math.max(2, progressPct * 100)}%`,
            background: allDone
              ? "linear-gradient(90deg, var(--app-success), var(--app-gold-light))"
              : "linear-gradient(90deg, var(--app-gold-dim), var(--app-gold-light))",
            boxShadow: "0 0 12px var(--app-gold-glow)",
          }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] font-bold" style={{ color: "var(--app-text-muted)" }}>
        <CalendarDays className="h-3.5 w-3.5" style={{ color: "var(--app-gold-dim)" }} />
        {formatShortDate(weekStart, locale)} – {formatShortDate(weekEnd, locale)}
      </div>
    </Surface>
  );
}

async function fetchQuestSnapshot(locale: string): Promise<QuestsData> {
  return readQuestCacheSnapshot(locale);
}

export function QuestsScreen({ className, refreshKey = 0, preview = false }: QuestsScreenProps) {
  const { t, locale } = useAppLocale();
  const { announceLevelUp, profile: appProfile } = useAppProfile();
  const curSymbol = currencySymbolForCountry(appProfile?.country);
  const queryClient = useQueryClient();

  const [completeQueue, setCompleteQueue] = useState<QuestCompleteData[]>([]);
  const [justCompletedIds, setJustCompletedIds] = useState<Set<string>>(new Set());
  const [selectingWeeklyType, setSelectingWeeklyType] = useState<string | null>(null);
  const autoCompletedRef = useRef(new Set<string>());
  const prevScopeKeyRef = useRef<string | null>(null);
  const prevRefreshKeyRef = useRef(refreshKey);

  const { data, isLoading: loading, isError } = useQuery({
    queryKey: [...QUESTS_DAILY_QUERY_KEY, locale],
    queryFn: () => fetchQuestSnapshot(locale),
    refetchInterval: 60_000,
  });

  const daily = useMemo(() => data?.daily ?? [], [data?.daily]);
  const weeklies = useMemo(() => data?.weeklies ?? [], [data?.weeklies]);
  const weeklyOptions = useMemo(() => data?.weeklyOptions ?? [], [data?.weeklyOptions]);
  const dailyTotalRyumo = data?.dailyTotalRyumo ?? 0;
  const dailyTotalSeasonXp = data?.dailyTotalSeasonXp ?? 0;
  const questDate = data?.date ?? getTodayUTC();
  const weekStart = data?.weekStart ?? getWeekBounds(getTodayUTC()).start;
  const weekEnd = data?.weekEnd ?? getWeekBounds(getTodayUTC()).end;

  const allDailyDone = daily.length > 0 && daily.every((q) => q.status === "completed");

  useEffect(() => {
    if (refreshKey !== prevRefreshKeyRef.current) {
      prevRefreshKeyRef.current = refreshKey;
      queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY });
    }
  }, [refreshKey, queryClient]);

  useEffect(() => {
    const scopeKey = `${questDate}:${weekStart}:${weekEnd}`;
    if (prevScopeKeyRef.current && prevScopeKeyRef.current !== scopeKey) {
      autoCompletedRef.current.clear();
    }
    prevScopeKeyRef.current = scopeKey;
  }, [questDate, weekStart, weekEnd]);

  const handleCompleteQuest = useCallback(
    async (
      endpoint: "/api/quests/daily/complete" | "/api/quests/weekly/complete",
      questId: number
    ): Promise<CompleteApiResponse | null> => {
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ questId }),
        });
        if (!res.ok) return null;

        const json = (await res.json().catch(() => ({ ok: false }))) as CompleteApiResponse;

        if (json.actionResult) {
          await applyMobileActionResult(json.actionResult, queryClient, { onLevelEvent: announceLevelUp });
        } else {
          await syncMobileData({ fullProfile: true }).catch(() => null);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
          ]);
        }

        return json;
      } catch {
        return null;
      }
    },
    [announceLevelUp, queryClient]
  );

  useEffect(() => {
    if (loading) return;

    type CompletableItem = {
      key: string;
      endpoint: "/api/quests/daily/complete" | "/api/quests/weekly/complete";
      questId: number;
      quest: QuestCardData;
      isWeekly: boolean;
    };

    const completable: CompletableItem[] = [
      ...daily
        .filter((q) => q.questId && q.status === "active" && q.progress >= q.target)
        .map((q) => ({
          key: q.id,
          endpoint: "/api/quests/daily/complete" as const,
          questId: q.questId as number,
          quest: q,
          isWeekly: false,
        })),
      ...weeklies
        .filter((w) => w.questId && w.status === "active" && w.progress >= w.target)
        .map((w) => ({ key: w.id, endpoint: "/api/quests/weekly/complete" as const, questId: w.questId as number, quest: w, isWeekly: true })),
    ].filter((item) => !autoCompletedRef.current.has(item.key));

    if (completable.length === 0) return;

    completable.forEach((item) => autoCompletedRef.current.add(item.key));

    Promise.all(completable.map((item) => handleCompleteQuest(item.endpoint, item.questId))).then((results) => {
      const queue: QuestCompleteData[] = [];
      const newJustCompleted = new Set<string>();

      results.forEach((result, index) => {
        if (!result?.ok) {
          autoCompletedRef.current.delete(completable[index].key);
          return;
        }
        if (result.alreadyCompleted) return;

        const item = completable[index];
        newJustCompleted.add(item.key);
        queue.push({
          questTitle: getQuestTitle(item.quest.type, locale, item.quest.title, curSymbol),
          rewardRyumo: item.quest.rewardRyumo,
          rewardSeasonXp: item.quest.rewardSeasonXp,
          isWeekly: item.isWeekly,
        });
      });

      if (queue.length > 0) {
        setJustCompletedIds((prev) => new Set([...prev, ...newJustCompleted]));
        setCompleteQueue(queue);
      }
    });
  }, [daily, weeklies, loading, handleCompleteQuest, locale, curSymbol]);

  const handleSelectWeeklyQuest = useCallback(
    async (questType: string) => {
      setSelectingWeeklyType(questType);
      try {
        const res = await fetch("/api/quests/weekly/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ questType }),
        });
        if (!res.ok) return;

        const payload = (await res.json().catch(() => ({}))) as {
          autoCompleted?: boolean;
          actionResult?: MobileActionResult;
        };
        if (payload.actionResult) {
          await applyMobileActionResult(payload.actionResult, queryClient, { onLevelEvent: announceLevelUp });
        } else {
          await syncMobileData({ fullProfile: true }).catch(() => null);
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY }),
            queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY }),
          ]);
        }

        if (payload.autoCompleted) {
          const found = weeklyOptions.find((o) => o.type === questType);
          if (found) {
            setCompleteQueue([
              {
                questTitle: getQuestTitle(found.type, locale, found.title, curSymbol),
                rewardRyumo: found.rewardRyumo,
                rewardSeasonXp: found.rewardSeasonXp,
                isWeekly: true,
              },
            ]);
          }
        }
      } finally {
        setSelectingWeeklyType(null);
      }
    },
    [announceLevelUp, queryClient, weeklyOptions, locale]
  );

  const handleOverlayDismiss = useCallback(() => {
    setCompleteQueue((prev) => prev.slice(1));
  }, []);

  useEffect(() => {
    const delay = msUntilNextMidnightUTC() + 60 * 1000;
    const timer = setTimeout(
      () => queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY }),
      Math.min(delay, 24 * 60 * 60 * 1000)
    );
    return () => clearTimeout(timer);
  }, [queryClient, questDate, weekStart]);

  useEffect(() => {
    const interval = setInterval(() => {
      const today = getTodayUTC();
      const nextWeek = getWeekBounds(today);
      if (today !== questDate || nextWeek.start !== weekStart || nextWeek.end !== weekEnd) {
        queryClient.invalidateQueries({ queryKey: QUESTS_DAILY_QUERY_KEY });
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [questDate, weekStart, weekEnd, queryClient]);

  const visibleDaily = preview ? daily.slice(0, 2) : daily;
  const showDaily = visibleDaily.length > 0;
  const showDailyEmpty = !loading && daily.length === 0;
  const showWeekly = weeklies.length > 0;
  const showWeeklyOptions = !preview && weeklies.length === 0 && weeklyOptions.length > 0;
  const showWeeklyPreviewPrompt = preview && weeklies.length === 0 && weeklyOptions.length > 0;

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="h-[92px] animate-pulse rounded-[var(--app-radius-lg)]" style={{ background: "var(--app-bg-elevated)" }} />
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-[210px] animate-pulse rounded-[var(--app-radius-md)]" style={{ background: "var(--app-bg-elevated)", opacity: 1 - i * 0.12 }} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Surface variant="flat" radius="lg" className={cn("py-10 text-center text-sm font-semibold", className)} style={{ color: "var(--app-text-secondary)" }}>
        {t("quests.loadError")}
      </Surface>
    );
  }

  return (
    <>
      <QuestCompleteOverlay data={completeQueue[0] ?? null} onDismiss={handleOverlayDismiss} />

      <div className={cn("space-y-6", className)}>
        {!preview ? (
          <QuestBoardHero
            daily={daily}
            weeklies={weeklies}
            dailyTotalRyumo={dailyTotalRyumo}
            dailyTotalSeasonXp={dailyTotalSeasonXp}
            weekStart={weekStart}
            weekEnd={weekEnd}
            locale={locale}
          />
        ) : null}

        <section className="space-y-4">
          <SectionHeader
            eyebrow={L(locale, "Günlük görevler", "Daily quests", "Ежедневные квесты", "ภารกิจรายวัน", "Misiones diarias", "每日任务")}
            title={L(locale, "Bugünün kartları", "Today's cards", "Карты на сегодня", "การ์ดของวันนี้", "Tarjetas de hoy", "今日卡片")}
            meta={
              <div className="text-right">
                <p className="font-mono text-[15px] font-black tabular-nums" style={{ color: allDailyDone ? "var(--app-success)" : "var(--app-gold)" }}>
                  {allDailyDone ? L(locale, "Hepsi tamam", "All done", "Все выполнено", "เสร็จทั้งหมด", "Todo listo", "全部完成") : `${dailyTotalRyumo} ${L(locale, "puan", "points", "поинты", "แต้ม", "puntos", "积分")}`}
                </p>
                <p className="text-[11px] font-bold tabular-nums" style={{ color: "var(--app-text-muted)" }}>
                  +{dailyTotalSeasonXp} {L(locale, "Sezon XP", "Season XP", "Сезон XP", "ซีซัน XP", "XP temporada", "赛季 XP")}
                </p>
              </div>
            }
          />

          {showDaily ? (
            <div className={cn("grid gap-3", preview ? "grid-cols-1" : "lg:grid-cols-2")}>
              {visibleDaily.map((quest, index) => (
                <QuestVisualCard
                  key={quest.id}
                  quest={quest}
                  tone={getQuestTone(quest, index)}
                  index={index}
                  justCompleted={justCompletedIds.has(quest.id)}
                  footer={
                    !preview && quest.type === "D1" ? (
                      quest.status === "completed" || quest.progress >= quest.target ? (
                        <div
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-[12px] font-black"
                          style={{
                            background: "rgba(154,165,175,0.08)",
                            borderColor: "rgba(154,165,175,0.14)",
                            color: "#77828D",
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {L(locale, "Bugün fiş yüklendi", "Receipt uploaded today", "Чек загружен сегодня", "อัปโหลดใบเสร็จวันนี้แล้ว", "Recibo subido hoy", "今日已上传收据")}
                        </div>
                      ) : (
                        <Link
                          href="/app/mine"
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-[12px] font-black transition-opacity hover:opacity-85"
                          style={{
                            background: "rgba(216,182,83,0.12)",
                            borderColor: "#3E3520",
                            color: "#D8B653",
                          }}
                        >
                          <ReceiptText className="h-4 w-4" />
                          {L(locale, "Fiş yükle", "Upload receipt", "Загрузить чек", "อัปโหลดใบเสร็จ", "Subir recibo", "上传收据")}
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      )
                    ) : null
                  }
                />
              ))}
            </div>
          ) : showDailyEmpty ? (
            <Surface variant="flat" radius="md" className="p-5 text-center text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>
              {t("quests.noDailyQuests")}
            </Surface>
          ) : null}
        </section>

        <section className="space-y-4">
          <SectionHeader
            eyebrow={L(locale, "Haftalık hedef", "Weekly goal", "Недельная цель", "เป้าหมายรายสัปดาห์", "Meta semanal", "每周目标")}
            title={showWeekly ? L(locale, "Haftalık görevler", "Weekly quests", "Недельные квесты", "ภารกิจรายสัปดาห์", "Misiones semanales", "每周任务") : L(locale, "Haftalık hedefini seç", "Choose your weekly goal", "Выбери недельную цель", "เลือกเป้าหมายรายสัปดาห์ของคุณ", "Elige tu objetivo semanal", "选择你的每周目标")}
            meta={
              showWeekly ? (
                <span className="inline-flex items-center gap-2 text-[12px] font-black" style={{ color: "#84909A" }}>
                  <CalendarDays className="h-4 w-4" />
                  {formatShortDate(weekStart, locale)} - {formatShortDate(weekEnd, locale)}
                </span>
              ) : null
            }
          />

          {showWeekly ? (
            <div className={cn("grid gap-3", preview ? "grid-cols-1" : "lg:grid-cols-2")}>
              {weeklies.map((quest, index) => (
                <QuestVisualCard
                  key={quest.id}
                  quest={quest}
                  tone={getQuestTone(quest, daily.length + index)}
                  index={daily.length + index}
                  featured={weeklies.length === 1}
                  justCompleted={justCompletedIds.has(quest.id)}
                />
              ))}
            </div>
          ) : showWeeklyOptions ? (
            <div className="space-y-3">
              <Surface variant="glass" accent="gold" radius="md" className="p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ color: "var(--app-gold)", background: "var(--app-gold-glow)" }}>
                    <Target className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[14px] font-black" style={{ color: "var(--app-text-primary)" }}>
                      {t("quests.selectGoalThisWeek")}
                    </p>
                    <p className="mt-1 text-[12px] font-semibold leading-5" style={{ color: "var(--app-text-secondary)" }}>
                      {L(locale, "Seçtiğin hedef bu hafta boyunca burada görünür.", "Your selected goal stays here throughout the week.", "Выбранная цель остаётся здесь на всю неделю.", "เป้าหมายที่เลือกจะแสดงที่นี่ตลอดสัปดาห์", "Tu meta seleccionada permanece aquí durante toda la semana.", "您选择的目标将在整周内显示在此处。")}
                    </p>
                  </div>
                </div>
              </Surface>
              <div className="grid gap-3 lg:grid-cols-2">
                {weeklyOptions.map((quest, index) => (
                  <WeeklyOptionCard
                    key={quest.id}
                    quest={quest}
                    tone={getQuestTone(quest, index)}
                    loading={selectingWeeklyType === quest.type}
                    onSelect={handleSelectWeeklyQuest}
                  />
                ))}
              </div>
            </div>
          ) : showWeeklyPreviewPrompt ? (
            <Surface variant="flat" radius="md" className="p-4 text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>
              {t("quests.selectGoalThisWeek")}
            </Surface>
          ) : (
            <Surface variant="flat" radius="md" className="p-5 text-center text-sm font-semibold" style={{ color: "var(--app-text-secondary)" }}>
              {t("quests.noWeeklyGoal")}
            </Surface>
          )}
        </section>

        {!preview ? (
          <StaggerReveal className="grid gap-3 lg:grid-cols-3">
            {[
              {
                icon: Trophy,
                color: "var(--app-gold)",
                soft: "var(--app-gold-glow)",
                title: L(locale, "Ödüller hazır", "Rewards ready", "Награды готовы", "รางวัลพร้อมแล้ว", "Recompensas listas", "奖励已就绪"),
                body: L(locale, "Kartları tamamladıkça puan ve XP kazanırsın.", "Complete cards to earn points and XP.", "Завершай карточки и получай очки и XP.", "ทำการ์ดให้ครบเพื่อรับแต้มและ XP", "Completa tarjetas para ganar puntos y XP.", "完成卡片即可获得积分和 XP。"),
              },
              {
                icon: ShieldCheck,
                color: "var(--app-success)",
                soft: "rgba(108,203,150,0.14)",
                title: L(locale, "İlerleme korunur", "Progress is preserved", "Прогресс сохраняется", "ความคืบหน้าจะถูกเก็บไว้", "El progreso se conserva", "进度会被保留"),
                body: L(locale, "Fiş ve keşif katkıların görev ilerlemeni günceller.", "Receipt and discovery contributions update your task progress.", "Вклад из чеков и открытий обновляет прогресс задач.", "ใบเสร็จและการค้นพบของคุณจะอัปเดตความคืบหน้าภารกิจ", "Las contribuciones de recibos y descubrimientos actualizan tu progreso.", "收据与发现贡献会更新你的任务进度。"),
              },
              {
                icon: Users,
                color: "#B99BE4",
                soft: "rgba(185,155,228,0.14)",
                title: L(locale, "Haftalık meydan okuma", "Weekly challenge", "Недельный челлендж", "ความท้าทายรายสัปดาห์", "Desafío semanal", "每周挑战"),
                body: L(locale, "Büyük hedefin haftalık ritmi belirler.", "Your big goal sets the weekly rhythm.", "Большая цель задает ритм недели.", "เป้าหมายใหญ่ของคุณกำหนดจังหวะของสัปดาห์", "Tu gran objetivo marca el ritmo semanal.", "你的大目标决定每周节奏。"),
              },
            ].map((card) => (
              <Reveal key={card.title}>
                <Surface variant="elevated" radius="md" className="h-full p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: card.soft, color: card.color }}>
                    <card.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-[14px] font-black" style={{ color: "var(--app-text-primary)" }}>
                    {card.title}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold leading-5" style={{ color: "var(--app-text-secondary)" }}>
                    {card.body}
                  </p>
                </Surface>
              </Reveal>
            ))}
          </StaggerReveal>
        ) : null}

        {preview && (daily.length > 0 || weeklies.length > 0 || weeklyOptions.length > 0) ? (
          <Surface
            as={Link}
            href="/app/tasks"
            variant="flat"
            radius="md"
            interactive
            className="flex min-h-11 w-full items-center justify-center gap-2 text-[12px] font-black"
            style={{ color: "var(--app-text-primary)" }}
          >
            {t("quests.viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Surface>
        ) : null}
      </div>
    </>
  );
}
