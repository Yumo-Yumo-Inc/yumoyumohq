"use client";

import { useCallback, useEffect, useState } from "react";
import { Share2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/lib/i18n/app-context";

/**
 * Compact invite prompt shown on the receipt result screen. Turns every verified
 * receipt into an invite moment (karar 2026-07-15): the campaign line plus a
 * one-tap share of the user's short referral link.
 */
export function ReferralInviteCta() {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) =>
    locale === "tr" ? tr : locale === "ru" ? ru : locale === "th" ? th : locale === "es" ? es : locale === "zh" ? zh : en;
  const [link, setLink] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/referral/link");
      const data = await res.json();
      if (res.ok && data.link) setLink(data.link);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async () => {
    if (!link) return;
    // URL only — no title/text. Share targets that merge the fields would
    // otherwise glue the copy onto the link and break the ref code.
    if (navigator.share) {
      try {
        await navigator.share({ url: link });
        return;
      } catch {
        /* cancelled → fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(link);
      toast.success(l("Davet linki kopyalandı!", "Invite link copied!", "Ссылка скопирована!", "คัดลอกลิงก์แล้ว!", "¡Enlace copiado!", "已复制邀请链接！"));
    } catch {
      toast.error(l("Kopyalanamadı", "Could not copy", "Не удалось", "คัดลอกไม่สำเร็จ", "No se pudo", "复制失败"));
    }
  };

  if (!link) return null;

  return (
    <div
      className="mt-4 flex items-center gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--app-gold-border)", backgroundColor: "var(--app-gold-glow)" }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ border: "1px solid var(--app-gold-border)" }}
      >
        <Users className="h-4 w-4" style={{ color: "var(--app-gold-light)" }} />
      </span>
      <p className="min-w-0 flex-1 text-xs leading-4" style={{ color: "var(--app-text-secondary)" }}>
        {l(
          "Bir arkadaşınla fiyat hafızası kur. İlk fişini doğrulattığında ikiniz de bonus kazanırsınız.",
          "Build price memory with a friend. You both unlock a bonus after their first verified receipt.",
          "Строй память о ценах с другом. Вы оба получите бонус после его первого чека.",
          "สร้างความทรงจำราคากับเพื่อน ทั้งคู่ได้โบนัสเมื่อยืนยันใบเสร็จแรก",
          "Crea memoria de precios con un amigo. Ambos ganan un bono tras su primer recibo.",
          "和朋友一起建立价格记忆。好友验证首张小票后你们都能获奖励。",
        )}
      </p>
      <Button size="sm" variant="outline" className="shrink-0 border-[var(--app-gold-border)]" onClick={invite}>
        <Share2 className="mr-1 h-3.5 w-3.5" />
        {l("Davet et", "Invite", "Пригласить", "ชวน", "Invitar", "邀请")}
      </Button>
    </div>
  );
}
