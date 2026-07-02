"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import {
  type WhitepaperLocale,
  whitepaperLocaleLabels,
  whitepaperLocales,
} from "@/lib/whitepaper/shared";
import { visionI18n } from "@/lib/vision/i18n";
import styles from "./vision-paper.module.css";

type Props = {
  lang: WhitepaperLocale;
};

/**
 * Vision Paper — single-page interactive manifesto.
 * Scoped via CSS module so it doesn't bleed into the rest of the app.
 */
export function VisionPaper({ lang }: Props) {
  const dict = visionI18n[lang];
  const t = (key: string) => dict[key] ?? key;

  const [activeId, setActiveId] = useState<string>("hero");
  const [langOpen, setLangOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Persist the chosen locale so the header and the rest of the site follow
  // the document language the reader picked here.
  const pickLang = (code: WhitepaperLocale) => {
    document.cookie = `locale=${code}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    setLangOpen(false);
  };

  // Scroll reveal
  useEffect(() => {
    if (!rootRef.current) return;
    const els = rootRef.current.querySelectorAll(`.${styles.reveal}`);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add(styles.revealIn);
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Active section tracker
  useEffect(() => {
    const ids = ["hero", "unseen", "proof", "compare", "loop", "future"];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const sio = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) setActiveId(en.target.id);
        });
      },
      { threshold: 0.4 },
    );
    sections.forEach((s) => sio.observe(s));
    return () => sio.disconnect();
  }, []);

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={rootRef} className={styles.root} data-lang={lang}>
      <div className={styles.grain} aria-hidden />
      <div className={styles.glow} aria-hidden />

      {/* LANGUAGE — switches the /vision/[lang] document language */}
      {langOpen ? (
        <div
          className={styles.langBackdrop}
          onClick={() => setLangOpen(false)}
          aria-hidden
        />
      ) : null}
      <div className={styles.langDock}>
        <button
          type="button"
          className={styles.langPill}
          onClick={() => setLangOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={langOpen}
        >
          <Globe size={14} style={{ color: "var(--vp-accent)" }} />
          <span>{whitepaperLocaleLabels[lang]}</span>
        </button>
        {langOpen ? (
          <div className={styles.langDockMenu} role="listbox">
            {whitepaperLocales.map((code) => (
              <Link
                key={code}
                href={`/vision/${code}`}
                onClick={() => pickLang(code)}
                className={code === lang ? styles.langActive : ""}
                role="option"
                aria-selected={code === lang}
              >
                <span>{whitepaperLocaleLabels[code]}</span>
                <span className={styles.langIso}>{code.toUpperCase()}</span>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* INDICATOR */}
      <div className={styles.indicator}>
        {([
          { id: "hero", key: "ind.hero", num: "00" },
          { id: "unseen", key: "ind.unseen", num: "01" },
          { id: "proof", key: "ind.proof", num: "02" },
          { id: "compare", key: "ind.compare", num: "03" },
          { id: "loop", key: "ind.loop", num: "04" },
          { id: "future", key: "ind.future", num: "05" },
        ]).map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => scrollTo(e, item.id)}
            className={activeId === item.id ? styles.indActive : ""}
          >
            {item.num} / <span>{t(item.key)}</span>
          </a>
        ))}
      </div>

      {/* HERO */}
      <section className={`${styles.hero} ${styles.section}`} id="hero">
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <div className={`${styles.eyebrow} ${styles.reveal}`}>{t("hero.eye")}</div>
            <h1 className={`${styles.reveal} ${styles.d1}`} style={{ marginTop: 24 }}>
              <span>{t("hero.h1a")}</span>
              <em>{t("hero.h1c")}</em>
              <br />
              <span>{t("hero.h1d")}</span>
            </h1>
            <p className={`${styles.heroSub} ${styles.reveal} ${styles.d2}`}>
              {t("hero.sub")}
            </p>
            <div className={`${styles.heroMeta} ${styles.reveal} ${styles.d3}`}>
              <span><span>{t("hero.m1l")}</span><b>{t("hero.m1v")}</b></span>
              <span><span>{t("hero.m2l")}</span><b>{t("hero.m2v")}</b></span>
              <span><span>{t("hero.m3l")}</span><b>{t("hero.m3v")}</b></span>
            </div>
          </div>
          <div className={`${styles.orbital} ${styles.reveal} ${styles.d2}`}>
            <div className={styles.orbRing} />
            <div className={`${styles.orbRing} ${styles.orbRing2}`} />
            <div className={`${styles.orbRing} ${styles.orbRing3}`} />
            <div
              className={styles.orbCenter}
              dangerouslySetInnerHTML={{ __html: t("hero.orb") }}
            />
            <div className={`${styles.orbChip} ${styles.orbC1}`}>MIGROS · <span className="num">₺ 348.20</span></div>
            <div className={`${styles.orbChip} ${styles.orbC2}`}>CARREFOUR · <span className="num">€ 27.10</span></div>
            <div className={`${styles.orbChip} ${styles.orbC3}`}>7-ELEVEN · <span className="num">฿ 215</span></div>
            <div className={`${styles.orbChip} ${styles.orbC4}`}>MERCADONA · <span className="num">€ 18.40</span></div>
            <div className={`${styles.orbChip} ${styles.orbC5}`}>永辉 · <span className="num">¥ 92</span></div>
          </div>
        </div>
      </section>

      {/* UNSEEN */}
      <section className={`${styles.unseen} ${styles.section}`} id="unseen">
        <div className={styles.wrap}>
          <div className={styles.lede}>
            <div className={`${styles.eyebrow} ${styles.reveal}`}>{t("u.eye")}</div>
            <div>
              <h2 className={`${styles.reveal} ${styles.d1}`}>
                <span>{t("u.h1")}</span>
                <span className={styles.strike}>{t("u.h2")}</span>.
              </h2>
            </div>
          </div>

          <div className={styles.statGrid}>
            {([
              { n: "300", u: "B+", k: "u.s1", s: "u.s1s", d: styles.d1 },
              { n: "0", u: "%", k: "u.s2", s: "u.s2s", d: styles.d2 },
              { n: "3.2", u: "x", k: "u.s3", s: "u.s3s", d: styles.d3 },
            ]).map((st) => (
              <div key={st.k} className={`${styles.stat} ${styles.reveal} ${st.d}`}>
                <div className={styles.statBig}>
                  {st.n}<span className={styles.statUnit}>{st.u}</span>
                </div>
                <div className={styles.statLabel}>{t(st.k)}</div>
                <div className={styles.statSrc}>{t(st.s)}</div>
              </div>
            ))}
          </div>

          <div className={styles.fall} aria-hidden>
            {[
              [5, 0], [15, 1.4], [28, 3.2], [42, 0.6],
              [55, 2.4], [68, 4.1], [81, 1.9], [93, 3.6],
            ].map(([left, delay], i) => (
              <div
                key={i}
                className={styles.fallR}
                style={{ left: `${left}%`, animationDelay: `${delay}s` }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className={`${styles.proof} ${styles.section}`} id="proof">
        <div className={styles.wrap}>
          <div className={styles.proofHead}>
            <div className={`${styles.eyebrow} ${styles.reveal}`}>{t("p.eye")}</div>
            <h2 className={`${styles.reveal} ${styles.d1}`}>
              <span>{t("p.h1")}</span>
              <span className={styles.proofAccent}>{t("p.h2")}</span>
            </h2>
          </div>

          <div className={styles.pipeline}>
            <div className={`${styles.pipeCard} ${styles.reveal} ${styles.d1}`}>
              <div className={styles.pipeNum}>01 · CAPTURE</div>
              <div className={styles.pipeTitle}>{t("p.c1t")}</div>
              <div className={styles.pipeBody}>{t("p.c1b")}</div>
              <div className={styles.pipeVisual}>
                <div className={styles.miniReceipt} />
              </div>
            </div>
            <div className={styles.arrow}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M4 12h16M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </div>
            <div className={`${styles.pipeCard} ${styles.reveal} ${styles.d2}`}>
              <div className={styles.pipeNum}>02 · UNDERSTAND</div>
              <div className={styles.pipeTitle}>{t("p.c2t")}</div>
              <div className={styles.pipeBody}>{t("p.c2b")}</div>
              <div className={styles.pipeVisual}>
                <div className={styles.parsed}>
                  {[
                    ["MERCHANT", "Migros"],
                    ["DATE", "2026-05-24"],
                    ["TOTAL", "₺ 348.20"],
                    ["LINES", "12"],
                    ["VAT", "verified ✓"],
                  ].map(([k, v]) => (
                    <div key={k} className={styles.parsedRow}>
                      <span className={styles.parsedKey}>{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.arrow}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M4 12h16M14 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </div>
            <div className={`${styles.pipeCard} ${styles.reveal} ${styles.d3}`}>
              <div className={styles.pipeNum}>03 · HIDDEN COST</div>
              <div className={styles.pipeTitle}>{t("p.c3t")}</div>
              <div className={styles.pipeBody}>{t("p.c3b")}</div>
              <div className={styles.pipeVisual}>
                <div className={styles.hcVis}>
                  <div className={styles.hcTotal}>
                    <span>{t("p.c3paid")}</span>
                    <b>₺ 348.20</b>
                  </div>
                  <div className={styles.hcStack} aria-label="Price layers">
                    <span className={styles.hcCore}>42%</span>
                    <span className={styles.hcVat}>18%</span>
                    <span className={styles.hcRetail}>22%</span>
                    <span className={styles.hcBrand}>18%</span>
                  </div>
                  <div className={styles.hcLegend}>
                    <span><i style={{ background: "linear-gradient(180deg,#34D399,#0F8A5F)" }} />{t("p.c3lg1")}</span>
                    <span><i style={{ background: "linear-gradient(180deg,#7A7A80,#4A4A50)" }} />{t("p.c3lg2")}</span>
                    <span><i style={{ background: "linear-gradient(180deg,#A992FF,#7A5AF8)" }} />{t("p.c3lg3")}</span>
                    <span><i style={{ background: "linear-gradient(180deg,#C7B6FF,#9F86FF)" }} />{t("p.c3lg4")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className={`${styles.compare} ${styles.section}`} id="compare">
        <div className={styles.wrap}>
          <div className={styles.compareHead}>
            <div className={`${styles.eyebrow} ${styles.reveal}`}>{t("c.eye")}</div>
            <h2 className={`${styles.reveal} ${styles.d1}`}>{t("c.h1")}</h2>
          </div>

          <div className={`${styles.ctable} ${styles.reveal} ${styles.d1}`}>
            <div className={`${styles.crow} ${styles.crowHead}`}>
              <div className={`${styles.cell} ${styles.cellFeat}`}>{t("c.col1")}</div>
              <div className={`${styles.cell} ${styles.cellBrand}`}>Fetch</div>
              <div className={`${styles.cell} ${styles.cellBrand}`}>Drop</div>
              <div className={`${styles.cell} ${styles.cellBrand}`}>Receipt Hog</div>
              <div className={`${styles.cell} ${styles.cellBrand} ${styles.cellUs}`}>
                <span style={{ color: "var(--vp-accent)" }}>Yumo Yumo</span>
                <span className={styles.badge}>{t("c.badge")}</span>
              </div>
            </div>

            <CompareRow t={t} feat="c.r1" cells={[["n","c.r1a"],["n","c.r1b"],["n","c.r1c"],["y","c.r1d"]]} />
            <CompareRow t={t} feat="c.r2" cells={[["line",""],["line",""],["line",""],["y","c.r2d"]]} />
            <CompareRow t={t} feat="c.r3" cells={[[null,"c.r3a"],[null,"c.r3b"],[null,"c.r3c"],[null,"c.r3d"]]} />
            <CompareRow t={t} feat="c.rL" cells={[["n","c.rLa"],["n","c.rLb"],["n","c.rLc"],["y","c.rLd"]]} />
            <CompareRow t={t} feat="c.r4" cells={[[null,"c.r4a"],[null,"c.r4b"],[null,"c.r4c"],["y","c.r4d"]]} />
            <CompareRow t={t} feat="c.r5" cells={[[null,"c.r5a"],[null,"c.r5b"],[null,"c.r5c"],["y","c.r5d"]]} />
            <CompareRow t={t} feat="c.r6" cells={[[null,"c.r6a"],[null,"c.r6b"],[null,"c.r6c"],[null,"c.r6d"]]} />
          </div>
        </div>
      </section>

      {/* LOOP */}
      <section className={`${styles.loop} ${styles.section}`} id="loop">
        <div className={styles.wrap}>
          <div className={styles.loopHead}>
            <div className={`${styles.eyebrow} ${styles.reveal}`}>{t("l.eye")}</div>
            <h2 className={`${styles.reveal} ${styles.d1}`}>
              <span>{t("l.h1")}</span>
              <span className={styles.loopAccent}>{t("l.h2")}</span>
            </h2>
          </div>

          <div className={styles.loopBody}>
            <div className={`${styles.loopDiagram} ${styles.reveal} ${styles.d1}`}>
              <svg className={styles.loopSvg} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden>
                <circle className={styles.loopRing} cx="200" cy="200" r="150" />
                <circle className={styles.loopFlow} cx="200" cy="200" r="150" />
                <circle cx="200" cy="200" r="48" fill="rgba(122,90,248,.18)" stroke="#A992FF" strokeWidth="1" />
                <text x="200" y="196" textAnchor="middle" fill="#fff" fontFamily="Fraunces, serif" fontSize="14" fontStyle="italic">YUMO</text>
                <text x="200" y="214" textAnchor="middle" fill="#A992FF" fontFamily="JetBrains Mono, monospace" fontSize="9" letterSpacing="2">PROTOCOL</text>
              </svg>
              {([
                { pos: styles.ln1, ico: "U", kt: "l.n1t", kd: "l.n1d" },
                { pos: styles.ln2, ico: "D", kt: "l.n2t", kd: "l.n2d" },
                { pos: styles.ln3, ico: "T", kt: "l.n3t", kd: "l.n3d" },
                { pos: styles.ln4, ico: "P", kt: "l.n4t", kd: "l.n4d" },
              ]).map((n, i) => (
                <div key={i} className={`${styles.loopNode} ${n.pos}`}>
                  <div className={styles.loopIco}>{n.ico}</div>
                  <div className={styles.nt}>{t(n.kt)}</div>
                  <div className={styles.nd}>{t(n.kd)}</div>
                </div>
              ))}
            </div>
            <div className={`${styles.loopText} ${styles.reveal} ${styles.d2}`}>
              <p dangerouslySetInnerHTML={{ __html: t("l.t1") }} />
              <p dangerouslySetInnerHTML={{ __html: t("l.t2a") }} />
              <p dangerouslySetInnerHTML={{ __html: t("l.t2b") }} />
              <p dangerouslySetInnerHTML={{ __html: t("l.t3") }} />
              <div className={styles.micro}>
                <div><b>{t("l.m1v")}</b><span>{t("l.m1l")}</span></div>
                <div><b>{t("l.m2v")}</b><span>{t("l.m2l")}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUTURE */}
      <section className={`${styles.future} ${styles.section}`} id="future">
        <div className={styles.wrap}>
          <div className={styles.futureHead}>
            <div className={`${styles.eyebrow} ${styles.reveal}`}>{t("f.eye")}</div>
            <h2 className={`${styles.reveal} ${styles.d1}`}>
              <span>{t("f.h1")}</span>
              <span className={styles.yrAccent}>2031</span>
              <span>{t("f.h2")}</span>
            </h2>
          </div>

          <div className={styles.timeline}>
            {([
              { yr: "2026", lblK: "f.t1l", ttlK: "f.t1t", descK: "f.t1d", now: true, delay: styles.d1 },
              { yr: "2027", lblK: "f.t2l", ttlK: "f.t2t", descK: "f.t2d", now: false, delay: styles.d2 },
              { yr: "2029", lblK: "f.t3l", ttlK: "f.t3t", descK: "f.t3d", now: false, delay: styles.d3 },
              { yr: "2031", lblK: "f.t4l", ttlK: "f.t4t", descK: "f.t4d", now: false, delay: styles.d4 },
            ]).map((step) => (
              <div
                key={step.yr}
                className={`${styles.tstep} ${step.now ? styles.tstepNow : ""} ${styles.reveal} ${step.delay}`}
              >
                <div className={styles.yr}>
                  {step.yr}
                  <small>{t(step.lblK)}</small>
                </div>
                <div className={styles.ttl}>{t(step.ttlK)}</div>
                <div className={styles.desc}>{t(step.descK)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Technical Paper */}
      <section className={`${styles.section}`} style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className={styles.wrap} style={{ textAlign: "center" }}>
          <a
            href={`/technical-paper/${lang}/04-tokenomics-mechanics/08-supply-and-allocation`}
            className={`${styles.reveal} ${styles.d1}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 28px",
              borderRadius: "12px",
              border: "1px solid rgba(169, 146, 255, 0.3)",
              background: "rgba(122, 90, 248, 0.08)",
              color: "#A992FF",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textDecoration: "none",
              transition: "background 0.2s, border-color 0.2s",
            }}
          >
            {t("cta.tp")}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      {/* CLOSING */}
      <section className={`${styles.closing} ${styles.section}`}>
        <div className={styles.wrap}>
          <p className={`${styles.sig} ${styles.reveal} ${styles.d1}`}>
            <span>{t("cl.q1")}</span>
            <em>{t("cl.q2")}</em>
          </p>
          <div className={`${styles.mark} ${styles.reveal} ${styles.d2}`}>
            <span className={`${styles.logoMark} ${styles.markLogo}`} />
            <span>Yumo Yumo · 2026 · {t("cl.draft")}</span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Helper: compare table row */
type CellSpec = ["y" | "n" | "line" | null, string];
function CompareRow({
  t,
  feat,
  cells,
}: {
  t: (k: string) => string;
  feat: string;
  cells: CellSpec[];
}) {
  return (
    <div className={styles.crow}>
      <div className={`${styles.cell} ${styles.cellFeat}`}>{t(feat)}</div>
      {cells.map(([tick, txtK], i) => {
        const isUs = i === cells.length - 1;
        const cls = `${styles.cell} ${isUs ? styles.cellUs : styles.cellDim}`;
        const tickEl =
          tick === "y" ? <span className={`${styles.tick} ${styles.tickY}`}>✓</span> :
          tick === "n" ? <span className={`${styles.tick} ${styles.tickN}`}>×</span> :
          tick === "line" ? <span className={styles.tickLine} /> : null;
        return (
          <div key={i} className={cls}>
            <div className={styles.cellInner}>
              {tickEl}
              {txtK ? <span className={styles.txt}>{t(txtK)}</span> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
