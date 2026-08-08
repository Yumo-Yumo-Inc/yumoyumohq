import { beforeEach, describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db/client", () => ({ db: { query } }));

import { attachExternalEvidenceToOpenTasks } from "../attach-task-evidence";
import { evidenceReference, type ExternalCatalogEvidence } from "../evidence";
import {
  confirmExternalMatchesForTask,
  rejectExternalCandidatesForTask,
} from "../confirmation";
import { evaluateTask } from "@/lib/contribution/resolve";

const CANONICAL = "11111111-1111-4111-8111-111111111111";
const EXTERNAL = "22222222-2222-4222-8222-222222222222";

function evidence(overrides: Partial<ExternalCatalogEvidence> = {}): ExternalCatalogEvidence {
  return {
    externalProductId: EXTERNAL,
    merchantLabel: "BİM",
    rawName: "Knorr Klasik Bardak Çorba",
    packageSignature: "1x1adet",
    priceTl: 24.5,
    unitPriceTl: 24.5,
    unitType: "adet",
    observedAt: "2026-08-07T10:00:00Z",
    medianPriceTl: null,
    medianIsReliable: false,
    ...overrides,
  };
}

describe("external price reference text", () => {
  it("shows the latest observation while the median is not yet reliable", () => {
    expect(evidenceReference([evidence({ medianPriceTl: 30, medianIsReliable: false })]))
      .toBe("BİM · 24.50 ₺ · 24.50 ₺/adet");
  });

  it("prefers the median once it clears the observation minimum", () => {
    expect(evidenceReference([evidence({ medianPriceTl: 26.75, medianIsReliable: true })]))
      .toBe("BİM · 26.75 ₺ · 24.50 ₺/adet");
  });

  it("omits missing numbers instead of inventing them", () => {
    expect(evidenceReference([evidence({ priceTl: null, unitPriceTl: null, unitType: null })]))
      .toBe("BİM");
  });
});

describe("open task annotation", () => {
  beforeEach(() => query.mockReset());

  it("annotates matching candidates and records the external ids", async () => {
    query.mockImplementation(async (sql: string) => {
      const text = String(sql ?? "");
      if (text.includes("FROM contribution_tasks t") && !text.includes("WITH active_links")) {
        return { rows: [{
          id: "7",
          merchant_id: "33333333-3333-4333-8333-333333333333",
          candidates: [
            { canonical_id: CANONICAL, label: "Knorr Klasik Bardak Çorba" },
            { canonical_id: "44444444-4444-4444-8444-444444444444", label: "Knorr Tavuk Çorba" },
          ],
        }] };
      }
      if (text.includes("WITH active_links")) {
        return { rows: [{
          canonical_id: CANONICAL,
          external_product_id: EXTERNAL,
          merchant_label: "BİM",
          raw_name: "Knorr Klasik Bardak Çorba",
          package_signature: "1x1adet",
          price_tl: "24.50",
          unit_price_tl: "24.50",
          unit_type: "adet",
          observed_at: "2026-08-07T10:00:00Z",
          median_price_tl: null,
          median_is_reliable: false,
        }] };
      }
      if (text.includes("UPDATE contribution_tasks")) return { rows: [{ id: "7" }] };
      return { rows: [] };
    });

    const result = await attachExternalEvidenceToOpenTasks({ limit: 10 });
    expect(result).toEqual({ scanned: 1, annotated: 1 });

    const update = query.mock.calls.find(([sql]) => String(sql).includes("UPDATE contribution_tasks"));
    const written = JSON.parse(String(update?.[1]?.[1]));
    // The candidate set is untouched; only the annotation fields are added.
    expect(written).toHaveLength(2);
    expect(written[0].label).toBe("Knorr Klasik Bardak Çorba");
    expect(written[0].external_reference).toBe("BİM · 24.50 ₺ · 24.50 ₺/adet");
    expect(written[1].external_reference).toBeUndefined();
    expect(update?.[1]?.[2]).toEqual([EXTERNAL]);
  });

  it("writes nothing when no candidate has external evidence", async () => {
    query.mockImplementation(async (sql: string) => {
      const text = String(sql ?? "");
      if (text.includes("FROM contribution_tasks t") && !text.includes("WITH active_links")) {
        return { rows: [{
          id: "7",
          merchant_id: "33333333-3333-4333-8333-333333333333",
          candidates: [{ canonical_id: CANONICAL, label: "Knorr Klasik Bardak Çorba" }],
        }] };
      }
      return { rows: [] };
    });

    const result = await attachExternalEvidenceToOpenTasks({ limit: 10 });
    expect(result).toEqual({ scanned: 1, annotated: 0 });
    expect(query.mock.calls.some(([sql]) => String(sql).includes("UPDATE contribution_tasks"))).toBe(false);
  });

  it("guards the write on the snapshot it read so a Diğer answer is not overwritten", async () => {
    query.mockImplementation(async (sql: string) => {
      const text = String(sql ?? "");
      if (text.includes("FROM contribution_tasks t") && !text.includes("WITH active_links")) {
        return { rows: [{
          id: "7",
          merchant_id: "33333333-3333-4333-8333-333333333333",
          candidates: [{ canonical_id: CANONICAL, label: "Knorr Klasik Bardak Çorba" }],
        }] };
      }
      if (text.includes("WITH active_links")) {
        return { rows: [{
          canonical_id: CANONICAL,
          external_product_id: EXTERNAL,
          merchant_label: "BİM",
          raw_name: "Knorr Klasik Bardak Çorba",
          package_signature: "1x1adet",
          price_tl: "24.50",
          unit_price_tl: null,
          unit_type: null,
          observed_at: "2026-08-07T10:00:00Z",
          median_price_tl: null,
          median_is_reliable: false,
        }] };
      }
      // The row changed under us: the guarded UPDATE matches nothing.
      if (text.includes("UPDATE contribution_tasks")) return { rows: [] };
      return { rows: [] };
    });

    const result = await attachExternalEvidenceToOpenTasks({ limit: 10 });
    expect(result).toEqual({ scanned: 1, annotated: 0 });
    const update = query.mock.calls.find(([sql]) => String(sql).includes("UPDATE contribution_tasks"));
    expect(String(update?.[0])).toContain("candidates = $4::jsonb");
  });
});

describe("resolution and confirmation", () => {
  beforeEach(() => query.mockReset());

  it("resolves receipt lines and writes a merchant-scoped alias", async () => {
    query.mockImplementation(async (sql: string) => {
      const text = String(sql ?? "");
      if (text.includes("FROM contribution_tasks WHERE id")) return { rows: [{
        id: "7", raw_text_norm: "KKT. BRDK CORBA", merchant_id: "merchant-bim",
        sample_raw_text: "KKT. BRDK CORBA", answers_count: 1, status: "open", is_gold: false,
      }] };
      if (text.includes("GROUP BY canonical_id")) return { rows: [{
        canonical_id: CANONICAL, answer_kind: "pick", weight: 1,
      }] };
      if (text.includes("UPDATE contribution_tasks") && text.includes("RETURNING id")) return { rows: [{ id: "7" }] };
      if (text.includes("INSERT INTO receipt_product_aliases")) return { rows: [] };
      if (text.includes("UPDATE receipt_line_items")) return { rows: [{ id: 10 }, { id: 11 }] };
      return { rows: [] };
    });
    const outcome = await evaluateTask("7");
    expect(outcome).toEqual({ status: "resolved", canonicalId: CANONICAL, rowsFixed: 2 });
    const aliasCall = query.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO receipt_product_aliases"));
    expect(aliasCall?.[1]).toEqual(["KKT. BRDK CORBA", CANONICAL, "merchant-bim"]);
  });

  it("promotes the selected external match and audits the confirmer", async () => {
    query.mockResolvedValue({ rows: [{ external_matches: 1, rows_fixed: 2 }] });
    const count = await confirmExternalMatchesForTask({
      taskId: "7",
      canonicalId: CANONICAL,
      confirmedBy: "ugur",
    });
    expect(count).toBe(1);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("apply_external_product_confirmation"),
      ["7", CANONICAL, "ugur"]
    );
  });

  it("records none as rejection without writing a canonical link", async () => {
    query.mockImplementation(async (sql: string) => {
      const text = String(sql ?? "");
      if (text.includes("FROM contribution_tasks WHERE id")) return { rows: [{
        raw_text_norm: "KKT. BRDK CORBA",
        sample_raw_text: "KKT. BRDK CORBA",
        merchant_id: "merchant-bim",
        external_product_ids: [EXTERNAL],
        candidates: [{
          canonical_id: CANONICAL,
          external_evidence: [{ externalProductId: EXTERNAL }],
        }],
      }] };
      if (text.includes("SET status = 'rejected'")) return { rows: [{ id: "match-1" }] };
      return { rows: [] };
    });
    expect(await rejectExternalCandidatesForTask({ taskId: "7", username: "ugur" })).toBe(1);
    expect(query.mock.calls.some(([sql]) => String(sql).includes("SET canonical_id"))).toBe(false);
  });

  it("ignores malformed or non-snapshotted external evidence during rejection", async () => {
    query.mockResolvedValueOnce({ rows: [{
      raw_text_norm: "KKT. BRDK CORBA",
      sample_raw_text: null,
      merchant_id: "merchant-bim",
      external_product_ids: [EXTERNAL],
      candidates: [{
        canonical_id: CANONICAL,
        external_evidence: [
          { externalProductId: "not-a-uuid" },
          { externalProductId: "33333333-3333-4333-8333-333333333333" },
        ],
      }],
    }] });
    expect(await rejectExternalCandidatesForTask({ taskId: "7", username: "ugur" })).toBe(0);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("removes the crowd-stamped alias when a confirmation is reverted", async () => {
    const { revertExternalConfirmation } = await import("../confirmation");
    query.mockImplementation(async (sql: string) => {
      const text = String(sql ?? "");
      if (text.includes("SELECT canonical_id FROM external_product_catalog")) {
        return { rows: [{ canonical_id: CANONICAL }] };
      }
      if (text.includes("FROM contribution_tasks WHERE id")) {
        return { rows: [{
          raw_text_norm: "KKT. BRDK CORBA",
          sample_raw_text: "KKT. BRDK CORBA",
          merchant_id: "merchant-bim",
        }] };
      }
      if (text.includes("UPDATE receipt_line_items")) return { rows: [{ id: 10 }] };
      return { rows: [] };
    });

    const result = await revertExternalConfirmation({
      externalProductId: EXTERNAL,
      taskId: "7",
      revertedBy: "ugur",
    });
    expect(result).toEqual({ canonicalId: CANONICAL, rowsCleared: 1 });

    // resolve.ts stamps crowd resolutions with match_type='crowd'; a revert that only
    // deleted 'user_confirmed' left the wrong alias behind.
    const aliasDelete = query.mock.calls.find(([sql]) =>
      String(sql).includes("DELETE FROM receipt_product_aliases")
    );
    expect(String(aliasDelete?.[0])).toContain("match_type IN ('crowd', 'user_confirmed')");
  });
});
