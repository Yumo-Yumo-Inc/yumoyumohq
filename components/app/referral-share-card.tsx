"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/lib/i18n/app-context";

export function ReferralShareCard({ accountLevel }: { accountLevel: number }) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLink = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/referral/link");
      const data = await res.json();
      if (!res.ok) {
        setError(l("Bağlantı alınamadı", "Failed to fetch link", "Не удалось получить ссылку", "ไม่สามารถดึงลิงก์ได้", "No se pudo obtener el enlace", "获取链接失败"));
        return;
      }
      setLink(data.link);
    } catch {
      setError(l("Bağlantı alınamadı", "Could not fetch link", "Не удалось получить ссылку", "ไม่สามารถดึงลิงก์ได้", "No se pudo obtener el enlace", "无法获取链接"));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  const copyToClipboard = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success(l("Link kopyalandı!", "Link copied!", "Ссылка скопирована!", "คัดลอกลิงก์แล้ว!", "¡Enlace copiado!", "链接已复制！"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(l("Kopyalanamadı", "Could not copy", "Не удалось скопировать", "คัดลอกไม่สำเร็จ", "No se pudo copiar", "复制失败"));
    }
  };

  const share = async () => {
    if (!link) return;
    // URL only — no title/text. Share targets that merge the fields would
    // otherwise glue the copy onto the link and break the ref code.
    if (navigator.share) {
      try {
        await navigator.share({ url: link });
      } catch { /* user cancelled */ }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
          {l("Davet Linki", "Referral Link", "Реферальная ссылка", "ลิงก์แนะนำ", "Enlace de referido", "邀请链接")}
        </h3>
      </div>
      <p className="text-xs leading-5" style={{ color: "var(--app-text-secondary)" }}>
        {locale === "tr"
          ? "Bir arkadaşınla fiyat hafızası kur. Arkadaşın ilk fişini doğrulattığında ikiniz de bonus kazanırsınız."
          : "Build price memory with a friend. You both unlock a contribution bonus after their first verified receipt."}
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--app-text-muted)" }}>
          <Loader2 className="h-3 w-3 animate-spin" />
          {l("Yükleniyor...", "Loading...", "Загрузка...", "กำลังโหลด...", "Cargando...", "加载中...")}
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: "var(--app-error, #ef4444)" }}>{error}</p>
      )}

      {link && !loading && (
        <div className="flex gap-2">
          <div
            className="flex-1 truncate rounded-xl border px-3 py-2 text-xs"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-bg-elevated)",
              color: "var(--app-text-primary)",
            }}
          >
            {link}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-[var(--app-border)] bg-[var(--app-bg-elevated)]"
            onClick={copyToClipboard}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-[var(--app-border)] bg-[var(--app-bg-elevated)]"
            onClick={share}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
