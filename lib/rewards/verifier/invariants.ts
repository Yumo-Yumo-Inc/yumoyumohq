/**
 * Step 7 hard invariants (pure). Each returns {ok, reason?}; verify-epoch runs
 * them and any failure stops the epoch. Binding: yumo-guvenlik-gereksinimleri-v02.md §2.3.
 */

export type Check = { ok: boolean; reason?: string };

const EPS = 1; // 1 INT tolerance for float accumulation

/** Engine root must match the independent recomputation (a, b, c, h via leaves). */
export function checkRootMatch(engineRoot: string | null, recomputedRoot: string): Check {
  if (!engineRoot) return { ok: false, reason: "engine root missing" };
  if (engineRoot !== recomputedRoot) {
    return { ok: false, reason: `root mismatch: engine=${engineRoot.slice(0, 12)}… recomputed=${recomputedRoot.slice(0, 12)}…` };
  }
  return { ok: true };
}

/** Source ledger slice must be untampered (invariant g). */
export function checkLedgerHash(storedHash: string | null, recomputedHash: string): Check {
  if (!storedHash) return { ok: false, reason: "stored ledger_hash missing" };
  if (storedHash !== recomputedHash) return { ok: false, reason: "ledger_hash mismatch (source tampered or backdated)" };
  return { ok: true };
}

/** Σ effective INT must not exceed the epoch soft-cap C (invariant h). */
export function checkSoftCap(totalInt: number, softCapC: number): Check {
  if (totalInt > softCapC + EPS) {
    return { ok: false, reason: `epoch total ${totalInt} exceeds soft-cap C ${softCapC}` };
  }
  return { ok: true };
}

/** Cumulative INT across committed epochs + this one must stay under the bucket cap (invariant e). */
export function checkCumulativeCap(priorCumulative: number, epochTotal: number, cap: number): Check {
  if (priorCumulative + epochTotal > cap + EPS) {
    return { ok: false, reason: `cumulative ${priorCumulative + epochTotal} exceeds cap ${cap}` };
  }
  return { ok: true };
}

/** Epoch windows must be contiguous and non-overlapping (invariant f, no double-pay). */
export function checkWindowContiguity(prevWindowEnd: string | null, windowStart: string): Check {
  if (prevWindowEnd === null) return { ok: true }; // first epoch
  if (new Date(prevWindowEnd).getTime() !== new Date(windowStart).getTime()) {
    return { ok: false, reason: `window gap/overlap: prev end ${prevWindowEnd} != start ${windowStart}` };
  }
  return { ok: true };
}

/** Stored total must equal the recomputed total (consistency with root). */
export function checkTotalMatch(storedTotal: number, recomputedTotal: number): Check {
  if (Math.abs(storedTotal - recomputedTotal) > EPS) {
    return { ok: false, reason: `total mismatch: stored=${storedTotal} recomputed=${recomputedTotal}` };
  }
  return { ok: true };
}
