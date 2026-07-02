"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_COPY,
  type YumoLocale,
} from "@/lib/product-architecture/dashboard-contract";
import {
  SERVICE_CATEGORY_ORDER,
  categoryLabel,
} from "@/lib/service-providers/categories";

type AddServiceProviderInput = {
  category: string;
  name: string;
  paymentDay: number;
  reminderDaysBefore: number[];
  reminderSameDay: boolean;
};

const DAY_BUTTONS = Array.from({ length: 31 }, (_, i) => i + 1);

export function AddServiceProviderModal({
  open,
  locale,
  onClose,
  onSubmit,
  submitting,
}: {
  open: boolean;
  locale: YumoLocale;
  onClose: () => void;
  onSubmit: (input: AddServiceProviderInput) => void;
  submitting: boolean;
}) {
  const copy = DASHBOARD_COPY[locale];
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };
  const [category, setCategory] = useState<string>("internet");
  const [name, setName] = useState("");
  const [paymentDay, setPaymentDay] = useState<number>(15);
  const [remind3, setRemind3] = useState(true);
  const [remind1, setRemind1] = useState(true);
  const [remindSameDay, setRemindSameDay] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = name.trim().length >= 1 && name.trim().length <= 80 && paymentDay >= 1 && paymentDay <= 31;

  const handleSubmit = () => {
    if (!valid) return;
    const reminderDaysBefore: number[] = [];
    if (remind3) reminderDaysBefore.push(3);
    if (remind1) reminderDaysBefore.push(1);
    onSubmit({
      category,
      name: name.trim(),
      paymentDay,
      reminderDaysBefore,
      reminderSameDay: remindSameDay,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md sm:items-center">
      <div className="relative max-h-[92vh] w-full max-w-[420px] overflow-y-auto rounded-t-[32px] border border-white/10 bg-[#08090f] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.5)] sm:rounded-[32px]">
        <div className="flex items-center justify-between pb-3">
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.07] text-white"
            aria-label={byLocale("Kapat", "Close", "Закрыть", "ปิด", "Cerrar", "关闭")}
          >
            <X className="h-4 w-4" strokeWidth={2.2} />
          </button>
          <p className="text-sm font-black text-white">{copy.servicesAddTitle}</p>
          <div className="w-9" />
        </div>

        <section className="mt-2">
          <p className="px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
            {copy.servicesStepCategory}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SERVICE_CATEGORY_ORDER.map((cat) => {
              const selected = cat === category;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-bold transition",
                    selected
                      ? "border-[#ff7a1a] bg-[#ff7a1a] text-[#170b05]"
                      : "border-white/8 bg-white/[0.06] text-white/72 hover:bg-white/[0.10]"
                  )}
                >
                  {selected && <Check className="-ml-0.5 mr-1 inline-block h-3 w-3" strokeWidth={3} />}
                  {categoryLabel(cat, locale)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-4 rounded-[22px] border border-white/8 bg-[#151720] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
            {copy.servicesStepName}
          </p>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder={byLocale("örn. Türk Telekom", "e.g. Verizon", "например, МТС", "เช่น AIS", "p. ej. Vodafone", "例如：中国联通")}
            className="mt-2 w-full rounded-[14px] border border-[#ff7a1a]/30 bg-white/[0.05] px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-[#ff7a1a]"
          />
          <p className="mt-2 text-[10px] font-semibold leading-relaxed text-white/45">
            {copy.servicesStepNameHint}
          </p>
        </section>

        <section className="mt-3 rounded-[22px] border border-white/8 bg-[#151720] p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
              {copy.servicesStepDay}
            </p>
            <p className="text-[12px] font-black text-white">
              {copy.servicesPaymentDayLabel}{" "}
              <span className="text-[#ffb347]">{paymentDay}</span>
            </p>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {DAY_BUTTONS.map((day) => {
              const selected = day === paymentDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setPaymentDay(day)}
                  className={cn(
                    "aspect-square rounded-[8px] text-[10.5px] font-bold transition",
                    selected
                      ? "bg-gradient-to-br from-[#ff7a1a] to-[#ec4899] text-white shadow-[0_6px_14px_rgba(255,122,26,0.32)]"
                      : day > 28
                        ? "bg-white/[0.04] text-white/45 hover:bg-white/[0.07]"
                        : "bg-white/[0.05] text-white/68 hover:bg-white/[0.08]"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-3 rounded-[22px] border border-white/8 bg-[#151720] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
            {copy.servicesStepReminder}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <ReminderRow
              label={copy.servicesReminder3}
              checked={remind3}
              onToggle={() => setRemind3((v) => !v)}
              accent
            />
            <ReminderRow
              label={copy.servicesReminder1}
              checked={remind1}
              onToggle={() => setRemind1((v) => !v)}
              accent
            />
            <ReminderRow
              label={copy.servicesReminderSameDay}
              checked={remindSameDay}
              onToggle={() => setRemindSameDay((v) => !v)}
            />
          </div>
        </section>

        <button
          type="button"
          disabled={!valid || submitting}
          onClick={handleSubmit}
          className={cn(
            "mt-4 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-black transition",
            valid && !submitting
              ? "bg-gradient-to-r from-[#ff7a1a] to-[#ec4899] text-white shadow-[0_16px_36px_rgba(255,122,26,0.36)] active:scale-[0.99]"
              : "cursor-not-allowed bg-white/[0.08] text-white/40"
          )}
        >
          {submitting ? byLocale("Kaydediliyor...", "Saving...", "Сохранение...", "กำลังบันทึก...", "Guardando...", "保存中...") : copy.servicesSubmit}
        </button>
      </div>
    </div>
  );
}

function ReminderRow({
  label,
  checked,
  onToggle,
  accent = false,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-center justify-between rounded-[14px] border px-3 py-2.5 text-left transition",
        checked
          ? accent
            ? "border-[#ff7a1a]/30 bg-[#ff7a1a]/8"
            : "border-white/12 bg-white/[0.07]"
          : "border-white/8 bg-white/[0.04]"
      )}
    >
      <span className={cn("text-xs font-bold", checked ? "text-white" : "text-white/65")}>
        {label}
      </span>
      <span
        className={cn(
          "flex h-5 w-9 items-center rounded-full p-0.5 transition",
          checked ? "bg-[#ff7a1a]" : "bg-white/12"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}
