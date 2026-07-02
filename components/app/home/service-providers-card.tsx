"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_COPY,
  type YumoLocale,
} from "@/lib/product-architecture/dashboard-contract";
import {
  SERVICE_CATEGORY_COLOR,
  SERVICE_CATEGORY_ORDER,
  categoryLabel,
} from "@/lib/service-providers/categories";
import { categoryIcon } from "@/lib/service-providers/icons";
import type { ServiceProvider } from "@/lib/service-providers/server";
import { AddServiceProviderModal } from "./add-service-provider-modal";

type Provider = ServiceProvider;

type UpcomingPayment = {
  providerId: number;
  category: string;
  name: string;
  paymentDay: number;
  daysUntil: number;
  dueDate: string;
  expectedAmount: number | null;
};

const TODAY_LABEL: Record<YumoLocale, string> = {
  tr: "Bugün",
  en: "Today",
  ru: "Сегодня",
  th: "วันนี้",
  es: "Hoy",
  zh: "今天",
};

const MONTHLY_DAY_PREFIX: Record<YumoLocale, string> = {
  tr: " Her ayın ",
  en: " Day ",
  ru: " День ",
  th: " วันที่ ",
  es: " Día ",
  zh: " 每月 ",
};

const MONTHLY_DAY_SUFFIX: Record<YumoLocale, string> = {
  tr: "'i",
  en: "",
  ru: "",
  th: "",
  es: "",
  zh: " 日",
};

async function fetchProviders(): Promise<Provider[]> {
  const response = await fetch("/api/service-providers", { credentials: "include" });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.providers) ? (data.providers as Provider[]) : [];
}

async function fetchUpcoming(): Promise<UpcomingPayment[]> {
  const response = await fetch("/api/service-providers/upcoming?within=30", { credentials: "include" });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.upcoming) ? (data.upcoming as UpcomingPayment[]) : [];
}

export function ServiceProvidersCard({ locale }: { locale: YumoLocale }) {
  const copy = DASHBOARD_COPY[locale];
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: providers = [] } = useQuery({
    queryKey: ["service-providers"],
    queryFn: fetchProviders,
    staleTime: 60_000,
  });

  const { data: upcoming = [] } = useQuery({
    queryKey: ["service-providers-upcoming"],
    queryFn: fetchUpcoming,
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (input: {
      category: string;
      name: string;
      paymentDay: number;
      reminderDaysBefore: number[];
      reminderSameDay: boolean;
    }) => {
      const response = await fetch("/api/service-providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("create_failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-providers"] });
      queryClient.invalidateQueries({ queryKey: ["service-providers-upcoming"] });
      setModalOpen(false);
    },
  });

  const upcomingByProvider = new Map(upcoming.map((u) => [u.providerId, u]));

  return (
    <section className="rounded-[28px] border border-white/[0.06] bg-[#151720]/80 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/38">
            {copy.servicesEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black tracking-[-0.02em] text-white">
            {copy.servicesTitle}
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1 rounded-full bg-[#ff7a1a] px-3 py-1.5 text-[11px] font-black text-[#170b05] transition hover:bg-[#ff9f43] active:scale-[0.98]"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
          {copy.servicesAdd}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SERVICE_CATEGORY_ORDER.map((category) => (
          <span
            key={category}
            className="rounded-full border border-white/8 bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold text-white/70"
          >
            {categoryLabel(category, locale)}
          </span>
        ))}
      </div>

      {providers.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2">
          {providers.slice(0, 5).map((provider) => {
            const due = upcomingByProvider.get(provider.id);
            const colorClass = SERVICE_CATEGORY_COLOR[provider.category] ?? SERVICE_CATEGORY_COLOR.other;
            const days = due?.daysUntil;
            const dayLabel =
              typeof days === "number"
                ? days <= 0
                  ? TODAY_LABEL[locale]
                  : `${days} ${copy.servicesDayCounter}`
                : "—";
            const isUrgent = typeof days === "number" && days <= 3;
            const Icon = categoryIcon(provider.category);

            return (
              <div
                key={provider.id}
                className="flex items-center gap-3 rounded-[16px] bg-white/[0.04] p-3"
              >
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-[10px]", colorClass)}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-white">{provider.name}</p>
                  <p className="mt-0.5 truncate text-[11px] font-bold text-white/50">
                    {categoryLabel(provider.category, locale)} ·
                    {MONTHLY_DAY_PREFIX[locale]} {provider.paymentDay}
                    {MONTHLY_DAY_SUFFIX[locale]}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-[11px] font-black tabular-nums",
                    isUrgent ? "text-[#fde047]" : "text-white/55"
                  )}
                >
                  {dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
          <p className="text-sm font-black text-white">{copy.servicesEmptyTitle}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-white/52">
            {copy.servicesEmptyBody}
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2 rounded-[14px] border border-[#ff7a1a]/24 bg-[#ff7a1a]/8 p-2.5">
        <Bell className="h-3.5 w-3.5 shrink-0 text-[#ffb347]" strokeWidth={2.2} />
        <span className="text-[10.5px] font-bold leading-tight text-[#ffb347]">
          {copy.servicesReminderHint}
        </span>
      </div>

      <AddServiceProviderModal
        open={modalOpen}
        locale={locale}
        onClose={() => setModalOpen(false)}
        onSubmit={(input) => createMutation.mutate(input)}
        submitting={createMutation.isPending}
      />
    </section>
  );
}
