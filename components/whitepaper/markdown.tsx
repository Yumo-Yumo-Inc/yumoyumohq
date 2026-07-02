import React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/components/whitepaper/mermaid-diagram";
import { type WhitepaperLocale, whitepaperUiStrings } from "@/lib/whitepaper/shared";

const BLOCK_TAGS = new Set([
  "pre",
  "table",
  "div",
  "ul",
  "ol",
  "blockquote",
  "figure",
]);

type WhitepaperMarkdownProps = {
  locale: WhitepaperLocale;
  markdown: string;
};

type ParsedSection = {
  heading: string;
  body: string;
};

type ParsedDocument = {
  title: string | null;
  intro: string;
  sections: ParsedSection[];
};

type SplitSectionBody = {
  lead: string | null;
  remainder: string;
};

type SectionTheme = {
  border: string;
  panel: string;
  accent: string;
  accentSoft: string;
  glow: string;
  chip: string;
};

function isBlockMarkdownCode(child: React.ReactElement): boolean {
  const props = child.props as { inline?: boolean; className?: string };
  if (props.inline === true) return false;
  if (props.inline === false) return true;
  const cn = props.className;
  return typeof cn === "string" && cn.includes("language-");
}

function hasBlockChild(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) return false;
    if (isBlockMarkdownCode(child)) return true;
    if (typeof child.type === "string" && BLOCK_TAGS.has(child.type)) return true;
    const inner = (child.props as { children?: React.ReactNode })?.children;
    return inner ? hasBlockChild(inner) : false;
  });
}

function normalizeMarkdown(markdown: string) {
  return markdown.replace(/\r\n/g, "\n").trim();
}

function parseMarkdownDocument(markdown: string): ParsedDocument {
  const normalized = normalizeMarkdown(markdown);
  const lines = normalized.split("\n");

  let title: string | null = null;
  let currentHeading: string | null = null;
  let introLines: string[] = [];
  let currentBody: string[] = [];
  const sections: ParsedSection[] = [];

  for (const line of lines) {
    if (!title && line.startsWith("# ")) {
      title = line.slice(2).trim();
      continue;
    }

    if (line.startsWith("## ")) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join("\n").trim(),
        });
      }

      currentHeading = line.slice(3).trim();
      currentBody = [];
      continue;
    }

    if (currentHeading) {
      currentBody.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join("\n").trim(),
    });
  }

  if (!sections.length && introLines.join("\n").trim()) {
    sections.push({
      heading: title ?? "Overview",
      body: introLines.join("\n").trim(),
    });
    introLines = [];
  }

  return {
    title,
    intro: introLines.join("\n").trim(),
    sections,
  };
}

function splitMarkdownBlocks(markdown: string) {
  const lines = markdown.split("\n");
  const blocks: string[] = [];
  let buffer: string[] = [];
  let inFence = false;

  const flush = () => {
    const value = buffer.join("\n").trim();
    if (value) blocks.push(value);
    buffer = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      buffer.push(line);
      continue;
    }

    if (!inFence && line.trim() === "") {
      flush();
      continue;
    }

    buffer.push(line);
  }

  flush();
  return blocks;
}

function isNarrativeBlock(block: string) {
  const trimmed = block.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("```")) return false;
  if (trimmed.startsWith("|")) return false;
  if (trimmed.startsWith(">")) return false;
  if (/^[-*+]\s/.test(trimmed)) return false;
  if (/^\d+\.\s/.test(trimmed)) return false;
  if (trimmed.startsWith("#")) return false;
  return true;
}

function splitLeadFromBody(markdown: string): SplitSectionBody {
  const blocks = splitMarkdownBlocks(markdown);
  const leadIndex = blocks.findIndex(isNarrativeBlock);

  if (leadIndex === -1) {
    return { lead: null, remainder: markdown };
  }

  const lead = blocks[leadIndex];
  const remainder = blocks.filter((_, index) => index !== leadIndex).join("\n\n");

  return {
    lead,
    remainder: remainder.trim(),
  };
}

function stripMarkdownToText(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function takePreviewText(markdown: string, maxLength = 180) {
  const text = stripMarkdownToText(markdown);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function splitIntoSentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getManifestoExcerpt(markdown: string, maxLength = 160) {
  const text = stripMarkdownToText(markdown);
  const sentences = splitIntoSentences(text);
  const candidate = sentences.find((sentence) => sentence.length > 70) ?? sentences[0] ?? text;
  if (candidate.length <= maxLength) return candidate;
  return `${candidate.slice(0, maxLength).trimEnd()}…`;
}

function getSectionSignals(heading: string, locale: WhitepaperLocale) {
  const normalized = heading.toLowerCase();
  const copy = {
    tr: {
      proof: ["Fiş zekası", "Fiyat hafızası", "Günlük sinyal"],
      product: ["Yönlendirilmiş aksiyon", "Günlük yüzey", "Gizli maliyet"],
      token: ["Katılım", "Teşvik tasarımı", "Açık kurallar"],
      privacy: ["Kullanıcı sahipliği", "Kontrollü işleme", "Taşınabilir geçmiş"],
      web3: ["Taşınabilirlik", "İncelenebilir kurallar", "Uzun ömürlü raylar"],
      risk: ["İcra yolu", "Açık sorular", "Uzun vadeli uyum"],
      thesis: ["Tez", "İhtiyaç", "Yön"],
      fallback: ["Ürün tezi", "Kullanıcı anlamı", "Sistem mantığı"],
    },
    en: {
      proof: ["Receipt intelligence", "Price memory", "Daily signal"],
      product: ["Guided action", "Everyday surface", "Hidden cost"],
      token: ["Participation", "Incentive design", "Open rules"],
      privacy: ["User ownership", "Controlled processing", "Portable history"],
      web3: ["Portability", "Inspectable rules", "Long-lived rails"],
      risk: ["Execution path", "Open questions", "Long-term fit"],
      thesis: ["Thesis", "Need", "Direction"],
      fallback: ["Product thesis", "User meaning", "System logic"],
    },
    es: {
      proof: ["Inteligencia del recibo", "Memoria de precios", "Señal diaria"],
      product: ["Acción guiada", "Superficie diaria", "Costo oculto"],
      token: ["Participación", "Diseño de incentivos", "Reglas abiertas"],
      privacy: ["Propiedad del usuario", "Procesamiento controlado", "Historial portable"],
      web3: ["Portabilidad", "Reglas visibles", "Rieles duraderos"],
      risk: ["Ruta de ejecución", "Preguntas abiertas", "Ajuste a largo plazo"],
      thesis: ["Tesis", "Necesidad", "Dirección"],
      fallback: ["Tesis del producto", "Significado para el usuario", "Lógica del sistema"],
    },
    ru: {
      proof: ["Интеллект чеков", "Ценовая память", "Ежедневный сигнал"],
      product: ["Направленное действие", "Повседневная поверхность", "Скрытая стоимость"],
      token: ["Участие", "Дизайн стимулов", "Открытые правила"],
      privacy: ["Пользовательское владение", "Контролируемая обработка", "Переносимая история"],
      web3: ["Переносимость", "Проверяемые правила", "Долгоживущие рельсы"],
      risk: ["Путь исполнения", "Открытые вопросы", "Долгосрочное соответствие"],
      thesis: ["Тезис", "Потребность", "Направление"],
      fallback: ["Тезис продукта", "Смысл для пользователя", "Логика системы"],
    },
    th: {
      proof: ["ข่าวกรองจากใบเสร็จ", "หน่วยความจำราคา", "สัญญาณประจำวัน"],
      product: ["การกระทำที่มีผู้ช่วยนำทาง", "พื้นผิวรายวัน", "ต้นทุนที่ซ่อนอยู่"],
      token: ["การมีส่วนร่วม", "การออกแบบแรงจูงใจ", "กติกาที่เปิดเผย"],
      privacy: ["ความเป็นเจ้าของของผู้ใช้", "การประมวลผลที่ควบคุมได้", "ประวัติที่พกพาได้"],
      web3: ["การพกพาได้", "กติกาที่ตรวจสอบได้", "รางที่มีอายุยืน"],
      risk: ["เส้นทางการดำเนินงาน", "คำถามที่ยังเปิดอยู่", "ความเข้ากันได้ระยะยาว"],
      thesis: ["วิทยานิพนธ์", "ความต้องการ", "ทิศทาง"],
      fallback: ["วิทยานิพนธ์ของผลิตภัณฑ์", "ความหมายต่อผู้ใช้", "ตรรกะของระบบ"],
    },
    zh: {
      proof: ["小票智能", "价格记忆", "日常信号"],
      product: ["被引导的行动", "日常界面", "隐藏成本"],
      token: ["参与", "激励设计", "开放规则"],
      privacy: ["用户所有权", "受控处理", "可迁移历史"],
      web3: ["可迁移性", "可审视规则", "长寿命轨道"],
      risk: ["执行路径", "开放问题", "长期适配"],
      thesis: ["论点", "需求", "方向"],
      fallback: ["产品论点", "用户意义", "系统逻辑"],
    },
  }[locale];

  if (
    normalized.includes("proof") ||
    normalized.includes("expense") ||
    normalized.includes("harcama") ||
    normalized.includes("fiyat")
  ) {
    return copy.proof;
  }

  if (
    normalized.includes("yumbie") ||
    normalized.includes("product") ||
    normalized.includes("surface") ||
    normalized.includes("yüzey")
  ) {
    return copy.product;
  }

  if (
    normalized.includes("token") ||
    normalized.includes("contribution") ||
    normalized.includes("katkı") ||
    normalized.includes("distribution") ||
    normalized.includes("ödül")
  ) {
    return copy.token;
  }

  if (
    normalized.includes("privacy") ||
    normalized.includes("data") ||
    normalized.includes("mahremiyet") ||
    normalized.includes("veri")
  ) {
    return copy.privacy;
  }

  if (
    normalized.includes("web3") ||
    normalized.includes("decentral") ||
    normalized.includes("ray") ||
    normalized.includes("zincir")
  ) {
    return copy.web3;
  }

  if (
    normalized.includes("risk") ||
    normalized.includes("roadmap") ||
    normalized.includes("varsayım") ||
    normalized.includes("soru")
  ) {
    return copy.risk;
  }

  if (
    normalized.includes("category") ||
    normalized.includes("problem") ||
    normalized.includes("mission") ||
    normalized.includes("opening") ||
    normalized.includes("açılış")
  ) {
    return copy.thesis;
  }

  return copy.fallback;
}

const sectionThemes: SectionTheme[] = [
  {
    border: "rgba(232, 201, 122, 0.18)",
    panel:
      "linear-gradient(145deg, rgba(28,22,16,0.92) 0%, rgba(15,14,20,0.96) 100%)",
    accent: "#E8C97A",
    accentSoft: "#F4DDA0",
    glow: "radial-gradient(circle at 12% 12%, rgba(232,201,122,0.16), transparent 36%)",
    chip: "rgba(232, 201, 122, 0.12)",
  },
  {
    border: "rgba(251, 146, 60, 0.18)",
    panel:
      "linear-gradient(145deg, rgba(34,20,12,0.92) 0%, rgba(20,14,20,0.96) 100%)",
    accent: "#FB923C",
    accentSoft: "#FDBA74",
    glow: "radial-gradient(circle at 86% 12%, rgba(251,146,60,0.15), transparent 34%)",
    chip: "rgba(251, 146, 60, 0.12)",
  },
  {
    border: "rgba(94, 234, 212, 0.18)",
    panel:
      "linear-gradient(145deg, rgba(10,25,27,0.92) 0%, rgba(14,16,24,0.96) 100%)",
    accent: "#5EEAD4",
    accentSoft: "#A5F3FC",
    glow: "radial-gradient(circle at 14% 84%, rgba(94,234,212,0.14), transparent 34%)",
    chip: "rgba(94, 234, 212, 0.10)",
  },
];

const markdownComponents = {
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 className="scroll-mt-24 text-[24px] font-bold leading-tight tracking-[-0.03em] text-white md:text-[30px]">
      {children}
    </h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 className="mt-14 scroll-mt-24 border-b border-white/10 pb-4 text-[24px] font-semibold leading-snug tracking-[-0.03em] text-white md:text-[30px]">
      <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E8C97A]/20 bg-[#E8C97A]/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#E8C97A]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#E8C97A]" />
        Section
      </span>
      <span className="mt-3 block">{children}</span>
    </h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 className="mt-10 scroll-mt-24 text-[19px] font-semibold tracking-[-0.02em] text-white md:text-[22px]">
      {children}
    </h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 className="mt-8 scroll-mt-24 text-[15px] font-semibold uppercase tracking-[0.14em] text-[#E8C97A] md:text-[16px]">
      {children}
    </h4>
  ),
  p: ({ children }: { children: React.ReactNode }) => {
    const className =
      "mt-5 max-w-3xl text-[15.5px] leading-[1.88] text-[#dddde4] md:text-[16.5px]";

    if (hasBlockChild(children)) {
      return <div className={className}>{children}</div>;
    }

    return <p className={className}>{children}</p>;
  },
  a: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      {...rest}
      href={href}
      className="font-medium text-[#E8C97A] underline decoration-[#C9A84C]/50 underline-offset-[3px] transition-colors hover:text-[#F0D080] hover:decoration-[#C9A84C]"
    >
      {children}
    </a>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="mt-5 max-w-3xl list-disc space-y-2.5 pl-6 text-[15.5px] leading-[1.78] text-[#d8d8de] marker:text-[#C9A84C] md:text-[16.5px]">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="mt-5 max-w-3xl list-decimal space-y-2.5 pl-6 text-[15.5px] leading-[1.78] text-[#d8d8de] marker:text-[#C9A84C] md:text-[16.5px]">
      {children}
    </ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => <li className="pl-1">{children}</li>,
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-white">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-[#ececf1]">{children}</em>
  ),
  hr: () => (
    <hr className="my-10 h-px border-0 bg-gradient-to-r from-transparent via-white/12 to-transparent" />
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="mt-8 max-w-3xl rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-5 py-5 text-[#ececf1] shadow-[0_22px_42px_rgba(0,0,0,0.18)]">
      {children}
    </blockquote>
  ),
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="mt-7 overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.02] shadow-[0_18px_44px_rgba(0,0,0,0.18)]">
      <table className="min-w-full border-collapse text-left text-[14px] md:text-[15px]">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-white/[0.04]">{children}</thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children: React.ReactNode }) => (
    <tr className="border-t border-white/[0.06] align-top">{children}</tr>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#E8C97A]">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 leading-[1.7] text-[#d8d8de]">{children}</td>
  ),
  pre({ children }: { children?: React.ReactNode }) {
    const childArray = React.Children.toArray(children);
    const firstElement = childArray.find(React.isValidElement);
    const codeProps = firstElement
      ? (firstElement.props as {
          className?: string;
          children?: React.ReactNode;
        })
      : undefined;
    const className = codeProps?.className ?? "";
    const language = className.replace("language-", "");
    const value = String(codeProps?.children ?? "").replace(/\n$/, "");

    if (language === "mermaid") {
      return <MermaidDiagram chart={value} />;
    }

    return (
      <pre className="mt-7 overflow-x-auto rounded-2xl border border-white/[0.08] bg-black/60 p-4 text-[13.5px] leading-[1.7] text-gray-100 shadow-[0_18px_42px_rgba(0,0,0,0.2)]">
        <code className="font-mono">{value || children}</code>
      </pre>
    );
  },
  code(props: { className?: string; children?: React.ReactNode }) {
    const { className, children } = props;
    if (className && className.includes("language-")) {
      return <>{children}</>;
    }
    return (
      <code className="rounded-md border border-white/[0.08] bg-white/[0.05] px-1.5 py-0.5 font-mono text-[0.88em] text-[#E8C97A]">
        {children}
      </code>
    );
  },
};

function MarkdownChunk({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return null;

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as Components}>
      {markdown}
    </ReactMarkdown>
  );
}

function ChapterVisual({
  accent,
  accentSoft,
  border,
  sectionNo,
  signals,
  excerpt,
  mirrored,
  label,
}: {
  accent: string;
  accentSoft: string;
  border: string;
  sectionNo: string;
  signals: string[];
  excerpt: string;
  mirrored: boolean;
  label: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_48px_rgba(0,0,0,0.18)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: mirrored
            ? `radial-gradient(circle at 78% 22%, ${accent}22, transparent 30%), linear-gradient(180deg, transparent, rgba(255,255,255,0.02))`
            : `radial-gradient(circle at 22% 18%, ${accent}22, transparent 30%), linear-gradient(180deg, transparent, rgba(255,255,255,0.02))`,
        }}
      />
      <div
        aria-hidden
        className={`absolute ${mirrored ? "left-4" : "right-4"} top-4 text-[84px] font-black leading-none tracking-[-0.08em] text-white/[0.05]`}
      >
        {sectionNo}
      </div>

      <div className="relative">
        <div className={`flex ${mirrored ? "justify-end" : "justify-start"}`}>
          <div
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.22em]"
            style={{
              borderColor: border,
              color: accentSoft,
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
            {label}
          </div>
        </div>

        <div className={`mt-5 flex ${mirrored ? "justify-end" : "justify-start"}`}>
          <div className="grid w-full max-w-[230px] gap-2">
            {signals.map((signal, index) => (
              <div
                key={signal}
                className="rounded-2xl border px-3 py-2 text-[11px] font-medium text-white/84"
                style={{
                  borderColor: border,
                  background:
                    index === 0
                      ? `linear-gradient(135deg, ${accent}22, rgba(255,255,255,0.04))`
                      : "rgba(255,255,255,0.03)",
                }}
              >
                {signal}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-3">
          <div className={`flex ${mirrored ? "justify-start" : "justify-end"}`}>
            <div
              className="h-24 w-24 rounded-full border"
              style={{
                borderColor: border,
                background: `radial-gradient(circle at 35% 35%, ${accent}55, rgba(255,255,255,0.03) 58%, transparent 60%)`,
                boxShadow: `0 0 42px ${accent}22`,
              }}
            />
          </div>
          <div
            className={`h-px w-full bg-gradient-to-r ${mirrored ? "from-white/10 via-white/35 to-transparent" : "from-transparent via-white/35 to-white/10"}`}
          />
          <p className="max-w-[24ch] text-sm leading-[1.8] text-white/70">
            {excerpt}
          </p>
        </div>
      </div>
    </div>
  );
}

export function WhitepaperMarkdown({ locale, markdown }: WhitepaperMarkdownProps) {
  const document = parseMarkdownDocument(markdown);
  const introSplit = splitLeadFromBody(document.intro);
  const ui = whitepaperUiStrings[locale];

  return (
    <div className="whitepaper-prose space-y-8 md:space-y-10">
      {document.intro ? (
        <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.018))] px-5 py-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] md:px-7 md:py-8">
          <div
            aria-hidden
            className="absolute inset-0 opacity-90"
            style={{
              background:
                "radial-gradient(circle at 8% 10%, rgba(232,201,122,0.14), transparent 24%), radial-gradient(circle at 86% 16%, rgba(236,72,153,0.08), transparent 28%)",
            }}
          />

          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.65fr)] lg:items-start">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E8C97A]/18 bg-[#E8C97A]/[0.08] px-3 py-1 text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.24em] text-[#F4DDA0]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E8C97A]" />
                {ui.readingSurface}
              </div>
              {introSplit.lead ? (
                <p className="mt-4 max-w-[22ch] font-serif text-[28px] leading-[1.22] tracking-[-0.03em] text-white md:text-[38px]">
                  {stripMarkdownToText(introSplit.lead)}
                </p>
              ) : null}
              {introSplit.remainder ? (
                <div className="mt-6" style={{ maxInlineSize: "66ch" }}>
                  <MarkdownChunk markdown={introSplit.remainder} />
                </div>
              ) : null}
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 18% 16%, rgba(232,201,122,0.24), transparent 28%), radial-gradient(circle at 78% 74%, rgba(236,72,153,0.16), transparent 32%)",
                }}
              />
              <div className="relative flex h-full min-h-[280px] flex-col justify-between">
                <div>
                  <div className="text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.24em] text-[#E8C97A]">
                    {ui.pageThesis}
                  </div>
                  <p className="mt-4 max-w-[18ch] font-serif text-[20px] leading-[1.35] tracking-[-0.02em] text-white md:text-[24px]">
                    {getManifestoExcerpt(document.intro, 150)}
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[ui.narrativeFirst, ui.signalRichStructure, ui.designedBreathingRoom].map(
                      (item, index) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 px-3 py-3 text-[11px] font-medium text-white/78"
                          style={{
                            background:
                              index === 1
                                ? "linear-gradient(135deg, rgba(232,201,122,0.14), rgba(255,255,255,0.03))"
                                : "rgba(255,255,255,0.03)",
                          }}
                        >
                          {item}
                        </div>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 via-white/35 to-transparent" />
                    <div className="h-3 w-3 rounded-full bg-[#E8C97A] shadow-[0_0_22px_rgba(232,201,122,0.65)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {document.sections.map((section, index) => {
        const theme = sectionThemes[index % sectionThemes.length];
        const split = splitLeadFromBody(section.body);
        const signals = getSectionSignals(section.heading, locale);
        const sectionNo = String(index + 1).padStart(2, "0");
        const mirrored = index % 2 === 1;
        const sectionExcerpt = getManifestoExcerpt(split.lead ?? section.body, 150);

        return (
          <section
            key={`${section.heading}-${index}`}
            className="relative overflow-hidden rounded-[34px] border shadow-[0_30px_80px_rgba(0,0,0,0.28)]"
            style={{
              borderColor: theme.border,
              background: theme.panel,
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: theme.glow,
              }}
            />

            <div className="relative border-b border-white/[0.08] px-5 py-6 md:px-7 md:py-7">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.22fr)_minmax(280px,0.78fr)] lg:items-start">
                <div className={`min-w-0 ${mirrored ? "lg:order-2" : ""}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.22em]"
                      style={{
                        borderColor: theme.border,
                        background: theme.chip,
                        color: theme.accentSoft,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: theme.accent }}
                      />
                      {ui.section} {sectionNo}
                    </span>
                    <span className="h-px w-12 bg-gradient-to-r from-white/40 to-transparent" />
                  </div>

                  <h2 className="mt-4 max-w-[14ch] text-[31px] font-black leading-[0.96] tracking-[-0.045em] text-white md:text-[44px]">
                    {section.heading}
                  </h2>

                  <p className="mt-5 max-w-[24ch] font-serif text-[20px] leading-[1.4] tracking-[-0.02em] text-white/90 md:text-[26px]">
                    {sectionExcerpt}
                  </p>
                </div>

                <div className={mirrored ? "lg:order-1" : ""}>
                  <ChapterVisual
                    accent={theme.accent}
                    accentSoft={theme.accentSoft}
                    border={theme.border}
                    sectionNo={sectionNo}
                    signals={signals}
                    excerpt={takePreviewText(section.body, 140)}
                    mirrored={mirrored}
                    label={ui.chapterAtmosphere}
                  />
                </div>
              </div>
            </div>

            <div className="relative px-5 py-6 md:px-7 md:py-8">
              {split.lead ? (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
                  <p className="max-w-[24ch] font-serif text-[23px] leading-[1.42] tracking-[-0.02em] text-white md:text-[29px]">
                    {stripMarkdownToText(split.lead)}
                  </p>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <div
                      className="text-[10px] font-[family:var(--font-orbitron)] uppercase tracking-[0.2em]"
                      style={{ color: theme.accentSoft }}
                    >
                      {ui.focus}
                    </div>
                    <p className="mt-3 text-sm leading-[1.75] text-white/70">
                      {getManifestoExcerpt(split.lead, 120)}
                    </p>
                  </div>
                </div>
              ) : null}

              {split.remainder ? (
                <div className={split.lead ? "mt-7" : ""} style={{ maxInlineSize: "66ch" }}>
                  <MarkdownChunk markdown={split.remainder} />
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
