"use client";

/**
 * Result-screen brand prompt (scanui dark-only idiom — deliberate exception to
 * theme parity, per the result-screen design language).
 *
 * Shown for a line item whose brand could not be determined but is expected
 * (brand_status = 'needs_user'). We never fabricate a brand: the user picks a
 * suggestion, types one, or marks the item as having no brand. The answer is
 * persisted via POST /api/receipt/line-item/brand.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppLocale } from "@/lib/i18n/app-context";

interface BrandPromptProps {
  lineItemId: number;
  productName: string;
  onResolved?: (brand: string | null) => void;
}

export function BrandPrompt({ lineItemId, productName, onResolved }: BrandPromptProps) {
  const { t } = useAppLocale();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [savedBrand, setSavedBrand] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const tmo = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/brands/search?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        const data = await res.json();
        setSuggestions(Array.isArray(data.brands) ? data.brands.slice(0, 6) : []);
      } catch {
        /* aborted or offline — ignore */
      }
    }, 180);
    return () => clearTimeout(tmo);
  }, [query]);

  async function save(opts: { brand?: string; unbranded?: boolean }) {
    if (saving || done) return;
    setSaving(true);
    try {
      const res = await fetch("/api/receipt/line-item/brand", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lineItemId, ...opts }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSavedBrand(data.brand ?? null);
        setDone(true);
        onResolved?.(data.brand ?? null);
      }
    } catch {
      /* swallow; the prompt stays open so the user can retry */
    } finally {
      setSaving(false);
    }
  }

  const typed = query.trim();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <motion.div
          key="done"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            background: "rgba(63,217,160,0.1)",
            border: "1px solid rgba(63,217,160,0.28)",
          }}
        >
          <span className="text-sm leading-none">✅</span>
          <span className="text-[12px] font-medium text-white/80">
            {t("receiptDetail.brandSaved")}
          </span>
          {savedBrand && (
            <span className="text-[12px] font-semibold text-white">· {savedBrand}</span>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="prompt"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 overflow-hidden rounded-xl p-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px dashed rgba(255,255,255,0.18)",
          }}
        >
          <p className="text-[12px] font-semibold text-white/85">
            {t("receiptDetail.brandQuestion")}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/45">
            {t("receiptDetail.brandHint")}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && typed) save({ brand: typed });
              }}
              placeholder={t("receiptDetail.brandPlaceholder")}
              className="min-w-0 flex-1 rounded-lg bg-white/[0.06] px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/35 focus:bg-white/[0.09]"
              style={{ border: "1px solid rgba(255,255,255,0.12)" }}
            />
            <button
              type="button"
              disabled={!typed || saving}
              onClick={() => save({ brand: typed })}
              className="shrink-0 rounded-lg px-3 py-2 text-[12px] font-semibold transition disabled:opacity-40"
              style={{
                background: "linear-gradient(140deg,#FFD37A,#FFB23E)",
                color: "#1c1638",
              }}
            >
              {t("receiptDetail.brandSave")}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2 flex flex-wrap gap-1.5"
              >
                {suggestions.map((b) => (
                  <button
                    key={b}
                    type="button"
                    disabled={saving}
                    onClick={() => save({ brand: b })}
                    className="rounded-full px-2.5 py-1 text-[11.5px] font-medium text-white/80 transition hover:text-white"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {b}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            disabled={saving}
            onClick={() => save({ unbranded: true })}
            className="mt-2 text-[11px] font-medium text-white/45 underline-offset-2 transition hover:text-white/70 hover:underline disabled:opacity-40"
          >
            {t("receiptDetail.brandUnbranded")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
