"use client";

/**
 * DEV-ONLY preview harness (no auth) to visually test the Yumbie workspace,
 * rooms, the door transition and the scan room's real-task flow in a real
 * browser. Not linked from the app. Safe to delete.
 */
import { useState } from "react";
import { AppI18nProvider } from "@/lib/i18n/app-context";
import { YumbieWorkspace } from "@/components/yumbie/YumbieWorkspace";
import { YumbieInsight } from "@/components/yumbie/YumbieInsight";
import { YumbieDeeplink } from "@/components/yumbie/YumbieDeeplink";
import { useYumbieChatStore } from "@/components/yumbie/useYumbieChatStore";
import { useYumbieStore } from "@/components/yumbie/useYumbieStore";
import { useYumbieInsights } from "@/components/yumbie/useYumbieInsights";
import { useYumbieMessage } from "@/components/yumbie/useYumbieMessage";
import { useYumbieVitality } from "@/components/yumbie/useYumbieVitality";
import { useYumbieProgress } from "@/components/yumbie/useYumbieProgress";
import { useYumbieTour } from "@/components/yumbie/useYumbieTour";
import { useYumbieInsight } from "@/components/yumbie/useYumbieInsight";
import type { SceneId } from "@/components/yumbie/types";

const SCENES: SceneId[] = ["today", "receipts", "wallet", "patterns", "scan"];
const btn = { padding: "6px 12px", fontSize: 12, borderRadius: 12, border: "1px solid #38383e", background: "#222226", color: "#9a9aa2", cursor: "pointer" } as const;

export default function YumbieLab() {
  const [scene, setScene] = useState<SceneId>("today");
  return (
    <AppI18nProvider initialLocale="tr">
      <div style={{ minHeight: "100vh", background: "#08090f" }}>
        <div style={{ height: 44, background: "#11131d" }} />
        {/* key={scene} forces a remount on scene change → exercises the door-walk
            transition (wsMemory) just like the real app's per-page remount. */}
        <YumbieWorkspace key={scene} sceneId={scene} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: 12 }}>
          {SCENES.map((s) => (
            <button key={s} data-scene={s} onClick={() => setScene(s)} style={{ ...btn, background: s === scene ? "#3a2f23" : "#222226", color: s === scene ? "#f2c14e" : "#9a9aa2" }}>
              {s}
            </button>
          ))}
          <button
            data-scan-task
            style={{ ...btn, background: "#23303a", color: "#37e0c2" }}
            onClick={() => {
              const id = useYumbieStore.getState().enqueue({ kind: "scan", label: "yumbie.workspace.scan.processing" });
              setTimeout(() => useYumbieStore.getState().setStatus(id, "done"), 3500);
            }}
          >
            scan task (real)
          </button>
          <button
            data-feed-demo
            style={{ ...btn, background: "#26323a", color: "#9b7bf0" }}
            onClick={() => {
              useYumbieInsights.getState().setCategories([
                { label: "Market & Gıda", ratio: 0.55, color: "#fb923c" },
                { label: "Yeme & İçme", ratio: 0.23, color: "#38bdf8" },
                { label: "Alkol", ratio: 0.17, color: "#a78bfa" },
              ]);
              useYumbieMessage.getState().say("Dün 3 fiş ekledin, +3 cPoint kazandın.");
              useYumbieVitality.getState().bump();
            }}
          >
            feed demo data
          </button>
          <button
            data-wallet
            style={{ ...btn, background: "#2a2620", color: "#f2c14e" }}
            onClick={() => useYumbieProgress.getState().set({ cPoints: 480, streak: 8, bond: 8 })}
          >
            wallet: 480 cP
          </button>
          <button
            data-wallet-up
            style={{ ...btn, background: "#2a2620", color: "#fbd76e" }}
            onClick={() => useYumbieProgress.getState().set({ cPoints: 520 })}
          >
            wallet +→520 (tier up)
          </button>
          <button
            data-tour
            style={{ ...btn, background: "#1e2e2c", color: "#37e0c2" }}
            onClick={() =>
              useYumbieTour.getState().start([
                { scene: "today", line: "Haftanı birlikte gözden geçirelim.", holdMs: 2800 },
                { scene: "patterns", line: "En çok Market: %55.", holdMs: 4200 },
                { scene: "wallet", line: "Bu hafta +120 cPoint kazandın.", holdMs: 3800 },
                { scene: "today", line: "8 gündür buradasın — bu emek değerli.", holdMs: 3400 },
                { scene: "today", line: "Güzel bir haftaydı.", holdMs: 3000 },
              ])
            }
          >
            weekly tour
          </button>
          <button
            data-insight
            style={{ ...btn, background: "#1e2e2c", color: "#37e0c2" }}
            onClick={() => {
              useYumbieInsight.getState().configure((id) => console.log("insight seen", id));
              useYumbieInsight.getState().setInsight({
                id: "lab-1",
                categoryKey: "food_restaurant",
                label: "Yeme & İçme",
                direction: "up",
                magnitude: "notable",
                recentMonthlyAvg: 12675,
                currency: "TRY",
              });
            }}
          >
            insight (pill)
          </button>
          <button data-open-chat style={{ ...btn, background: "#ffb347", color: "#1a1206" }} onClick={() => useYumbieChatStore.getState().openChat()}>
            open chat
          </button>
        </div>
        <YumbieInsight />
        <YumbieDeeplink />
      </div>
    </AppI18nProvider>
  );
}
