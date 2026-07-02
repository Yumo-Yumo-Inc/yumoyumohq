"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, X, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/lib/i18n/app-context";
import {
  DASHBOARD_COPY,
  type YumoLocale,
} from "@/lib/product-architecture/dashboard-contract";
import type { VerificationTask } from "@/lib/verification/server";

type FeedResponse = {
  tasks: VerificationTask[];
  quota: { daily: number; used: number; remaining: number };
  openCount: number;
};

type SimilarSuggestion = { text: string; confirmedCount: number };
function byLocale(locale: YumoLocale, tr: string, en: string, ru: string, th: string, es: string, zh: string): string {
  if (locale === "tr") return tr;
  if (locale === "ru") return ru;
  if (locale === "th") return th;
  if (locale === "es") return es;
  if (locale === "zh") return zh;
  return en;
}

async function fetchFeed(): Promise<FeedResponse> {
  const response = await fetch("/api/verify/feed?limit=20", { credentials: "include" });
  if (!response.ok) throw new Error("feed_failed");
  return (await response.json()) as FeedResponse;
}

async function postRespond(input: {
  taskId: number;
  response: "confirmed" | "rejected" | "correction" | "skipped" | "unknown";
  correctionText?: string;
}) {
  const response = await fetch("/api/verify/respond", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "respond_failed");
  }
  return response.json();
}

async function fetchSuggestions(query: string): Promise<SimilarSuggestion[]> {
  if (query.trim().length < 2) return [];
  const response = await fetch(`/api/verify/suggestions?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.suggestions) ? (data.suggestions as SimilarSuggestion[]) : [];
}

function buildPrompt(task: VerificationTask, locale: YumoLocale): { eyebrow: string; question: string } {
  switch (task.taskType) {
    case "merchant_name":
      return {
        eyebrow: byLocale(locale, "Doğrulama · İşletme", "Verification · Merchant", "Проверка · Магазин", "การยืนยัน · ร้านค้า", "Verificación · Comercio", "验证 · 商家"),
        question: byLocale(locale, `Bu işletme ${task.candidateText} mi?`, `Is this merchant ${task.candidateText}?`, `Это магазин ${task.candidateText}?`, `นี่คือร้านค้า ${task.candidateText} ใช่ไหม?`, `¿Este comercio es ${task.candidateText}?`, `这是商户 ${task.candidateText} 吗？`),
      };
    case "product_canonical":
      return {
        eyebrow: byLocale(locale, "Doğrulama · Ürün", "Verification · Product", "Проверка · Товар", "การยืนยัน · สินค้า", "Verificación · Producto", "验证 · 商品"),
        question: byLocale(locale, `"${task.candidateText}" doğru ürün adı mı?`, `Is "${task.candidateText}" the correct product name?`, `"${task.candidateText}" — это корректное название товара?`, `"${task.candidateText}" เป็นชื่อสินค้าที่ถูกต้องหรือไม่?`, `¿"${task.candidateText}" es el nombre correcto del producto?`, `"${task.candidateText}" 是正确的商品名吗？`),
      };
    case "receipt_kind":
      return {
        eyebrow: byLocale(locale, "Doğrulama · Tür", "Verification · Kind", "Проверка · Тип", "การยืนยัน · ประเภท", "Verificación · Tipo", "验证 · 类型"),
        question: byLocale(locale, "Bu fatura mı, market alışverişi mi?", "Is this a bill or grocery purchase?", "Это счет или покупка продуктов?", "นี่คือบิลหรือการซื้อของชำ?", "¿Es una factura o una compra de supermercado?", "这是账单还是日常采购？"),
      };
    case "bill_amount":
      return {
        eyebrow: byLocale(locale, "Doğrulama · Tutar", "Verification · Amount", "Проверка · Сумма", "การยืนยัน · จำนวนเงิน", "Verificación · Monto", "验证 · 金额"),
        question: byLocale(locale, `Fatura tutarı ${task.candidateText} mi?`, `Is the bill amount ${task.candidateText}?`, `Сумма счета — ${task.candidateText}?`, `ยอดบิลคือ ${task.candidateText} ใช่ไหม?`, `¿El monto de la factura es ${task.candidateText}?`, `账单金额是 ${task.candidateText} 吗？`),
      };
    case "provider_match":
      return {
        eyebrow: byLocale(locale, "Doğrulama · Sağlayıcı", "Verification · Provider", "Проверка · Провайдер", "การยืนยัน · ผู้ให้บริการ", "Verificación · Proveedor", "验证 · 服务商"),
        question: byLocale(locale, `Bu fatura ${task.candidateText} sağlayıcına mı ait?`, `Does this bill belong to ${task.candidateText}?`, `Этот счет относится к провайдеру ${task.candidateText}?`, `บิลนี้เป็นของผู้ให้บริการ ${task.candidateText} ใช่ไหม?`, `¿Esta factura pertenece a ${task.candidateText}?`, `这张账单属于 ${task.candidateText} 服务商吗？`),
      };
    default:
      return {
        eyebrow: byLocale(locale, "Doğrulama", "Verification", "Проверка", "การยืนยัน", "Verificación", "验证"),
        question: task.candidateText,
      };
  }
}

export default function VerifyPage() {
  const { locale } = useAppLocale();
  const yumoLocale = locale as YumoLocale;
  const copy = DASHBOARD_COPY[yumoLocale];
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-feed"],
    queryFn: fetchFeed,
    staleTime: 10_000,
  });

  const tasks = useMemo(() => data?.tasks ?? [], [data]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<"prompt" | "correction">("prompt");
  const [correctionText, setCorrectionText] = useState("");

  useEffect(() => {
    setIndex(0);
    setMode("prompt");
    setCorrectionText("");
  }, [tasks.length]);

  const respondMutation = useMutation({
    mutationFn: postRespond,
    onSuccess: () => {
      setMode("prompt");
      setCorrectionText("");
      queryClient.invalidateQueries({ queryKey: ["verify-feed"] });
      queryClient.invalidateQueries({ queryKey: ["verify-feed-preview"] });
      setIndex((prev) => prev + 1);
    },
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["verify-suggestions", correctionText],
    queryFn: () => fetchSuggestions(correctionText),
    enabled: mode === "correction" && correctionText.trim().length >= 2,
    staleTime: 5_000,
  });

  const current = tasks[index];
  const total = tasks.length;
  const progressPercent = total > 0 ? Math.round((index / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[var(--app-bg-shell)] text-sm text-white/55">
        {byLocale(yumoLocale, "Yükleniyor...", "Loading...", "Загрузка...", "กำลังโหลด...", "Cargando...", "加载中...")}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[var(--app-bg-shell)] px-6 text-center text-white">
        <div>
          <p className="text-base font-black">
            {byLocale(yumoLocale, "Bir şeyler ters gitti.", "Something went wrong.", "Что-то пошло не так.", "เกิดข้อผิดพลาดบางอย่าง", "Algo salió mal.", "出了点问题。")}
          </p>
          <Link href="/app/dashboard" className="mt-4 inline-flex text-[#ffb347] underline">
            {byLocale(yumoLocale, "Dashboard'a dön", "Back to dashboard", "Назад к панели", "กลับไปแดชบอร์ด", "Volver al panel", "返回仪表盘")}
          </Link>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="grid min-h-[100svh] place-items-center bg-[var(--app-bg-shell)] px-6 text-center text-white">
        <div className="max-w-[320px]">
          <p className="text-lg font-black">{copy.verifyEmptyTitle}</p>
          <p className="mt-2 text-sm font-semibold text-white/55">{copy.verifyEmptyBody}</p>
          <Link
            href="/app/dashboard"
            className="mt-6 inline-flex items-center gap-1 rounded-full bg-[#ff7a1a] px-4 py-2 text-sm font-black text-[#170b05]"
          >
            {byLocale(yumoLocale, "Dashboard'a dön", "Back to dashboard", "Назад к панели", "กลับไปแดชบอร์ด", "Volver al panel", "返回仪表盘")}
          </Link>
        </div>
      </div>
    );
  }

  const { eyebrow, question } = buildPrompt(current, yumoLocale);

  const handleConfirm = () => {
    respondMutation.mutate({ taskId: current.id, response: "confirmed" });
  };
  const handleReject = () => {
    setMode("correction");
  };
  const handleSkip = () => {
    respondMutation.mutate({ taskId: current.id, response: "skipped" });
  };
  const handleSubmitCorrection = () => {
    const trimmed = correctionText.trim();
    if (trimmed.length < 1 || trimmed.length > 240) return;
    respondMutation.mutate({
      taskId: current.id,
      response: "correction",
      correctionText: trimmed,
    });
  };
  const handleUnknown = () => {
    respondMutation.mutate({ taskId: current.id, response: "unknown" });
  };

  return (
    <div className="min-h-[100svh] bg-[var(--app-bg-shell)] pb-20 pt-4 text-white">
      <div className="mx-auto w-full max-w-[420px] px-3">
        <div className="flex items-center justify-between">
          <Link
            href="/app/dashboard"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-white"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>
          <p className="text-[12px] font-black text-white/72">
            {index + 1} / {total}
          </p>
          <span className="rounded-full bg-[#fcd34d]/14 px-3 py-1 text-[11px] font-black text-[#fcd34d]">
            +{current.rewardContribution} {copy.todayMicroContribution}
          </span>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full bg-gradient-to-r from-[#ff7a1a] to-[#ec4899] transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {mode === "prompt" ? (
          <PromptView
            eyebrow={eyebrow}
            question={question}
            task={current}
            locale={yumoLocale}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onSkip={handleSkip}
            disabled={respondMutation.isPending}
          />
        ) : (
          <CorrectionView
            task={current}
            locale={yumoLocale}
            value={correctionText}
            onChange={setCorrectionText}
            suggestions={suggestions}
            onSubmit={handleSubmitCorrection}
            onUnknown={handleUnknown}
            onCancel={() => setMode("prompt")}
            disabled={respondMutation.isPending}
            quota={data.quota}
          />
        )}
      </div>
    </div>
  );
}

function PromptView({
  eyebrow,
  question,
  task,
  locale,
  onConfirm,
  onReject,
  onSkip,
  disabled,
}: {
  eyebrow: string;
  question: string;
  task: VerificationTask;
  locale: YumoLocale;
  onConfirm: () => void;
  onReject: () => void;
  onSkip: () => void;
  disabled: boolean;
}) {
  const copy = DASHBOARD_COPY[locale];
  return (
    <>
      <div className="mt-4 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ffb347]">{eyebrow}</p>
        <h1 className="mt-1.5 text-[20px] font-black leading-[1.3] tracking-[-0.01em] text-white">
          {question}
        </h1>
      </div>

      {task.contextText && (
        <div className="mt-4 rounded-[20px] border border-white/8 bg-[var(--app-bg-elevated)] p-3.5">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
            {byLocale(locale, "Bağlam", "Context", "Контекст", "บริบท", "Contexto", "上下文")}
          </p>
          <p className="mt-1.5 whitespace-pre-line font-mono text-[12px] text-white/85">
            {task.contextText}
          </p>
        </div>
      )}

      {task.candidateMetadata && typeof task.candidateMetadata === "object" && (
        <CandidatePreview metadata={task.candidateMetadata} locale={locale} />
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onReject}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-[18px] border p-4 transition active:scale-[0.98]",
            "border-[#ef4444]/30 bg-[#ef4444]/8 text-[#fca5a5] disabled:opacity-50"
          )}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#ef4444]/18">
            <X className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
          <span className="text-[12px] font-black">{copy.verifyReject}</span>
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onConfirm}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-[18px] border p-4 transition active:scale-[0.98]",
            "border-[#22c55e]/32 bg-[#22c55e]/12 text-[#86efac] disabled:opacity-50"
          )}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#22c55e]/22">
            <Check className="h-3.5 w-3.5" strokeWidth={2.8} />
          </span>
          <span className="text-[12px] font-black">{copy.verifyConfirm}</span>
        </button>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onSkip}
        className="mt-3 w-full text-center text-[11px] font-bold text-white/45"
      >
        {copy.verifySkip}
      </button>
    </>
  );
}

function CorrectionView({
  task,
  locale,
  value,
  onChange,
  suggestions,
  onSubmit,
  onUnknown,
  onCancel,
  disabled,
  quota,
}: {
  task: VerificationTask;
  locale: YumoLocale;
  value: string;
  onChange: (next: string) => void;
  suggestions: SimilarSuggestion[];
  onSubmit: () => void;
  onUnknown: () => void;
  onCancel: () => void;
  disabled: boolean;
  quota: { daily: number; used: number };
}) {
  const copy = DASHBOARD_COPY[locale];
  const valid = value.trim().length >= 1 && value.trim().length <= 240;
  const usedPercent = Math.min(100, Math.round((quota.used / Math.max(1, quota.daily)) * 100));

  return (
    <>
      <div className="mt-4 flex items-center gap-2.5 rounded-[14px] border border-[#ef4444]/22 bg-[#ef4444]/7 p-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#ef4444]/20 text-[#fca5a5]">
          <X className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
            {byLocale(locale, "Yumbie'nin tahmini yanlış", "Yumbie's guess is wrong", "Предположение Yumbie неверно", "การเดาของ Yumbie ไม่ถูกต้อง", "La predicción de Yumbie es incorrecta", "Yumbie 的预测不正确")}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-white/60 line-through">
            {task.candidateText}
          </p>
        </div>
      </div>

      <div className="mt-4 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ffb347]">
          {copy.verifyCorrectTitle}
        </p>
        <p className="mt-1 text-[16px] font-black leading-[1.3] text-white">
          {copy.verifyCorrectHint}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-[16px] border border-[#ff7a1a]/35 bg-[var(--app-bg-elevated)] px-3.5 py-3">
        <Edit3 className="h-4 w-4 shrink-0 text-[#ffb347]" strokeWidth={2} />
        <input
          type="text"
          autoFocus
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={240}
          disabled={disabled}
          className="flex-1 bg-transparent text-sm font-black text-white outline-none placeholder:text-white/35"
          placeholder={
            task.taskType === "merchant_name"
              ? byLocale(locale, "Migros M5M Etiler", "Whole Foods Market", "Перекрёсток на Тверской", "เซเว่น อีเลฟเว่น สีลม", "Mercadona Centro", "盒马鲜生 浦东店")
              : byLocale(locale, "Doğrusunu yaz", "Type the correct value", "Введите правильное значение", "พิมพ์ค่าที่ถูกต้อง", "Escribe el valor correcto", "输入正确的值")
          }
          onKeyDown={(event) => {
            if (event.key === "Enter" && valid) onSubmit();
            if (event.key === "Escape") onCancel();
          }}
        />
        <span className="shrink-0 text-[10px] font-bold text-white/40">
          {value.length}/240
        </span>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3">
          <p className="px-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/42">
            {copy.verifySimilar}
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.text}
                type="button"
                disabled={disabled}
                onClick={() => onChange(suggestion.text)}
                className="flex items-center justify-between rounded-[12px] border border-white/8 bg-white/[0.04] px-3 py-2 text-left transition hover:bg-white/[0.07]"
              >
                <span className="min-w-0 truncate text-[12px] font-bold text-white">
                  {suggestion.text}
                </span>
                <span className="shrink-0 text-[10px] font-black text-white/45">
                  {suggestion.confirmedCount}{" "}
                  {byLocale(locale, "doğrulama", "verifications", "проверок", "การยืนยัน", "verificaciones", "次验证")}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={!valid || disabled}
        className={cn(
          "mt-4 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-black transition",
          valid && !disabled
            ? "bg-gradient-to-r from-[#ff7a1a] to-[#ec4899] text-white shadow-[0_16px_36px_rgba(255,122,26,0.36)] active:scale-[0.99]"
            : "cursor-not-allowed bg-white/[0.08] text-white/40"
        )}
      >
        {copy.verifyCorrectSave}
      </button>

      <button
        type="button"
        onClick={onUnknown}
        disabled={disabled}
        className="mt-2 block w-full text-center text-[11px] font-bold text-white/45"
      >
        {byLocale(locale, "Bu işletmeyi tanımıyorum, atla", "I don't know this merchant, skip", "Я не знаю этот магазин, пропустить", "ไม่รู้จักร้านค้านี้ ข้าม", "No conozco este comercio, omitir", "我不认识这家商户，跳过")}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="mt-1 block w-full text-center text-[10px] font-bold text-white/35"
      >
        {byLocale(locale, "Vazgeç", "Cancel", "Отмена", "ยกเลิก", "Cancelar", "取消")}
      </button>

      <div className="mt-5 rounded-[14px] border border-white/8 bg-[var(--app-bg-elevated)] p-3">
        <p className="text-[10px] font-black text-white/68">
          {copy.verifyQuotaUsed}: {quota.used} / {quota.daily}
        </p>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full bg-gradient-to-r from-[#fcd34d] to-[#ffb347]"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        <p className="mt-1.5 text-[9px] font-bold text-white/42">
          {byLocale(locale, "Günlük sınır spam'i önler — yarın yeniden 20", "Daily limit prevents spam — resets tomorrow", "Дневной лимит предотвращает спам — сброс завтра", "ลิมิตรายวันช่วยป้องกันสแปม — รีเซ็ตพรุ่งนี้", "El límite diario evita spam — se reinicia mañana", "每日限制可防止垃圾提交——明天重置")}
        </p>
      </div>
    </>
  );
}

function CandidatePreview({
  metadata,
  locale,
}: {
  metadata: Record<string, unknown>;
  locale: YumoLocale;
}) {
  const confidence = typeof metadata.confidence === "number" ? metadata.confidence : null;
  const description = typeof metadata.description === "string" ? metadata.description : null;
  if (!confidence && !description) return null;

  return (
    <div className="mt-3 rounded-[16px] border border-[#3b82f6]/24 bg-[#3b82f6]/8 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
        {byLocale(locale, "Yumbie'nin tahmini", "Yumbie's prediction", "Прогноз Yumbie", "การคาดเดาของ Yumbie", "Predicción de Yumbie", "Yumbie 的预测")}
      </p>
      {description && (
        <p className="mt-1 text-[12px] font-bold text-white">{description}</p>
      )}
      {confidence !== null && (
        <p className="mt-1 text-[10px] font-black text-[#93c5fd]">
          %{Math.round(confidence * 100)} {byLocale(locale, "emin", "confident", "уверен", "มั่นใจ", "de confianza", "置信")}
        </p>
      )}
    </div>
  );
}
