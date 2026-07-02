"use client"

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/context";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sparkles,
  Coins,
  Receipt,
  Zap,
  Users,
  Shield,
  TrendingUp,
  Rocket,
  ArrowRight,
  Wallet,
  FileText,
  CheckCircle2,
  Lightbulb,
  Target,
  Globe
} from "lucide-react";

// Icon mapping for sections
const getSectionIcon = (index: number) => {
  const icons = [
    Sparkles, Coins, Receipt, Zap, Users, Wallet, Globe, Target, TrendingUp, Rocket, CheckCircle2, FileText
  ];
  return icons[index % icons.length];
};

// Color gradients for sections
const getSectionGradient = (index: number) => {
  const gradients = [
    "from-purple-500 to-pink-500",
    "from-pink-500 to-orange-500",
    "from-orange-500 to-yellow-500",
    "from-yellow-500 to-green-500",
    "from-green-500 to-blue-500",
    "from-blue-500 to-purple-500",
    "from-purple-600 to-pink-600",
    "from-pink-600 to-orange-600",
    "from-orange-600 to-red-600",
    "from-red-600 to-purple-600",
    "from-indigo-500 to-purple-500",
    "from-cyan-500 to-blue-500"
  ];
  return gradients[index % gradients.length];
};

export default function FunpaperPage() {
  const { locale } = useLocale();
  const [hoveredSection, setHoveredSection] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const funpaperContent: Record<string, any> = {
    en: {
      hero: {
        subtitle: "The not-so-serious guide to the most serious Web3 project"
      },
      sections: [
        {
          title: "1. So… what is Yumo Yumo?",
          content: "Yumo Yumo is a personal financial operating system built around Proof of Expense.\n\nIt starts with receipts, but it does not stop at receipts.\n\nPrices, routines, bills, repeated products, and the rhythm of daily life become living financial memory.\n\nYumbie reads that memory and helps you understand what is changing, what matters, and what deserves your attention today."
        },
        {
          title: "2. Why should anyone care?",
          content: "Most finance apps ask the boring question:\n\n\"How much did you spend?\"\n\nYumo Yumo also asks:\n\n\"What was actually inside that price?\"\n\n\"How has it changed over time?\"\n\n\"And what does that pattern mean inside your life?\"\n\nOnce you see spending this way, it stops being just a record.\n\nIt becomes memory, guidance, and contribution."
        },
        {
          title: "3. Proof of Expense (PoE)",
          content: "PoE is simple and honest.\n\n• You upload a real receipt.\n• The system reads what is inside the price.\n• Hidden costs come into the light.\n• Real-world data → price memory, guidance, and eligible contribution credit.\n\nNo fake actions.\n\nNo buttons mashed by bots.\n\nNo \"vibe-based\" rewards.\n\nIf you spend in real life, you can contribute to Yumo Yumo."
        },
        {
          title: "4. Data contribution, normal-life edition",
          content: "Forget GPUs.\n\nForget warehouses full of machines.\n\nIn Yumo Yumo, your receipts are part of the contribution.\n\nEvery valid receipt sends a signal into the system.\n\nThat signal strengthens price memory and, when product rules allow it, can create contribution credit.\n\nThe cycle is clean:\n\nSpend → Upload → Understand → Contribute\n\nStep one, you were already doing."
        },
        {
          title: "5. About tokens (community first)",
          content: "Let's be blunt:\n\nNo separate passive team allocation.\n\nNo hidden stash.\n\nNo giant marketing budget set aside for insiders.\n\nNo pre-mint for the founder's friends.\n\nIf token rails are enabled, the published allocation map and contribution rules decide the flow.\n\nThe goal is simple:\n\ncontribution should be inspectable, and value should follow rules instead of backroom discretion."
        },
        {
          title: "6. \"But how is this funded?\"",
          content: "Not the usual way.\n\nNo raise. No rounds. No funds chasing an exit.\n\nNo paid advertising machine.\n\nNo artificial demand.\n\nYumo Yumo grows the Web3 way:\n\nThrough participation, contribution, and shared incentives.\n\nValue comes from what people do — not from what a team promises."
        },
        {
          title: "7. Why Web3 at all?",
          content: "Because rules matter more than people.\n\nWeb3 guarantees:\n\n• Contribution logic can be inspected.\n• Distribution cannot quietly be changed by hand.\n• No one behind a curtain should decide who gets what.\n\nYour spending becomes a shared signal.\n\nFuture token functionality, if enabled, should open through published rules, eligibility, and product readiness.\n\nSimple systems survive.\n\nOpaque ones get filtered out."
        },
        {
          title: "8. Who is this actually for?",
          content: "• People who spend money.\n• People who enjoy contributing data but also enjoy sleeping at night.\n• People who pick rules over stories.\n\nYou don't need to trade.\n\nYou don't need to use leverage.\n\nYou don't need to predict charts.\n\nYou just upload receipts."
        },
        {
          title: "9. The bigger picture",
          content: "Yumo Yumo starts with awareness.\n\nOver time, that awareness becomes:\n\n• Sharper insights into your own spending.\n• Smarter financial tools built on real receipts.\n• A growing price-intelligence ecosystem, fed by the people who actually do the spending.\n\nAll of it powered by you — not by a quarterly forecast."
        },
        {
          title: "10. Final thought",
          content: "Money already leaves your wallet every day.\n\nYumo Yumo doesn't try to stop that.\n\nIt just lets you contribute data — and maybe spot a cheaper option — while it happens."
        },
        {
          title: "The Cycle",
          content: "Spend\n\nUpload\n\nContribute\n\nEarn\n\nThat's the cycle."
        }
      ],
      cycleSteps: { spend: "Spend", upload: "Upload", contribute: "Contribute", earn: "Earn" },
      cycleCaption: "That's the cycle. Simple. Clean. Yours.",
      cta: {
        title: "Ready to dive deeper?",
        description: "The technical architecture, trust layer, data model, and token mechanics — in one place."
      },
      whitepaperLink: "/technical-paper/en",
      readTechnicalDocs: "Read the Technical Documents"
    },
    tr: {
      hero: {
        subtitle: "En ciddi Web3 projesinin pek de ciddi olmayan rehberi"
      },
      sections: [
        {
          title: "1. Peki... Yumo Yumo nedir?",
          content: "Yumo Yumo, Proof of Expense etrafında kurulu kişisel bir finansal işletim sistemidir.\n\nFişlerle başlar ama fişlerde kalmaz.\n\nFiyatlar, rutinler, faturalar, tekrar eden ürünler ve gündelik hayatın ritmi yaşayan bir finansal hafızaya dönüşür.\n\nYumbie bu hafızayı okuyarak sana bugün neyin değiştiğini, neyin önemli olduğunu ve neye dikkat etmen gerektiğini gösterir."
        },
        {
          title: "2. Neden insanların umurunda olsun?",
          content: "Çoğu finans uygulaması sıkıcı soruyu sorar:\n\n\"Ne kadar harcadın?\"\n\nYumo Yumo şunları da sorar:\n\n\"O fiyatın içinde aslında neler vardı?\"\n\n\"Zaman içinde nasıl değişti?\"\n\n\"Ve bu örüntü hayatının ritmi içinde ne anlama geliyor?\"\n\nHarcamaya bu gözle bakmaya başladığında, bu sadece bir kayıt olmaktan çıkar.\n\nHafızaya, rehberliğe ve katkıya dönüşür."
        },
        {
          title: "3. Harcama Kanıtı (Proof of Expense — PoE)",
          content: "PoE basit ve dürüsttür.\n\n• Gerçek bir fiş yüklersin.\n• Sistem fiyatın içindekileri okur.\n• Gizli maliyetler gün yüzüne çıkar.\n• Gerçek dünya verisi → fiyat hafızası, rehberlik ve uygun katkı kredisi.\n\nSahte aksiyon yok.\n\nBotlarla buton tıklamak yok.\n\n\"Havadan\" ödül yok.\n\nGerçek hayatta harcıyorsan, Yumo Yumo'ya katkı yapabilirsin."
        },
        {
          title: "4. Veri katkısı, günlük hayat versiyonu",
          content: "GPU'ları unut.\n\nMakine dolu depoları unut.\n\nYumo Yumo'da fişlerin katkının bir parçasıdır.\n\nHer geçerli fiş sisteme bir sinyal yollar.\n\nBu sinyal fiyat hafızasını güçlendirir ve ürün kuralları izin verdiğinde katkı kredisi oluşturabilir.\n\nDöngü tertemiz:\n\nHarca → Yükle → Anla → Katkı yap\n\nBirinci adımı zaten yapıyordun."
        },
        {
          title: "5. Tokenlar hakkında (önce topluluk)",
          content: "Net konuşalım:\n\nAyrı ve pasif bir ekip tahsisi yok.\n\nGizli zula yok.\n\nİçeriden birilerine ayrılmış dev pazarlama bütçesi yok.\n\nKurucunun arkadaşlarına önceden basılmış token yok.\n\nToken rayları açılırsa akışı yayınlanmış tahsis haritası ve katkı kuralları belirler.\n\nAmaç basit:\n\nkatkı denetlenebilir olsun ve değer arka kapı kararlarıyla değil kurallarla aksın."
        },
        {
          title: "6. \"Peki bu iş nasıl fonlanıyor?\"",
          content: "Alışılmış yolla değil.\n\nYatırım turu yok. Çıkış peşinde fon yok.\n\nPara ile kurulmuş reklam makinesi yok.\n\nYapay talep yok.\n\nYumo Yumo, Web3 yoluyla büyür:\n\nKatılım, katkı, ve paylaşılan teşviklerle.\n\nDeğer, insanların yaptığından gelir — bir ekibin söz verdiğinden değil."
        },
        {
          title: "7. Neden Web3?",
          content: "Çünkü kurallar insanlardan daha önemlidir.\n\nWeb3 şunları sağlar:\n\n• Katkı mantığı denetlenebilir olur.\n• Dağıtım sessizce elle değiştirilemez.\n• Perde arkasında kimsenin \"kim ne alacak\"a karar vermemesi hedeflenir.\n\nHarcamaların ortak bir sinyale dönüşür.\n\nGelecekte token işlevleri açılırsa bu; yayınlanmış kurallar, uygunluk ve ürün hazır oluşu üzerinden açılmalıdır.\n\nBasit sistemler hayatta kalır.\n\nŞeffaf olmayanlar elenir."
        },
        {
          title: "8. Bu aslında kimin için?",
          content: "• Para harcayan insanlar.\n• Veri katkısı yapmayı seven ama uykusunu da almak isteyenler.\n• Hikâyeler yerine kuralları tercih edenler.\n\nAlım-satım yapmana gerek yok.\n\nKaldıraç kullanmana gerek yok.\n\nGrafik tahmin etmene gerek yok.\n\nSadece fiş yüklersin."
        },
        {
          title: "9. Büyük resim",
          content: "Yumo Yumo bir farkındalıkla başlar.\n\nZamanla bu farkındalık şuna dönüşür:\n\n• Kendi harcamana dair daha keskin içgörüler.\n• Gerçek fişler üzerine kurulu daha akıllı finansal araçlar.\n• Asıl harcayan insanların beslediği, büyüyen bir fiyat zekâsı ekosistemi.\n\nHepsi senin tarafından çalışır — üç aylık tahminlerle değil."
        },
        {
          title: "10. Son düşünce",
          content: "Cüzdanından her gün zaten para çıkıyor.\n\nYumo Yumo bunu durdurmaya çalışmaz.\n\nSadece bu olurken veri katkısı yapmanı — ve belki daha ucuz bir seçeneği fark etmeni — sağlar."
        },
        {
          title: "Döngü",
          content: "Harca\n\nYükle\n\nKatkı\n\nKazan\n\nİşte döngü bu."
        }
      ],
      cycleSteps: { spend: "Harca", upload: "Yükle", contribute: "Katkı", earn: "Kazan" },
      cycleCaption: "İşte döngü bu. Basit. Temiz. Senin.",
      cta: {
        title: "Daha derine inmeye hazır mısın?",
        description: "Teknik mimari, güven katmanı, veri modeli ve token mekanikleri — hepsi tek yerde."
      },
      whitepaperLink: "/technical-paper/tr",
      readTechnicalDocs: "Teknik Dokümanları Oku"
    },
    th: {
      hero: {
        subtitle: "คู่มือฉบับไม่ค่อยจริงจัง ของโปรเจกต์ Web3 ที่จริงจังที่สุด"
      },
      sections: [
        {
          title: "1. แล้ว... Yumo Yumo คืออะไรกันแน่? 💸",
          content: "Yumo Yumo คือโปรเจกต์ Web3 ที่เปลี่ยนสิ่งที่คุณทำอยู่แล้วทุกวัน ให้กลายเป็นวิธีรับโทเคน\n\nสิ่งนั้นก็คือ — การใช้จ่ายเงิน\n\nในทุกๆ ราคามี \"เลเยอร์\" ซ่อนอยู่ — ภาษี กำไรของร้าน ค่าดำเนินการ — และคุณก็จ่ายมันทุกวันโดยไม่เคยคิดเลย\n\nYumo Yumo เปิดเลเยอร์เหล่านี้ออกมา เทียบราคาสินค้าเดียวกันกับร้านอื่นๆ แล้วบอกว่า:\n\n\"เจ๋งไปเลย! เรามาเปลี่ยนสิ่งนี้ให้กลายเป็นข้อมูลที่มีค่ากันดีกว่า\" 🍎"
        },
        {
          title: "2. ทำไมคุณถึงต้องสนใจล่ะ? 🤔",
          content: "แอปการเงินส่วนใหญ่ มักจะถามคำถามเดิมๆ ที่น่าเบื่อ:\n\n\"คุณจ่ายไปเท่าไหร่?\"\n\nแต่ Yumo Yumo ถามคำถามที่เจ๋งกว่านั้นถึงสองข้อ:\n\n\"จริงๆ แล้วมีอะไรซ่อนอยู่ในราคานั้นบ้าง?\"\n\n\"แล้วถ้าซื้อจากที่อื่น มันจะถูกกว่ามั้ย?\"\n\nเมื่อคุณเริ่มมองราคาในมุมนี้ การใช้จ่ายจะไม่ใช่แค่การจ่ายทิ้งอีกต่อไป\n\nมันจะกลายเป็น \"ข้อมูล\"\n\nและข้อมูลนี่แหละ ที่สร้างรายได้ให้คุณ"
        },
        {
          title: "3. Proof of Expense (PoE) — เรียบง่ายและซื่อสัตย์ 🧾",
          content: "ระบบ PoE ตรงไปตรงมาที่สุด:\n\n• คุณอัปโหลดใบเสร็จจริงๆ\n• ระบบจะอ่านว่าอะไรอยู่ในราคานั้น\n• ต้นทุนที่แฝงอยู่จะถูกเปิดเผยออกมา\n• ข้อมูลจากโลกจริง → รางวัลจริง\n\nไม่มีการสร้างยอดปลอม\n\nไม่มีบอทคลิก\n\nไม่มีรางวัลที่ให้ตาม \"ความรู้สึก\"\n\nถ้าคุณใช้จ่ายในชีวิตจริง คุณก็มีส่วนร่วมกับ Yumo Yumo ได้"
        },
        {
          title: "4. ส่งข้อมูล — แต่แบบในชีวิตประจำวัน 🏠",
          content: "ลืมการ์ดจอแรงๆ ไปได้เลย\n\nลืมโกดังที่เต็มไปด้วยเครื่องขุดด้วย\n\nที่ Yumo Yumo \"ใบเสร็จของคุณ\" คือการมีส่วนร่วม\n\nทุกใบเสร็จที่ถูกต้องคือการส่งสัญญาณเข้าสู่ระบบ\n\nและทุกสัญญาณจะสร้างรางวัลออกมา\n\nวงจรนั้นง่ายมาก:\n\nจ่าย → อัปโหลด → ส่งข้อมูล → รับรางวัล\n\n(ขั้นตอนแรก คุณก็ทำอยู่แล้วทุกวันใช่ไหมล่ะ?)"
        },
        {
          title: "5. เกี่ยวกับโทเคน (ชุมชนต้องมาก่อน) 🍪",
          content: "ขอพูดชัดๆ ตรงนี้เลย:\n\nไม่มี การแบ่งให้ทีมงาน\n\nไม่มี การเก็บงำไว้ลับๆ\n\nไม่มี งบการตลาดมหาศาลที่กันไว้ให้คนใน\n\nไม่มี การแอบเสกเหรียญให้เพื่อนผู้ก่อตั้ง\n\nYumo Yumo ถูกสร้างมาเพื่อให้คุณค่าไหลไปสู่ผู้เข้าร่วมตัวจริง ไม่ใช่ไปสู่โครงสร้างส่วนกลาง\n\nถ้าคุณช่วยสร้าง คุณก็ได้รับ\n\nถ้าไม่ ก็คือไม่\n\nจบแค่นั้น"
        },
        {
          title: "6. \"แล้วเอาเงินทุนมาจากไหน?\" 💰",
          content: "ไม่ได้ระดมทุนแบบเดิมๆ\n\nไม่มีรอบลงทุน ไม่มีกองทุนที่ไล่หา Exit\n\nไม่มีเครื่องโฆษณาที่ใช้เงินซื้อ\n\nไม่มีความต้องการปลอมๆ\n\nYumo Yumo เติบโตในวิถีของ Web3:\n\nผ่านการมีส่วนร่วม การส่งข้อมูล และแรงจูงใจที่แบ่งปันร่วมกัน\n\nมูลค่ามาจากสิ่งที่ผู้คนทำจริงๆ ไม่ใช่จากคำสัญญาของทีมงาน"
        },
        {
          title: "7. ทำไมต้องเป็น Web3? 🌐",
          content: "เพราะ \"กฎเกณฑ์\" สำคัญกว่าตัวบุคคล\n\nWeb3 การันตีว่า:\n\n• รางวัลจะเป็นไปตามตรรกะที่เขียนไว้ล่วงหน้า\n• การกระจายเหรียญไม่สามารถแก้ไขด้วยมือได้\n• ไม่มีใคร \"หลังม่าน\" มาตัดสินใจได้ว่าใครจะได้อะไร\n\nการใช้จ่ายของคุณกลายเป็นสัญญาณร่วมกัน\n\nและโทเคนจะไหลกลับไปสู่ผู้คนที่สร้างสัญญาณนั้น\n\nระบบที่โปร่งใสจะอยู่รอด\n\nส่วนระบบที่ไม่ชัดเจน ก็จะถูกคัดออก"
        },
        {
          title: "8. โปรเจกต์นี้เหมาะกับใคร? 👥",
          content: "• คนที่ใช้จ่ายเงิน (ซึ่งก็คือทุกคน!)\n• คนที่ชอบส่งข้อมูล แต่ก็ยังอยากนอนหลับสบาย\n• คนที่เชื่อในกฎกติกามากกว่าคำพูดสวยหรู\n\nคุณไม่จำเป็นต้องเทรด\n\nไม่ต้องใช้ Leverage\n\nไม่ต้องทำนายกราฟ\n\nแค่อัปโหลดใบเสร็จก็พอ"
        },
        {
          title: "9. ภาพรวมที่ใหญ่กว่า 🖼️",
          content: "Yumo Yumo เริ่มต้นจากการสร้างความตระหนักรู้\n\nและเมื่อเวลาผ่านไป สิ่งนี้จะกลายเป็น:\n\n• ข้อมูลเชิงลึกที่คมยิ่งขึ้น เกี่ยวกับการใช้จ่ายของตัวคุณเอง\n• เครื่องมือทางการเงินที่ฉลาดกว่าเดิม สร้างบนใบเสร็จจริง\n• ระบบนิเวศ \"ข้อมูลราคา\" ที่เติบโต โดยถูกป้อนจากคนที่ใช้จ่ายเงินจริงๆ\n\nทั้งหมดนี้ขับเคลื่อนโดยคุณ ไม่ใช่โดยการคาดการณ์รายไตรมาส"
        },
        {
          title: "10. ทิ้งท้ายสักนิด ✨",
          content: "เงินออกจากกระเป๋าคุณทุกวันอยู่แล้ว\n\nYumo Yumo ไม่ได้พยายามหยุดสิ่งนั้น\n\nมันแค่ช่วยให้คุณ \"ส่งข้อมูล\" — และอาจจะเจอตัวเลือกที่ถูกกว่า — ไปพร้อมๆ กัน"
        },
        {
          title: "วงจร",
          content: "จ่าย\n\nอัปโหลด\n\nส่งข้อมูล\n\nรับรางวัล\n\nนั่นแหละคือวงจร"
        }
      ],
      cycleSteps: { spend: "จ่าย", upload: "อัปโหลด", contribute: "ส่งข้อมูล", earn: "รับรางวัล" },
      cycleCaption: "นั่นแหละคือวงจร — เรียบง่าย ใสสะอาด เป็นของคุณ",
      cta: {
        title: "พร้อมจะลงลึกแล้วใช่ไหม?",
        description: "รายละเอียดทางเทคนิคทั้งหมด โทเคโนมิกส์ และกระบวนการพัฒนา — รวมไว้ในที่เดียว"
      },
      whitepaperLink: "/technical-paper/th",
      readTechnicalDocs: "อ่านเอกสารทางเทคนิค"
    },
    ru: {
      hero: {
        subtitle: "Не самый серьёзный путеводитель по самому серьёзному Web3-проекту"
      },
      sections: [
        {
          title: "1. Итак… что такое Yumo Yumo? 🍎",
          content: "Yumo Yumo — это Web3-проект, который превращает то, что ты и так делаешь каждый день, в способ зарабатывать токены:\n\nТратить деньги.\n\nВ каждой цене есть слои — налоги, маржа, операционные расходы — и ты оплачиваешь их каждый день, не задумываясь.\n\nYumo Yumo раскрывает эти слои, сравнивает цену того же товара в других местах и говорит:\n\n\"Отлично. Превратим это в data-вклад.\""
        },
        {
          title: "2. Почему это важно? 🤔",
          content: "Большинство финансовых приложений задают скучный вопрос:\n\n\"Сколько ты потратил?\"\n\nYumo Yumo задаёт два вопроса получше:\n\n\"Что на самом деле было внутри этой цены?\"\n\n\"И не было ли это дешевле где-то ещё?\"\n\nКак только ты начинаешь смотреть на цены так, траты перестают быть пассивным действием.\n\nОни становятся данными.\n\nА данные приносят доход."
        },
        {
          title: "3. Proof of Expense (PoE) — Доказательство Расходов 🧾",
          content: "PoE — это просто и честно:\n\n• Ты загружаешь реальный чек.\n• Система читает, что внутри цены.\n• Скрытые расходы выходят на свет.\n• Реальные данные → реальные награды.\n\nНикаких фальшивых действий.\n\nНикаких ботов, тыкающих кнопки.\n\nНикаких наград «по настроению».\n\nЕсли ты тратишь в реальной жизни — ты можешь вносить вклад в Yumo Yumo."
        },
        {
          title: "4. Вклад данных, в обычной жизни 🏠",
          content: "Забудь о видеокартах.\n\nЗабудь о складах, забитых оборудованием.\n\nВ Yumo Yumo твои чеки — это и есть твой вклад.\n\nКаждый валидный чек — это сигнал для системы.\n\nКаждый сигнал генерирует награду.\n\nЦикл предельно чист:\n\nПотратил → Загрузил → Внёс вклад → Заработал\n\nПервый шаг ты всё равно уже делал."
        },
        {
          title: "5. О токенах (сообщество прежде всего) 🍪",
          content: "Скажем прямо:\n\nНикаких долей для команды.\n\nНикаких скрытых заначек.\n\nНикаких огромных маркетинговых бюджетов для «своих».\n\nНикакого пре-минта для друзей основателя.\n\nYumo Yumo построен так, чтобы ценность текла к участникам, а не в центральную структуру.\n\nДелаешь вклад — зарабатываешь.\n\nНет — значит нет.\n\nВсё просто."
        },
        {
          title: "6. «А как это финансируется?» 💰",
          content: "Не обычным способом.\n\nНикаких раундов. Никаких фондов, гонящихся за exit.\n\nНикаких рекламных машин на деньги.\n\nНикакого искусственного спроса.\n\nYumo Yumo растёт по пути Web3:\n\nчерез участие, вклад и общие стимулы.\n\nЦенность создаётся действиями людей, а не обещаниями команды."
        },
        {
          title: "7. Зачем вообще здесь Web3? 🌐",
          content: "Потому что правила важнее людей.\n\nWeb3 гарантирует:\n\n• Награды выплачиваются по заранее прописанной логике.\n• Распределение нельзя изменить вручную.\n• Никто «за кулисами» не решает, кому и сколько дать.\n\nТвои траты становятся общим сигналом.\n\nТокены возвращаются к тем, кто этот сигнал создал.\n\nПрозрачные системы выживают.\n\nЗакрытые исчезают."
        },
        {
          title: "8. Для кого это? 👥",
          content: "• Для тех, кто тратит деньги.\n• Для тех, кто любит вносить данные, но также хочет спокойно спать.\n• Для тех, кто предпочитает правила сказкам.\n\nТебе не нужно торговать.\n\nТебе не нужно использовать плечи.\n\nТебе не нужно угадывать графики.\n\nПросто загружай чеки."
        },
        {
          title: "9. Большая картина 🖼️",
          content: "Yumo Yumo начинается с осознанности.\n\nСо временем эта осознанность превращается в:\n\n• Более глубокую аналитику собственных трат.\n• Более умные финансовые инструменты на базе реальных чеков.\n• Растущую экосистему «ценового интеллекта», поддерживаемую людьми, которые реально тратят деньги.\n\nВсё это работает за счёт тебя — а не за счёт квартального прогноза."
        },
        {
          title: "10. Финальная мысль ✨",
          content: "Деньги и так покидают твой кошелёк каждый день.\n\nYumo Yumo не пытается это остановить.\n\nОн просто позволяет тебе вносить данные — и, возможно, замечать более дешёвый вариант — пока это происходит."
        },
        {
          title: "Цикл",
          content: "Трать\n\nЗагружай\n\nВноси вклад\n\nЗарабатывай\n\nВот и весь цикл."
        }
      ],
      cycleSteps: { spend: "Трать", upload: "Загружай", contribute: "Вноси вклад", earn: "Зарабатывай" },
      cycleCaption: "Вот и весь цикл. Просто. Чисто. Твоё.",
      cta: {
        title: "Готов копнуть глубже?",
        description: "Все технические детали, токеномика и процессы реализации — в одном месте."
      },
      whitepaperLink: "/technical-paper/ru",
      readTechnicalDocs: "Читать техническую документацию"
    },
    es: {
      hero: {
        subtitle: "La guía no tan seria del proyecto Web3 más serio"
      },
      sections: [
        {
          title: "1. Entonces... ¿qué es Yumo Yumo?",
          content: "Yumo Yumo es un proyecto Web3 que convierte algo que ya haces todos los días en una forma de ganar tokens:\n\nGastar dinero.\n\nCada precio tiene capas — impuestos, márgenes de ganancia, costos operativos — y las pagas a diario sin darte cuenta.\n\nYumo Yumo abre esas capas, compara cuánto cuesta el mismo producto en otros lugares y dice:\n\n\"Genial. Convirtamos esto en contribución de datos\"."
        },
        {
          title: "2. ¿Por qué debería importarte?",
          content: "Casi todas las apps financieras te hacen la misma pregunta aburrida:\n\n\"¿Cuánto gastaste?\"\n\nYumo Yumo te hace dos preguntas mucho mejores:\n\n\"¿Qué había realmente dentro de ese precio?\"\n\n\"¿Y estaba más barato en otro lado?\"\n\nCuando empiezas a ver el gasto así, deja de ser una acción pasiva.\n\nSe convierte en datos.\n\nY los datos rinden."
        },
        {
          title: "3. Proof of Expense (PoE): simple y honesto",
          content: "El sistema PoE es transparente:\n\n• Subes un recibo real.\n• El sistema lee qué hay dentro del precio.\n• Los costos ocultos salen a la luz.\n• Datos reales → recompensas reales.\n\nSin bots clickeando botones.\n\nSin acciones falsas.\n\nSin recompensas \"por buena vibra\".\n\nSi gastas en la vida real, contribuyes datos en Yumo Yumo."
        },
        {
          title: "4. Contribución de datos, versión vida cotidiana",
          content: "Olvida las tarjetas gráficas.\n\nOlvida los galpones llenos de máquinas.\n\nEn Yumo Yumo, tus recibos son la contribución.\n\nCada tique válido envía una señal al sistema.\n\nCada señal genera recompensa.\n\nEl ciclo es perfecto:\n\nGasta → Sube → Contribuye → Gana\n\nEl paso uno ya lo estabas haciendo igual."
        },
        {
          title: "5. Sobre los tokens (la comunidad primero)",
          content: "Seamos directos:\n\nSin asignación para el equipo.\n\nSin reservas ocultas.\n\nSin presupuestos gigantes de marketing para los de adentro.\n\nSin pre-minteo para los amigos del fundador.\n\nYumo Yumo se construyó para que el valor fluya hacia los participantes, no hacia una estructura centralizada.\n\nSi contribuyes, ganas.\n\nSi no, no.\n\nAsí de simple."
        },
        {
          title: "6. \"¿Y cómo se financia esto?\"",
          content: "No de la forma habitual.\n\nSin rondas de inversión. Sin fondos persiguiendo un exit.\n\nSin máquinas de publicidad pagada.\n\nSin demanda artificial.\n\nYumo Yumo crece al estilo Web3:\n\na través de la participación, la contribución y los incentivos compartidos.\n\nEl valor nace de lo que la gente hace, no de las promesas de un equipo."
        },
        {
          title: "7. ¿Por qué Web3?",
          content: "Porque las reglas importan más que las personas.\n\nWeb3 garantiza que:\n\n• Las recompensas siguen una lógica escrita por adelantado.\n• La distribución no se puede modificar a mano.\n• Nadie \"detrás de la cortina\" decide quién gana qué.\n\nTu gasto se convierte en una señal compartida.\n\nLos tokens regresan a las personas que crearon esa señal.\n\nLos sistemas transparentes sobreviven.\n\nLos opacos se filtran y desaparecen."
        },
        {
          title: "8. ¿Para quién es esto realmente?",
          content: "• Para quienes gastan dinero (o sea, todos).\n• Para quienes disfrutan contribuir datos pero también quieren dormir tranquilos.\n• Para quienes prefieren reglas claras antes que historias bonitas.\n\nNo necesitas hacer trading.\n\nNo necesitas usar apalancamiento.\n\nNo necesitas predecir gráficos.\n\nSolo subes recibos."
        },
        {
          title: "9. La visión global",
          content: "Yumo Yumo empieza con conciencia.\n\nCon el tiempo, esa conciencia se convierte en:\n\n• Insights más afilados sobre tu propio gasto.\n• Herramientas financieras más inteligentes basadas en recibos reales.\n• Un ecosistema creciente de inteligencia de precios, alimentado por quienes realmente gastan.\n\nTodo impulsado por ti — no por un pronóstico trimestral."
        },
        {
          title: "10. Reflexión final",
          content: "El dinero ya sale de tu bolsillo todos los días.\n\nYumo Yumo no intenta detener eso.\n\nSolo te permite contribuir datos — y quizás encontrar una opción más barata — mientras sucede."
        },
        {
          title: "El Ciclo",
          content: "Gastar\n\nSubir\n\nContribuir\n\nGanar\n\nEse es el ciclo."
        }
      ],
      cycleSteps: { spend: "Gastar", upload: "Subir", contribute: "Contribuir", earn: "Ganar" },
      cycleCaption: "Ese es el ciclo. Simple. Limpio. Tuyo.",
      cta: {
        title: "¿Listo para profundizar?",
        description: "Todos los detalles técnicos, tokenomics y procesos de implementación — en un solo lugar."
      },
      whitepaperLink: "/technical-paper/es",
      readTechnicalDocs: "Leer Documentación Técnica"
    },
    zh: {
      hero: {
        subtitle: "最严肃的 Web3 项目，最不严肃的指南"
      },
      sections: [
        {
          title: "1. 所以……Yumo Yumo 是什么？",
          content: "Yumo Yumo 是一个 Web3 项目， 它把你每天本来就在做的事， 变成获得代币的方式。\n\n那件事就是——花钱。\n\n每一个价格都有很多层： 税费、利润、运营成本……\n\n你每天都在支付这些， 只是从来没有仔细想过。\n\nYumo Yumo 打开这些层， 顺便比对同样的商品在别处卖多少， 然后说：\n\n\"太好了，我们把它变成一种数据贡献吧。\""
        },
        {
          title: "2. 那为什么要在意？",
          content: "几乎所有理财应用， 都会问一个很无聊的问题：\n\n\"你花了多少钱？\"\n\nYumo Yumo 问两个更好的问题：\n\n\"这个价格里面，到底装了什么？\"\n\n\"它在别的地方，是不是更便宜？\"\n\n一旦你开始这样看待消费， 花钱就不再只是一个被动动作。\n\n它会变成数据。\n\n而数据，是有价值的。"
        },
        {
          title: "3. 什么是支出证明（PoE）？",
          content: "PoE 很简单，也很诚实。\n\n• 你上传一张真实的收据\n• 系统解读价格里的结构\n• 原本看不见的部分被摊开\n• 真实世界的数据 → 真实的奖励\n\n没有假操作。\n\n没有机器人点按钮。\n\n没有\"靠感觉发奖励\"。\n\n只要你在现实生活中花钱， 你就可以在 Yumo Yumo 中做出贡献。"
        },
        {
          title: "4. 贡献数据，但它就是日常生活",
          content: "忘掉显卡吧。\n\n忘掉机器仓库吧。\n\n在 Yumo Yumo 里， 你的收据，就是贡献本身。\n\n每一张有效收据， 都会为系统提供一个信号。\n\n每一个信号， 都会产生奖励。\n\n流程非常干净：\n\n花钱 → 上传 → 贡献 → 获得\n\n而第一步， 你本来就每天在做。"
        },
        {
          title: "5. 关于代币（社区优先）",
          content: "我们说清楚一件事：\n\n没有团队专属分配。\n\n没有隐藏储备。\n\n没有为内部人士准备的巨额营销预算。\n\n没有给创始人朋友的预铸代币。\n\nYumo Yumo 的设计目标只有一个：\n\n让价值流向参与者， 而不是某个中心结构。\n\n你贡献，你获得。\n\n你不贡献，就不会获得。\n\n就这么简单。"
        },
        {
          title: "6. \"那这个系统靠什么运转？\"",
          content: "不是用传统方式运转的。\n\n没有融资轮， 没有追逐 exit 的基金。\n\n没有花钱买的广告机器。\n\n没有人为制造的需求。\n\nYumo Yumo 以 Web3 的方式成长：\n\n靠参与、靠贡献、靠共同激励。\n\n价值来自人们做了什么， 而不是团队说了什么。"
        },
        {
          title: "7. 为什么一定要用 Web3？",
          content: "因为规则， 比人更重要。\n\nWeb3 确保：\n\n• 奖励遵循预先写下的逻辑\n• 分配无法被手动更改\n• 没有人可以在幕后决定\"谁拿多少\"\n\n你的消费， 变成一种共享信号。\n\n代币， 会回到创造这个信号的人手中。\n\n简单的系统， 才能长期存在。\n\n不透明的系统， 最终会被淘汰。"
        },
        {
          title: "8. 这到底适合谁？",
          content: "• 会花钱的人\n• 喜欢贡献数据，但也想好好睡觉的人\n• 更相信规则，而不是故事的人\n\n你不需要交易。\n\n不需要加杠杆。\n\n不需要预测走势图。\n\n只需要上传收据。"
        },
        {
          title: "9. 更大的图景",
          content: "Yumo Yumo 从\"看懂消费\"开始。\n\n随着时间推移， 这种认知会变成：\n\n• 对你自身消费的更深入洞察\n• 建立在真实收据上的、更聪明的金融工具\n• 一个由真正花钱的人喂养着的\"价格情报\"生态\n\n而所有这一切， 是由你支撑的—— 不是由一份季度预测。"
        },
        {
          title: "10. 最后的话",
          content: "钱每天都会离开你的钱包。\n\nYumo Yumo 并不会阻止它。\n\n它只是让你在这个过程中， 顺便贡献一些数据—— 也许还会发现某个更便宜的选择。"
        },
        {
          title: "循环",
          content: "花钱\n\n上传\n\n贡献\n\n获得\n\n这就是循环。"
        }
      ],
      cycleSteps: { spend: "花钱", upload: "上传", contribute: "贡献", earn: "获得" },
      cycleCaption: "这就是循环。简单。干净。属于你。",
      cta: {
        title: "准备好深入了解了吗？",
        description: "技术细节、代币经济学，以及完整的实现流程——都在一个地方。"
      },
      whitepaperLink: "/technical-paper/zh",
      readTechnicalDocs: "阅读技术文档"
    }
  };

  const content = funpaperContent[locale] || funpaperContent.en;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 left-1/2 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{
            x: [0, 50, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-block mb-6"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-6xl mb-4">🎉</div>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-primary via-pink-500 to-orange-500 bg-clip-text text-transparent">
              Fun Paper
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {content.hero?.subtitle || "The not-so-serious guide to the most serious Web3 project"}
            </p>
          </motion.div>

          {/* Sections */}
          <div className="space-y-8">
            {content.sections && content.sections.length > 0 ? (
              content.sections.map((section: any, index: number) => {
                const Icon = getSectionIcon(index);
                const gradient = getSectionGradient(index);
                const isHovered = hoveredSection === index;
                const isCycleSection = index === content.sections.length - 1;

                return (
                  <motion.section
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onHoverStart={() => setHoveredSection(index)}
                    onHoverEnd={() => setHoveredSection(null)}
                    className="relative"
                  >
                    {/* Special styling for Cycle section */}
                    {isCycleSection ? (
                      <motion.div
                        className="relative bg-gradient-to-br from-primary/20 via-pink-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-8 md:p-12 border-4 border-primary/50 shadow-2xl"
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <div className="absolute top-4 right-4 text-4xl animate-bounce">✨</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                          {[
                            content.cycleSteps?.spend || 'Spend',
                            content.cycleSteps?.upload || 'Upload',
                            content.cycleSteps?.contribute || 'Contribute',
                            content.cycleSteps?.earn || 'Earn'
                          ].map((step, stepIndex) => (
                            <motion.div
                              key={stepIndex}
                              className="text-center"
                              initial={{ opacity: 0, scale: 0.8 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: stepIndex * 0.2 }}
                            >
                              <motion.div
                                className={`w-20 h-20 rounded-full bg-gradient-to-br ${getSectionGradient(stepIndex)} mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg`}
                                whileHover={{ scale: 1.1, rotate: 360 }}
                                transition={{ duration: 0.5 }}
                              >
                                {stepIndex + 1}
                              </motion.div>
                              <h3 className="font-bold text-lg text-white">{step}</h3>
                            </motion.div>
                          ))}
                        </div>
                        <p className="text-center text-2xl font-bold text-white">
                          {content.cycleCaption || "That's the cycle. Simple. Clean. Yours."}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        className={`relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-10 border border-white/10 shadow-xl transition-all duration-300 ${
                          isHovered ? 'shadow-2xl border-primary/50' : ''
                        }`}
                        whileHover={{
                          scale: 1.02,
                          boxShadow: "0 20px 40px rgba(255, 122, 26, 0.2)"
                        }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {/* Icon Badge */}
                        <motion.div
                          className={`absolute -top-6 -left-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg z-10`}
                          whileHover={{ rotate: 360, scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="w-8 h-8 text-white" />
                        </motion.div>

                        {/* Section Number */}
                        <div className="absolute top-4 right-4">
                          <span className={`text-4xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent opacity-20`}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                        </div>

                        <div className="mt-4">
                          <motion.h2
                            className={`text-2xl md:text-3xl font-bold mb-6 bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
                            whileHover={{ x: 10 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            {section.title}
                          </motion.h2>

                          <div className="text-gray-300 leading-relaxed space-y-4">
                            {section.content.split(/\n\n+/).map((paragraph: string, pIndex: number) => {
                              const lines = paragraph.split('\n').filter(line => line.trim());
                              if (lines.length === 0) return null;

                              // Check if it's a bullet point
                              if (lines[0].trim().match(/^[•\-\d+\.]/)) {
                                return (
                                  <motion.ul
                                    key={pIndex}
                                    className="list-none space-y-3 mb-4"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: pIndex * 0.1 }}
                                  >
                                    {lines.map((line, lIndex) => (
                                      <motion.li
                                        key={lIndex}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-white/90 hover:bg-white transition-colors text-gray-900"
                                        whileHover={{ x: 5 }}
                                      >
                                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 text-primary`} />
                                        <span className="whitespace-pre-line">{line.replace(/^[•\-\d+\.]\s*/, '')}</span>
                                      </motion.li>
                                    ))}
                                  </motion.ul>
                                );
                              }

                              // Regular paragraph with emphasis detection
                              const hasEmphasis = paragraph.includes('"') || paragraph.includes('•') || paragraph.match(/[A-Z][^.!?]*!/);
                              return (
                                <motion.p
                                  key={pIndex}
                                  className={`mb-4 whitespace-pre-line ${
                                    hasEmphasis
                                      ? 'text-lg font-semibold text-white bg-gradient-to-r from-primary/20 to-pink-500/20 p-4 rounded-xl border-l-4 border-primary'
                                      : 'text-gray-300'
                                  }`}
                                  initial={{ opacity: 0 }}
                                  whileInView={{ opacity: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: pIndex * 0.1 }}
                                >
                                  {paragraph}
                                </motion.p>
                              );
                            })}
                          </div>
                        </div>

                        {/* Hover glow effect */}
                        {isHovered && (
                          <motion.div
                            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-5 pointer-events-none`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </motion.div>
                    )}
                  </motion.section>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">
                  {locale === 'en' ? 'Content loading...' : 'This content is not yet available in your language. Please check back later.'}
                </p>
              </div>
            )}
          </div>

          {/* CTA Section */}
          {content.sections && content.sections.length > 0 && (
            <motion.div
              className="mt-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10"
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                <div className="relative z-10">
                  <motion.div
                    className="text-6xl mb-6"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    🚀
                  </motion.div>
                  <h3
                    className="text-3xl md:text-4xl font-bold text-white mb-6"
                    style={{
                      textShadow: '0 0 20px rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {content.cta?.title || "Ready to dive deeper?"}
                  </h3>
                  <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                    {content.cta?.description || "All the technical details, tokenomics, and implementation flow — in one place."}
                  </p>
                  <motion.a
                    href={content.whitepaperLink}
                    className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-purple-600 font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl"
                    style={{
                      boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)'
                    }}
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 0 40px rgba(255, 255, 255, 0.5), 0 10px 30px rgba(0,0,0,0.5)"
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {content.readTechnicalDocs || "Read the Technical Documents"}
                    <ArrowRight className="w-6 h-6" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
