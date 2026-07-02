/**
 * wallet scene — vault, honest mirror of the REAL cPoint balance, COMPACT FRAME
 * (ground y=108). The progress stack (yb-w1..5) shows distance to the next
 * milestone (scaled, not absolute). Coin/+1 FX only on a REAL increase; a tier
 * completion flashes the teal diamond (yb-wdia). Empty if no data. Logic + ids
 * preserved; visuals upgraded (dial vault).
 */
import type { Scene, SceneApi } from "../types";
import { useYumbieProgress } from "../useYumbieProgress";
import { tierInfo } from "../walletTier";

let lastSeen: number | null = null;

function applyStack(api: SceneApi): void {
  const cp = useYumbieProgress.getState().cPoints;
  if (cp == null) {
    for (let i = 1; i <= 5; i++) {
      const w = api.$(`yb-w${i}`);
      if (w) w.style.display = "none";
    }
    return;
  }
  const filled = Math.max(0, Math.min(5, Math.round(tierInfo(cp).progress * 5)));
  for (let i = 1; i <= 5; i++) {
    const w = api.$(`yb-w${i}`);
    if (w) w.style.display = i <= filled ? "" : "none";
  }
}

const wallet: Scene = {
  id: "wallet",
  Props: () => (
    <g id="yb-scene-wallet" style={{ display: "none" }}>
      {/* tier diamond (flashes on tier-up) */}
      <g id="yb-wdia" transform="translate(248,58) rotate(45)">
        <rect x="-5" y="-5" width="10" height="10" rx="2.5" fill="#3FB8A5" />
        <rect x="-5" y="0" width="10" height="5" rx="2.5" fill="#2C8A7A" />
      </g>

      {/* decorative gold pile (left, on the floor) */}
      <ellipse cx="74" cy="106" rx="16" ry="4.5" fill="#a97c17" />
      <ellipse cx="66" cy="102" rx="10" ry="3" fill="#DCA22E" />
      <ellipse cx="66" cy="98.5" rx="10" ry="3" fill="#F2C14E" />
      <ellipse cx="86" cy="102" rx="10" ry="3" fill="#DCA22E" />
      <ellipse cx="86" cy="98.5" rx="10" ry="3" fill="#FBD76E" />
      <ellipse cx="76" cy="95" rx="10" ry="3" fill="#FBD76E" />

      {/* vault with dial */}
      <rect x="206" y="64" width="84" height="44" rx="6" fill="var(--ys-panel)" />
      <rect x="206" y="64" width="84" height="7" rx="6" fill="var(--ys-panel)" />
      <rect x="202" y="74" width="6" height="30" rx="2" fill="var(--ys-deep)" />
      <circle cx="248" cy="88" r="19" fill="var(--ys-panel)" />
      <circle cx="248" cy="88" r="19" fill="none" stroke="var(--ys-line)" strokeWidth="1.8" />
      <circle cx="248" cy="88" r="15" fill="var(--ys-panel)" />
      <circle cx="248" cy="73" r="1.4" fill="var(--ys-edge)" />
      <circle cx="261" cy="81" r="1.4" fill="var(--ys-edge)" />
      <circle cx="261" cy="95" r="1.4" fill="var(--ys-edge)" />
      <circle cx="248" cy="103" r="1.4" fill="var(--ys-edge)" />
      <circle cx="235" cy="95" r="1.4" fill="var(--ys-edge)" />
      <circle cx="235" cy="81" r="1.4" fill="var(--ys-edge)" />
      <circle cx="248" cy="88" r="6.5" fill="var(--ys-line)" stroke="var(--ys-edge)" strokeWidth="1.2" />
      <line x1="248" y1="81.5" x2="248" y2="94.5" stroke="var(--ys-edge)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="241.5" y1="88" x2="254.5" y2="88" stroke="var(--ys-edge)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="248" cy="88" r="2" fill="#C9A24B" />

      {/* progress stack toward the next milestone (yb-w1..5) */}
      <ellipse cx="186" cy="104" rx="9" ry="3.2" fill="#DCA22E" />
      <ellipse id="yb-w1" cx="186" cy="100.5" rx="9" ry="3.2" fill="#F2C14E" style={{ display: "none" }} />
      <ellipse id="yb-w2" cx="186" cy="97" rx="9" ry="3.2" fill="#FBD76E" style={{ display: "none" }} />
      <ellipse id="yb-w3" cx="186" cy="93.5" rx="9" ry="3.2" fill="#F2C14E" style={{ display: "none" }} />
      <ellipse id="yb-w4" cx="186" cy="90" rx="9" ry="3.2" fill="#FBD76E" style={{ display: "none" }} />
      <ellipse id="yb-w5" cx="186" cy="86.5" rx="9" ry="3.2" fill="#F2C14E" style={{ display: "none" }} />
    </g>
  ),
  plan: () => [
    { m: "idle", d: 1.0, msg: "yumbie.workspace.wallet.counting" },
    { m: "walk", to: 160, msg: "yumbie.workspace.wallet.toVault" },
    { m: "act", d: 0.8, fx: "dep", msg: "yumbie.workspace.wallet.stacking" },
    { m: "walk", to: 60, msg: "yumbie.workspace.wallet.counting" },
  ],
  onActStart: (fx, api) => {
    if (fx === "dep") applyStack(api);
  },
  onActEnd: (fx, api) => {
    if (fx !== "dep") return;
    const cp = useYumbieProgress.getState().cPoints;
    if (cp == null) {
      applyStack(api);
      return;
    }
    if (lastSeen == null) {
      lastSeen = cp;
      applyStack(api);
      return;
    }
    if (cp > lastSeen) {
      const before = tierInfo(lastSeen);
      const after = tierInfo(cp);
      api.pushFx({ t: "plus", a: 0, x: 186, y: 78, txt: api.t("yumbie.workspace.fx.plusCPoint") });
      if (after.lo > before.lo) {
        const dia = api.$("yb-wdia");
        if (dia) {
          dia.setAttribute("opacity", "0.3");
          setTimeout(() => dia.setAttribute("opacity", "1"), 300);
        }
      }
      lastSeen = cp;
    }
    applyStack(api);
  },
};

export default wallet;
