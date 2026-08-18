import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import {
  DEMO_CITY,
  DEMO_COUNTRY,
  DEMO_DISPLAY_NAME,
  DEMO_EMAIL,
  DEMO_PASSWORD,
  DEMO_USERNAME,
  DEMO_WINDOW_DAYS,
} from "./constants";
import { buildDemoPlan } from "./plan";
import { buildReceiptRows } from "./receipt-payload";

export interface SeedQuery {
  (text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
}

export interface SeedResult {
  receipts: number;
  lineItems: number;
  monthTotal: number;
  sectors: string[];
}

async function tableColumns(q: SeedQuery, table: string): Promise<Set<string>> {
  const res = await q(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return new Set(res.rows.map((r) => String(r.column_name)));
}

async function insertFiltered(
  q: SeedQuery,
  table: string,
  cols: Set<string>,
  row: Record<string, unknown>
): Promise<void> {
  const keys = Object.keys(row).filter((k) => cols.has(k));
  if (keys.length === 0) return;
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(",");
  const ident = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(",");
  await q(`INSERT INTO ${table} (${ident}) VALUES (${placeholders})`, keys.map((k) => row[k]));
}

export async function seedDemoAccount(q: SeedQuery, now = new Date()): Promise<SeedResult> {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const seasonRow = await q(
    `SELECT season_number FROM seasons WHERE status='active' ORDER BY start_at DESC LIMIT 1`
  );
  const season = Number(seasonRow.rows[0]?.season_number) || 2;

  await q(
    `INSERT INTO users (username, email, country, password_hash, password, display_name, email_verified_at,
      terms_accepted_at, terms_version, privacy_accepted_at, privacy_version, preferred_locale,
      created_at, updated_at)
     VALUES ($1,$2,$3,$4,'',$5,now(),now(),'1.0',now(),'1.0','tr', now() - interval '70 days', now())
     ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, country=$3, display_name=$5,
       email_verified_at=now(), preferred_locale='tr', updated_at=now()`,
    [DEMO_USERNAME, DEMO_EMAIL, DEMO_COUNTRY, hash, DEMO_DISPLAY_NAME]
  );

  await q(
    `INSERT INTO user_profiles (username, display_name, account_xp, account_level, season_xp, season_level,
      current_season_number, honor, streak, gender, birth_date, occupation, city, updated_at)
     VALUES ($1,$2,138900,50,23200,30,$3,80,9,'other','1992-04-15','Girişimci',$4,now())
     ON CONFLICT (username) DO UPDATE SET display_name=$2, account_xp=138900, account_level=50,
       season_xp=23200, season_level=30, current_season_number=$3, honor=80, streak=9,
       gender='other', birth_date='1992-04-15', occupation='Girişimci', city=$4, updated_at=now()`,
    [DEMO_USERNAME, DEMO_DISPLAY_NAME, season, DEMO_CITY]
  );

  await q(
    `INSERT INTO user_companion_preferences (username, onboarding_language, onboarding_completed_at)
     VALUES ($1,'tr',now()) ON CONFLICT (username) DO UPDATE SET onboarding_completed_at=now(), onboarding_language='tr'`,
    [DEMO_USERNAME]
  );

  await q(
    `UPDATE user_profiles SET name_color='rose', profile_frame='legendary', theme_accent='violet',
       avatar_sticker='crown', profile_bg='aurora', active_title='title_master' WHERE username=$1`,
    [DEMO_USERNAME]
  );

  const rCols = await tableColumns(q, "receipts");
  const liCols = await tableColumns(q, "receipt_line_items");

  const old = await q(`SELECT receipt_id FROM receipts WHERE username=$1`, [DEMO_USERNAME]);
  const oldIds = old.rows.map((r) => String(r.receipt_id));
  if (oldIds.length) {
    for (const t of ["receipt_line_items", "receipt_rewards", "receipt_canonical", "receipts"]) {
      await q(`DELETE FROM ${t} WHERE receipt_id = ANY($1)`, [oldIds]).catch(() => ({ rows: [], rowCount: 0 }));
    }
  }

  const plan = buildDemoPlan(now);
  const built = buildReceiptRows(plan, now, () => randomUUID());
  let lineItems = 0;
  let monthTotal = 0;
  const sectors = new Set<string>();

  for (const row of built) {
    const extra: Record<string, unknown> = { ...row.receipt };
    if (typeof extra.receipt_data === "string") extra.receipt_data = JSON.parse(String(extra.receipt_data));
    if (typeof extra.source === "string") extra.source = JSON.parse(String(extra.source));
    if (rCols.has("receipt_hash")) extra.receipt_hash = randomBytes(32).toString("hex");
    if (rCols.has("content_hash")) extra.content_hash = randomBytes(32).toString("hex");
    await insertFiltered(q, "receipts", rCols, extra);
    sectors.add(String(row.receipt.merchant_category));
    const created = new Date(row.receipt.created_at);
    if (created.getUTCFullYear() === now.getUTCFullYear() && created.getUTCMonth() === now.getUTCMonth()) {
      monthTotal += Number(row.receipt.pricing_total_paid);
    }
    for (const line of row.lines) {
      await insertFiltered(q, "receipt_line_items", liCols, line as unknown as Record<string, unknown>);
      lineItems += 1;
    }
    await q(
      `INSERT INTO receipt_rewards (receipt_id, base_reward_amount, extra_reward_amount, base_hidden_cost,
        final_hidden_cost, bint_amount, bint_bonus_amount, cpi_multiplier_used, exchange_rate_used,
        season_level_multiplier_used, account_xp_contribution, contribution_points, created_at, updated_at)
       VALUES ($1,$2,0,$3,$3,$2,$2,2.0,1,1.10,10,$4,$5,$5)`,
      [row.receipt.receipt_id, row.cpoints, row.receipt.hidden_cost_core, row.cpoints, row.receipt.created_at]
    ).catch(() => ({ rows: [], rowCount: 0 }));
    await q(
      `INSERT INTO receipt_canonical (receipt_id, payload, total_hidden_canonical, analyzed_at)
       VALUES ($1,'{}'::jsonb,$2,$3)`,
      [row.receipt.receipt_id, row.receipt.hidden_cost_core, row.receipt.created_at]
    ).catch(() => ({ rows: [], rowCount: 0 }));
  }

  await q(`DELETE FROM contribution_point_events WHERE username=$1`, [DEMO_USERNAME]);
  await q(
    `SELECT setval(pg_get_serial_sequence('contribution_point_events','id'),
      (SELECT COALESCE(MAX(id),0)+1 FROM contribution_point_events), false)`
  ).catch(() => ({ rows: [], rowCount: 0 }));

  for (const row of built) {
    await q(
      `INSERT INTO contribution_point_events (username, points_delta, source_type, reference_id, season_number, contribution_version, created_at)
       VALUES ($1,$2,'receipt_verified',$3,$4,1,$5)`,
      [DEMO_USERNAME, row.cpoints, row.receipt.receipt_id, season, row.receipt.created_at]
    );
  }
  for (let i = 0; i < 10; i++) {
    const pts = 12 + (i * 5) % 8;
    const d = new Date(now.getTime() - (i + (i % 3)) * 86400000);
    await q(
      `INSERT INTO contribution_point_events (username, points_delta, source_type, reference_id, season_number, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [DEMO_USERNAME, pts, `quest_d${1 + (i % 5)}`, `demo-quest-${i}`, season, d.toISOString()]
    );
  }

  await q(
    `INSERT INTO user_trust_scores (username, trust_score, tier, updated_at) VALUES ($1,720,'A',now())
     ON CONFLICT (username) DO UPDATE SET trust_score=720, tier='A', updated_at=now()`,
    [DEMO_USERNAME]
  );

  await q(`DELETE FROM user_behavior_profile WHERE username=$1`, [DEMO_USERNAME]);
  await q(
    `INSERT INTO user_behavior_profile (username, preferred_categories, preferred_merchants,
      avg_basket_size, avg_receipt_frequency, shopping_day_of_week, shopping_time_of_day,
      price_sensitivity_score, brand_loyalty_score, impulse_score, health_conscious_score, planning_score,
      top_category_path, top_category_share, first_receipt_at, last_receipt_at, total_receipts,
      total_spend_lifetime, behavior_archetype, identity_primary, identity_secondary, updated_at)
     VALUES ($1, $2::text[], $3::text[], 480, interval '31 hours', 6, 'evening', 0.72, 0.61, 0.34, 0.58, 0.66,
      'groceries>dairy', 0.31, $4, $5, $6, $7, 'planner', 'value_hunter', 'family_provider', now())`,
    [
      DEMO_USERNAME,
      ["groceries", "restaurant", "fuel"],
      ["Migros", "A101", "Starbucks"],
      new Date(now.getTime() - (DEMO_WINDOW_DAYS - 1) * 86400000).toISOString(),
      now.toISOString(),
      built.length,
      Math.round(built.reduce((s, r) => s + Number(r.receipt.pricing_total_paid), 0)),
    ]
  ).catch(() => ({ rows: [], rowCount: 0 }));

  return {
    receipts: built.length,
    lineItems,
    monthTotal: Math.round(monthTotal * 100) / 100,
    sectors: [...sectors].sort(),
  };
}
