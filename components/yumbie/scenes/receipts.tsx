/**
 * receipts scene — archive shift, COMPACT FRAME (ground y=108). Yumbie takes a
 * receipt from the inbox to the filing cabinet; the open drawer (yb-drw) flashes
 * and an "archived" label rises. Logic + ids (yb-drw, yb-slip2) preserved;
 * visuals upgraded (depth cabinet, file tabs, wall clock).
 */
import type { Scene } from "../types";

const receipts: Scene = {
  id: "receipts",
  Props: () => (
    <g id="yb-scene-receipts" style={{ display: "none" }}>
      {/* wall clock */}
      <circle cx="196" cy="30" r="13" fill="var(--ys-panel)" />
      <circle cx="196" cy="30" r="13" fill="none" stroke="var(--ys-line)" strokeWidth="1.4" />
      <circle cx="196" cy="30" r="10" fill="var(--ys-deep)" />
      <line x1="196" y1="21" x2="196" y2="23" stroke="var(--ys-edge2)" strokeWidth="1.1" />
      <line x1="196" y1="37" x2="196" y2="39" stroke="var(--ys-edge2)" strokeWidth="1.1" />
      <line x1="187" y1="30" x2="189" y2="30" stroke="var(--ys-edge2)" strokeWidth="1.1" />
      <line x1="203" y1="30" x2="205" y2="30" stroke="var(--ys-edge2)" strokeWidth="1.1" />
      <line x1="196" y1="30" x2="196" y2="24" stroke="#cfccc0" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="196" y1="30" x2="201" y2="33" stroke="#cfccc0" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="196" cy="30" r="1.2" fill="#C9A24B" />

      {/* filing cabinet with depth */}
      <path d="M106 62 l8 -5 v51 l-8 5 Z" fill="var(--ys-deep)" />
      <path d="M108 58 l8 -5 h-60 l-8 5 Z" fill="var(--ys-panel2)" />
      <rect x="48" y="58" width="60" height="6" rx="2" fill="var(--ys-panel)" />
      <rect x="50" y="62" width="56" height="46" rx="2" fill="var(--ys-panel)" />
      <rect x="54" y="66" width="48" height="13" rx="2" fill="var(--ys-panel)" />
      <rect x="58" y="68" width="16" height="3.5" rx="1" fill="var(--ys-line)" />
      <rect x="72" y="73" width="12" height="2.6" rx="1.3" fill="var(--ys-edge)" />
      {/* open middle drawer (flash target) with file tabs */}
      <rect id="yb-drw" x="51" y="82" width="58" height="16" rx="2" fill="var(--ys-panel2)" />
      <rect x="55" y="82" width="50" height="4.5" rx="1" fill="var(--ys-deep)" />
      <rect x="60" y="76" width="8.5" height="8" rx="1" fill="#d8c89a" />
      <rect x="71" y="74" width="8.5" height="10" rx="1" fill="#cdbd8e" />
      <rect x="82" y="76" width="8.5" height="8" rx="1" fill="#d8c89a" />
      <rect x="93" y="75" width="8.5" height="9" rx="1" fill="#cdbd8e" />
      <rect x="72" y="92" width="12" height="2.6" rx="1.3" fill="var(--ys-edge)" />
      {/* bottom drawer */}
      <rect x="54" y="100" width="48" height="7" rx="2" fill="var(--ys-panel)" />
      <rect x="72" y="102.5" width="12" height="2.4" rx="1.2" fill="var(--ys-edge)" />
      {/* archived stamp on top (decor) */}
      <g transform="translate(90,52) rotate(-12)"><rect x="-4" y="0" width="9" height="6" rx="1.5" fill="#2C8A7A" /><rect x="-2.5" y="-4" width="6" height="4" rx="1.5" fill="#3FB8A5" /></g>

      {/* inbox with a receipt to file (yb-slip2 = pick target) */}
      <rect x="236" y="100" width="38" height="8" rx="2" fill="var(--ys-panel)" />
      <rect x="236" y="100" width="38" height="3" rx="2" fill="var(--ys-panel2)" />
      <g transform="rotate(7 250 92)"><rect x="242" y="82" width="16" height="20" rx="1.5" fill="#D8D5CA" /></g>
      <path
        id="yb-slip2"
        d="M246 80 h18 v20 l-2.25 2.5 l-2.25 -2.5 l-2.25 2.5 l-2.25 -2.5 l-2.25 2.5 l-2.25 -2.5 l-2.25 2.5 l-2.25 -2.5 Z"
        fill="#ECEAE2"
      />
      <line x1="250" y1="86" x2="262" y2="86" stroke="#B9B5A8" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="250" y1="90" x2="259" y2="90" stroke="#B9B5A8" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  ),
  plan: () => [
    { m: "idle", d: 1.1, msg: "yumbie.workspace.receipts.archiveShift" },
    { m: "walk", to: 218, msg: "yumbie.workspace.receipts.inboxHasReceipt" },
    { m: "pick", d: 0.6, src: "yb-slip2", label: "yumbie.workspace.fx.plusReceipt", msg: "yumbie.workspace.receipts.picking" },
    { m: "walk", to: 130, msg: "yumbie.workspace.receipts.toFiling" },
    { m: "act", d: 0.9, fx: "file", msg: "yumbie.workspace.receipts.archiving" },
    { m: "walk", to: 178, msg: "yumbie.workspace.receipts.next" },
  ],
  onActEnd: (fx, api) => {
    if (fx !== "file") return;
    const d = api.$("yb-drw");
    if (d) {
      d.setAttribute("fill", "var(--ys-edge)");
      setTimeout(() => d.setAttribute("fill", "var(--ys-panel2)"), 350);
    }
    api.pushFx({ t: "plus", a: 0, x: 130, y: 54, txt: api.t("yumbie.workspace.fx.archived") });
    const slip = api.$("yb-slip2");
    if (slip) slip.style.opacity = "1";
  },
};

export default receipts;
