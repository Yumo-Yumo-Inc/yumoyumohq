/**
 * scan scene — scanner station, COMPACT FRAME (ground y=108). Driven by REAL OCR
 * tasks (useYumbieStore). Yumbie feeds the doc, the light sweeps for the real
 * duration, then a coin (+cPoint) rises above the head on success / "couldn't
 * read" on failure. Never fabricated. Logic + ids (yb-scan-line/led) preserved;
 * only the visuals and coordinates are upgraded.
 */
import type { Scene } from "../types";
import { useYumbieStore } from "../useYumbieStore";
import { useYumbieVitality } from "../useYumbieVitality";

const scan: Scene = {
  id: "scan",
  Props: () => (
    <g id="yb-scene-scan" style={{ display: "none" }}>
      {/* flatbed scanner */}
      <rect x="150" y="74" width="88" height="34" rx="6" fill="var(--ys-panel)" />
      <rect x="150" y="74" width="88" height="8" rx="6" fill="var(--ys-panel2)" />
      <rect x="150" y="104" width="88" height="4" rx="2" fill="var(--ys-deep)" />
      <rect x="160" y="103" width="18" height="6" rx="1" fill="var(--ys-deep)" />
      <rect x="208" y="103" width="18" height="6" rx="1" fill="var(--ys-deep)" />
      <rect x="160" y="80" width="42" height="15" rx="2" fill="var(--ys-deep)" />
      <rect x="162" y="82" width="38" height="11" rx="1" fill="#0a2620" />
      <rect id="yb-scan-line" x="166" y="84" width="30" height="2.5" rx="1" fill="#6BE0BE" opacity="0.8" />
      <rect x="166" y="90" width="30" height="1.4" rx="0.7" fill="#2f7d68" />
      <circle id="yb-scan-led" cx="224" cy="80" r="2.6" fill="#6BE0BE" opacity="0.4" />
      <circle cx="218" cy="89" r="2.2" fill="var(--ys-line)" />
      <circle cx="225" cy="92" r="2.2" fill="var(--ys-line)" />
      <rect x="144" y="108" width="9" height="4" rx="1" fill="var(--ys-deep)" />
      <rect x="236" y="108" width="9" height="4" rx="1" fill="var(--ys-deep)" />
      {/* in-tray with a waiting doc */}
      <rect x="110" y="100" width="26" height="8" rx="2" fill="var(--ys-panel)" />
      <rect x="110" y="100" width="26" height="3" rx="2" fill="var(--ys-panel2)" />
      <rect x="116" y="92" width="14" height="10" rx="1.5" fill="#D8D5CA" />
    </g>
  ),
  plan: () => [
    { m: "idle", d: 1.6, msg: "yumbie.workspace.scan.ready" },
    { m: "act", d: 1.0, fx: "checkled", msg: "yumbie.workspace.scan.standby" },
    { m: "idle", d: 1.4, msg: "yumbie.workspace.scan.ready" },
  ],
  hasWork: () => {
    const head = useYumbieStore.getState().peek();
    return !!head && (head.status === "pending" || head.status === "running");
  },
  work: () => [
    { m: "walk", to: 130, msg: "yumbie.workspace.scan.receiving" },
    { m: "act", d: 60, fx: "process", awaitTask: true, msg: "yumbie.workspace.scan.processing" },
  ],
  onActEnd: (fx, api) => {
    if (fx !== "process") return;
    const head = useYumbieStore.getState().peek();
    if (head?.status === "done") {
      useYumbieVitality.getState().bump(); // real work finished → vitality
      api.pushFx({
        t: "coin",
        a: 0,
        from: [168, 86],
        ctrl: [148, 56],
        to: [130, 54],
        onLand: () => api.pushFx({ t: "plus", a: 0, x: 130, y: 50, txt: api.t("yumbie.workspace.fx.plusCPoint") }),
      });
    } else if (head?.status === "error") {
      api.pushFx({ t: "plus", a: 0, x: 130, y: 54, txt: api.t("yumbie.workspace.fx.scanFailed") });
    }
    if (head) useYumbieStore.getState().shift();
  },
  frame: (api, { step, st }) => {
    const led = api.$("yb-scan-led");
    const processing = step.m === "act" && step.fx === "process";
    if (led)
      led.setAttribute(
        "opacity",
        processing || (step.m === "act" && step.fx === "checkled") ? (0.4 + 0.6 * Math.abs(Math.sin(st * 10))).toFixed(2) : "0.4"
      );
    if (processing) {
      const line = api.$("yb-scan-line");
      if (line) line.setAttribute("y", (82 + 11 * (0.5 + 0.5 * Math.sin(st * 5))).toFixed(1));
    }
  },
};

export default scan;
