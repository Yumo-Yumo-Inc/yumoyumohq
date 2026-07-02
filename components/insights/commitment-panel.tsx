"use client";

/**
 * CommitmentPanel — Plan tab management surface for active commitments.
 *
 * This is NOT a data-entry form. Commitments are always created from insight
 * cards (in the Truth tab). This panel only displays, tracks, and controls
 * existing commitments. The user can:
 *   - See progress per commitment (kind-specific visualization)
 *   - Pause / Resume an active commitment
 *   - End (complete/abandon) a commitment
 *   - See the originating insight kind as context
 *
 * Design principle: every action is single-tap, every row is self-contained.
 */

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Fingerprint,
  Flame,
  Layers,
  Pause,
  Play,
  ShieldCheck,
  Tag,
  Timer,
  TrendingDown,
  TrendingUp,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { ThemeCard } from "@/components/app/theme-card";
import { formatCurrency } from "@/lib/insights/format";
import {
  listCommitmentsLocal,
  fetchCommitmentsFromServer,
  setCommitmentStatusClient,
  deleteCommitmentClient,
} from "@/lib/commitments/client";
import { subscribeLocalDbChanges } from "@/lib/local-db";
import type { CachedCommitmentRecord, CommitmentKind, CommitmentStatus } from "@/lib/offline/types";

// ─── Kind metadata ────────────────────────────────────────────────────────────

export type PanelLocale = "tr" | "en" | "ru" | "th" | "es" | "zh";

function pick(locale: PanelLocale, tr: string, en: string, ru: string, th: string, es: string, zh: string): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

interface KindMeta {
  icon: typeof Flame;
  label: Record<PanelLocale, string>;
  color: string;
}

const KIND_META: Record<CommitmentKind, KindMeta> = {
  price_watch: {
    icon: TrendingUp,
    label: {
      tr: "Fiyat takibi",
      en: "Price watch",
      ru: "Контроль цен",
      th: "การติดตามราคา",
      es: "Vigilancia de precio",
      zh: "价格监控",
    },
    color: "var(--app-warn, #F59E0B)",
  },
  time_rule: {
    icon: Clock,
    label: {
      tr: "Zaman kuralı",
      en: "Time rule",
      ru: "Временное правило",
      th: "กฎเรื่องเวลา",
      es: "Regla de tiempo",
      zh: "时间规则",
    },
    color: "var(--app-danger, #F87171)",
  },
  category_cap: {
    icon: Layers,
    label: {
      tr: "Kategori tavanı",
      en: "Category cap",
      ru: "Лимит категории",
      th: "เพดานหมวดหมู่",
      es: "Tope de categoría",
      zh: "类别上限",
    },
    color: "var(--app-blue, #60A5FA)",
  },
  merchant_diet: {
    icon: Tag,
    label: {
      tr: "Merchant diyeti",
      en: "Merchant diet",
      ru: "Диета по магазину",
      th: "ลดร้านนี้",
      es: "Dieta de comercio",
      zh: "商家节制",
    },
    color: "var(--app-primary, #D6B75B)",
  },
  restock_reminder: {
    icon: ShieldCheck,
    label: {
      tr: "Yenileme hatırlatıcı",
      en: "Restock reminder",
      ru: "Напоминание о пополнении",
      th: "เตือนเติมสต็อก",
      es: "Recordatorio de reposición",
      zh: "补货提醒",
    },
    color: "var(--app-success, #34D399)",
  },
  streak_goal: {
    icon: Flame,
    label: {
      tr: "Seri hedefi",
      en: "Streak goal",
      ru: "Цель серии",
      th: "เป้าหมายสตรีค",
      es: "Meta de racha",
      zh: "连续目标",
    },
    color: "var(--app-danger, #F87171)",
  },
  ritual_swap: {
    icon: UserCheck,
    label: {
      tr: "Ritüel değişimi",
      en: "Ritual swap",
      ru: "Замена ритуала",
      th: "เปลี่ยนพิธีกรรม",
      es: "Cambio de ritual",
      zh: "仪式替换",
    },
    color: "var(--app-primary, #D6B75B)",
  },
  frequency_cap: {
    icon: Timer,
    label: {
      tr: "Sıklık sınırı",
      en: "Frequency cap",
      ru: "Лимит частоты",
      th: "เพดานความถี่",
      es: "Tope de frecuencia",
      zh: "频次上限",
    },
    color: "var(--app-warn, #F59E0B)",
  },
};

const STATUS_COLORS: Record<CommitmentStatus, string> = {
  active: "var(--app-success, #34D399)",
  paused: "var(--app-warn, #F59E0B)",
  completed: "var(--app-primary, #D6B75B)",
  dismissed: "var(--app-text-muted)",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommitmentPanelProps {
  currency?: string;
  locale?: PanelLocale;
  accountLevel?: number;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CommitmentPanel({
  currency = "TRY",
  locale = "tr",
  accountLevel = 1,
}: CommitmentPanelProps) {
  const [commitments, setCommitments] = useState<CachedCommitmentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Single-fire server refresh on mount, then local-only on DB changes
  useEffect(() => {
    let cancelled = false;

    const loadLocal = async () => {
      const local = await listCommitmentsLocal();
      if (!cancelled) setCommitments(local);
    };

    const refreshRemoteOnce = async () => {
      await fetchCommitmentsFromServer();
      await loadLocal();
      if (!cancelled) setLoading(false);
    };

    void refreshRemoteOnce();

    const unsub = subscribeLocalDbChanges((stores) => {
      if (stores.includes("commitments")) void loadLocal();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const active = commitments.filter((c) => c.status === "active");
  const paused = commitments.filter((c) => c.status === "paused");
  const completed = commitments.filter((c) => c.status === "completed");

  if (loading) {
    return (
      <ThemeCard accountLevel={accountLevel} className="p-6">
        <div className="h-32 animate-pulse rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }} />
      </ThemeCard>
    );
  }

  if (commitments.length === 0) {
    return (
      <ThemeCard accountLevel={accountLevel} className="p-6">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: "rgba(214,183,91,0.1)" }}
          >
            <Circle className="h-6 w-6" style={{ color: "var(--app-primary)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
            {pick(locale, "Henüz taahhüt yok", "No commitments yet", "Пока нет обязательств", "ยังไม่มีคำมั่น", "Aún no hay compromisos", "暂无承诺")}
          </p>
          <p className="max-w-xs text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
            {pick(
              locale,
              "Truth sekmesindeki davranış sinyallerini inceleyip bir taahhüde dönüştür.",
              "Review the behaviour signals in the Truth tab and convert one into a commitment.",
              "Просмотри поведенческие сигналы во вкладке Truth и преврати один из них в обязательство.",
              "ดูสัญญาณพฤติกรรมในแท็บ Truth และเปลี่ยนให้เป็นคำมั่น",
              "Revisa las señales de conducta en la pestaña Truth y conviértelas en un compromiso.",
              "查看 Truth 标签中的行为信号，并把其中之一转化为承诺。",
            )}
          </p>
          <div
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "var(--app-primary)" }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
            {pick(locale, "Truth → Sinyal kartları", "Truth → Signal cards", "Truth → Карточки сигналов", "Truth → การ์ดสัญญาณ", "Truth → Tarjetas de señal", "Truth → 信号卡片")}
          </div>
        </div>
      </ThemeCard>
    );
  }

  return (
    <ThemeCard accountLevel={accountLevel} className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--app-text-primary)" }}>
            {pick(locale, "Taahhütlerim", "My Commitments", "Мои обязательства", "คำมั่นของฉัน", "Mis compromisos", "我的承诺")}
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: "var(--app-text-muted)" }}>
            {pick(
              locale,
              `${active.length} aktif · ${paused.length} duraklatıldı · ${completed.length} tamamlandı`,
              `${active.length} active · ${paused.length} paused · ${completed.length} completed`,
              `${active.length} активных · ${paused.length} на паузе · ${completed.length} завершено`,
              `ใช้งาน ${active.length} · พัก ${paused.length} · เสร็จ ${completed.length}`,
              `${active.length} activos · ${paused.length} pausados · ${completed.length} completados`,
              `${active.length} 进行中 · ${paused.length} 已暂停 · ${completed.length} 已完成`,
            )}
          </p>
        </div>
        {/* Summary stats */}
        {active.length > 0 && (
          <div
            className="rounded-xl border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: "rgba(52,211,153,0.25)",
              background: "rgba(52,211,153,0.06)",
              color: "var(--app-success)",
            }}
          >
            {active.length} {pick(locale, "aktif", "active", "активные", "ใช้งาน", "activos", "进行中")}
          </div>
        )}
      </div>

      {/* Active */}
      {active.length > 0 && (
        <Section label={pick(locale, "Aktif", "Active", "Активные", "ใช้งาน", "Activos", "进行中")}>
          {active.map((c) => (
            <CommitmentRow key={c.id} commitment={c} currency={currency} locale={locale} />
          ))}
        </Section>
      )}

      {/* Paused */}
      {paused.length > 0 && (
        <Section label={pick(locale, "Duraklatıldı", "Paused", "На паузе", "พัก", "Pausados", "已暂停")}>
          {paused.map((c) => (
            <CommitmentRow key={c.id} commitment={c} currency={currency} locale={locale} />
          ))}
        </Section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <Section label={pick(locale, "Tamamlandı", "Completed", "Завершено", "เสร็จสิ้น", "Completados", "已完成")} muted>
          {completed.map((c) => (
            <CommitmentRow key={c.id} commitment={c} currency={currency} locale={locale} />
          ))}
        </Section>
      )}
    </ThemeCard>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  label,
  children,
  muted = false,
}: {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="space-y-2">
      <p
        className="text-[10px] uppercase tracking-[0.16em]"
        style={{ color: muted ? "var(--app-text-muted)" : "var(--app-text-secondary)" }}
      >
        {label}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Single commitment row ────────────────────────────────────────────────────

function CommitmentRow({
  commitment,
  currency,
  locale,
}: {
  commitment: CachedCommitmentRecord;
  currency: string;
  locale: PanelLocale;
}) {
  const [busy, setBusy] = useState(false);
  const meta = KIND_META[commitment.kind];
  const Icon = meta.icon;
  const isActive = commitment.status === "active";
  const isPaused = commitment.status === "paused";
  const isDone = commitment.status === "completed" || commitment.status === "dismissed";

  const togglePause = async () => {
    if (busy || isDone) return;
    setBusy(true);
    const next: CommitmentStatus = isActive ? "paused" : "active";
    await setCommitmentStatusClient(commitment.id, next).catch(() => {});
    setBusy(false);
  };

  const endCommitment = async () => {
    if (busy) return;
    setBusy(true);
    await setCommitmentStatusClient(commitment.id, "completed").catch(() => {});
    setBusy(false);
  };

  // Progress percentage
  const progressPct =
    commitment.target && commitment.target > 0
      ? Math.min(100, Math.round((commitment.progress / commitment.target) * 100))
      : null;

  return (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{
        borderColor: isDone
          ? "rgba(255,255,255,0.04)"
          : isActive
            ? `color-mix(in srgb, ${meta.color} 20%, transparent)`
            : "rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        opacity: isDone ? 0.5 : 1,
      }}
    >
      {/* Top row: icon + title + status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `color-mix(in srgb, ${meta.color} 15%, transparent)` }}
          >
            <Icon className="h-4 w-4" style={{ color: meta.color }} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-snug" style={{ color: "var(--app-text-primary)" }}>
              {commitment.title}
            </p>
            <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: meta.color }}>
              {meta.label[locale]}
            </p>
          </div>
        </div>

        {/* Status dot */}
        <div
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ background: STATUS_COLORS[commitment.status] }}
          title={commitment.status}
        />
      </div>

      {/* Description */}
      {commitment.description ? (
        <p className="text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
          {commitment.description}
        </p>
      ) : null}

      {/* Progress bar (when target is set) */}
      {progressPct !== null && !isDone ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span style={{ color: "var(--app-text-muted)" }}>
              {pick(locale, "İlerleme", "Progress", "Прогресс", "ความคืบหน้า", "Progreso", "进度")}
            </span>
            <span className="tabular-nums font-semibold" style={{ color: meta.color }}>
              {commitment.progress} / {commitment.target}
              {commitment.currency
                ? ` ${commitment.currency}`
                : ` ${pick(locale, "gün", "days", "дн.", "วัน", "días", "天")}`}
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, background: meta.color }}
            />
          </div>
        </div>
      ) : null}

      {/* Kind-specific params summary */}
      <KindParams commitment={commitment} currency={currency} locale={locale} meta={meta} />

      {/* Action buttons (hidden when done) */}
      {!isDone ? (
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={togglePause}
            disabled={busy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-opacity disabled:opacity-50"
            style={{
              borderColor: "var(--app-border)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--app-text-secondary)",
            }}
          >
            {isActive ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                {pick(locale, "Duraklat", "Pause", "Пауза", "พัก", "Pausar", "暂停")}
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                {pick(locale, "Devam et", "Resume", "Возобновить", "ทำต่อ", "Reanudar", "继续")}
              </>
            )}
          </button>

          <button
            onClick={endCommitment}
            disabled={busy}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50"
            style={{
              borderColor: "rgba(248,113,113,0.2)",
              background: "transparent",
              color: "var(--app-text-muted)",
            }}
            title={pick(locale, "Sonlandır", "End commitment", "Завершить", "สิ้นสุด", "Finalizar", "结束")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--app-primary)" }} />
          <p className="text-xs" style={{ color: "var(--app-text-muted)" }}>
            {pick(locale, "Tamamlandı", "Completed", "Завершено", "เสร็จสิ้น", "Completado", "已完成")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Kind-specific parameter summary ─────────────────────────────────────────

function KindParams({
  commitment,
  currency,
  locale,
  meta,
}: {
  commitment: CachedCommitmentRecord;
  currency: string;
  locale: PanelLocale;
  meta: KindMeta;
}) {
  const params = commitment.params ?? {};
  const cur = commitment.currency ?? currency;

  const chips: string[] = [];

  switch (commitment.kind) {
    case "price_watch": {
      const baseline = params.baselineUnitPrice as number | undefined;
      const trigger = params.triggerRatio as number | undefined;
      if (baseline) chips.push(`${pick(locale, "Baz", "Baseline", "База", "ฐาน", "Base", "基线")}: ${formatCurrency(baseline, cur)}`);
      if (trigger) chips.push(`±${Math.round(trigger * 100)}% ${pick(locale, "tetikleyici", "trigger", "триггер", "ตัวกระตุ้น", "disparador", "触发")}`);
      break;
    }
    case "time_rule": {
      const dow = params.dayOfWeek as number | undefined;
      const bucket = params.hourBucket as string | undefined;
      const DAYS: Record<PanelLocale, string[]> = {
        tr: ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"],
        en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
        th: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
        es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
        zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
      };
      if (dow !== undefined) chips.push(DAYS[locale][dow] ?? "");
      if (bucket) chips.push(bucket);
      break;
    }
    case "category_cap": {
      const cat = params.category as string | undefined;
      const amount = params.amount as number | undefined;
      if (cat) chips.push(cat);
      if (amount) chips.push(`≤ ${formatCurrency(amount, cur)}`);
      break;
    }
    case "streak_goal": {
      const days = params.streakDays as number | undefined;
      const avg = params.targetDailyAverage as number | undefined;
      if (days) chips.push(`${days} ${pick(locale, "gün", "days", "дн.", "วัน", "días", "天")}`);
      if (avg) chips.push(`≤ ${formatCurrency(avg, cur)} / ${pick(locale, "gün", "day", "день", "วัน", "día", "天")}`);
      break;
    }
    case "merchant_diet": {
      const merchant = params.merchant as string | undefined;
      const visits = params.monthlyVisitCap as number | undefined;
      if (merchant) chips.push(merchant);
      if (visits) chips.push(`≤ ${visits} ${pick(locale, "ziyaret/ay", "visits/mo", "визитов/мес.", "ครั้ง/เดือน", "visitas/mes", "次/月")}`);
      break;
    }
    default:
      break;
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-lg px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
            color: meta.color,
          }}
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
