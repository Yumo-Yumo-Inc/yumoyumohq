/**
 * bills scene — payments shift. Yumbie picks a due bill envelope from the side
 * table and carries it to the door (handoff → door flashes green = paid). A wall
 * calendar marks due dates; a small card terminal sits on the right shelf.
 * Structural surfaces use --ys-* (theme-aware); paper/accents stay literal.
 */
import type { Scene, Step } from "../types";

const bills: Scene = {
  id: "bills",
  Props: () => (
    <g id="yb-scene-bills">
      {/* Wall calendar (top-left) */}
      <g style={{ cursor: "pointer" }}>
        <rect x="16" y="14" width="50" height="40" rx="4" fill="var(--ys-panel)" />
        <rect x="12" y="54" width="58" height="3" rx="1" fill="var(--ys-deep)" />
        {/* paper */}
        <rect x="20" y="26" width="42" height="24" rx="1" fill="#F4F1E8" />
        {/* red header band */}
        <rect x="20" y="18" width="42" height="9" rx="1" fill="#FF8A6B" />
        <circle cx="30" cy="16" r="2" fill="var(--ys-edge2)" />
        <circle cx="52" cy="16" r="2" fill="var(--ys-edge2)" />
        {/* day grid */}
        <g fill="#C9C4B6">
          <rect x="24" y="31" width="5" height="4" rx="1" />
          <rect x="32" y="31" width="5" height="4" rx="1" />
          <rect x="40" y="31" width="5" height="4" rx="1" />
          <rect x="48" y="31" width="5" height="4" rx="1" />
          <rect x="24" y="39" width="5" height="4" rx="1" />
          <rect x="32" y="39" width="5" height="4" rx="1" />
          <rect x="48" y="39" width="5" height="4" rx="1" />
        </g>
        {/* due date marker */}
        <circle id="yb-bill-due" cx="42.5" cy="41" r="3.6" fill="#E85A3C" />
      </g>

      {/* Card terminal on right shelf */}
      <rect x="236" y="44" width="48" height="4" rx="2" fill="var(--ys-panel)" />
      <g>
        {/* device body */}
        <rect x="252" y="20" width="20" height="26" rx="3" fill="var(--ys-panel2)" />
        {/* green screen */}
        <rect x="255" y="24" width="14" height="9" rx="1.5" fill="#0B1A0E" />
        <rect id="yb-bill-screen" x="256.5" y="25.5" width="11" height="6" rx="1" fill="#4ADE80" />
        {/* keypad dots */}
        <g fill="var(--ys-edge)">
          <circle cx="258" cy="37" r="1.4" />
          <circle cx="262" cy="37" r="1.4" />
          <circle cx="266" cy="37" r="1.4" />
          <circle cx="258" cy="41" r="1.4" />
          <circle cx="262" cy="41" r="1.4" />
          <circle cx="266" cy="41" r="1.4" />
        </g>
        {/* card sticking out (top) */}
        <rect x="257" y="14" width="10" height="6" rx="1" fill="#FAC775" />
      </g>

      {/* Side table + due bill envelope (pickable) */}
      <rect x="88" y="102" width="34" height="6" rx="2" fill="var(--ys-panel)" />
      <rect x="88" y="102" width="34" height="2.5" rx="2" fill="var(--ys-panel2)" />
      <g id="yb-slip1">
        {/* envelope body */}
        <rect x="92" y="84" width="26" height="18" rx="1.5" fill="#ECEAE2" />
        {/* flap */}
        <path d="M92 85 L105 95 L118 85" fill="none" stroke="#C2BCA9" strokeWidth="1.4" strokeLinejoin="round" />
        {/* due stamp */}
        <rect x="108" y="87" width="7" height="5" rx="1" fill="#E85A3C" />
      </g>
    </g>
  ),
  plan: (cycle) => {
    const s: Step[] = [
      { m: "idle", d: 1.4, msg: "yumbie.workspace.bills.billsShift" },
      { m: "walk", to: 92, msg: "yumbie.workspace.bills.duePile" },
      { m: "pick", d: 0.7, src: "yb-slip1", label: "yumbie.workspace.bills.paid", msg: "yumbie.workspace.bills.picking" },
      { m: "walk", to: 264, msg: "yumbie.workspace.bills.toTerminal" },
      { m: "act", d: 0.9, fx: "pay", msg: "yumbie.workspace.bills.paying" },
    ];
    if (cycle % 3 === 2) {
      s.push(
        { m: "walk", to: 42, msg: "yumbie.workspace.bills.checking" },
        { m: "tend", d: 1.0, msg: "yumbie.workspace.bills.checking" }
      );
    }
    s.push({ m: "walk", to: 44, msg: "yumbie.workspace.bills.shiftContinues" });
    return s;
  },
  onActEnd: (fx, api) => {
    if (fx !== "pay") return;
    const door = api.$("yb-doorP");
    if (door) {
      door.setAttribute("fill", "#4ADE80");
      setTimeout(() => door.setAttribute("fill", "var(--yb-door-panel)"), 340);
    }
    const slip = api.$("yb-slip1");
    if (slip) slip.style.opacity = "1";
  },
};

export default bills;
