"use client";

/**
 * SubscriptionPanel — currently a "Coming Soon" placeholder.
 *
 * The previous implementation collected manual subscription entries inline
 * (merchant name + amount + cadence form), which conflicts with the new
 * Personal Finance OS direction: the insights section must be a management
 * surface, not a data-entry form.
 *
 * The future flow will live on a dedicated route (`/app/subscriptions/new`)
 * and walks the user through:
 *   1. Subscription type        (electricity, water, gas, mobile, streaming, …)
 *   2. Service provider         (picked from a seeded TR catalog)
 *   3. First bill upload        (hits the existing receipt OCR pipeline)
 *
 * Because (a) there is no `subscription_types` / `subscription_providers`
 * catalog yet, (b) the `subscriptions` table is not finalized for the new
 * model, and (c) the feature will ship TR-only behind a Beta flag, the
 * insights panel intentionally renders a stub for now. Do NOT reintroduce
 * manual add inputs here; they belong on the dedicated entry route.
 */

import { Construction, Repeat } from "lucide-react";
import { ThemeCard } from "@/components/app/theme-card";
import { useAppLocale } from "@/lib/i18n/app-context";

interface SubscriptionPanelProps {
  accountLevel?: number;
}

export function SubscriptionPanel({ accountLevel = 1 }: SubscriptionPanelProps) {
  const { locale } = useAppLocale();
  const l = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };

  const bullets = [
    l(
      "Abonelik tipi ve hizmet sağlayıcıyı listeden seçin",
      "Pick a subscription type and provider from a curated list",
      "Выберите тип подписки и поставщика из списка",
      "เลือกประเภทการสมัครและผู้ให้บริการจากรายการ",
      "Elige tipo de suscripción y proveedor desde una lista",
      "从列表中选择订阅类型和服务商",
    ),
    l(
      "İlk faturanızı yükleyin — sistem dönemi otomatik öğrenir",
      "Upload your first bill — the system learns the cadence",
      "Загрузите первый счёт — система сама определит периодичность",
      "อัปโหลดบิลแรก — ระบบจะเรียนรู้รอบบิลเอง",
      "Sube tu primera factura — el sistema aprende la cadencia",
      "上传第一张账单——系统会自动学习周期",
    ),
    l(
      "Değişken faturalar (elektrik, su, doğalgaz) için sapma uyarısı",
      "Variance alerts for variable bills (electricity, water, gas)",
      "Уведомления об отклонениях по переменным счетам (свет, вода, газ)",
      "แจ้งเตือนความเบี่ยงเบนสำหรับบิลผันแปร (ไฟ น้ำ แก๊ส)",
      "Alertas de variación para facturas variables (luz, agua, gas)",
      "对水电燃气等浮动账单提供异常提醒",
    ),
    l(
      "İptal senaryosu + yıllık tasarruf projeksiyonu",
      "Cancel-scenario simulation with annual savings projection",
      "Сценарий отмены и прогноз годовой экономии",
      "จำลองสถานการณ์ยกเลิกพร้อมประมาณการเงินที่ประหยัดต่อปี",
      "Simulación de cancelación con proyección de ahorro anual",
      "取消场景模拟与年度节省预测",
    ),
  ];

  return (
    <ThemeCard accountLevel={accountLevel} className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4" style={{ color: "var(--app-primary)" }} />
          <h3
            className="text-sm font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--app-text-secondary)" }}
          >
            {l("Abonelik radarı", "Subscription radar", "Радар подписок", "เรดาร์การสมัครสมาชิก", "Radar de suscripciones", "订阅雷达")}
          </h3>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{
            background: "rgba(214,183,91,0.12)",
            color: "var(--app-primary)",
            border: "1px solid var(--app-primary)",
          }}
        >
          {l("Yakında · Beta TR", "Coming soon · TR Beta", "Скоро · Бета TR", "เร็วๆ นี้ · TR Beta", "Pronto · Beta TR", "即将推出 · TR Beta")}
        </span>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4 py-6 text-center">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            background: "rgba(214,183,91,0.08)",
            color: "var(--app-primary)",
            border: "1px solid var(--app-border)",
          }}
        >
          <Construction className="h-6 w-6" />
        </div>
        <div className="max-w-md space-y-2">
          <p className="text-sm font-semibold" style={{ color: "var(--app-text-primary)" }}>
            {l(
              "Abonelik yönetimi yeniden tasarlanıyor",
              "Subscription management is being redesigned",
              "Управление подписками переосмысливается",
              "การจัดการการสมัครสมาชิกกำลังถูกออกแบบใหม่",
              "La gestión de suscripciones se está rediseñando",
              "订阅管理正在重新设计",
            )}
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
            {l(
              "Abonelikler artık burada manuel olarak eklenmeyecek. Yakında ayrı bir akış: tip → sağlayıcı → ilk fatura. Değişken tutarlı faturalar (su, elektrik, doğalgaz) için sapma takibi dahil. Şimdilik sadece Türkiye'de Beta olarak açılacak.",
              "Subscriptions will no longer be added manually here. Coming soon as a dedicated flow: type → provider → first bill. Includes variance tracking for variable bills (water, electricity, gas). Launching Beta in Türkiye first.",
              "Подписки больше не будут добавляться вручную здесь. Скоро появится отдельный поток: тип → поставщик → первый счёт. Включает контроль отклонений по переменным счетам (вода, электричество, газ). Сначала запустится в Бете в Турции.",
              "การสมัครสมาชิกจะไม่ถูกเพิ่มด้วยตนเองที่นี่อีกต่อไป เร็วๆ นี้จะมีโฟลว์เฉพาะ: ประเภท → ผู้ให้บริการ → บิลแรก รวมการติดตามความเบี่ยงเบนของบิลผันแปร (น้ำ ไฟ แก๊ส) เปิด Beta ในตุรกีก่อน",
              "Las suscripciones ya no se agregarán manualmente aquí. Pronto: flujo dedicado tipo → proveedor → primera factura. Incluye seguimiento de variación para facturas variables (agua, luz, gas). Primero como Beta en Türkiye.",
              "订阅将不再通过此面板手动添加。即将推出独立流程：类型 → 服务商 → 首张账单。包含水电燃气等浮动账单的差异跟踪。先在土耳其以 Beta 形式上线。",
            )}
          </p>
        </div>
      </div>

      <ul
        className="mt-2 space-y-1.5 rounded-xl border px-4 py-3 text-xs"
        style={{ borderColor: "var(--app-border)", color: "var(--app-text-secondary)" }}
      >
        {bullets.map((text) => (
          <li key={text} className="flex items-start gap-2">
            <span
              className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ background: "var(--app-primary)" }}
            />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </ThemeCard>
  );
}
