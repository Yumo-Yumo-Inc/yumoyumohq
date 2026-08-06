"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { ScanLine, Sparkles, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useAppLocale } from "@/lib/i18n/app-context";
import {
  CONTRIBUTION_FEED_QUERY_KEY,
  CONTRIBUTION_STATS_QUERY_KEY,
} from "@/lib/app/query-keys";
import {
  fetchContributionFeed,
  fetchContributionStats,
  submitContributionAnswer,
  AnswerError,
  type AnswerResult,
} from "@/lib/contribution/client";
import { ContributionStatsHeader } from "./contribution-stats";
import { TaskCard, type TaskAnswer } from "./task-card";
import { AnswerFlash } from "./answer-flash";

/**
 * Contribution Center — the identification flow.
 *
 * A supermarket receipt abbreviates its products ("K.GOFRET"); the machine can't invent
 * what isn't on the paper, but the shopper who bought it knows. Here they identify it, one
 * short task at a time, and earn points. The screen is built to feel like genuine
 * contribution: the honest impact ("X receipts fixed") leads, the meaning is stated, and
 * the flow never stalls — answer, a small payoff beat, next.
 */
export function ContributeScreen() {
  const { t } = useAppLocale();
  const reduce = useReducedMotion();
  const queryClient = useQueryClient();

  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [flash, setFlash] = useState<AnswerResult | null>(null);
  const [pending, setPending] = useState(false);
  const shownAtRef = useRef<number>(Date.now());

  const feedQuery = useQuery({
    queryKey: CONTRIBUTION_FEED_QUERY_KEY,
    queryFn: () => fetchContributionFeed(10),
  });
  const statsQuery = useQuery({
    queryKey: CONTRIBUTION_STATS_QUERY_KEY,
    queryFn: fetchContributionStats,
  });

  const visibleTasks = useMemo(
    () => (feedQuery.data?.tasks ?? []).filter((task) => !answeredIds.has(task.id)),
    [feedQuery.data, answeredIds],
  );
  const activeTask = visibleTasks[0];

  // Reset the latency clock whenever a new task takes the stage.
  const activeId = activeTask?.id;
  const latencyKey = useRef<string | undefined>(undefined);
  if (activeId && latencyKey.current !== activeId) {
    latencyKey.current = activeId;
    shownAtRef.current = Date.now();
  }

  const handleAnswer = useCallback(
    async (answer: TaskAnswer) => {
      if (!activeTask || pending) return;
      setPending(true);
      const latencyMs = Date.now() - shownAtRef.current;
      try {
        const result = await submitContributionAnswer({
          taskId: activeTask.id,
          kind: answer.kind,
          canonicalId: answer.canonicalId ?? null,
          freeText: answer.freeText ?? null,
          latencyMs,
        });
        setAnsweredIds((prev) => new Set(prev).add(activeTask.id));
        setFlash(result);
        void queryClient.invalidateQueries({ queryKey: CONTRIBUTION_STATS_QUERY_KEY });
        void queryClient.invalidateQueries({ queryKey: ["profile"] });
        // Refill before the queue runs dry so the flow never shows an empty gap.
        if (visibleTasks.length <= 2) {
          void queryClient.invalidateQueries({ queryKey: CONTRIBUTION_FEED_QUERY_KEY });
        }
      } catch (err) {
        setPending(false);
        if (err instanceof AnswerError && err.code === "quota_exhausted") {
          setAnsweredIds((prev) => new Set(prev).add(activeTask.id));
          void queryClient.invalidateQueries({ queryKey: CONTRIBUTION_STATS_QUERY_KEY });
          toast.info(t("contribute.toast.quotaReached"));
        } else if (err instanceof AnswerError && err.code === "already_answered") {
          setAnsweredIds((prev) => new Set(prev).add(activeTask.id));
        } else {
          toast.error(t("contribute.toast.answerFailed"));
        }
      }
    },
    [activeTask, pending, visibleTasks.length, queryClient, t],
  );

  const dismissFlash = useCallback(() => {
    setFlash(null);
    setPending(false);
  }, []);

  const loading = feedQuery.isLoading;
  const quotaReached = (statsQuery.data?.me.quotaRemaining ?? 1) <= 0 && !activeTask;

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-4 sm:pt-6">
      <header className="mb-5">
        <h1
          className="text-[22px] font-black tracking-tight"
          style={{ color: "var(--app-text-primary)" }}
        >
          {t("contribute.title")}
        </h1>
        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
          {t("contribute.subtitle")}
        </p>
      </header>

      <ContributionStatsHeader stats={statsQuery.data} />

      {/* Main stage */}
      <div className="relative mt-6 min-h-[420px]">
        {loading ? (
          <TaskSkeleton />
        ) : quotaReached ? (
          <DoneState variant="quota" />
        ) : activeTask ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTask.id}
                initial={reduce ? undefined : { opacity: 0, y: 14 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -14 }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              >
                <TaskCard task={activeTask} onAnswer={handleAnswer} disabled={pending} />
              </motion.div>
            </AnimatePresence>
            <AnswerFlash result={flash} onDone={dismissFlash} />
          </>
        ) : (
          <DoneState variant="empty" />
        )}
      </div>

      {/* Meaning — why this matters (the contribution, not a game) */}
      <p
        className="mt-6 text-center text-[12px] leading-relaxed"
        style={{ color: "var(--app-text-muted)" }}
      >
        {t("contribute.meaning")}
      </p>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div
      className="w-full animate-pulse rounded-[var(--app-radius-xl)]"
      style={{
        height: 380,
        background: "var(--surface-grad-elevated)",
        boxShadow: "inset 0 0 0 1px var(--app-border)",
      }}
    />
  );
}

function DoneState({ variant }: { variant: "empty" | "quota" }) {
  const { t } = useAppLocale();
  const Icon = variant === "quota" ? Sparkles : PackageCheck;
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "var(--app-gold-glow)", color: "var(--app-gold-light)" }}
      >
        <Icon size={30} strokeWidth={2} />
      </span>
      <h2 className="text-[18px] font-bold" style={{ color: "var(--app-text-primary)" }}>
        {t(variant === "quota" ? "contribute.done.quotaTitle" : "contribute.done.emptyTitle")}
      </h2>
      <p className="mt-2 max-w-xs text-[13px] leading-relaxed" style={{ color: "var(--app-text-secondary)" }}>
        {t(variant === "quota" ? "contribute.done.quotaBody" : "contribute.done.emptyBody")}
      </p>
      <Link
        href="/app/mine"
        className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[14px] font-semibold"
        style={{ color: "#0F1117", background: "var(--app-gold-light)" }}
      >
        <ScanLine size={16} />
        {t("contribute.done.scanCta")}
      </Link>
    </div>
  );
}
