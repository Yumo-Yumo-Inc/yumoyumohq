"use client";

import { useEffect, useState } from "react";
import { beginDemoTour } from "@/lib/demo/tour-context";
import { useAppLocale } from "@/lib/i18n/app-context";

export default function DemoTourEntryPage() {
  const { locale } = useAppLocale();
  const tr = locale === "tr";
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      beginDemoTour();
      const res = await fetch("/api/demo/preview", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enter" }),
      }).catch(() => null);
      if (cancelled) return;
      if (!res || res.status === 401) {
        window.location.replace("/app/login");
        return;
      }
      if (!res.ok) {
        setFailed(true);
        return;
      }
      window.location.replace("/app/dashboard");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#07080c] px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(520px 280px at 50% 38%, rgba(201,168,76,0.16), transparent 62%)",
        }}
      />
      <div className="relative w-full max-w-[340px] text-center">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "var(--app-gold, #C9A84C)" }}
        >
          {tr ? "Örnek hesap" : "Sample account"}
        </p>
        <h1 className="mt-3 text-[28px] font-black tracking-tight text-white">
          {failed
            ? tr
              ? "Rehber açılamadı"
              : "Tour could not open"
            : tr
              ? "Rehber açılıyor"
              : "Opening the tour"}
        </h1>
        <p className="mt-2 text-[14px] font-medium leading-snug text-white/62">
          {failed
            ? tr
              ? "Oturum açıkken bu sayfayı yenile."
              : "Refresh this page while signed in."
            : tr
              ? "Dolu bir hesap. Bir fişin neleri mümkün kıldığını göstereceğim."
              : "A full account. See what a single receipt makes possible."}
        </p>
      </div>
    </div>
  );
}
