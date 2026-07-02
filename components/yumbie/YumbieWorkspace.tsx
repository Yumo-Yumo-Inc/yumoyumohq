"use client";

/**
 * YumbieWorkspace — a persistent, side-view, route-aware SVG office. A single
 * requestAnimationFrame engine walks Yumbie between stations on a ground line and
 * through a fixed door (right) to swap rooms on navigation. Ported 1:1 from the
 * reference prototype (yumbie_final_cpoints_gunes_ay.html): same character, door
 * timing, sky, FX and per-room work loops. The necktie is TEAL (reference).
 *
 * The walker's face <g> is CHILDLESS in JSX; the engine sets its innerHTML.
 */

import { useEffect, useRef, useState } from "react";
import { useAppLocale } from "@/lib/i18n/app-context";
import { SCENES, SCENE_ORDER } from "./scenes";
import { useYumbieStore } from "./useYumbieStore";
import { useYumbieChatStore } from "./useYumbieChatStore";
import { YumbieChat } from "./YumbieChat";
import { useYumbieMessage, yumbieToday } from "./useYumbieMessage";
import type { Effect, Mood, Scene, SceneApi, SceneId, Step } from "./types";
import { SC, TY, buildFace } from "./sprites";
import { useYumbieVitality } from "./useYumbieVitality";
import { useYumbieTour } from "./useYumbieTour";
import { markReviewed } from "./yumbieRhythm";
import { useYumbieInsight } from "./useYumbieInsight";

const NS = "http://www.w3.org/2000/svg";
const AWAIT_TIMEOUT = 60;
/** Rig-local lift (walker units) raising Yumbie onto a seat / mattress when it
 * settles into a resting pose. Tuned against the today-room furniture. */
const SIT_LIFT = 40;
const LIE_LIFT = 44;

/** Survives the per-page AppShell remount so the door walk replays (no reset). */
const wsMemory: { scene: SceneId | null; X: number } = { scene: null, X: 64 };

interface Eng {
  X: number;
  pf: number;
  cycle: number;
  steps: Step[];
  si: number;
  st: number;
  effects: Effect[];
  scene: SceneId;
  pending: SceneId | null;
  transitioning: boolean;
  carrying: boolean;
  curFace: Mood | "";
  blinkT: number;
  last: number | null;
  nightMode: boolean;
  swapped: boolean;
  recheck: boolean;
  mode: "work" | "loop";
}

export function YumbieWorkspace({ sceneId }: { sceneId: SceneId }) {
  const { t } = useAppLocale();
  const tourPending = useYumbieTour((s) => s.pending);
  const tourActive = useYumbieTour((s) => s.active);
  const insightPending = useYumbieInsight((s) => s.pending);
  const chatOpen = useYumbieChatStore((s) => s.open);
  // Yumbie's current message — drives the "!" head badge and the popup bubble.
  const message = useYumbieMessage((s) => s.message);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  // Acknowledgement is tracked per-day in the message store (persisted), so the
  // same daily line never re-raises the "!" after it's been seen — even across
  // remounts or reloads. It returns only for a genuinely new message or new day.
  const seenMessage = useYumbieMessage((s) => s.seenMessage);
  const seenDate = useYumbieMessage((s) => s.seenDate);
  const hasUnseenMessage =
    !!message && !(message === seenMessage && seenDate === yumbieToday());
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Stage scale — the whole scene group. Desktop keeps the 0.825 framing; phones
  // (< sm) bump it up so Yumbie reads larger on the short mobile band. The floor
  // line (y=108) and the ground below it stay in view: at scale 0.9 the floor
  // renders at 97.2, well inside the 114-tall viewBox. Applied via the SVG
  // transform attribute (native user units).
  const [stageScale, setStageScale] = useState(0.825);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(max-width: 639.98px)");
    const apply = () => setStageScale(mq.matches ? 0.9 : 0.825);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // Keep the group horizontally centred for the chosen scale: (340 − 340·s)/2.
  const stageTx = ((340 - 340 * stageScale) / 2).toFixed(2);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const walkerRef = useRef<SVGGElement | null>(null);
  const rigRef = useRef<SVGGElement | null>(null);
  const footLRef = useRef<SVGEllipseElement | null>(null);
  const footRRef = useRef<SVGEllipseElement | null>(null);
  const faceRef = useRef<SVGGElement | null>(null);
  const fxRef = useRef<SVGGElement | null>(null);
  const labRef = useRef<SVGTextElement | null>(null);
  const doorPRef = useRef<SVGRectElement | null>(null);
  const doorHRef = useRef<SVGCircleElement | null>(null);
  const goSceneRef = useRef<((s: SceneId) => void) | null>(null);
  const sceneIdRef = useRef<SceneId>(sceneId);

  useEffect(() => {
    const svg = svgRef.current;
    const fx = fxRef.current;
    const face = faceRef.current;
    if (!svg || !fx || !face) return;

    const now = () => (typeof performance !== "undefined" ? performance.now() : 0);
    const $ = (id: string) => svg.querySelector<SVGElement>(`#${id}`);

    const eng: Eng = {
      X: 64, pf: 0, cycle: 0, steps: [], si: 0, st: 0, effects: [],
      scene: sceneId, pending: null, transitioning: false, carrying: false,
      curFace: "", blinkT: 0, last: null,
      nightMode: (() => { const h = new Date().getHours(); return h < 7 || h >= 19; })(),
      swapped: false, recheck: false, mode: "loop",
    };

    const curScene = (): Scene => SCENES[eng.scene];
    const api: SceneApi = {
      $,
      pushFx: (e: Effect) => eng.effects.push(e),
      t: (k, p) => tRef.current(k, p),
    };

    const setFace = (mood: Mood) => {
      if (mood !== eng.curFace) {
        eng.curFace = mood;
        face.innerHTML = buildFace(mood);
      }
    };
    const setCarry = (on: boolean, key?: string) => {
      eng.carrying = on;
      if (labRef.current) {
        labRef.current.style.display = on ? "" : "none";
        if (on && key) labRef.current.textContent = tRef.current(key);
      }
    };
    const applySky = () => {
      const sun = $("yb-sky-sun");
      const moon = $("yb-sky-moon");
      const glass = $("yb-sky-glass");
      if (sun) sun.style.display = eng.nightMode ? "none" : "";
      if (moon) moon.style.display = eng.nightMode ? "" : "none";
      // Daytime sky is always blue; night is deep slate-blue.
      if (glass) glass.setAttribute("fill", eng.nightMode ? "#1b2838" : "#8FCDEF");
    };
    const refreshSky = () => {
      const h = new Date().getHours();
      eng.nightMode = h < 7 || h >= 19;
      if (eng.scene === "today") applySky();
    };
    const toggleSky = () => {
      eng.nightMode = !eng.nightMode;
      applySky();
    };
    const setSceneDisplays = () => {
      for (const id of SCENE_ORDER) {
        const g = $(`yb-scene-${id}`);
        if (g) g.style.display = id === eng.scene ? "" : "none";
        const f = $(`yb-front-${id}`);
        if (f) f.style.display = id === eng.scene ? "" : "none";
      }
      if (eng.scene === "today") applySky();
    };
    const restoreSlips = () => {
      for (const id of ["yb-slip1", "yb-slip2"]) {
        const s = $(id);
        if (s) s.style.opacity = "1";
      }
    };
    const clearEffects = () => {
      while (eng.effects.length) {
        const e = eng.effects.pop();
        if (e && e.el && e.t !== "bargrow" && e.el.parentNode === fx) fx.removeChild(e.el);
      }
    };

    const buildSteps = (): Step[] => {
      const s = curScene();
      if (s.hasWork?.(api) && s.work) {
        eng.mode = "work";
        return s.work(api);
      }
      eng.mode = "loop";
      return s.plan(eng.cycle, api);
    };

    const startStep = () => {
      const s = eng.steps[eng.si];
      if (!s) return;
      eng.st = 0;
      eng.swapped = false;
      if (s.m === "act") {
        setCarry(false);
        curScene().onActStart?.(s.fx, api);
      }
      // Resting poses settle in place — drop anything carried and pick the
      // right face (eyes shut for sleep, calm idle for reading/watering).
      if (s.m === "sit" || s.m === "lie" || s.m === "tend") setCarry(false);
      if (s.m === "lie") setFace("sleep");
      else if (s.m === "sit" || s.m === "tend") setFace("idle");
    };

    const endStep = () => {
      const s = eng.steps[eng.si];
      if (!s) return;
      if (s.m === "door") {
        walkerRef.current?.setAttribute("opacity", "1");
        eng.transitioning = false;
        eng.cycle = 0;
        eng.steps = buildSteps();
        eng.si = 0;
        startStep();
        return;
      }
      if (s.m === "pick") {
        if (s.src) {
          const src = $(s.src);
          if (src) src.style.opacity = "0";
        }
        setCarry(true, s.label);
        setFace("happy");
      }
      if (s.m === "act") {
        setFace("idle");
        curScene().onActEnd?.(s.fx, api);
      }
      if (s.m === "tend" || s.m === "sit" || s.m === "lie") setFace("idle");
      eng.si += 1;
      if (eng.si >= eng.steps.length) {
        eng.cycle += 1;
        eng.steps = buildSteps();
        eng.si = 0;
      }
      startStep();
    };

    const swapProps = () => {
      if (eng.pending) eng.scene = eng.pending;
      setSceneDisplays();
      restoreSlips();
    };

    const goScene = (target: SceneId) => {
      if (target === eng.scene && !eng.transitioning) return;
      if (eng.transitioning) {
        eng.pending = target;
        return;
      }
      eng.pending = target;
      eng.transitioning = true;
      setCarry(false);
      setFace("idle");
      restoreSlips();
      clearEffects();
      eng.steps = [
        { m: "walk", to: 282, msg: "yumbie.workspace.door.toDoor" },
        { m: "door", d: 1.7 },
      ];
      eng.si = 0;
      startStep();
    };
    goSceneRef.current = goScene;

    const quad = (p0: [number, number], p1: [number, number], p2: [number, number], tt: number): [number, number] => {
      const u = 1 - tt;
      return [u * u * p0[0] + 2 * u * tt * p1[0] + tt * tt * p2[0], u * u * p0[1] + 2 * u * tt * p1[1] + tt * tt * p2[1]];
    };

    const runFx = (dt: number) => {
      for (let i = eng.effects.length - 1; i >= 0; i--) {
        const e = eng.effects[i];
        if (!e.el) {
          if (e.t === "coin") {
            const c = document.createElementNS(NS, "circle");
            c.setAttribute("r", "5"); c.setAttribute("fill", "#F2C14E");
            fx.appendChild(c); e.el = c; e.dur = 0.9;
          } else if (e.t === "sink") {
            const r = document.createElementNS(NS, "rect");
            r.setAttribute("x", String(e.x)); r.setAttribute("width", "20"); r.setAttribute("height", "24"); r.setAttribute("rx", "2"); r.setAttribute("fill", "#ECEAE2");
            fx.appendChild(r); e.el = r; e.dur = 0.6;
          } else if (e.t === "plus") {
            const tx = document.createElementNS(NS, "text");
            tx.textContent = e.txt; tx.setAttribute("font-size", "10"); tx.setAttribute("fill", "#FBD76E"); tx.setAttribute("text-anchor", "middle");
            fx.appendChild(tx); e.el = tx; e.dur = 1.1;
          } else if (e.t === "bargrow") {
            const el = $(e.id);
            if (!el) { eng.effects.splice(i, 1); continue; }
            e.el = el; e.dur = 0.6;
          }
        }
        e.a += dt / (e.dur ?? 1);
        if (e.t === "coin" && e.el) {
          const p = quad(e.from, e.ctrl, e.to, Math.min(e.a, 1));
          e.el.setAttribute("cx", p[0].toFixed(1)); e.el.setAttribute("cy", p[1].toFixed(1));
          if (e.a >= 1) { if (e.el.parentNode === fx) fx.removeChild(e.el); eng.effects.splice(i, 1); e.onLand?.(); }
        } else if (e.t === "sink" && e.el) {
          e.el.setAttribute("y", (104 + 24 * Math.min(e.a, 1)).toFixed(1)); e.el.setAttribute("opacity", (1 - e.a * 0.9).toFixed(2));
          if (e.a >= 1) { if (e.el.parentNode === fx) fx.removeChild(e.el); eng.effects.splice(i, 1); }
        } else if (e.t === "plus" && e.el) {
          e.el.setAttribute("x", String(e.x)); e.el.setAttribute("y", (e.y - 14 * e.a).toFixed(1)); e.el.setAttribute("opacity", (1 - e.a).toFixed(2));
          if (e.a >= 1) { if (e.el.parentNode === fx) fx.removeChild(e.el); eng.effects.splice(i, 1); }
        } else if (e.t === "bargrow" && e.el) {
          const k = Math.min(e.a, 1);
          e.el.setAttribute("height", (e.fromH + (e.toH - e.fromH) * k).toFixed(1));
          e.el.setAttribute("y", (e.fromY + (e.toY - e.fromY) * k).toFixed(1));
          if (e.a >= 1) eng.effects.splice(i, 1);
        }
      }
    };

    const tick = (ts: number) => {
      if (document.hidden) { eng.last = null; raf = requestAnimationFrame(tick); return; }
      if (eng.last === null) eng.last = ts;
      const dt = Math.min((ts - eng.last) / 1000, 0.05);
      eng.last = ts;

      // (b) Real interaction energy: tempo + a short happy flash on a real bump.
      const energy = useYumbieVitality.getState().energyNow();
      if (energy - lastEnergy > 0.25 && eng.curFace === "idle") {
        setFace("happy");
        setTimeout(() => {
          if (eng.curFace === "happy" && !eng.carrying) setFace("idle");
        }, 900);
      }
      lastEnergy = energy;

      // Real work appeared (scan) → jump to it.
      if (eng.recheck && !eng.transitioning) {
        eng.recheck = false;
        if (eng.mode !== "work" && curScene().hasWork?.(api)) {
          setCarry(false); setFace("idle"); eng.cycle = 0;
          eng.steps = buildSteps(); eng.si = 0; startStep();
        }
      }

      const s = eng.steps[eng.si];
      if (!s) { raf = requestAnimationFrame(tick); return; }
      eng.st += dt;
      let walking = false;
      let dir = 1;

      if (s.m === "walk") {
        walking = true;
        dir = s.to > eng.X ? 1 : -1;
        eng.X += dir * (52 + 12 * energy) * dt;
        eng.pf += dt * (10 + 2 * energy);
        if ((dir > 0 && eng.X >= s.to) || (dir < 0 && eng.X <= s.to)) { eng.X = s.to; endStep(); }
      } else if (s.m === "door") {
        const tt = eng.st;
        let sx = 1;
        if (tt < 0.3) sx = 1 - 0.88 * (tt / 0.3);
        else if (tt < 1.4) sx = 0.12;
        else sx = 0.12 + 0.88 * Math.min((tt - 1.4) / 0.3, 1);
        doorPRef.current?.setAttribute("transform", `translate(298,0) scale(${sx.toFixed(2)},1) translate(-298,0)`);
        doorHRef.current?.setAttribute("opacity", sx > 0.5 ? "1" : "0");
        if (tt >= 0.3 && tt < 0.85) {
          const k = (tt - 0.3) / 0.55;
          eng.X = 282 + 28 * k;
          walkerRef.current?.setAttribute("opacity", (1 - k).toFixed(2));
          eng.pf += dt * 11; walking = true; dir = 1;
        } else if (tt >= 0.85 && tt < 1.4) {
          if (!eng.swapped) { swapProps(); eng.swapped = true; }
          const k = (tt - 0.85) / 0.55;
          eng.X = 310 - 28 * k;
          walkerRef.current?.setAttribute("opacity", k.toFixed(2));
          eng.pf += dt * 11; walking = true; dir = -1;
        }
        if (eng.st >= s.d) endStep();
      } else if (s.m === "act" && s.awaitTask) {
        const head = useYumbieStore.getState().peek();
        const settled = head?.status === "done" || head?.status === "error";
        if (settled || eng.st >= AWAIT_TIMEOUT) endStep();
      } else if (eng.st >= s.d) {
        endStep();
      }

      curScene().frame?.(api, { step: s, st: eng.st });

      const lift = walking ? 7 : 0;
      footLRef.current?.setAttribute("cy", (158 - Math.max(0, Math.sin(eng.pf)) * lift).toFixed(1));
      footRRef.current?.setAttribute("cy", (158 - Math.max(0, Math.sin(eng.pf + Math.PI)) * lift).toFixed(1));
      // Rig pose: a slight walk sway, or an eased settle into a seated/lying
      // pose for the resting beats (read on the chair, sleep on the bed). The
      // ease makes Yumbie visibly sit down / lie down rather than snap.
      let rigT = `rotate(${walking ? dir * 3 : 0} 100 110)`;
      if (!walking && (s.m === "sit" || s.m === "lie")) {
        const k = Math.min(eng.st / 0.5, 1);
        const e = 1 - Math.pow(1 - k, 3); // easeOutCubic
        if (s.m === "sit") {
          rigT = `translate(0 ${(-SIT_LIFT * e).toFixed(1)}) rotate(${(-5 * e).toFixed(1)} 100 132)`;
        } else {
          rigT = `translate(0 ${(-LIE_LIFT * e).toFixed(1)}) rotate(${(-90 * e).toFixed(1)} 100 150)`;
        }
      } else if (!walking && s.m === "tend" && s.lean) {
        // Gentle forward lean toward what's being tended (e.g. pouring onto the
        // plant) — reads as an action rather than standing. Opt-in per step.
        const lean = s.lean * Math.sin(Math.PI * Math.min(eng.st / s.d, 1));
        rigT = `rotate(${lean.toFixed(1)} 100 150)`;
      }
      rigRef.current?.setAttribute("transform", rigT);
      walkerRef.current?.setAttribute("transform", `translate(${(eng.X - 100 * SC).toFixed(1)},${TY.toFixed(1)}) scale(${SC})`);
      if (eng.carrying && labRef.current) {
        labRef.current.setAttribute("x", eng.X.toFixed(1));
        labRef.current.setAttribute("y", "56");
      }

      wsMemory.scene = eng.scene;
      wsMemory.X = eng.X;

      eng.blinkT += dt;
      if (eng.blinkT > 3.6 && eng.curFace === "idle") {
        setFace("blink");
        setTimeout(() => { if (eng.curFace === "blink") setFace("idle"); }, 140);
        eng.blinkT = 0;
      }

      runFx(dt);
      raf = requestAnimationFrame(tick);
    };

    // ── init ──
    setFace("idle");
    refreshSky();
    if (wsMemory.scene && wsMemory.scene !== sceneId) {
      // Remounted after navigation: show the previous room, place Yumbie where it
      // was, and replay the door walk into the new room.
      eng.scene = wsMemory.scene;
      eng.X = wsMemory.X;
      setSceneDisplays();
      eng.pending = sceneId;
      eng.transitioning = true;
      eng.steps = [{ m: "walk", to: 282 }, { m: "door", d: 1.7 }];
      eng.si = 0;
      startStep();
    } else {
      eng.scene = sceneId;
      eng.X = wsMemory.X || 64;
      setSceneDisplays();
      eng.steps = buildSteps();
      eng.si = 0;
      startStep();
    }
    walkerRef.current?.setAttribute("opacity", "1");
    walkerRef.current?.setAttribute("transform", `translate(${(eng.X - 100 * SC).toFixed(1)},${TY.toFixed(1)}) scale(${SC})`);

    const skyEl = $("yb-sky");
    skyEl?.addEventListener("click", toggleSky);
    const skyInterval = window.setInterval(refreshSky, 60000);
    const unsub = useYumbieStore.subscribe(() => { eng.recheck = true; });

    // Phase 2 — Weekly tour: show the room the tour wants; return to the route
    // when it ends.
    const unsubTour = useYumbieTour.subscribe((st) => {
      if (st.active) {
        if (st.scene && st.scene !== eng.scene && !eng.transitioning) goScene(st.scene);
      } else if (eng.scene !== sceneIdRef.current && !eng.transitioning) {
        goScene(sceneIdRef.current);
      }
    });

    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastEnergy = 0;
    let raf = 0;
    if (!reduce) raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearInterval(skyInterval);
      skyEl?.removeEventListener("click", toggleSky);
      unsub();
      unsubTour();
      goSceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Drive door transitions when the route-derived scene changes.
  useEffect(() => {
    sceneIdRef.current = sceneId;
    // During a tour, don't follow the route; the tour drives its own room.
    if (!useYumbieTour.getState().active) goSceneRef.current?.(sceneId);
  }, [sceneId]);

  // The "!" cue above Yumbie's head — shown whenever there's something to say.
  const cueVisible = insightPending || (tourPending && !tourActive) || hasUnseenMessage;
  // Shared handler: tapping the "!" OR tapping Yumbie himself triggers the cue.
  // Does nothing when there's no cue, so a plain tap on Yumbie stays inert.
  const handleCueClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    if (insightPending) useYumbieInsight.getState().show();
    // Mark this ISO week reviewed the moment the user enters the recap chain, so
    // it never nags again this week — not on reload, not on F5, even if they
    // refresh mid-tour (onDone would miss that case). markReviewed() is keyed by
    // ISO week, so next week's recap still surfaces.
    else if (tourPending && !tourActive) {
      markReviewed();
      useYumbieTour.getState().start(tourPending);
    }
    else if (hasUnseenMessage) {
      useYumbieMessage.getState().markSeen();
      setBubbleOpen(true);
    }
  };

  return (
    <div className="relative w-full border-b border-[var(--app-border)] bg-[var(--yb-room)]">
      {/* Insight/tour cue is shown as a "!" above Yumbie's head (in the SVG),
          not as a pill. Tapping it opens the bottom sheet. */}
      {!chatOpen && (
        <button
          type="button"
          aria-label="Yumbie ile konuş"
          onClick={() => useYumbieChatStore.getState().openChat()}
          className="absolute right-3 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#ffb347]/40 bg-[#ffb347]/15 text-[#ffb347] backdrop-blur-sm transition hover:bg-[#ffb347]/25 active:scale-95"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
          </svg>
        </button>
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 340 114"
        width="100%"
        role="img"
        aria-label="Yumbie workspace"
        className="block w-full select-none"
        onClick={() => setBubbleOpen(false)}
      >
        {/* Whole stage scaled and centred. Desktop ~82.5% (0.75 × ~1.1); phones
            bump to 90% so Yumbie reads larger on the short mobile band (see
            stageScale). translate x keeps it centred for the active scale. The
            dock's dark bg fills the slim side gutters, so it stays full-bleed. */}
        <g transform={`translate(${stageTx} 0) scale(${stageScale})`}>
        <rect x="0" y="0" width="340" height="128" fill="var(--yb-room)" />
        {SCENE_ORDER.map((id) => (
          <g key={id}>{SCENES[id].Props()}</g>
        ))}

        {/* Fixed door (right). */}
        <rect x="294" y="62" width="38" height="46" rx="5" fill="var(--yb-door-frame)" />
        <rect x="298" y="66" width="30" height="42" fill="var(--yb-door-void)" />
        <rect ref={doorPRef} id="yb-doorP" x="298" y="66" width="30" height="42" rx="2" fill="var(--yb-door-panel)" />
        <circle ref={doorHRef} id="yb-doorH" cx="322" cy="88" r="2" fill="var(--yb-door-handle)" />

        <line x1="14" y1="108" x2="326" y2="108" stroke="var(--yb-floor)" strokeWidth="2" strokeLinecap="round" />

        <g id="yb-fx" ref={fxRef} />

        <g
          id="yb-walker"
          ref={walkerRef}
          onClick={handleCueClick}
          style={{ cursor: cueVisible ? "pointer" : "default" }}
          role={cueVisible ? "button" : undefined}
          aria-label={cueVisible ? (insightPending ? t("yumbie.insight.pill") : t("yumbie.review.pill")) : undefined}
        >
          <g id="yb-rig" ref={rigRef}>
            <ellipse ref={footLRef} id="yb-footL" cx="78" cy="158" rx="13" ry="7" fill="#8A5C12" />
            <ellipse ref={footRRef} id="yb-footR" cx="122" cy="158" rx="13" ry="7" fill="#8A5C12" />
            <rect x="30" y="22" width="140" height="132" rx="46" fill="#F2C14E" />
            <clipPath id="yb-walkclip"><rect x="30" y="22" width="140" height="132" rx="46" /></clipPath>
            <g clipPath="url(#yb-walkclip)">
              <ellipse cx="78" cy="40" rx="44" ry="17" fill="#FBD76E" />
              <ellipse cx="106" cy="152" rx="62" ry="20" fill="#DCA22E" />
            </g>
            {/* TEAL necktie (reference). */}
            <path d="M100 131 L92 138 L100 151 L108 138 Z" fill="#3FB8A5" />
            <path d="M100 131 L108 138 L100 151 Z" fill="#2C8A7A" />
            <g transform="translate(100,126) rotate(45)">
              <rect x="-5.5" y="-5.5" width="11" height="11" rx="3" fill="#3FB8A5" />
              <rect x="-5.5" y="0" width="11" height="5.5" rx="3" fill="#2C8A7A" />
            </g>
            <g id="yb-face" ref={faceRef} />
            {/* "!" cue above the head whenever Yumbie has something to say. Tap
                shows the message in a popup bubble; an insight/tour takes
                priority and opens its richer sheet. */}
            {cueVisible && (
              <g
                className="yb-alert-pulse"
                /* Enlarged 40% (×1.4) around the badge centre (158, 2). */
                transform="translate(158 2) scale(1.4) translate(-158 -2)"
                style={{ cursor: "pointer" }}
                onClick={handleCueClick}
                role="button"
                aria-label={insightPending ? t("yumbie.insight.pill") : t("yumbie.review.pill")}
              >
                <circle cx="158" cy="2" r="22" fill="#EF4444" stroke="#fff" strokeWidth="3.5" />
                <rect x="153" y="-9" width="10" height="16" rx="5" fill="#fff" />
                <circle cx="158" cy="13" r="4.2" fill="#fff" />
              </g>
            )}
          </g>
        </g>

        {/* Front prop layer — held items (book, watering can) drawn AFTER the
            walker so they overlay Yumbie instead of hiding behind it. Toggled
            with the scene by setSceneDisplays. */}
        {SCENE_ORDER.map((id) =>
          SCENES[id].FrontProps ? (
            <g key={`front-${id}`} id={`yb-front-${id}`} style={{ display: "none" }}>
              {SCENES[id].FrontProps!()}
            </g>
          ) : null
        )}

        <text ref={labRef} id="yb-carrylab" fontSize="10" fill="#FBD76E" textAnchor="middle" style={{ display: "none" }} />
        </g>
      </svg>
      {/* Yumbie's message — a popup speech bubble opened by tapping the "!" cue
          on Yumbie's head. Tap the bubble (or anywhere in the room) to dismiss.
          Hidden while the full chat panel is open. */}
      {bubbleOpen && message && !chatOpen && (
        <div className="absolute left-3 right-14 top-2 z-20" onClick={() => setBubbleOpen(false)}>
          <div className="relative rounded-2xl border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3.5 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.3)] [animation:yb-bubble-in_180ms_cubic-bezier(0.19,1,0.22,1)]">
            <p className="m-0 text-[12.5px] font-medium leading-snug text-[var(--app-text-primary)]">
              {message}
            </p>
            <span className="absolute -bottom-1.5 left-9 h-3 w-3 rotate-45 border-b border-r border-[var(--app-border)] bg-[var(--app-bg-elevated)]" />
          </div>
        </div>
      )}
      <YumbieChat />
    </div>
  );
}
