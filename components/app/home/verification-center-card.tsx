"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, Building2, Package, ReceiptText } from "lucide-react";
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

async function fetchFeed(): Promise<FeedResponse> {
  const response = await fetch("/api/verify/feed?limit=3", { credentials: "include" });
  if (!response.ok) return { tasks: [], quota: { daily: 20, used: 0, remaining: 20 }, openCount: 0 };
  return (await response.json()) as FeedResponse;
}

const TASK_ICON: Record<string, typeof Building2> = {
  merchant_name: Building2,
  product_canonical: Package,
  receipt_kind: ReceiptText,
  bill_amount: ReceiptText,
  provider_match: BadgeCheck,
};

const TASK_TONE: Record<string, string> = {
  merchant_name: "text-[#93c5fd] bg-[#3b82f6]/14",
  product_canonical: "text-[#f9a8d4] bg-[#ec4899]/14",
  receipt_kind: "text-[#86efac] bg-[#22c55e]/14",
  bill_amount: "text-[#fbbf24] bg-[#d97706]/14",
  provider_match: "text-[#c4b5fd] bg-[#8b5cf6]/14",
};

function localeLabel(
  locale: YumoLocale,
  labels: { tr: string; en: string; ru?: string; th?: string; es?: string; zh?: string },
): string {
  return labels[locale] || labels.en || labels.tr;
}

function formatPrompt(task: VerificationTask, locale: YumoLocale): string {
  if (task.taskType === "merchant_name") {
    return localeLabel(locale, {
      tr: `${task.candidateText} — doğru mu?`,
      en: `${task.candidateText} — is this correct?`,
      ru: `${task.candidateText} — это верно?`,
      th: `${task.candidateText} — ถูกต้องไหม?`,
      es: `${task.candidateText} — ¿es correcto?`,
      zh: `${task.candidateText}——正确吗？`,
    });
  }
  if (task.taskType === "product_canonical") {
    return localeLabel(locale, {
      tr: `"${task.candidateText}" doğru ürün adı mı?`,
      en: `Is "${task.candidateText}" the correct product?`,
      ru: `"${task.candidateText}" — правильное название товара?`,
      th: `"${task.candidateText}" คือชื่อสินค้าที่ถูกต้องไหม?`,
      es: `¿"${task.candidateText}" es el producto correcto?`,
      zh: `"${task.candidateText}" 是正确的商品名称吗？`,
    });
  }
  if (task.taskType === "receipt_kind") {
    return localeLabel(locale, {
      tr: "Bu fatura mı, market alışverişi mi?",
      en: "Is this a bill or grocery purchase?",
      ru: "Это счет или покупка в магазине?",
      th: "นี่คือบิลหรือเป็นการซื้อของในร้าน?",
      es: "¿Es una factura o una compra de supermercado?",
      zh: "这是账单还是超市购物？",
    });
  }
  if (task.taskType === "bill_amount") {
    return localeLabel(locale, {
      tr: `Fatura tutarı ${task.candidateText} mi?`,
      en: `Is the bill amount ${task.candidateText}?`,
      ru: `Сумма счета ${task.candidateText}?`,
      th: `ยอดบิลคือ ${task.candidateText} ใช่ไหม?`,
      es: `¿El monto de la factura es ${task.candidateText}?`,
      zh: `账单金额是 ${task.candidateText} 吗？`,
    });
  }
  if (task.taskType === "provider_match") {
    return localeLabel(locale, {
      tr: `Bu fatura ${task.candidateText} sağlayıcına mı ait?`,
      en: `Does this bill belong to ${task.candidateText}?`,
      ru: `Этот счет относится к провайдеру ${task.candidateText}?`,
      th: `บิลนี้เป็นของผู้ให้บริการ ${task.candidateText} ใช่ไหม?`,
      es: `¿Esta factura corresponde a ${task.candidateText}?`,
      zh: `这张账单属于 ${task.candidateText} 服务商吗？`,
    });
  }
  return task.candidateText;
}

function formatSubtitle(task: VerificationTask, locale: YumoLocale): string {
  const labels: Record<string, { tr: string; en: string; ru?: string; th?: string; es?: string; zh?: string }> = {
    merchant_name: { tr: "İşletme", en: "Merchant", ru: "Магазин", th: "ร้านค้า", es: "Comercio", zh: "商家" },
    product_canonical: { tr: "Ürün", en: "Product", ru: "Товар", th: "สินค้า", es: "Producto", zh: "商品" },
    receipt_kind: { tr: "Tür", en: "Kind", ru: "Тип", th: "ประเภท", es: "Tipo", zh: "类型" },
    bill_amount: { tr: "Tutar", en: "Amount", ru: "Сумма", th: "จำนวนเงิน", es: "Monto", zh: "金额" },
    provider_match: { tr: "Sağlayıcı", en: "Provider", ru: "Провайдер", th: "ผู้ให้บริการ", es: "Proveedor", zh: "服务商" },
  };
  const seconds = task.taskType === "merchant_name" ? 12 : task.taskType === "product_canonical" ? 8 : 6;
  const label = labels[task.taskType];
  const labelText = label ? localeLabel(locale, label) : "";
  const unit = localeLabel(locale, { tr: "sn", en: "sec", ru: "сек", th: "วิ", es: "s", zh: "秒" });
  return `${labelText} · ${seconds} ${unit}`;
}

export function VerificationCenterCard({ locale }: { locale: YumoLocale }) {
  const copy = DASHBOARD_COPY[locale];

  const { data } = useQuery({
    queryKey: ["verify-feed-preview"],
    queryFn: fetchFeed,
    staleTime: 30_000,
  });

  const tasks = data?.tasks ?? [];
  const openCount = data?.openCount ?? 0;
  const remaining = data?.quota.remaining ?? 20;

  return (
    <section className="rounded-[28px] border border-white/[0.06] bg-[#151720]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/38">
            {copy.verifyEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-white">
            {copy.verifyTitle}
          </h2>
        </div>
        {openCount > 0 && (
          <span className="rounded-full bg-[#fcd34d]/14 px-3 py-1 text-[11px] font-black text-[#fcd34d]">
            {openCount} {copy.verifyPending}
          </span>
        )}
      </div>

      <p className="mt-2 text-[12px] font-semibold leading-5 text-white/55">
        {copy.verifyBody}
      </p>

      {tasks.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {tasks.map((task) => {
            const Icon = TASK_ICON[task.taskType] ?? BadgeCheck;
            const tone = TASK_TONE[task.taskType] ?? TASK_TONE.merchant_name;
            return (
              <Link
                key={task.id}
                href={`/app/verify?focus=${task.id}`}
                className="flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-3 transition hover:bg-white/[0.07]"
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[10px] ${tone}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-black text-white">
                    {formatPrompt(task, locale)}
                  </p>
                  <p className="mt-0.5 truncate text-[10.5px] font-bold text-white/45">
                    {formatSubtitle(task, locale)}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] font-black text-[#86efac]">
                  +{task.rewardContribution}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-sm font-black text-white">{copy.verifyEmptyTitle}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/52">
            {copy.verifyEmptyBody}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-white/45">
            {copy.verifyQuotaUsed}: {data?.quota.used ?? 0}/{data?.quota.daily ?? 20}
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full bg-gradient-to-r from-[#ffb347] to-[#fcd34d]"
              style={{
                width: `${Math.min(100, ((data?.quota.used ?? 0) / Math.max(1, data?.quota.daily ?? 20)) * 100)}%`,
              }}
            />
          </div>
        </div>
        {tasks.length > 0 && (
          <Link
            href="/app/verify"
            className="inline-flex items-center gap-1 text-[11px] font-black text-[#ffb347]"
          >
            {copy.verifyMore}
            <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
          </Link>
        )}
      </div>
    </section>
  );
}
