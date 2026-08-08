import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "lib/db/migrations/140_external_product_catalog.sql"),
  "utf8"
);
const merchantAliasSql = readFileSync(
  join(process.cwd(), "lib/db/migrations/133_alias_merchant_scope.sql"),
  "utf8"
);
const securityFixSql = readFileSync(
  join(process.cwd(), "lib/db/migrations/141_external_product_catalog_security_fix.sql"),
  "utf8"
);
const matchingFixSql = readFileSync(
  join(process.cwd(), "lib/db/migrations/142_external_catalog_matching_fixes.sql"),
  "utf8"
);

describe("external catalog migration contract", () => {
  it("contains no URL or link columns in the new tables", () => {
    const tableBlocks = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS (external_[a-z_]+)\s*\(([\s\S]*?)\n\);/g)];
    expect(tableBlocks.length).toBeGreaterThanOrEqual(4);
    for (const [, , body] of tableBlocks) {
      expect(body).not.toMatch(/^\s*(source_url|url|link|image_url)\s+/m);
    }
  });

  it("keeps source product ids and canonical ids in separate columns", () => {
    expect(sql).toContain("source_product_id  TEXT NOT NULL");
    expect(sql).toContain("canonical_id       UUID REFERENCES canonical_products(id)");
    expect(sql).toContain("UNIQUE (source, source_product_id, merchant_id)");
  });

  it("groups price references by package signature and excludes old price from aggregates", () => {
    const view = sql.slice(sql.indexOf("CREATE OR REPLACE VIEW canonical_external_price_by_market"));
    expect(view).toContain("l.package_signature");
    expect(view).toContain("ORDER BY o.price_tl");
    expect(view).not.toContain("ORDER BY o.old_price_tl");
  });

  it("validates the resolved task, selected candidate, and confirming pick", () => {
    expect(sql).toContain("task_row.task_type <> 'product_identify'");
    expect(sql).toContain("task_row.status <> 'resolved'");
    expect(sql).toContain("task_row.resolved_canonical_id IS DISTINCT FROM p_canonical_id");
    expect(sql).toContain("canonical_candidate_not_in_task");
    expect(sql).toContain("answer.answer_kind = 'pick'");
    expect(sql).toContain("answer.username = p_confirmed_by");
  });

  it("blocks non-candidate picks and answers to closed tasks at the database boundary", () => {
    expect(sql).toContain("CREATE OR REPLACE FUNCTION validate_contribution_pick_candidate()");
    expect(sql).toContain("task.status = 'open'");
    expect(sql).toContain("candidate->>'canonical_id' = NEW.canonical_id::text");
    expect(sql).toContain("RAISE EXCEPTION 'canonical_candidate_not_in_open_task'");
    expect(sql).toContain("BEFORE INSERT OR UPDATE OF task_id, answer_kind, canonical_id");
  });

  it("does not duplicate alias or receipt propagation in the external confirmation function", () => {
    const start = sql.indexOf("CREATE OR REPLACE FUNCTION apply_external_product_confirmation");
    const end = sql.indexOf("CREATE OR REPLACE FUNCTION set_external_product_updated_at");
    const confirmation = sql.slice(start, end);
    expect(confirmation).not.toContain("INSERT INTO receipt_product_aliases");
    expect(confirmation).not.toContain("UPDATE receipt_line_items");
    expect(confirmation).toContain("REVOKE ALL ON FUNCTION apply_external_product_confirmation");
  });

  it("filters malformed external product ids before casting", () => {
    const regexPosition = sql.indexOf("~* '^[0-9a-f]{8}");
    const castPosition = sql.indexOf("(evidence->>'externalProductId')::uuid", regexPosition);
    expect(regexPosition).toBeGreaterThan(0);
    expect(castPosition).toBeGreaterThan(regexPosition);
    expect(sql).toContain("= ANY(task_row.external_product_ids)");
  });

  it("audits superseded confirmations", () => {
    expect(sql).toContain("reverted_by = p_confirmed_by");
    expect(sql).toContain("reverted_at = now()");
    expect(sql).toContain("'supersedes', to_jsonb(superseded_ids)");
  });

  it("uses active confirmed matches as the only price source of truth", () => {
    const start = sql.indexOf("CREATE OR REPLACE VIEW canonical_external_price_by_market");
    const end = sql.indexOf("COMMENT ON TABLE external_product_catalog");
    const views = sql.slice(start, end);
    expect(views).toContain("FROM external_product_canonical_matches m");
    expect(views).toContain("WHERE m.status = 'user_confirmed'");
    expect(views).not.toContain("COALESCE(\n      ep.canonical_id");
    expect(views).toContain("CREATE OR REPLACE VIEW canonical_external_price_overall");
  });

  it("keeps canonical foreign keys UUID while receipt line compatibility remains text", () => {
    const canonicalSchema = readFileSync(
      join(process.cwd(), "lib/db/migrations/047_product_taxonomy_v3.sql"),
      "utf8"
    );
    const receiptSchema = readFileSync(
      join(process.cwd(), "lib/db/migrations/050_receipt_line_items_v3_columns.sql"),
      "utf8"
    );
    expect(canonicalSchema).toContain("id                     UUID PRIMARY KEY");
    expect(canonicalSchema).toContain("canonical_id  UUID REFERENCES canonical_products(id)");
    expect(receiptSchema).toContain("ADD COLUMN IF NOT EXISTS canonical_id TEXT");
  });

  it("allows only one active user confirmation per external product", () => {
    expect(sql).toContain("uq_external_active_user_confirmation");
    expect(sql).toContain("WHERE status = 'user_confirmed'");
  });

  it("keeps the same raw alias independently scoped by merchant", () => {
    expect(merchantAliasSql).toContain("uq_rpa_raw_merchant_canonical");
    expect(merchantAliasSql).toContain("COALESCE(merchant_id");
    expect(merchantAliasSql).toContain("canonical_id");
  });

  it("ships a forward-only repair for databases that already applied migration 140", () => {
    expect(securityFixSql).toContain("BEGIN;");
    expect(securityFixSql).toContain("migration_141_preflight_missing_columns");
    expect(securityFixSql).toContain("CREATE OR REPLACE FUNCTION apply_external_product_confirmation");
    expect(securityFixSql).toContain("CREATE TRIGGER tr_validate_contribution_pick_candidate");
    expect(securityFixSql).toContain("CREATE OR REPLACE VIEW canonical_external_price_overall");
    expect(securityFixSql).toContain("task.resolved_canonical_id = m.canonical_id");
    expect(securityFixSql).toContain("answer.username = m.confirmed_by");
    expect(securityFixSql).toContain("m.match_method = 'manual' OR EXISTS");
    expect(securityFixSql).toContain("active_canonical_id IS NOT DISTINCT FROM p_canonical_id");
    expect(securityFixSql).toContain("evidence = evidence || jsonb_build_object(");
    expect(securityFixSql).toContain("COMMIT;");
    expect(securityFixSql).toContain("VALUES ('141_external_product_catalog_security_fix.sql')");
    expect(securityFixSql).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM/);
  });

  it("seeds the price reference minimum the price views already read", () => {
    expect(matchingFixSql).toContain("'price_reference_min_observations'");
    expect(matchingFixSql).toContain("ON CONFLICT (scope, key) DO NOTHING");
    // The views fall back to the literal 3 when the key is missing, so the seeded value
    // must not silently change behaviour on an already-running database.
    expect(matchingFixSql).toMatch(/'price_reference_min_observations', 3\b/);
    expect(sql).toContain("'price_reference_min_observations'");
  });

  it("removes only the thresholds that no code path reads", () => {
    const removal = matchingFixSql.slice(
      matchingFixSql.indexOf("DELETE FROM canonization_thresholds")
    );
    expect(removal).toContain("'external_catalog_sim'");
    expect(removal).toContain("'external_auto_match_min'");
    for (const live of [
      "external_suggest_min",
      "external_review_min",
      "external_name_weight",
      "external_package_weight",
      "external_price_weight",
    ]) {
      expect(removal.slice(0, removal.indexOf(";"))).not.toContain(live);
    }
  });

  it("hands normalized_name to normalize_receipt_text and drops nothing else", () => {
    expect(matchingFixSql).toContain("SET normalized_name = normalize_receipt_text(raw_name)");
    expect(matchingFixSql).toMatch(/BEGIN;[\s\S]*COMMIT;/);
    expect(matchingFixSql).toContain("VALUES ('142_external_catalog_matching_fixes.sql')");
    expect(matchingFixSql).not.toMatch(/DROP TABLE|DROP VIEW|DROP COLUMN|TRUNCATE/);
    // The only permitted deletion is the dead threshold rows above. Commented lines are
    // stripped first so the documented rollback block is not read as executable SQL.
    const executable = matchingFixSql
      .split("\n")
      .filter((line) => !line.trimStart().startsWith("--"))
      .join("\n");
    expect([...executable.matchAll(/DELETE FROM (\w+)/g)].map(([, table]) => table)).toEqual([
      "canonization_thresholds",
    ]);
  });
});
