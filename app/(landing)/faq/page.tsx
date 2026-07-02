"use client"

import React from "react";
import { useLocale } from "@/lib/i18n/context";

export default function FaqPage() {
  const { locale } = useLocale();

  const faqContent: Record<string, any> = {
    en: {
      title: "FAQ",
      subtitle: "Frequently asked questions about Yumo Yumo and how it works.",
      items: [
        {
          q: "What's Yumo Yumo all about?",
          a: "Yumo Yumo is a personal financial operating system built around Proof of Expense. It turns receipts, routines, bills, and price memory into clearer guidance and contribution history.",
        },
        {
          q: "How does it actually work?",
          a: "Upload or scan a receipt, and our system extracts totals, products, merchant context, and hidden-cost signals. Validated activity can update your price memory and may generate non-transferable in-app contribution records subject to eligibility and product rules.",
        },
        {
          q: "What are \"hidden costs\"?",
          a: "Hidden costs are the price components not directly visible to shoppers (brand premium, retail margins, import costs). We estimate these to create an awareness metric.",
        },
        {
          q: "Is this financial advice?",
          a: "No. Yumo Yumo provides insights and rewards for awareness — not investment or financial advice. Use the information responsibly.",
        },
        {
          q: "How do I earn rewards?",
          a: "By contributing eligible activity such as valid receipts and other product-defined contribution events. Any resulting in-app records follow published rules, caps, trust checks, and eligibility requirements.",
        },
        {
          q: "What's the INT token?",
          a: "INT is planned as a utility token for platform and community features. Any claim, transfer, or distribution will require separate eligibility checks, updated terms, and legal review before it is enabled.",
        },
        {
          q: "Will I get rich quick?",
          a: "No guarantees. Rewards are designed for engagement and fairness; they're not a guaranteed income source.",
        },
        {
          q: "How do you keep things fair and sustainable?",
          a: "We apply deterministic rules, caps, and anti-duplicate gates to ensure fair reward distribution and long-term sustainability.",
        },
        {
          q: "What about my privacy?",
          a: "We treat receipt data as sensitive. Receipt images may be stored briefly for processing and integrity checks, then targeted for deletion; structured records are kept only as needed for product, compliance, and abuse-prevention purposes. We never expose personal payment details.",
        },
        {
          q: "Can anyone join?",
          a: "Yes — the platform is open. Some features may require account verification or eligibility checks depending on promotions.",
        },
        {
          q: "Are there airdrops or free tokens?",
          a: "No token claim, airdrop, or transfer is guaranteed. Any future distribution would be subject to eligibility, sanctions, jurisdiction, wallet, tax, and product requirements announced through official channels.",
        },
        {
          q: "When can I start using it?",
          a: "Sign up for the waitlist or follow the onboarding instructions on the site. Availability may vary by region and program phase.",
        },
        {
          q: "Why isn't there a marketing budget?",
          a: "Our early focus is on community-driven growth and fair distribution; budgets evolve as the project matures.",
        },
        {
          q: "Does the team keep a team allocation?",
          a: "There is no separate passive team allocation outside the published tokenomics map. If token rails are enabled, any team-linked token flow follows the same published contribution mechanisms and disclosures.",
        },
        {
          q: "Where can I learn more or ask questions?",
          a: "Check the whitepaper, our FAQ, and community channels (Twitter, Discord). Use the Support page to contact us.",
        },
      ]
    },
    tr: {
      title: "Yumo Yumo Hakkında Merak Edilenler",
      subtitle: "Sıkça sorulan sorular ve cevapları.",
      items: [
        {
          q: "Yumo Yumo tam olarak nedir?",
          a: "Yumo Yumo, Proof of Expense etrafında kurulu kişisel bir finansal işletim sistemidir. Fişleri, rutinleri, faturaları ve fiyat hafızasını daha net rehberliğe ve katkı geçmişine dönüştürür.",
        },
        {
          q: "Sistem nasıl çalışıyor?",
          a: "Fişinizi yükleyin veya taratın; sistem toplamı, ürünleri, mağaza bağlamını ve gizli maliyet sinyallerini çıkarır. Doğrulanan aktivite fiyat hafızanızı güncelleyebilir ve uygunluk ile ürün kurallarına bağlı olarak devredilemeyen uygulama içi katkı kayıtları oluşturabilir.",
        },
        {
          q: "\"Gizli maliyetler\" ne demek?",
          a: "Marka primi, perakende marjları ve ithalat masrafları gibi tüketicinin doğrudan görmediği fiyat bileşenleridir. Farkındalık yaratmak için bunları tahmin ediyoruz.",
        },
        {
          q: "Bu bir finansal tavsiye mi?",
          a: "Hayır. Yumo Yumo sadece içgörü ve farkındalık ödülü sağlar; yatırım tavsiyesi değildir.",
        },
        {
          q: "Nasıl ödül kazanırım?",
          a: "Geçerli fişler ve ürünün tanımladığı diğer uygun katkı aktiviteleriyle. Oluşan uygulama içi kayıtlar yayınlanmış kurallar, limitler, güven kontrolleri ve uygunluk şartlarına bağlıdır.",
        },
        {
          q: "INT Token nedir?",
          a: "INT, platform ve topluluk ozellikleri icin planlanan bir utility tokendir. Claim, transfer veya dagitim acilmadan once ayri uygunluk kontrolleri, guncel sartlar ve hukuki inceleme gerekir.",
        },
        {
          q: "Zengin olur muyum?",
          a: "Garanti yok. Ödüller gelir kaynağı değil, adil etkileşim içindir.",
        },
        {
          q: "Sürdürülebilirliği nasıl sağlıyorsunuz?",
          a: "Adil dağıtım için belirli kurallar, limitler ve mükerrer kayıt engelleri uyguluyoruz.",
        },
        {
          q: "Gizliliğim ne olacak?",
          a: "Fiş verileriniz hassastır. Fiş görselleri işleme ve bütünlük kontrolleri için kısa süre tutulabilir ve ardından silinmesi hedeflenir; yapılandırılmış kayıtlar ise ürün, uyum ve kötüye kullanım önleme ihtiyaçları kadar saklanır. Ödeme bilgilerinizi asla ifşa etmeyiz.",
        },
        {
          q: "Herkes katılabilir mi?",
          a: "Evet, platform herkese açık. Bazı özellikler doğrulama gerektirebilir.",
        },
        {
          q: "Airdrop olacak mı?",
          a: "Token claim, airdrop veya transfer garantisi yoktur. Gelecekteki herhangi bir dagitim; uygunluk, yaptirim, bolge, cuzdan, vergi ve urun sartlarina bagli olur.",
        },
        {
          q: "Ne zaman başlayabilirim?",
          a: "Bekleme listesine kaydolun veya onboarding talimatlarını izleyin.",
        },
        {
          q: "Neden pazarlama bütçeniz yok?",
          a: "Erken aşamada topluluk odaklı büyümeye odaklanıyoruz; bütçeler zamanla evrilir.",
        },
        {
          q: "Ekip için token ayrıldı mı?",
          a: "Yayınlanmış tokenomics haritasının dışında ayrı ve pasif bir ekip tahsisi yoktur. Token rayları açılırsa, ekiple ilişkili akışlar da aynı yayınlanmış katkı mekanizmalarına ve açıklamalara bağlı olur.",
        },
        {
          q: "Daha fazla bilgi?",
          a: "Teknik dökümanımıza ve topluluk kanallarımıza (Twitter, Discord) göz atın.",
        },
      ]
    },
    th: {
      title: "คำถามที่พบบ่อยเกี่ยวกับ Yumo Yumo",
      subtitle: "คำถามที่พบบ่อยและคำตอบ",
      items: [
        {
          q: "Yumo Yumo คืออะไร?",
          a: "เปลี่ยนใบเสร็จประจำวันของคุณให้เป็นรางวัล โดยการวิเคราะห์ต้นทุนแฝงผ่านประสบการณ์แบบเกม.",
        },
        {
          q: "มันทำงานอย่างไร?",
          a: "อัปโหลดหรือสแกนใบเสร็จ ระบบจะดึงยอดรวมและประมาณการต้นทุนแฝง ซึ่งจะถูกเปลี่ยนเป็นคะแนนรางวัลหรือโทเค็น.",
        },
        {
          q: "\"ต้นทุนแฝง\" คืออะไร?",
          a: "ส่วนประกอบของราคาที่ผู้ซื้อไม่เห็นโดยตรง เช่น ค่าพรีเมียมของแบรนด์, กำไรค้าปลีก และต้นทุนการนำเข้า.",
        },
        {
          q: "นี่คือคำแนะนำทางการเงินหรือไม่?",
          a: "ไม่ใช่ Yumo Yumo ให้ข้อมูลเชิงลึกและรางวัลสำหรับความรู้เท่าทันเท่านั้น ไม่ใช่การแนะนำการลงทุน.",
        },
        {
          q: "ฉันจะได้รับรางวัลได้อย่างไร?",
          a: "รับรางวัลจากการอัปโหลดใบเสร็จที่ถูกต้อง ระบบจะเปลี่ยนต้นทุนแฝงเป็นเครดิตรางวัลตามกฎที่กำหนด.",
        },
        {
          q: "INT token คืออะไร?",
          a: "คือโทเค็นของแพลตฟอร์มที่ใช้สำหรับรางวัลและฟีเจอร์ของชุมชน.",
        },
        {
          q: "ฉันจะรวยเร็วไหม?",
          a: "ไม่มีการรับประกัน รางวัลออกแบบมาเพื่อการมีส่วนร่วม ไม่ใช่แหล่งรายได้หลัก.",
        },
        {
          q: "ความเป็นส่วนตัวของฉันล่ะ?",
          a: "เราถือว่าข้อมูลใบเสร็จเป็นข้อมูลละเอียดอ่อน เราเก็บเฉพาะที่จำเป็นและไม่เปิดเผยรายละเอียดการชำระเงินส่วนบุคคล.",
        },
        {
          q: "เริ่มใช้ได้เมื่อไหร่?",
          a: "ลงชื่อในรายการรอ (waitlist) หรือทำตามขั้นตอนในเว็บไซต์.",
        },
        {
          q: "มี airdrop ไหม?",
          a: "อาจมีการส่งเสริมการขายเป็นครั้งคราว ติดตามช่องทางอย่างเป็นทางการ.",
        },
        {
          q: "ใครสามารถเข้าร่วมได้?",
          a: "ใช่ แพลตฟอร์มเปิดให้ทุกคน ฟีเจอร์บางอย่างอาจต้องมีการยืนยัน.",
        },
        {
          q: "ทำไมไม่มีงบการตลาด?",
          a: "ในระยะเริ่มต้น เรามุ่งเน้นการเติบโตที่ขับเคลื่อนโดยชุมชน งบประมาณจะพัฒนาตามโครงการ.",
        },
        {
          q: "ทีมมีส่วนแบ่งโทเค็นหรือไม่?",
          a: "การจัดสรรโทเค็นและนโยบายการ vesting ถูกเปิดเผยในเอกสาร tokenomics.",
        },
        {
          q: "หาข้อมูลเพิ่มเติมได้ที่ไหน?",
          a: "ดูเอกสารทางเทคนิคและช่องทางชุมชนของเรา (Twitter, Discord).",
        },
      ]
    },
    ru: {
      title: "FAQ по Yumo Yumo",
      subtitle: "Часто задаваемые вопросы и ответы.",
      items: [
        {
          q: "Что такое Yumo Yumo?",
          a: "Это превращение обычных чеков в награды путем анализа скрытых затрат через геймифицированный опыт.",
        },
        {
          q: "Как это работает?",
          a: "Загрузите чек, система извлечет суммы и оценит скрытые расходы, которые конвертируются в баллы или токены.",
        },
        {
          q: "Что такое «скрытые расходы»?",
          a: "Это наценки за бренд, розничная прибыль и импортные пошлины, которые не видит покупатель.",
        },
        {
          q: "Является ли это финансовым советом?",
          a: "Нет. Это инструмент для повышения осведомленности, а не руководство по инвестициям.",
        },
        {
          q: "Как заработать награды?",
          a: "Загружая валидные чеки. Скрытые расходы превращаются в кредиты согласно правилам системы.",
        },
        {
          q: "Что такое INT токен?",
          a: "Это токен платформы, используемый для наград и функций сообщества.",
        },
        {
          q: "Стану ли я богатым?",
          a: "Без гарантий. Награды созданы для вовлечения, а не как источник стабильного дохода.",
        },
        {
          q: "А что с приватностью?",
          a: "Данные чеков — это конфиденциально. Мы не храним личные платежные данные.",
        },
        {
          q: "Может ли кто-то присоединиться?",
          a: "Да, платформа открыта. Некоторые функции могут требовать верификации.",
        },
        {
          q: "Будут ли airdrop?",
          a: "Могут быть периодические промо-акции. Следите за официальными каналами.",
        },
        {
          q: "Когда я могу начать?",
          a: "Зарегистрируйтесь в списке ожидания или следуйте инструкциям на сайте.",
        },
        {
          q: "Почему нет маркетингового бюджета?",
          a: "На раннем этапе мы фокусируемся на росте сообщества; бюджеты развиваются по мере развития проекта.",
        },
        {
          q: "Есть ли выделение токенов для команды?",
          a: "Распределение токенов и политика вестинга раскрыты в документах по токеномике.",
        },
        {
          q: "Где узнать больше?",
          a: "Читайте Whitepaper и следите за нами в Twitter и Discord.",
        },
      ]
    },
    es: {
      title: "Preguntas Frecuentes sobre Yumo Yumo",
      subtitle: "Preguntas frecuentes y respuestas.",
      items: [
        {
          q: "¿De qué se trata Yumo Yumo?",
          a: "Es una experiencia gamificada que convierte tus recibos diarios en recompensas al analizar los \"costos ocultos\" que pagas sin darte cuenta.",
        },
        {
          q: "¿Cómo funciona?",
          a: "Escanea tu recibo y nuestro sistema extraerá los totales y estimará los costos ocultos; estos se convierten en puntos de recompensa o tokens.",
        },
        {
          q: "¿Qué son los \"costos ocultos\"?",
          a: "Son componentes del precio que no ves directamente, como el sobreprecio por marca, márgenes minoristas y costos de importación. Los estimamos para que seas consciente de lo que realmente pagas.",
        },
        {
          q: "¿Es esto asesoría financiera?",
          a: "No. Yumo Yumo ofrece información y recompensas por tu conciencia como consumidor, no es asesoría de inversión o financiera. Úsalo con responsabilidad.",
        },
        {
          q: "¿Cómo gano recompensas?",
          a: "Subiendo recibos válidos. El sistema convierte las estimaciones validadas en créditos de recompensa según las reglas establecidas.",
        },
        {
          q: "¿Qué es el token INT?",
          a: "Es el token de la plataforma utilizado para recompensas y funciones de la comunidad.",
        },
        {
          q: "¿Me haré rico rápido?",
          a: "No hay garantías. Las recompensas son para fomentar la participación; no son una fuente de ingresos garantizada.",
        },
        {
          q: "¿Cómo mantienen la equidad?",
          a: "Aplicamos reglas deterministas, límites y filtros anti-duplicados para asegurar una distribución justa y sostenible.",
        },
        {
          q: "¿Y mi privacidad?",
          a: "Tratamos los datos de los recibos como sensibles. Solo guardamos lo necesario y nunca exponemos detalles de pago personales.",
        },
        {
          q: "¿Cuándo puedo empezar?",
          a: "Regístrate en la lista de espera o sigue las instrucciones en el sitio.",
        },
        {
          q: "¿Hay airdrops o tokens gratis?",
          a: "Pueden ocurrir distribuciones o promociones ocasionales. Sigue los canales oficiales para anuncios.",
        },
        {
          q: "¿Puede unirse cualquiera?",
          a: "Sí, la plataforma está abierta. Algunas funciones pueden requerir verificación de cuenta.",
        },
        {
          q: "¿Por qué no hay presupuesto de marketing?",
          a: "Nuestro enfoque temprano está en el crecimiento impulsado por la comunidad; los presupuestos evolucionan a medida que el proyecto madura.",
        },
        {
          q: "¿El equipo mantiene una asignación?",
          a: "Las asignaciones de tokens y las políticas de vesting se divulgan en el whitepaper y los documentos de tokenomics.",
        },
        {
          q: "¿Dónde puedo aprender más o hacer preguntas?",
          a: "Consulta el whitepaper, nuestro FAQ y los canales de la comunidad (Twitter, Discord). Usa la página de Soporte para contactarnos.",
        },
      ]
    },
    zh: {
      title: "关于 Yumo Yumo 的常见问题",
      subtitle: "常见问题和答案。",
      items: [
        {
          q: "Yumo Yumo 是做什么的？",
          a: "Yumo Yumo 通过分析隐藏成本，将日常收据转化为奖励，为您提供游戏化的理财意识体验。",
        },
        {
          q: "它是如何运作的？",
          a: "您只需上传或扫描收据，我们的系统就会提取总额并估算隐藏成本；这些隐藏成本将根据规则转化为奖励积分或代币。",
        },
        {
          q: "什么是\"隐藏成本\"？",
          a: "隐藏成本是消费者无法直接看到的价值层级（如品牌溢价、零售利润、进口成本等）。我们估算这些数据是为了建立一种消费透明度指标。",
        },
        {
          q: "这是财务建议吗？",
          a: "不是。Yumo Yumo 仅提供洞察和意识奖励，不构成任何投资或财务建议。请负责任地使用这些信息。",
        },
        {
          q: "我该如何赚取奖励？",
          a: "通过上传有效的收据。平台会根据公布的规则，将验证后的隐藏成本估算值转换为奖励额度。",
        },
        {
          q: "什么是 INT 代币？",
          a: "INT 是用于奖励和社区功能的平台代币。详情请参阅我们的白皮书。",
        },
        {
          q: "我会快点变富吗？",
          a: "不保证。奖励旨在鼓励参与和公平，并非保证的收入来源。",
        },
        {
          q: "如何保持公平和可持续性？",
          a: "我们采用确定性规则、上限和防重复机制，以确保奖励分配的公平性和长期可持续性。",
        },
        {
          q: "关于我的隐私？",
          a: "我们将收据数据视为敏感信息。我们仅存储必要的信息，绝不会公开个人支付详情。",
        },
        {
          q: "我什么时候可以开始使用？",
          a: "请加入候补名单或按照网站上的操作指南进行操作。",
        },
        {
          q: "是否有空投或免费代币？",
          a: "可能会偶尔进行分发或促销活动。请关注官方渠道获取公告。",
        },
        {
          q: "任何人都可以加入吗？",
          a: "是的，平台是开放的。某些功能可能需要账户验证或资格检查，具体取决于促销活动。",
        },
        {
          q: "为什么没有营销预算？",
          a: "我们早期专注于社区驱动的增长和公平分配；预算会随着项目的成熟而发展。",
        },
        {
          q: "团队是否保留团队分配？",
          a: "代币分配和归属政策在白皮书和代币经济学文件中披露。",
        },
        {
          q: "在哪里可以了解更多信息或提问？",
          a: "查看白皮书、我们的常见问题解答和社区渠道（Twitter、Discord）。使用支持页面联系我们。",
        },
      ]
    }
  };

  const content = faqContent[locale] || faqContent.en;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-20">
        {/* Header Section */}
        <div className="text-center mb-12 md:mb-16">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-pink-500 to-orange-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-primary/20 via-pink-500/20 to-orange-500/20 backdrop-blur-sm border border-white/10 shadow-2xl transform hover:scale-110 transition-transform duration-300">
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-pink-500 to-orange-500 bg-clip-text text-transparent">
            {content.title}
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium">
            {content.subtitle}
          </p>
        </div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4 md:space-y-5">
          {content.items.map((item: any, idx: number) => (
            <details
              key={idx}
              className="group bg-white/5 backdrop-blur-xl rounded-3xl shadow-lg border border-white/10 hover:border-primary/50 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              <summary className="px-6 py-5 cursor-pointer font-bold text-white hover:text-primary transition-all duration-300 list-none flex items-center gap-3 group-open:bg-gradient-to-r group-open:from-primary/10 group-open:via-pink-500/10 group-open:to-orange-500/10">
                <span className="flex-1 text-lg md:text-xl">{item.q}</span>
                <span className="text-primary text-xl transform group-open:rotate-180 transition-transform duration-300">▼</span>
              </summary>
              <div className="px-6 pb-5 text-gray-300 leading-relaxed text-base md:text-lg border-t border-white/10 bg-gradient-to-br from-white/5 to-primary/5">
                <div className="pt-4">
                  <p className="flex-1">{item.a}</p>
                </div>
              </div>
            </details>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 md:mt-20 text-center">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-pink-500 to-orange-500 rounded-[40px] blur-xl opacity-20"></div>
            <div className="relative bg-white/5 backdrop-blur-xl rounded-[40px] p-8 md:p-12 border border-white/10 shadow-2xl">
              <p className="text-xl md:text-2xl font-bold text-white mb-3 bg-gradient-to-r from-primary via-pink-500 to-orange-500 bg-clip-text text-transparent">
                {locale === 'en' && 'Still have questions?'}
                {locale === 'tr' && 'Hala soruların var mı?'}
                {locale === 'th' && 'ยังมีคำถามอยู่ไหม?'}
                {locale === 'ru' && 'Еще есть вопросы?'}
                {locale === 'es' && '¿Todavía tienes preguntas?'}
                {locale === 'zh' && '还有问题吗？'}
                {!['en', 'tr', 'th', 'ru', 'es', 'zh'].includes(locale) && 'Still have questions?'}
              </p>
              <p className="text-gray-400 mb-8 text-lg">
                {locale === 'en' && 'Slide into our DMs or tweet us — we love chatting!'}
                {locale === 'tr' && 'Bize DM at veya tweet gönder — sohbet etmeyi çok seviyoruz!'}
                {locale === 'th' && 'ส่งข้อความหรือทวีตหาเรา — เราชอบคุยกัน!'}
                {locale === 'ru' && 'Напиши нам в DM или твитни — мы любим общаться!'}
                {locale === 'es' && '¡Escríbenos por DM o twitea — nos encanta charlar!'}
                {locale === 'zh' && '给我们发私信或推文 — 我们喜欢聊天！'}
                {!['en', 'tr', 'th', 'ru', 'es', 'zh'].includes(locale) && 'Slide into our DMs or tweet us — we love chatting!'}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href={`/vision/${locale || 'tr'}`}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-primary via-pink-500 to-primary text-white font-bold text-lg hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:rotate-1"
                >
                  {locale === 'en' && 'Read Whitepaper'}
                  {locale === 'tr' && 'Whitepaper Oku'}
                  {locale === 'th' && 'อ่าน Whitepaper'}
                  {locale === 'ru' && 'Читать Whitepaper'}
                  {locale === 'es' && 'Leer Whitepaper'}
                  {locale === 'zh' && '阅读白皮书'}
                  {!['en', 'tr', 'th', 'ru', 'es', 'zh'].includes(locale) && 'Read Whitepaper'}
                </a>
                <a
                  href="/support/"
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 via-orange-500 to-pink-500 text-white font-bold text-lg hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:-rotate-1"
                >
                  {locale === 'en' && 'Contact Us'}
                  {locale === 'tr' && 'Bize Ulaş'}
                  {locale === 'th' && 'ติดต่อเรา'}
                  {locale === 'ru' && 'Связаться с нами'}
                  {locale === 'es' && 'Contáctanos'}
                  {locale === 'zh' && '联系我们'}
                  {!['en', 'tr', 'th', 'ru', 'es', 'zh'].includes(locale) && 'Contact Us'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

