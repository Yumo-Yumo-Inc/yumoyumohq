"use client"

import { useEffect, useRef } from "react"

/**
 * Isometric "command room" — the animated backdrop for the hero.
 *
 * Room geometry is generated once into the SVG. A lightweight rAF loop runs
 * ambient station micro-animations (server LEDs, holo chart). Paused when the tab
 * is hidden or the hero scrolls out of view.
 */

// Isometric projection: world (tile x, tile y, height z) -> screen (px, py).
function isoProj(x: number, y: number, z = 0): [number, number] {
  return [800 + (x - y) * 76, 168 + (x + y) * 38 - z]
}

const f1 = (n: number) => n.toFixed(1)

function buildRoom(svg: SVGSVGElement): void {
  const pj = isoProj
  const P = (p: [number, number]) => `${f1(p[0])},${f1(p[1])}`
  const sub = (a: [number, number], b: [number, number]): [number, number] => [a[0] - b[0], a[1] - b[1]]
  const poly = (pts: [number, number][], fill: string, extra?: string) =>
    `<polygon points="${pts.map(P).join(" ")}" fill="${fill}" ${extra || ""}/>`
  const line = (a: [number, number], b: [number, number], st: string, w: number, op?: number) =>
    `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="${st}" stroke-width="${w}" opacity="${op ?? 1}"/>`

  // cuboid from z0..z0+h
  const box = (
    x: number, y: number, w: number, d: number, h: number,
    c: { top: string; left: string; right: string }, z0 = 0,
  ) => {
    const z1 = z0 + h
    const top: [number, number][] = [pj(x, y, z1), pj(x + w, y, z1), pj(x + w, y + d, z1), pj(x, y + d, z1)]
    const right: [number, number][] = [pj(x + w, y, z0), pj(x + w, y + d, z0), pj(x + w, y + d, z1), pj(x + w, y, z1)]
    const left: [number, number][] = [pj(x, y + d, z0), pj(x + w, y + d, z0), pj(x + w, y + d, z1), pj(x, y + d, z1)]
    const st = 'stroke="#000" stroke-opacity="0.3" stroke-width="2" stroke-linejoin="round"'
    return poly(left, c.left, st) + poly(right, c.right, st) + poly(top, c.top, st)
  }

  // face frames for decals
  type Face = { O: [number, number]; U: [number, number]; V: [number, number] }
  const faceR = (x: number, y: number, w: number, d: number, h: number, z0 = 0): Face => {
    const O = pj(x + w, y, z0)
    return { O, U: sub(pj(x + w, y + d, z0), O), V: sub(pj(x + w, y, z0 + h), O) }
  }
  const faceL = (t: number, h: number): Face => {
    const O = pj(0, t, h)
    return { O, U: sub(pj(0, t + 1, h), O), V: sub(pj(0, t, h + 1), O) }
  }
  const fp = (f: Face, u: number, v: number): [number, number] => [
    f.O[0] + f.U[0] * u + f.V[0] * v,
    f.O[1] + f.U[1] * u + f.V[1] * v,
  ]
  const fquad = (f: Face, u0: number, v0: number, u1: number, v1: number, fill: string, extra?: string) =>
    poly([fp(f, u0, v0), fp(f, u1, v0), fp(f, u1, v1), fp(f, u0, v1)], fill, extra)

  let s = ""
  const H = 300

  // walls (dark, modern)
  s += poly([pj(0, 0, 0), pj(8, 0, 0), pj(8, 0, H), pj(0, 0, H)], "#14161f")
  s += poly([pj(0, 0, 0), pj(0, 8, 0), pj(0, 8, H), pj(0, 0, H)], "#0f111a")
  s += poly([pj(0, 0, 0), pj(8, 0, 0), pj(8, 0, 12), pj(0, 0, 12)], "#0e0f16")
  s += poly([pj(0, 0, 0), pj(0, 8, 0), pj(0, 8, 12), pj(0, 0, 12)], "#0a0b11")
  // floor
  s += poly([pj(0, 0), pj(8, 0), pj(8, 8), pj(0, 8)], "#13151c")
  for (let i = 0; i <= 8; i++) {
    s += line(pj(i, 0), pj(i, 8), "#1f3a44", 1.5, 0.45) + line(pj(0, i), pj(8, i), "#1f3a44", 1.5, 0.45)
  }
  // rug
  s += poly([pj(2.4, 2.8), pj(5.6, 2.8), pj(5.6, 6), pj(2.4, 6)], "#0e2230", 'opacity="0.7"')
  s += poly([pj(2.7, 3.1), pj(5.3, 3.1), pj(5.3, 5.7), pj(2.7, 5.7)], "#123040", 'opacity="0.6"')

  // ---- wall items (screens / digital boards) ----
  const wr = (t: number, h: number) => pj(t, 0, h)
  const wl = (t: number, h: number) => pj(0, t, h)
  const screen = (a: number, b: number, h0: number, h1: number, id: string | null, fill?: string) => {
    let o = poly(
      [wr(a - 0.07, h0 - 8), wr(b + 0.07, h0 - 8), wr(b + 0.07, h1 + 8), wr(a - 0.07, h1 + 8)],
      "#05070c",
    )
    o += `<polygon ${id ? `id="${id}" ` : ""}points="${[wr(a, h0), wr(b, h0), wr(b, h1), wr(a, h1)]
      .map(P)
      .join(" ")}" fill="${fill || "#0a1c28"}"/>`
    return o
  }
  // RIGHT WALL — trading screen wall (3 panels) + ticker
  s += screen(1.9, 3.0, 164, 248, "isoTV", "#0a1c28")
  s += `<polyline points="${[wr(2.0, 178), wr(2.2, 200), wr(2.4, 192), wr(2.6, 220), wr(2.8, 210), wr(2.96, 240)]
    .map(P)
    .join(" ")}" fill="none" stroke="#35e0e0" stroke-width="2.5"/>`
  s += screen(3.12, 3.9, 164, 248, null, "#0a1c28")
  {
    const v = [22, 44, 30, 56, 38, 64]
    for (let i = 0; i < v.length; i++) {
      const t = 3.18 + i * 0.115
      s += poly([wr(t, 176), wr(t + 0.08, 176), wr(t + 0.08, 176 + v[i]), wr(t, 176 + v[i])], i % 2 ? "#f97316" : "#ec4899")
    }
  }
  s += screen(4.02, 4.8, 164, 248, null, "#0a1c28")
  {
    for (let i = 0; i < 6; i++) {
      const t = 4.1 + i * 0.115
      const a = 188 + Math.abs(Math.sin(i * 1.7)) * 26
      const b = a + 16 + (i % 2 ? 14 : 4)
      s += `<line x1="${f1(wr(t, a)[0])}" y1="${f1(wr(t, a)[1])}" x2="${f1(wr(t, b)[0])}" y2="${f1(
        wr(t, b)[1],
      )}" stroke="${i % 2 ? "#14f195" : "#ef6f6c"}" stroke-width="5"/>`
    }
  }
  s += poly([wr(1.9, 150), wr(4.8, 150), wr(4.8, 158), wr(1.9, 158)], "#0a1622")
  {
    const c = ["#35e0e0", "#14f195", "#f97316", "#ec4899"]
    for (let i = 0; i < 15; i++) {
      const t = 1.95 + i * 0.19
      s += poly([wr(t, 151.5), wr(t + 0.1, 151.5), wr(t + 0.1, 156.5), wr(t, 156.5)], c[i % c.length], 'opacity="0.7"')
    }
  }
  // LEFT WALL — network map panel
  s += poly([wl(0.8, 156), wl(2.4, 156), wl(2.4, 250), wl(0.8, 250)], "#05070c")
  s += poly([wl(0.9, 164), wl(2.3, 164), wl(2.3, 242), wl(0.9, 242)], "#0a1c28")
  {
    const nodes: [number, number][] = [
      [1.1, 196], [1.5, 178], [1.9, 210], [2.1, 184], [1.3, 224], [1.7, 200],
    ]
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = wl(nodes[i][0], nodes[i][1]), b = wl(nodes[i + 1][0], nodes[i + 1][1])
      s += `<line x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}" stroke="#1f6a72" stroke-width="1.5"/>`
    }
    nodes.forEach((n) => {
      const p = wl(n[0], n[1])
      s += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="4" fill="#35e0e0"/>`
    })
  }
  // LEFT WALL — digital price board
  s += poly([wl(4.0, 150), wl(6.3, 150), wl(6.3, 256), wl(4.0, 256)], "#05070c")
  s += poly([wl(4.1, 158), wl(6.2, 158), wl(6.2, 248), wl(4.1, 248)], "#0a1c28")
  {
    const rows: [string, number][] = [
      ["#35e0e0", 238], ["#14f195", 222], ["#f97316", 206], ["#ec4899", 190], ["#9fd6ff", 174],
    ]
    rows.forEach(([c, h]) => {
      s += poly([wl(4.24, h), wl(5.0, h), wl(5.0, h - 9), wl(4.24, h - 9)], "#13344a")
      s += poly([wl(5.46, h), wl(6.04, h), wl(6.04, h - 9), wl(5.46, h - 9)], c)
    })
  }
  // LEFT WALL — digital clock
  {
    const t0 = 3.06
    const t1 = 3.68
    const h0 = 213
    const h1 = 229
    const midT = (t0 + t1) / 2
    const inner: [number, number][] = [wl(t0, h0), wl(t1, h0), wl(t1, h1), wl(t0, h1)]
    s += poly([wl(3.0, 210), wl(3.74, 210), wl(3.74, 232), wl(3.0, 232)], "#05070c")
    s += poly(inner, "#0a1c28")
    const clockFace = faceL(t0, h0)
    const clockCtr = fp(clockFace, midT - t0, (h0 + h1) / 2 - h0)
    const topY = wl(midT, h1)[1]
    const botY = wl(midT, h0)[1]
    const fontPx = 10
    const centerY = (topY + botY) / 2
    s += `<defs><clipPath id="isoClockClip"><polygon points="${inner.map(P).join(" ")}"/></clipPath></defs>`
    s += `<g clip-path="url(#isoClockClip)"><g transform="translate(${f1(clockCtr[0])} ${f1(
      centerY,
    )}) rotate(-25)"><text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-family="ui-monospace,monospace" font-size="${fontPx}" font-weight="700" fill="#35e0e0" letter-spacing="-0.4">09:24</text></g></g>`
  }

  // ---- furniture (fintech, back -> front) ----
  // server rack @ (0.4,0.4)
  s += box(0.4, 0.4, 0.7, 0.9, 180, { top: "#1a1d26", left: "#0f1117", right: "#15171f" })
  {
    const f = faceR(0.4, 0.4, 0.7, 0.9, 180)
    s += '<g id="isoServer">'
    for (let r = 0; r < 7; r++) {
      const v0 = 0.08 + r * 0.125
      s += fquad(f, 0.1, v0, 0.9, v0 + 0.085, "#0a0d12")
      const lc = ["#14f195", "#35e0e0", "#f97316"][r % 3]
      s += fquad(f, 0.12, v0 + 0.02, 0.18, v0 + 0.055, lc)
      s += fquad(f, 0.21, v0 + 0.02, 0.27, v0 + 0.055, r % 2 ? "#2a2f38" : lc)
    }
    s += "</g>"
  }
  // multi-monitor desk @ (0.4,1.5)
  s += box(0.4, 1.5, 1.0, 0.8, 72, { top: "#1c1f28", left: "#111319", right: "#171a22" })
  s += box(0.58, 1.62, 0.34, 0.06, 46, { top: "#0c0e13", left: "#08090d", right: "#0a0b10" }, 72)
  {
    const f = faceR(0.58, 1.62, 0.34, 0.06, 46, 72)
    s += `<polygon id="isoMon" points="${[fp(f, 0.08, 0.14), fp(f, 0.92, 0.14), fp(f, 0.92, 0.9), fp(f, 0.08, 0.9)]
      .map(P)
      .join(" ")}" fill="#0a1c28"/>`
    s += `<polyline points="${[fp(f, 0.16, 0.74), fp(f, 0.4, 0.5), fp(f, 0.62, 0.62), fp(f, 0.86, 0.3)]
      .map(P)
      .join(" ")}" fill="none" stroke="#35e0e0" stroke-width="2.5"/>`
  }
  s += box(0.98, 1.62, 0.34, 0.06, 46, { top: "#0c0e13", left: "#08090d", right: "#0a0b10" }, 72)
  {
    const f = faceR(0.98, 1.62, 0.34, 0.06, 46, 72)
    s += fquad(f, 0.08, 0.14, 0.92, 0.9, "#0a1c28")
    for (let i = 0; i < 5; i++) {
      const u = 0.16 + i * 0.15
      const hb = 0.3 + Math.abs(Math.sin(i * 1.5)) * 0.4
      s += fquad(f, u, 0.85 - hb * 0.6, u + 0.1, 0.85, i % 2 ? "#f97316" : "#ec4899")
    }
  }
  {
    const t = (x: number, y: number) => pj(x, y, 72)
    s += poly([t(0.66, 1.98), t(1.06, 1.98), t(1.06, 2.14), t(0.66, 2.14)], "#23262f")
  }
  // token vault stack @ (0.4,3.0)
  s += box(0.4, 3.0, 1.3, 1.5, 10, { top: "#15171f", left: "#0d0e13", right: "#111219" })
  {
    const ring = pj(1.0, 3.6, 10)
    s += `<ellipse cx="${f1(ring[0])}" cy="${f1(ring[1])}" rx="82" ry="44" fill="none" stroke="#35e0e0" stroke-width="3" opacity="0.45"/>`
    const tok = (cx: number, cy: number, n: number) => {
      let o = ""
      for (let i = 0; i < n; i++) {
        const p2 = pj(cx, cy, 10 + i * 9)
        o += `<ellipse cx="${f1(p2[0])}" cy="${f1(p2[1])}" rx="20" ry="11" fill="#9945ff" stroke="#14f195" stroke-width="2"/>`
      }
      return o
    }
    s += tok(0.8, 3.4, 5) + tok(1.18, 3.6, 3) + tok(0.85, 3.95, 4)
    const gl = pj(0.8, 3.4, 10 + 5 * 9 + 16)
    s += `<g id="isoCoin" opacity="0"><circle cx="${f1(gl[0])}" cy="${f1(gl[1])}" r="9" fill="#14f195"/></g>`
  }
  // receipt scanner @ (3.3,0.4)
  s += box(3.3, 0.4, 0.85, 0.85, 150, { top: "#1c1f28", left: "#111319", right: "#171a22" })
  {
    const f = faceR(3.3, 0.4, 0.85, 0.85, 150)
    s += fquad(f, 0.18, 0.26, 0.82, 0.54, "#0a1c28")
    s += `<polyline points="${[fp(f, 0.26, 0.44), fp(f, 0.44, 0.34), fp(f, 0.6, 0.4), fp(f, 0.76, 0.3)]
      .map(P)
      .join(" ")}" fill="none" stroke="#35e0e0" stroke-width="2"/>`
    s += fquad(f, 0.2, 0.62, 0.8, 0.67, "#13344a")
  }
  const fisPt = pj(3.3 + 0.86, 0.4 + 0.42, 56)
  s += `<g id="isoFis"><rect x="${f1(fisPt[0] - 9)}" y="${f1(
    fisPt[1],
  )}" width="18" height="0" fill="#dff6ff" stroke="#7fd0e0" stroke-width="1"/></g>`
  // balance terminal @ (5.3,0.4)
  s += box(5.3, 0.4, 0.95, 1.0, 196, { top: "#1c1f28", left: "#111319", right: "#171a22" })
  {
    const f = faceR(5.3, 0.4, 0.95, 1.0, 196)
    s += fquad(f, 0.14, 0.14, 0.86, 0.56, "#06121c")
    s += `<polygon id="isoKiosk" points="${[fp(f, 0.14, 0.14), fp(f, 0.86, 0.14), fp(f, 0.86, 0.56), fp(f, 0.14, 0.56)]
      .map(P)
      .join(" ")}" fill="#06121c"/>`
    s += `<polyline points="${[fp(f, 0.2, 0.46), fp(f, 0.38, 0.32), fp(f, 0.56, 0.4), fp(f, 0.8, 0.22)]
      .map(P)
      .join(" ")}" fill="none" stroke="#14f195" stroke-width="2.5"/>`
    for (let i = 0; i < 3; i++) {
      s += fquad(f, 0.2 + i * 0.2, 0.64, 0.34 + i * 0.2, 0.72, "#13344a")
    }
  }
  // sleek vault @ (0.5,5.1)
  s += box(0.5, 5.1, 1.0, 1.2, 98, { top: "#22262f", left: "#14171d", right: "#1a1e25" })
  {
    const f = faceR(0.5, 5.1, 1.0, 1.2, 98)
    s += fquad(f, 0.14, 0.14, 0.86, 0.88, "#0e1117")
    const ctr = fp(f, 0.48, 0.52)
    s += `<g id="isoSafe"><circle cx="${f1(ctr[0])}" cy="${f1(
      ctr[1],
    )}" r="17" fill="#2a2f38" stroke="#35e0e0" stroke-width="2.5"/><line x1="${f1(ctr[0])}" y1="${f1(
      ctr[1] - 17,
    )}" x2="${f1(ctr[0])}" y2="${f1(ctr[1] + 17)}" stroke="#7fd0e0" stroke-width="2.5"/><line x1="${f1(
      ctr[0] - 17,
    )}" y1="${f1(ctr[1])}" x2="${f1(ctr[0] + 17)}" y2="${f1(ctr[1])}" stroke="#7fd0e0" stroke-width="2.5"/></g>`
  }
  // holographic chart pillar @ (3.7,3.6)
  s += box(3.7, 3.6, 0.8, 0.8, 30, { top: "#1c1f28", left: "#111319", right: "#171a22" })
  {
    s += '<g id="isoHolo">'
    for (let i = 0; i < 5; i++) {
      const bx = 3.78 + i * 0.16
      const hb = 40 + (i % 3) * 26
      const base = pj(bx, 3.95, 30)
      const topp = pj(bx, 3.95, 30 + hb)
      s += `<line x1="${f1(base[0])}" y1="${f1(base[1])}" x2="${f1(topp[0])}" y2="${f1(
        topp[1],
      )}" stroke="#35e0e0" stroke-width="6" opacity="0.5" stroke-linecap="round"/>`
    }
    s += "</g>"
  }
  // plant @ (6.1,1.0)
  s += box(6.1, 1.0, 0.34, 0.34, 26, { top: "#2a2f38", left: "#1a1e25", right: "#222730" })
  {
    const b = pj(6.27, 1.17, 26)
    s += `<path d="M${f1(b[0])},${f1(b[1])} C${b[0] - 22},${b[1] - 30} ${b[0] - 26},${b[1] - 66} ${b[0] - 22},${
      b[1] - 86
    } C${b[0] - 4},${b[1] - 70} ${b[0]},${b[1] - 38} ${b[0]},${b[1] - 26} Z" fill="#2f7d49"/>`
    s += `<path d="M${f1(b[0])},${f1(b[1])} C${b[0] + 22},${b[1] - 32} ${b[0] + 26},${b[1] - 68} ${b[0] + 20},${
      b[1] - 90
    } C${b[0] + 4},${b[1] - 72} ${b[0]},${b[1] - 40} ${b[0]},${b[1] - 26} Z" fill="#3a9456"/>`
  }

  svg.innerHTML = s
}

export function HeroIsoRoom({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    buildRoom(svg)

    // Responsive framing: always cover (slice), but zoom out on mobile by
    // widening the viewBox so the portrait crop isn't an extreme close-up.
    const wideMq = window.matchMedia("(min-width: 768px)")
    const applyAspect = () => {
      svg.setAttribute("viewBox", wideMq.matches ? "0 0 1600 760" : "-360 -150 2320 1060")
      svg.setAttribute("preserveAspectRatio", "xMidYMid slice")
    }
    applyAspect()
    wideMq.addEventListener("change", applyAspect)

    const byId = (id: string) => svg.querySelector<SVGElement>(`#${id}`)
    const server = byId("isoServer")
    const holo = byId("isoHolo")

    let t0 = 0

    const frame = (now: number) => {
      if (!t0) t0 = now
      const tg = (now - t0) / 1000

      if (server) server.setAttribute("opacity", (0.78 + 0.22 * Math.abs(Math.sin(tg * 4.7))).toFixed(2))
      if (holo) {
        holo.setAttribute("opacity", (0.55 + 0.35 * Math.abs(Math.sin(tg * 2))).toFixed(2))
        holo.setAttribute("transform", `translate(0 ${(Math.sin(tg * 2) * 2).toFixed(1)})`)
      }
    }

    // Static first paint for everyone (also the only frame for reduced-motion).
    frame(performance.now())

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    let raf = 0
    let running = false
    const tick = (now: number) => {
      if (!running) return
      frame(now)
      raf = requestAnimationFrame(tick)
    }
    const startLoop = () => {
      if (running || document.hidden) return
      running = true
      t0 = 0
      raf = requestAnimationFrame(tick)
    }
    const stopLoop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // Pause when the hero is scrolled out of view.
    let inView = true
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (inView) startLoop()
        else stopLoop()
      },
      { threshold: 0 },
    )
    io.observe(svg)

    const onVisibility = () => {
      if (document.hidden) stopLoop()
      else if (inView) startLoop()
    }
    document.addEventListener("visibilitychange", onVisibility)

    if (inView) startLoop()

    return () => {
      stopLoop()
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      wideMq.removeEventListener("change", applyAspect)
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1600 760"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  )
}
