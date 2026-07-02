"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";

/**
 * The deep receipt view is no longer a standalone page — it opens as an in-place
 * modal on the receipts feed. This route is kept only as a compatibility redirect
 * so existing links (`/app/receipts/<id>`) still resolve: they forward to
 * `/app/receipts?receipt=<id>`, which opens the modal.
 */
export default function ReceiptDetailRedirect() {
  const params = useParams();
  const router = useRouter();
  const receiptId = (params?.id as string | undefined)?.trim();

  useEffect(() => {
    if (receiptId) {
      router.replace(`/app/receipts?receipt=${encodeURIComponent(receiptId)}`);
    } else {
      router.replace("/app/receipts");
    }
  }, [receiptId, router]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-4 px-4 pt-4">
        <div className="h-8 w-1/3 animate-pulse rounded" style={{ background: "var(--app-bg-elevated)" }} />
        <div className="h-72 animate-pulse rounded-2xl" style={{ background: "var(--app-bg-elevated)" }} />
      </div>
    </AppShell>
  );
}
