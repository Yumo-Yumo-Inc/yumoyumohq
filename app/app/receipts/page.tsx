"use client";

import { Suspense, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { ErrorState } from "@/components/app/error-state";
import { ReceiptSwipeFeed } from "@/components/app/receipt-swipe-feed";
import { ReceiptDetailModal } from "@/components/app/receipt-detail/receipt-detail-modal";
import { CategoryFilterSheet } from "@/components/app/category-filter-sheet";
import { normalizeReceiptCategory } from "@/lib/receipt/categories";
import { useTier } from "@/lib/theme/theme-context";
import type { Receipt, ReceiptFilters } from "@/lib/mock/types";
import { useAppLocale, translateApiError } from "@/lib/i18n/app-context";
import { useAppProfile } from "@/lib/app/profile-context";
import { RECEIPTS_QUERY_KEY } from "@/lib/app/query-keys";
import { loadBootstrapSnapshot } from "@/lib/bootstrap";
import { localDb } from "@/lib/local-db";
import { readCachedReceipts } from "@/lib/offline/cache";
import { convertCachedReceiptToReceipt } from "@/lib/offline/receipt-cache";
import { syncMobileData } from "@/lib/sync";
import { Search, GalleryVerticalEnd } from "lucide-react";
import {
  getDeletedReceiptIdsFilter,
  rememberDeletedReceiptId,
  stripReceiptIdFromAllReceiptQueries,
} from "@/lib/receipt/deleted-receipt-tombstones";

function buildReceiptsApiQueryString(params: {
  page: number;
  pageSize: number;
  search?: string;
  statusFilter?: string;
  expenseFilter?: string;
  timeRange?: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page));
  qs.set("pageSize", String(params.pageSize));
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.statusFilter) qs.set("statusFilter", params.statusFilter);
  if (params.expenseFilter && params.expenseFilter !== "all") {
    qs.set("expenseFilter", params.expenseFilter);
  }
  if (params.timeRange && params.timeRange !== "all") {
    qs.set("timeRange", params.timeRange);
  }
  return qs.toString();
}

// ── Fetch function (React Query queryFn)
async function fetchReceipts(params: {
  page: number;
  pageSize: number;
  search?: string;
  statusFilter?: string;
  expenseFilter?: string;
  timeRange?: string;
  dateFrom?: string;
  dateTo?: string;
  isAdmin: boolean;
}): Promise<{ receipts: Receipt[]; pagination: { totalPages: number; total: number; page: number } }> {
  await loadBootstrapSnapshot().catch(() => {});

  const { convertReceiptAnalysisToReceipt } = await import("@/lib/receipt/receipt-converter");

  // Admin date-range export: paginate through all server receipts
  if (params.isAdmin) {
    const needsFullScan = !!(params.dateFrom || params.dateTo);

    if (needsFullScan) {
      // Larger batches => fewer roundtrips. 500 still fits well under the
      // server-side maxPageSize (1000) and the JSON response is light.
      const batchSize = 500;
      // 1) Fetch page 1 to learn totalPages.
      const firstQs = buildReceiptsApiQueryString({
        page: 1,
        pageSize: batchSize,
        search: params.search,
        statusFilter: params.statusFilter,
        expenseFilter: params.expenseFilter,
      });
      const firstRes = await fetch(`/api/receipts?${firstQs}`, { credentials: "include" });
      if (!firstRes.ok) {
        const err = new Error(`HTTP ${firstRes.status}`) as Error & { status?: number };
        err.status = firstRes.status;
        throw err;
      }
      const firstData = await firstRes.json();
      const totalPages = Math.min(
        500,
        Math.max(1, Number(firstData.pagination?.totalPages) || 1)
      );
      const allRaw: unknown[] = [...(firstData.receipts ?? [])];

      // 2) Fetch remaining pages in parallel (capped concurrency to avoid
      //    overwhelming the Neon connection pool — 4 at a time is plenty).
      if (totalPages > 1) {
        const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const CONCURRENCY = 4;
        for (let i = 0; i < remaining.length; i += CONCURRENCY) {
          const slice = remaining.slice(i, i + CONCURRENCY);
          const results = await Promise.all(
            slice.map(async (page) => {
              const qs = buildReceiptsApiQueryString({
                page,
                pageSize: batchSize,
                search: params.search,
                statusFilter: params.statusFilter,
                expenseFilter: params.expenseFilter,
              });
              const res = await fetch(`/api/receipts?${qs}`, { credentials: "include" });
              if (!res.ok) {
                const err = new Error(`HTTP ${res.status}`) as Error & { status?: number };
                err.status = res.status;
                throw err;
              }
              return (await res.json()).receipts ?? [];
            })
          );
          for (const r of results) allRaw.push(...r);
        }
      }
      let list = allRaw.map((a) => convertReceiptAnalysisToReceipt(a as import("@/lib/receipt/types").ReceiptAnalysis));
      if (params.dateFrom) list = list.filter((receipt) => receipt.date >= params.dateFrom!);
      if (params.dateTo) list = list.filter((receipt) => receipt.date <= params.dateTo!);
      list = list.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      const total = list.length;
      const totalPagesOut = Math.max(1, Math.ceil(total / params.pageSize));
      const start = (params.page - 1) * params.pageSize;
      const pageItems = list.slice(start, start + params.pageSize);
      return {
        receipts: pageItems,
        pagination: {
          totalPages: totalPagesOut,
          total,
          page: params.page,
        },
      };
    }
  }

  // Primary path: server list (correct status + other-expense merge)
  try {
    const qs = buildReceiptsApiQueryString({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      statusFilter: params.statusFilter,
      expenseFilter: params.expenseFilter,
      timeRange: params.timeRange,
    });
    const res = await fetch(`/api/receipts?${qs}`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      const list = (data.receipts ?? []).map((a: import("@/lib/receipt/types").ReceiptAnalysis) =>
        convertReceiptAnalysisToReceipt(a)
      );
      return {
        receipts: list,
        pagination: {
          totalPages: Math.max(1, Number(data.pagination?.totalPages) || 1),
          total: Number(data.pagination?.total) ?? list.length,
          page: Number(data.pagination?.page) || params.page,
        },
      };
    }
  } catch {
    // Fall through to offline cache below
  }

  // Offline cache fallback
  let list = (await readCachedReceipts()).map(convertCachedReceiptToReceipt);
  const deletedFilter = getDeletedReceiptIdsFilter();
  if (deletedFilter.size > 0) {
    list = list.filter((receipt) => !deletedFilter.has(receipt.id));
  }
  if (params.search) {
    const query = params.search.toLowerCase();
    list = list.filter(
      (receipt) =>
        receipt.merchantName.toLowerCase().includes(query) ||
        receipt.id.toLowerCase().includes(query)
    );
  }
  if (params.statusFilter === "verifiedOnly") {
    list = list.filter(
      (receipt) => receipt.status === "VERIFIED" || receipt.status === "rewarded_other"
    );
  } else if (params.statusFilter) {
    const normalized = params.statusFilter.toLowerCase();
    list = list.filter((receipt) => String(receipt.status).toLowerCase() === normalized);
  }
  if (params.expenseFilter) {
    list = list.filter((receipt) => (receipt.expenseType ?? "personal") === params.expenseFilter);
  }
  const dateFrom = params.dateFrom;
  const dateTo = params.dateTo;
  if (dateFrom) list = list.filter((receipt) => receipt.date >= dateFrom);
  if (dateTo) list = list.filter((receipt) => receipt.date <= dateTo);
  list = list.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  const start = (params.page - 1) * params.pageSize;
  const pageItems = list.slice(start, start + params.pageSize);
  return {
    receipts: pageItems,
    pagination: {
      totalPages,
      total,
      page: params.page,
    },
  };
}

type PeriodKey = "all" | "7d" | "30d" | "90d";

// Maps any raw merchant_category to its canonical category (e.g. supermarket →
// grocery), so real categories are never lost into a guessed "other" bucket.
function canonicalCat(raw?: string | null): string {
  return normalizeReceiptCategory(raw) ?? "other";
}

function periodToDateFrom(period: PeriodKey): string | undefined {
  if (period === "all") return undefined;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function ReceiptsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useAppLocale();
  const { profile } = useAppProfile();
  const queryClient = useQueryClient();
  const accountLevel = profile?.accountLevel ?? 1;
  const tier = useTier(accountLevel);
  const acc = tier.accent;
  const isAdmin = profile?.isAdmin ?? false;

  const [filters, setFilters] = useState<ReceiptFilters>({});
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Receipt detail opens as an in-place modal instead of a separate page.
  const [detailId, setDetailId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [startAtEnd, setStartAtEnd] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [category, setCategory] = useState<string>("all");
  // Larger page so the swipe feed is continuous and category filtering is
  // accurate over the whole loaded set (not just one page of 10).
  const pageSize = 100;
  const isLocalDev = process.env.NODE_ENV === "development";
  const byLocale = (tr: string, en: string, ru: string, th: string, es: string, zh: string) => {
    if (locale === "tr") return tr;
    if (locale === "ru") return ru;
    if (locale === "th") return th;
    if (locale === "es") return es;
    if (locale === "zh") return zh;
    return en;
  };

  const queryParams = {
    page: currentPage,
    pageSize,
    search: filters.search?.trim() || undefined,
    statusFilter: undefined,
    expenseFilter: undefined,
    timeRange: period,
    dateFrom: periodToDateFrom(period),
    dateTo: undefined,
    isAdmin,
  };

  const {
    data: receiptsData,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: RECEIPTS_QUERY_KEY(queryParams),
    queryFn: () => fetchReceipts(queryParams),
    staleTime: 60_000,          // 1-minute freshness — instant display on tab switch
    placeholderData: (prev) => prev, // keep the previous list while page/filter changes
  });

  const receipts = receiptsData?.receipts ?? [];
  const totalPages = receiptsData?.pagination.totalPages ?? 1;

  // Canonical categories present in the loaded set, with counts, for the picker.
  const categoryCounts = receipts.reduce<Record<string, number>>((acc, r) => {
    const key = canonicalCat(r.category);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const categoryOptions = Object.entries(categoryCounts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
  const displayReceipts =
    category === "all" ? receipts : receipts.filter((r) => canonicalCat(r.category) === category);

  const errorMessage = isError
    ? ((queryError as any)?.status === 401
        ? t("receipts.error.login") + " (401)"
        : t("receipts.error.load"))
    : null;

  const toUiStatus = (status: string): Receipt["status"] => {
    if (status === "verified") return "VERIFIED";
    if (status === "rejected") return "REJECTED";
    if (status === "pending") return "PENDING";
    if (status === "analyzed") return "analyzed";
    if (status === "rewarded_other") return "rewarded_other";
    return "scanned";
  };

  // Reset the page to 1 when filters change
  const handleFilterChange = (next: ReceiptFilters) => {
    setFilters(next);
    setCurrentPage(1);
    setStartAtEnd(false);
  };

  const handlePeriodChange = (p: PeriodKey) => {
    setPeriod(p);
    setCategory("all");
    setCurrentPage(1);
    setStartAtEnd(false);
  };

  // ── Swipe feed navigation (continuous flow instead of pagination) ──
  // Detail is no longer a separate page; it opens as a modal on the same screen.
  const handleOpenReceipt = (id: string) => setDetailId(id);
  const handleVerifyReceipt = (id: string) => router.push(`/app/claim/${id}`);

  // Deep links / cross-page entries land here as `?receipt=<id>` and open the modal.
  const receiptParam = searchParams?.get("receipt") ?? null;
  useEffect(() => {
    if (receiptParam) setDetailId(receiptParam);
  }, [receiptParam]);

  const handleCloseDetail = () => {
    setDetailId(null);
    // Drop the deep-link param so closing does not re-open on the next render.
    if (receiptParam) {
      const next = new URLSearchParams(Array.from(searchParams?.entries() ?? []));
      next.delete("receipt");
      const qs = next.toString();
      router.replace(qs ? `/app/receipts?${qs}` : "/app/receipts", { scroll: false });
    }
  };

  // Silently prefetch the next page as the active card nears the end of the current page.
  const prefetchNextPage = () => {
    if (currentPage >= totalPages) return;
    const nextParams = { ...queryParams, page: currentPage + 1 };
    queryClient.prefetchQuery({
      queryKey: RECEIPTS_QUERY_KEY(nextParams),
      queryFn: () => fetchReceipts(nextParams),
      staleTime: 60_000,
    });
  };

  const handleReachEnd = () => {
    if (currentPage < totalPages) {
      setStartAtEnd(false);
      setCurrentPage((p) => p + 1);
    }
  };

  const handleReachStart = () => {
    if (currentPage > 1) {
      setStartAtEnd(true);
      setCurrentPage((p) => p - 1);
    }
  };

  const handleDelete = async (receiptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(t("receipts.deleteConfirm"))) return;
    try {
      setDeletingId(receiptId);
      const response = await fetch(`/api/receipts/${encodeURIComponent(receiptId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        // Server has no row (already deleted or never persisted) — still drop local ghost so UI matches.
        if (response.status === 404) {
          rememberDeletedReceiptId(receiptId);
          await localDb.delete("receipts", receiptId).catch(() => {});
          await syncMobileData().catch(() => null);
          stripReceiptIdFromAllReceiptQueries(queryClient, receiptId);
          await queryClient.invalidateQueries({ queryKey: ["receipts"] });
          return;
        }
        throw new Error(err.error || t("receipts.error.delete"));
      }
      rememberDeletedReceiptId(receiptId);
      await localDb.delete("receipts", receiptId);
      await syncMobileData().catch(() => null);
      stripReceiptIdFromAllReceiptQueries(queryClient, receiptId);
      await queryClient.invalidateQueries({ queryKey: ["receipts"] });
    } catch (err: any) {
      alert(translateApiError(err.message, t) || t("receipts.error.delete"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdminStatusChange = async (
    receiptId: string,
    nextStatus: string,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    try {
      setStatusUpdatingId(receiptId);
      const res = await fetch("/api/admin/receipts/status", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptId, status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || t("receipts.error.load"));
      }
      const nowIso = new Date().toISOString();
      await localDb.patch("receipts", receiptId, {
        status: nextStatus,
        updated_at: nowIso,
        version: Date.parse(nowIso),
      });
      await syncMobileData().catch(() => null);
      // Optimistic update: patch the status in the cache
      queryClient.setQueryData(
        RECEIPTS_QUERY_KEY(queryParams),
        (old: typeof receiptsData) =>
          old
            ? {
                ...old,
                receipts: old.receipts.map((r) =>
                  r.id === receiptId ? { ...r, status: toUiStatus(nextStatus) } : r
                ),
              }
            : old
      );
    } catch (err: any) {
      alert(translateApiError(err?.message, t) || t("receipts.error.load"));
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: "all", label: byLocale("Tümü", "All", "Все", "ทั้งหมด", "Todo", "全部") },
    { key: "7d", label: byLocale("7 gün", "7 days", "7 дней", "7 วัน", "7 días", "7天") },
    { key: "30d", label: byLocale("30 gün", "30 days", "30 дней", "30 วัน", "30 días", "30天") },
    { key: "90d", label: byLocale("90 gün", "90 days", "90 дней", "90 วัน", "90 días", "90天") },
  ];

  if (errorMessage) {
    return (
      <AppShell>
        <ErrorState
          message={errorMessage}
          onRetry={() => queryClient.invalidateQueries({ queryKey: RECEIPTS_QUERY_KEY(queryParams) })}
        />
      </AppShell>
    );
  }

  return (
    <AppShell fixedViewport>
      <div className="flex min-h-0 w-full max-w-2xl mx-auto flex-1 flex-col gap-3.5 pb-[calc(env(safe-area-inset-bottom)+4.75rem)] lg:pb-6">
        {/* Pinned chrome: title + filters never scroll with the deck */}
        <div className="shrink-0 space-y-3.5">
        {/* Header */}
        <div className="flex items-center gap-2.5 pt-1">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `${acc}1a`, border: `1px solid ${acc}33` }}
          >
            <GalleryVerticalEnd className="h-[18px] w-[18px]" style={{ color: acc }} />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--app-text-primary)" }}>
            {t("receipts.title")}
          </h1>
        </div>

        {/* Filters: period chips + search + category */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {PERIODS.map((p) => {
              const on = period === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handlePeriodChange(p.key)}
                  className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={
                    on
                      ? { background: `${acc}1f`, color: acc, border: `1px solid ${acc}55` }
                      : { background: "var(--app-bg-elevated)", color: "var(--app-text-secondary)", border: "1px solid var(--app-border)" }
                  }
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              <input
                type="text"
                placeholder={t("filter.search.placeholder")}
                value={filters.search || ""}
                onChange={(e) => handleFilterChange({ ...filters, search: e.target.value || undefined })}
                className="w-full rounded-lg border pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                style={{ background: "var(--app-bg-elevated)", borderColor: "var(--app-border)", color: "var(--app-text-primary)" }}
              />
            </div>
            {categoryOptions.length > 1 && (
              <CategoryFilterSheet
                value={category}
                options={categoryOptions}
                accent={acc}
                onChange={(v) => {
                  setCategory(v);
                  setStartAtEnd(false);
                }}
              />
            )}
          </div>
        </div>
        </div>

        {/* Content fills the remaining viewport; the deck owns this space so each
            card sits flush below the pinned chrome — never under the topbar. */}
        <div className="min-h-0 flex-1">
        {isLoading ? (
          <div
            className="h-full w-full animate-pulse rounded-3xl"
            style={{ background: "var(--app-bg-elevated)", border: "1px solid var(--app-border)" }}
          />
        ) : receipts.length === 0 ? (
          <div
            className="flex h-full flex-col items-center justify-center rounded-3xl px-8 text-center"
            style={{ background: "var(--app-bg-surface)", border: "1px solid var(--app-border)" }}
          >
            <div
              className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: `${acc}15`, border: `1px solid ${acc}30` }}
            >
              <GalleryVerticalEnd className="h-7 w-7" style={{ color: acc }} />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white/90">{t("receipts.empty")}</h3>
            <p className="mx-auto mb-6 max-w-sm text-sm text-white/50">{t("receipts.emptyDesc")}</p>
            <button
              type="button"
              onClick={() => router.push("/app/mine")}
              className="rounded-xl px-5 py-2.5 text-sm font-medium transition-all"
              style={{ background: `linear-gradient(135deg,${acc},${tier.accent2})`, color: "#0a0a0a", boxShadow: `0 0 16px ${acc}40` }}
            >
              {t("receipts.upload")}
            </button>
          </div>
        ) : displayReceipts.length === 0 ? (
          <div
            className="flex h-full flex-col items-center justify-center rounded-3xl px-8 text-center"
            style={{ background: "var(--app-bg-surface)", border: "1px solid var(--app-border)" }}
          >
            <p className="text-sm text-white/50">
              {byLocale(
                "Bu filtreye uyan fiş yok.",
                "No receipts match this filter.",
                "Нет чеков по этому фильтру.",
                "ไม่มีใบเสร็จที่ตรงกับตัวกรองนี้",
                "Ningún recibo coincide.",
                "没有符合此筛选的收据。"
              )}
            </p>
          </div>
        ) : (
          <ReceiptSwipeFeed
            receipts={displayReceipts}
            accountLevel={accountLevel}
            isAdmin={isAdmin}
            isLocalDev={isLocalDev}
            deletingId={deletingId}
            statusUpdatingId={statusUpdatingId}
            resetSignal={`${period}|${category}|${currentPage}|${filters.search ?? ""}`}
            startAtEnd={startAtEnd}
            currentPage={currentPage}
            totalPages={category === "all" ? totalPages : 1}
            onOpen={handleOpenReceipt}
            onDelete={handleDelete}
            onVerify={handleVerifyReceipt}
            onAdminStatusChange={handleAdminStatusChange}
            onNearEnd={prefetchNextPage}
            onReachEnd={handleReachEnd}
            onReachStart={handleReachStart}
          />
        )}
        </div>
      </div>

      <ReceiptDetailModal receiptId={detailId} onClose={handleCloseDetail} />
    </AppShell>
  );
}

export default function ReceiptsPage() {
  return (
    <Suspense fallback={<AppShell><div className="px-4 pt-6" /></AppShell>}>
      <ReceiptsPageContent />
    </Suspense>
  );
}
