"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface ReceiptPipelineShellProps {
  title: string;
  onBack: () => void;
  hasStickyAction?: boolean;
  children: ReactNode;
}

export function ReceiptPipelineShell({
  title,
  onBack,
  hasStickyAction = false,
  children,
}: ReceiptPipelineShellProps) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-6 pt-2">
      <header className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: "var(--receipt-card-bg, var(--app-bg-surface))",
            border: "1px solid var(--receipt-card-border, var(--app-border))",
            color: "var(--app-text-primary)",
          }}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: "var(--app-text-primary)" }}>
          {title}
        </h1>
      </header>

      <div className={`space-y-4 ${hasStickyAction ? "pb-28" : ""}`}>{children}</div>
    </div>
  );
}
