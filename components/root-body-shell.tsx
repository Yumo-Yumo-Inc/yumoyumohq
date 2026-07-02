"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ErrorBoundary } from "@/components/error-boundary";

/**
 * Single client boundary for root layout: keeps ErrorBoundary + Toaster in one module
 * to avoid dev-time webpack chunk issues around undefined component types.
 */
export function RootBodyShell({ children }: { children: ReactNode }) {
  return (
    <>
      <ErrorBoundary>{children}</ErrorBoundary>
      <Toaster />
    </>
  );
}
