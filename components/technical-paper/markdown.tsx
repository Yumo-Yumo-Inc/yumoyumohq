import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/components/whitepaper/mermaid-diagram";

const BLOCK_TAGS = new Set([
  "pre", "table", "div", "ul", "ol", "blockquote", "figure",
]);

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

// Minimal JSON syntax highlighter. We deliberately keep this lightweight — no
// Shiki / Prism dependency, no per-page WASM. Only tokenises keys, strings,
// numbers, booleans, and line comments. Everything else stays plain.
function highlightJson(source: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < source.length) {
    // Line comments
    if (source[i] === "/" && source[i + 1] === "/") {
      const end = source.indexOf("\n", i);
      const slice = source.slice(i, end === -1 ? source.length : end);
      out.push(
        <span key={key++} style={{ color: "#6B7280" }}>
          {slice}
        </span>
      );
      i = end === -1 ? source.length : end;
      continue;
    }

    // Strings
    if (source[i] === '"') {
      let j = i + 1;
      while (j < source.length && source[j] !== '"') {
        if (source[j] === "\\") j += 2;
        else j += 1;
      }
      const slice = source.slice(i, j + 1);
      // Look ahead: is this a key (followed by colon)?
      let k = j + 1;
      while (k < source.length && /\s/.test(source[k])) k++;
      const isKey = source[k] === ":";
      out.push(
        <span
          key={key++}
          style={{ color: isKey ? "#93C5FD" : "#FCA5A5" }}
        >
          {slice}
        </span>
      );
      i = j + 1;
      continue;
    }

    // Numbers
    if (/[0-9-]/.test(source[i]) && (i === 0 || /[\s:,\[\{]/.test(source[i - 1]))) {
      let j = i;
      while (j < source.length && /[0-9.eE+-]/.test(source[j])) j++;
      const slice = source.slice(i, j);
      if (slice && /^-?\d/.test(slice)) {
        out.push(
          <span key={key++} style={{ color: "#FBBF24" }}>
            {slice}
          </span>
        );
        i = j;
        continue;
      }
    }

    // Booleans / null
    const word = source.slice(i, i + 5);
    if (word.startsWith("true") || word.startsWith("null")) {
      const len = word.startsWith("true") || word.startsWith("null") ? 4 : 5;
      out.push(
        <span key={key++} style={{ color: "#FBBF24" }}>
          {source.slice(i, i + len)}
        </span>
      );
      i += len;
      continue;
    }
    if (source.slice(i, i + 5) === "false") {
      out.push(
        <span key={key++} style={{ color: "#FBBF24" }}>
          false
        </span>
      );
      i += 5;
      continue;
    }

    // Punctuation / whitespace — render as plain
    out.push(
      <span key={key++} style={{ color: "#D1D5DB" }}>
        {source[i]}
      </span>
    );
    i += 1;
  }

  return out;
}

type TechnicalPaperMarkdownProps = {
  markdown: string;
};

export function TechnicalPaperMarkdown({ markdown }: TechnicalPaperMarkdownProps) {
  return (
    <div className="tp-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1
              className="scroll-mt-24 text-[28px] font-medium leading-tight tracking-[-0.02em] md:text-[32px]"
              style={{ color: "#F9FAFB" }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            // Auto-generate slug from heading text for anchor links from the sidebar.
            const text = React.Children.toArray(children)
              .map((c) => (typeof c === "string" ? c : ""))
              .join("");
            const anchor =
              text
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .trim()
                .replace(/\s+/g, "-") || "section";
            return (
              <h2
                id={anchor}
                className="mt-12 scroll-mt-24 pb-2 text-[20px] font-medium leading-snug tracking-[-0.01em] md:text-[22px]"
                style={{
                  color: "#F9FAFB",
                  borderBottom: "0.5px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3
              className="mt-9 scroll-mt-24 text-[16px] font-medium md:text-[17px]"
              style={{ color: "#F9FAFB" }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              className="mt-7 scroll-mt-24 text-[14px] font-medium md:text-[15px]"
              style={{ color: "#A78BFA" }}
            >
              {children}
            </h4>
          ),
          p: ({ children }) => {
            if (hasBlockChild(children)) {
              return (
                <div
                  className="mt-4 text-[14.5px] leading-[1.7] md:text-[15px]"
                  style={{ color: "#D1D5DB" }}
                >
                  {children}
                </div>
              );
            }
            return (
              <p
                className="mt-4 text-[14.5px] leading-[1.7] md:text-[15px]"
                style={{ color: "#D1D5DB" }}
              >
                {children}
              </p>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              className="font-medium underline underline-offset-[3px] transition-colors"
              style={{ color: "#A78BFA", textDecorationColor: "rgba(167, 139, 250, 0.25)" }}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul
              className="mt-4 list-disc space-y-2 pl-6 text-[14.5px] leading-[1.7] md:text-[15px]"
              style={{ color: "#D1D5DB" }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className="mt-4 list-decimal space-y-2 pl-6 text-[14.5px] leading-[1.7] md:text-[15px]"
              style={{ color: "#D1D5DB" }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1" style={{ color: "#D1D5DB" }}>
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-medium" style={{ color: "#F9FAFB" }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic" style={{ color: "#D1D5DB" }}>
              {children}
            </em>
          ),
          hr: () => (
            <hr
              className="my-10 h-px border-0"
              style={{ background: "rgba(255, 255, 255, 0.1)" }}
            />
          ),
          blockquote: ({ children }) => {
            // Sniff content for TBD / pending status — render as amber callout.
            // Otherwise render as the default purple metadata box.
            const text = React.Children.toArray(children)
              .map((c) => (typeof c === "string" ? c : ""))
              .join("");
            const flatText = JSON.stringify(children).toLowerCase();
            const isTbd =
              /\btbd\b/i.test(text) ||
              flatText.includes("\"tbd") ||
              flatText.includes("taslak bekliyor") ||
              flatText.includes("draft pending") ||
              flatText.includes("pending —");

            if (isTbd) {
              return (
                <div
                  className="mt-6 px-4 py-3"
                  style={{
                    borderLeft: "2px solid #FCD34D",
                    background: "rgba(252, 211, 77, 0.06)",
                    color: "#D1D5DB",
                    borderRadius: 0,
                  }}
                >
                  <div
                    className="mb-1 text-[10px] font-medium uppercase tracking-[0.08em]"
                    style={{
                      fontFamily:
                        "var(--font-jetbrains-mono), ui-monospace, Menlo, Consolas, monospace",
                      color: "#FCD34D",
                    }}
                  >
                    TBD
                  </div>
                  <div className="text-[14px] leading-[1.6]">{children}</div>
                </div>
              );
            }

            return (
              <blockquote
                className="mt-6 px-4 py-3 text-[14px]"
                style={{
                  borderLeft: "2px solid #A78BFA",
                  background: "rgba(167, 139, 250, 0.08)",
                  color: "#D1D5DB",
                  borderRadius: 0,
                }}
              >
                {children}
              </blockquote>
            );
          },
          table: ({ children }) => {
            // Inspect header text to pick a colour scheme per table.
            // Categories: risk/warning, metric/cost, data/schema, default(info).
            const childArray = React.Children.toArray(children);
            let headerText = "";
            const walk = (n: React.ReactNode): void => {
              if (typeof n === "string") {
                headerText += " " + n.toLowerCase();
                return;
              }
              if (React.isValidElement(n)) {
                const el = n as React.ReactElement<{ children?: React.ReactNode }>;
                const c = el.props?.children;
                if (c) React.Children.toArray(c).forEach(walk);
              }
            };
            childArray.forEach(walk);

            type Theme = {
              border: string;
              bg: string;
              headBg: string;
              headBorder: string;
              headText: string;
              accent: string;
            };
            const themes: Record<string, Theme> = {
              risk: {
                border: "rgba(252, 211, 77, 0.22)",
                bg: "rgba(252, 211, 77, 0.03)",
                headBg: "rgba(252, 211, 77, 0.09)",
                headBorder: "rgba(252, 211, 77, 0.3)",
                headText: "#FCD34D",
                accent: "#FCD34D",
              },
              metric: {
                border: "rgba(96, 165, 250, 0.22)",
                bg: "rgba(96, 165, 250, 0.03)",
                headBg: "rgba(96, 165, 250, 0.09)",
                headBorder: "rgba(96, 165, 250, 0.3)",
                headText: "#93C5FD",
                accent: "#60A5FA",
              },
              data: {
                border: "rgba(94, 234, 212, 0.22)",
                bg: "rgba(94, 234, 212, 0.03)",
                headBg: "rgba(94, 234, 212, 0.09)",
                headBorder: "rgba(94, 234, 212, 0.3)",
                headText: "#5EEAD4",
                accent: "#5EEAD4",
              },
              info: {
                border: "rgba(167, 139, 250, 0.22)",
                bg: "rgba(167, 139, 250, 0.03)",
                headBg: "rgba(167, 139, 250, 0.09)",
                headBorder: "rgba(167, 139, 250, 0.3)",
                headText: "#C4B5FD",
                accent: "#A78BFA",
              },
            };

            const riskWords = /\b(risk|önlem|failure|arıza|fraud|dolandırıc|mitigation|hata|edge case|uç durum|fallback|yedek)\b/i;
            const metricWords = /\b(cost|maliyet|latency|gecikme|budget|bütçe|sla|p95|p50|p99|throughput|hız|target|hedef|provider|sağlayıc|tier|kademe)\b/i;
            const dataWords = /\b(field|alan|schema|şema|kural|rule|convention|katman|layer|enum|status|durum|signal|sinyal|attribute|öznitelik)\b/i;

            let theme: Theme;
            if (riskWords.test(headerText)) theme = themes.risk;
            else if (metricWords.test(headerText)) theme = themes.metric;
            else if (dataWords.test(headerText)) theme = themes.data;
            else theme = themes.info;

            return (
              <div
                className="mt-6 overflow-x-auto"
                data-tp-table-theme={
                  theme === themes.risk
                    ? "risk"
                    : theme === themes.metric
                      ? "metric"
                      : theme === themes.data
                        ? "data"
                        : "info"
                }
                style={{
                  borderRadius: "6px",
                  border: `0.5px solid ${theme.border}`,
                  background: theme.bg,
                  // Inline CSS custom properties consumed by thead/th below.
                  ["--tp-tbl-head-bg" as string]: theme.headBg,
                  ["--tp-tbl-head-border" as string]: theme.headBorder,
                  ["--tp-tbl-head-text" as string]: theme.headText,
                  ["--tp-tbl-accent" as string]: theme.accent,
                }}
              >
                <table className="min-w-full border-collapse text-left text-[13px] md:text-[13.5px]">
                  {children}
                </table>
              </div>
            );
          },
          thead: ({ children }) => (
            <thead
              style={{
                background: "var(--tp-tbl-head-bg)",
                borderBottom: "0.5px solid var(--tp-tbl-head-border)",
              }}
            >
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr
              className="align-top transition-colors hover:bg-white/[0.03]"
              style={{ borderTop: "0.5px solid rgba(255, 255, 255, 0.06)" }}
            >
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              className="px-3.5 py-2.5 text-[10px] font-medium uppercase tracking-[0.1em]"
              style={{
                color: "var(--tp-tbl-head-text)",
                fontFamily:
                  "var(--font-jetbrains-mono), ui-monospace, Menlo, Consolas, monospace",
              }}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => {
            // First-cell-of-row accent: read the implicit position via the
            // sibling order. react-markdown doesn't pass index, but we can
            // detect with CSS via :first-child instead. Inline style is
            // simplest: use the accent var for the first column.
            return (
              <td
                className="px-3.5 py-2.5 leading-[1.6] [&:first-child]:font-medium"
                style={{
                  color: "#D1D5DB",
                }}
                {...props}
              >
                {children}
              </td>
            );
          },
          pre({ children }) {
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

            const isJson = language === "json" || /^[\s]*[\{\[]/.test(value);
            const content = isJson ? highlightJson(value) : value;
            const langLabel = language || (isJson ? "json" : "");

            return (
              <div
                className="mt-6 overflow-x-auto text-[12.5px] leading-[1.6]"
                style={{
                  background: "#07090C",
                  borderRadius: "6px",
                  border: "0.5px solid rgba(255, 255, 255, 0.1)",
                }}
              >
                {langLabel ? (
                  <div
                    className="flex items-center justify-between px-4 py-2 text-[10px] uppercase tracking-[0.08em]"
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), ui-monospace, Menlo, Consolas, monospace",
                      color: "#6B7280",
                      borderBottom: "0.5px solid rgba(255, 255, 255, 0.06)",
                    }}
                  >
                    <span>{langLabel}</span>
                  </div>
                ) : null}
                <pre className="p-4">
                  <code
                    style={{
                      fontFamily: "var(--font-jetbrains-mono), ui-monospace, Menlo, Consolas, monospace",
                      color: "#D1D5DB",
                    }}
                  >
                    {content}
                  </code>
                </pre>
              </div>
            );
          },
          code(props) {
            const { className, children } = props as {
              className?: string;
              children?: React.ReactNode;
            };
            if (className && className.includes("language-")) {
              return <>{children}</>;
            }
            // Inline code chips (`2048 px` etc.) get the .tp-prose code styling
            // from globals.css. We pass children directly.
            return <code>{children}</code>;
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
