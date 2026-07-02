/**
 * today scene — Yumbie's home. Yumbie LIVES here: a wall clock (ticks in real
 * time), a mini bookshelf, a small bed, a chair and a potted plant. There is no
 * window/day-night anymore.
 *
 * Behaviour: Yumbie RE-ENACTS the user's real recent actions. Every other cycle
 * it re-files one receipt the user actually scanned this week (count from
 * useYumbieProgress.recentReceipts, fed by real data) — walk to the inbox, pick
 * the slip, carry it to the door, hand off. Otherwise it settles into a real
 * rest activity — lie in bed (eyes shut, zZz), sit on the chair and read a book,
 * or water the plant — choosing a different one each time rather than pacing the
 * room. Never a fake action.
 */
import type { Scene, Step } from "../types";
import { useYumbieProgress } from "../useYumbieProgress";

const CLOCK_CX = 163;
const CLOCK_CY = 28;

/* Resting stations — where Yumbie settles for each activity. */
const BED_X = 110; // lie down: head reaches the pillow (left), feet stay on the bed
const CHAIR_X = 163; // sit & read, centred on the chair
const PLANT_X = 230; // stand beside the plant to water it (can reaches right)

/**
 * Pick the next rest activity, never repeating the one just performed, so Yumbie
 * varies what it does between cycles instead of looping the same beat. Module
 * scope persists the last choice across cycles (the engine calls plan() fresh
 * each cycle). 0 = sleep, 1 = read, 2 = water.
 */
let lastActivity = -1;
function pickRestActivity(): number {
  const options = [0, 1, 2].filter((o) => o !== lastActivity);
  lastActivity = options[Math.floor(Math.random() * options.length)];
  return lastActivity;
}

const today: Scene = {
  id: "today",
  Props: () => (
    <g id="yb-scene-today">
      {/* floor rug under the living area */}
      <ellipse cx="120" cy="108" rx="64" ry="3.2" fill="var(--ys-deep)" opacity="0.5" />

      {/* wall clock — replaces the window; hands are ticked live in frame() */}
      <g id="yb-clock">
        <circle cx={CLOCK_CX} cy={CLOCK_CY} r="15" fill="var(--ys-panel)" stroke="var(--ys-deep)" strokeWidth="2.2" />
        <circle cx={CLOCK_CX} cy={CLOCK_CY} r="12.5" fill="var(--ys-panel2)" />
        <line x1="163" y1="16" x2="163" y2="18.6" stroke="var(--app-text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="163" y1="40" x2="163" y2="37.4" stroke="var(--app-text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="151" y1="28" x2="153.6" y2="28" stroke="var(--app-text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="175" y1="28" x2="172.4" y2="28" stroke="var(--app-text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
        <line id="yb-clock-hour" x1="163" y1="28" x2="163" y2="21.5" stroke="var(--app-text-secondary)" strokeWidth="2" strokeLinecap="round" />
        <line id="yb-clock-min" x1="163" y1="28" x2="163" y2="18" stroke="var(--app-text-secondary)" strokeWidth="1.5" strokeLinecap="round" />
        <line id="yb-clock-sec" x1="163" y1="28" x2="163" y2="17" stroke="#EF6A43" strokeWidth="0.9" strokeLinecap="round" />
        <circle cx={CLOCK_CX} cy={CLOCK_CY} r="1.5" fill="#EF6A43" />
      </g>

      {/* framed picture above the bed */}
      <g>
        <rect x="84" y="18" width="22" height="16" rx="1.5" fill="var(--ys-deep)" />
        <rect x="86" y="20" width="18" height="12" rx="1" fill="var(--ys-panel2)" />
        <path d="M86 32 l5 -6 l4 4 l3 -3 l6 5 Z" fill="#67D07F" opacity="0.85" />
        <circle cx="100" cy="23" r="2" fill="#F2C14E" />
      </g>

      {/* mini bookshelf (left) */}
      <g>
        <ellipse cx="31" cy="108" rx="18" ry="2.6" fill="var(--ys-deep)" opacity="0.5" />
        <rect x="16" y="72" width="30" height="36" rx="2" fill="#8a5c2e" />
        <rect x="18" y="74" width="26" height="14" fill="#6e4a25" />
        <rect x="18" y="90" width="26" height="14" fill="#6e4a25" />
        <rect x="20" y="76" width="3" height="12" fill="#d96a4a" />
        <rect x="24" y="78" width="3" height="10" fill="#e0b050" />
        <rect x="28" y="76" width="3" height="12" fill="#5b8def" />
        <rect x="32.5" y="79" width="4" height="9" fill="#7fae8f" />
        <rect x="38" y="76" width="3" height="12" fill="#a78bfa" />
        <rect x="20" y="92" width="3" height="12" fill="#5b8def" />
        <rect x="24.5" y="94" width="4" height="10" fill="#d96a4a" />
        <rect x="30" y="92" width="3" height="12" fill="#e0b050" />
        <rect x="34" y="93" width="3" height="11" fill="#7fae8f" />
        <rect x="38" y="92" width="3" height="12" fill="#d96a4a" />
      </g>

      {/* small bed (left-center) */}
      <g>
        <ellipse cx="96" cy="108" rx="30" ry="2.6" fill="var(--ys-deep)" opacity="0.45" />
        <rect x="69" y="99" width="54" height="6" rx="2" fill="#8a5c2e" />
        <rect x="69" y="103" width="3" height="5" fill="#6e4a25" />
        <rect x="120" y="103" width="3" height="5" fill="#6e4a25" />
        <rect x="71" y="93" width="50" height="8" rx="3" fill="#d9d2c4" />
        <rect x="71" y="93" width="50" height="3.5" rx="3" fill="#e7e1d6" />
        <path d="M96 93 h25 v8 h-25 Z" fill="#7fae8f" />
        <path d="M96 93 h25 v3 h-25 Z" fill="#8fbf9d" />
        <rect x="73" y="90" width="16" height="7" rx="3" fill="#cfe0ec" />
      </g>

      {/* chair (center, under the clock) */}
      <g>
        <ellipse cx="163" cy="108" rx="15" ry="2.4" fill="var(--ys-deep)" opacity="0.45" />
        <rect x="153" y="82" width="3.5" height="20" rx="1.5" fill="#8a5c2e" />
        <rect x="153" y="83" width="15" height="3" rx="1.5" fill="#a06a32" />
        <rect x="153" y="88" width="15" height="3" rx="1.5" fill="#a06a32" />
        <rect x="152" y="95" width="22" height="4" rx="1.5" fill="#9a6a32" />
        <rect x="153" y="99" width="3" height="9" fill="#6e4a25" />
        <rect x="170" y="99" width="3" height="9" fill="#6e4a25" />
      </g>

      {/* inbox tray + the receipt Yumbie re-files */}
      <g>
        <ellipse cx="210" cy="108" rx="16" ry="2.4" fill="var(--ys-deep)" opacity="0.45" />
        <rect x="196" y="100" width="28" height="7" rx="2" fill="var(--ys-panel)" />
        <rect x="196" y="100" width="28" height="2.6" rx="2" fill="var(--ys-panel2)" />
        <path id="yb-slip1" d="M203 84 h14 v18 l-1.75 2 l-1.75 -2 l-1.75 2 l-1.75 -2 l-1.75 2 l-1.75 -2 l-1.75 2 l-1.75 -2 Z" fill="#ECEAE2" />
        <line x1="206" y1="89" x2="215" y2="89" stroke="#B9B5A8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="206" y1="93" x2="213" y2="93" stroke="#B9B5A8" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* potted plant (near the door) */}
      <g>
        <ellipse cx="252" cy="108" rx="12" ry="2.4" fill="var(--ys-deep)" opacity="0.45" />
        <path d="M244 108 l2.5 -14 h12 l2.5 14 Z" fill="#b9542f" />
        <path d="M244 108 l2.5 -14 h6 l0 14 Z" fill="#cf6a44" />
        <rect x="242" y="90" width="21" height="4.5" rx="2" fill="#d8743f" />
        <line x1="252.5" y1="92" x2="252.5" y2="72" stroke="#3B8F5A" strokeWidth="2.2" strokeLinecap="round" />
        <ellipse cx="246" cy="80" rx="5" ry="2.4" fill="#4CAF6E" transform="rotate(-28 246 80)" />
        <ellipse cx="259" cy="77" rx="5" ry="2.4" fill="#56C271" transform="rotate(28 259 77)" />
        <ellipse cx="247" cy="72" rx="4.4" ry="2.2" fill="#56C271" transform="rotate(-22 247 72)" />
        <ellipse id="yb-leaftop" cx="252" cy="69" rx="2.6" ry="4.4" fill="#67D07F" />
      </g>

      {/* zZz — drifts up above the pillow while sleeping. Stays in the back
          layer: it sits above Yumbie's head, so nothing occludes it. */}
      <g id="yb-zzz" style={{ display: "none" }}>
        <text x="85" y="84" fontSize="6" fontWeight="700" fill="var(--app-text-secondary)">z</text>
        <text x="90" y="79" fontSize="8" fontWeight="700" fill="var(--app-text-secondary)">z</text>
        <text x="96" y="73" fontSize="10" fontWeight="700" fill="var(--app-text-secondary)">Z</text>
      </g>
    </g>
  ),
  // Held items drawn in FRONT of Yumbie (see Scene.FrontProps).
  FrontProps: () => (
    <g>
      {/* open hardcover book — held up to read while seated on the chair (~x163).
          Bound look: leather cover boards, an inset page block with fore-edge
          thickness, a stitched spine, a gilt edge line and a bookmark ribbon.
          The page (#yb-book-flip) turns periodically in frame(). */}
      <g id="yb-book" style={{ display: "none" }}>
        {/* hard cover boards (sit just proud of the pages, darker leather) */}
        <path d="M163 83.2 L146.6 85 Q144.6 85.2 144.6 87.2 L144.6 95.6 Q144.6 96.9 146.3 96.7 L163 95.2 Z" fill="#6e3c20" />
        <path d="M163 83.2 L179.4 85 Q181.4 85.2 181.4 87.2 L181.4 95.6 Q181.4 96.9 179.7 96.7 L163 95.2 Z" fill="#854a29" />
        {/* page block (cream), inset within the boards */}
        <path d="M163 84.5 L148.4 86 Q146.8 86.2 146.8 87.9 L146.8 94.8 Q146.8 95.6 148 95.4 L163 94 Z" fill="#efe9dd" />
        <path d="M163 84.5 L177.6 86 Q179.2 86.2 179.2 87.9 L179.2 94.8 Q179.2 95.6 178 95.4 L163 94 Z" fill="#f5f0e6" />
        {/* fore-edge page stacks — a hint of many pages */}
        <path d="M147.3 94.6 l1 1 M147.6 92.8 l1 1 M147.9 91 l1 1" stroke="#d9d1bf" strokeWidth="0.45" strokeLinecap="round" />
        <path d="M178.7 94.6 l-1 1 M178.4 92.8 l-1 1 M178.1 91 l-1 1" stroke="#d9d1bf" strokeWidth="0.45" strokeLinecap="round" />
        {/* stitched spine + gutter shadow */}
        <rect x="161.8" y="83" width="2.4" height="12.4" rx="1" fill="#54301a" />
        <rect x="162.6" y="84.6" width="0.8" height="9.2" fill="#000000" opacity="0.12" />
        {/* gilt edge line along the cover */}
        <path d="M147.4 96.2 L162 94.9 M178.6 96.2 L164 94.9" stroke="#caa24a" strokeWidth="0.45" opacity="0.65" />
        {/* text lines on both pages */}
        <line x1="150.8" y1="88.2" x2="160" y2="87.4" stroke="#bdb4a2" strokeWidth="0.55" strokeLinecap="round" />
        <line x1="151" y1="90" x2="160" y2="89.2" stroke="#c8c0af" strokeWidth="0.55" strokeLinecap="round" />
        <line x1="151.2" y1="91.8" x2="160" y2="91.1" stroke="#c8c0af" strokeWidth="0.55" strokeLinecap="round" />
        <line x1="166" y1="87.4" x2="175.2" y2="88.2" stroke="#bdb4a2" strokeWidth="0.55" strokeLinecap="round" />
        <line x1="166" y1="89.2" x2="175" y2="90" stroke="#c8c0af" strokeWidth="0.55" strokeLinecap="round" />
        <line x1="166" y1="91.1" x2="174.8" y2="91.8" stroke="#c8c0af" strokeWidth="0.55" strokeLinecap="round" />
        {/* turning page — copy of the right page, swept across the spine in frame() */}
        <path id="yb-book-flip" d="M163 84.5 L177.6 86 Q179.2 86.2 179.2 87.9 L179.2 94.8 Q179.2 95.6 178 95.4 L163 94 Z" fill="#faf6ee" opacity="0" />
        {/* bookmark ribbon hanging from the spine */}
        <path d="M169.5 83.6 L169.5 99.4 L170.9 97.4 L172.3 99.4 L172.3 83.6 Z" fill="#3FB8A5" />
      </g>

      {/* watering can — held toward the plant while watering (~x248) */}
      <g id="yb-can" style={{ display: "none" }}>
        <rect x="243" y="80" width="11" height="9" rx="2.5" fill="#3FB8A5" />
        <rect x="244.5" y="89" width="8" height="1.6" rx="0.8" fill="#2C8A7A" />
        <rect x="246" y="77" width="6" height="3" rx="1.5" fill="#2C8A7A" />
        <path d="M254 82 L261 78" stroke="#3FB8A5" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M243 82 q-3.2 2 -1 5.2" stroke="#2C8A7A" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        <g id="yb-can-drops">
          <line x1="261" y1="80" x2="261.6" y2="84" stroke="#7fd0e8" strokeWidth="1" strokeLinecap="round" />
          <line x1="259" y1="82" x2="259.6" y2="85" stroke="#7fd0e8" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      </g>
    </g>
  ),
  plan: (cycle) => {
    const recent = useYumbieProgress.getState().recentReceipts ?? 0;
    const replayCount = Math.min(recent, 4);

    // Re-enact one real receipt scan on alternating cycles, as long as the user
    // actually scanned this week. No receipts → no carry beats (no fake work).
    if (replayCount > 0 && cycle % 2 === 0) {
      return [
        { m: "idle", d: 0.9, msg: "yumbie.workspace.onDuty" },
        { m: "walk", to: 206, msg: "yumbie.workspace.today.newReceipt" },
        { m: "pick", d: 0.7, src: "yb-slip1", label: "yumbie.workspace.fx.plusReceipt", msg: "yumbie.workspace.today.picking" },
        { m: "walk", to: 268, msg: "yumbie.workspace.today.toDoor" },
        { m: "act", d: 0.8, fx: "handoff", msg: "yumbie.workspace.today.handoff" },
      ];
    }

    // Living beat — settle into a real activity (lie in bed, sit & read, or
    // water the plant). The activity is chosen without repeating the previous
    // one, so Yumbie never does the same thing twice in a row.
    const activity = pickRestActivity();
    if (activity === 0) {
      return [
        { m: "walk", to: BED_X, msg: "yumbie.workspace.ambient.sleeping" },
        { m: "lie", d: 16, msg: "yumbie.workspace.ambient.sleeping" },
      ];
    }
    if (activity === 1) {
      return [
        { m: "walk", to: CHAIR_X, msg: "yumbie.workspace.ambient.reading" },
        { m: "sit", d: 30, msg: "yumbie.workspace.ambient.reading" },
      ];
    }
    return [
      { m: "walk", to: PLANT_X, msg: "yumbie.workspace.today.watering" },
      { m: "tend", d: 6, lean: 9, msg: "yumbie.workspace.today.watering" },
    ];
  },
  onActEnd: (fx, api) => {
    if (fx !== "handoff") return;
    const door = api.$("yb-doorP");
    if (door) {
      door.setAttribute("fill", "var(--yb-door-handle)");
      setTimeout(() => door.setAttribute("fill", "var(--yb-door-panel)"), 320);
    }
    const slip = api.$("yb-slip1");
    if (slip) slip.style.opacity = "1";
  },
  frame: (api, { step, st }) => {
    // Live wall clock — hour/minute/second hands from the real time.
    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const min = now.getMinutes() + sec / 60;
    const hr = (now.getHours() % 12) + min / 60;
    api.$("yb-clock-hour")?.setAttribute("transform", `rotate(${(hr * 30).toFixed(2)} ${CLOCK_CX} ${CLOCK_CY})`);
    api.$("yb-clock-min")?.setAttribute("transform", `rotate(${(min * 6).toFixed(2)} ${CLOCK_CX} ${CLOCK_CY})`);
    api.$("yb-clock-sec")?.setAttribute("transform", `rotate(${(sec * 6).toFixed(2)} ${CLOCK_CX} ${CLOCK_CY})`);

    // Activity props — each is visible only during its own rest beat.
    const book = api.$("yb-book");
    const zzz = api.$("yb-zzz");
    const can = api.$("yb-can");
    if (book) book.style.display = step.m === "sit" ? "" : "none";
    if (zzz) zzz.style.display = step.m === "lie" ? "" : "none";
    if (can) can.style.display = step.m === "tend" ? "" : "none";

    // Reading: turn a page now and then, plus a slow breathing sway of the book.
    if (book && step.m === "sit") {
      const flip = api.$("yb-book-flip");
      if (flip) {
        const PERIOD = 7.5; // seconds between page turns
        const DUR = 0.95; // length of a single turn
        const phase = st % PERIOD;
        if (phase < DUR) {
          const k = phase / DUR; // 0 → 1
          const sx = Math.cos((Math.PI * k) / 1); // +1 → -1 (page sweeps over the spine)
          flip.setAttribute("transform", `translate(163 0) scale(${sx.toFixed(3)} 1) translate(-163 0)`);
          flip.setAttribute("opacity", "1");
        } else {
          flip.setAttribute("opacity", "0");
        }
      }
      // Subtle hold sway so the book feels held, not pinned.
      const sway = Math.sin(st * 1.1) * 0.5;
      book.setAttribute("transform", `translate(0 ${sway.toFixed(2)})`);
    }
    // zZz drifts up and fades on a slow loop while sleeping.
    if (zzz && step.m === "lie") {
      const p = (st % 1.8) / 1.8;
      zzz.setAttribute("transform", `translate(${(-2 * p).toFixed(1)} ${(-7 * p).toFixed(1)})`);
      zzz.setAttribute("opacity", (0.9 * (1 - p)).toFixed(2));
    }
    // Watering can tilts toward the plant in gentle pouring waves through the beat.
    if (can && step.m === "tend") {
      const k = Math.max(0, Math.sin(st * 1.6));
      can.setAttribute("transform", `rotate(${(20 * k).toFixed(1)} 248 88)`);
      const drops = api.$("yb-can-drops");
      if (drops) drops.setAttribute("opacity", k > 0.25 ? "1" : "0");
    }

    // Plant leaf — gentle pulse while watering, otherwise scaled by the bond.
    const lf = api.$("yb-leaftop");
    if (!lf) return;
    if (step.m === "tend") {
      const k = 1 + 0.35 * Math.sin(Math.PI * Math.min(st / step.d, 1));
      lf.setAttribute("rx", (2.6 * k).toFixed(2));
      lf.setAttribute("ry", (4.4 * k).toFixed(2));
    } else {
      const bond = useYumbieProgress.getState().bond ?? 0;
      const f = 1 + 0.3 * Math.min(1, bond / 10);
      lf.setAttribute("rx", (2.6 * f).toFixed(2));
      lf.setAttribute("ry", (4.4 * f).toFixed(2));
    }
  },
};

export default today;
