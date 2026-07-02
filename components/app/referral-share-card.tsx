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
        setError(data.error || l("Bağlantı alınamadı", "Failed to fetch link", "Не удалось получить ссылку", "ไม่สามารถดึงลิงก์ได้", "No se pudo obtener el enlace", "获取链接失败"));
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: l("Yumo'ya katıl!", "Join Yumo!", "Присоединяйся к Yumo!", "มาร่วมกับ Yumo!", "¡Únete a Yumo!", "加入 Yumo！"),
          text: l(
            "Yumo'ya davet linkimle katıl ve birlikte kazan!",
            "Join Yumo with my referral link and earn together!",
            "Присоединяйся к Yumo по моей ссылке и зарабатывай вместе со мной!",
            "เข้าร่วม Yumo ด้วยลิงก์แนะนำของฉัน แล้วมาเก็บรางวัลไปด้วยกัน!",
            "Únete a Yumo con mi enlace y ganemos juntos.",
            "通过我的邀请链接加入 Yumo，一起赚奖励！",
          ),
          url: link,
        });
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
          ? "Arkadaşlarını davet et, onların fiş kazanımlarından 30 gün boyunca %5 bonus kazan."
          : "Invite friends and earn 5% bonus from their receipt rewards for 30 days."}
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
