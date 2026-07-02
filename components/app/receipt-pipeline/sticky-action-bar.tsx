"use client";

import type { ReactNode } from "react";

interface StickyActionBarProps {
  secondary: ReactNode;
  primary: ReactNode;
}

export function StickyActionBar({ secondary, primary }: StickyActionBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
      style={{
        background: "var(--app-nav-bg)",
        borderColor: "var(--app-border)",
      }}
    >
      <div className="mx-auto flex w-full max-w-lg gap-3">
        <div className="flex-1">{secondary}</div>
        <div className="flex-1">{primary}</div>
      </div>
    </div>
  );
}
