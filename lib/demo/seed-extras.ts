import { randomUUID } from "crypto";
import { DEMO_USERNAME } from "./constants";
import type { SeedQuery } from "./seed-account";

function isoDaysAgo(now: Date, n: number, hour = 12): string {
  const d = new Date(now.getTime() - n * 86400000);
  d.setUTCHours(hour, 15, 0, 0);
  return d.toISOString();
}

export async function seedDemoExtras(q: SeedQuery, now = new Date()): Promise<void> {
  const seasonRow = await q(
    `SELECT season_number FROM seasons WHERE status='active' ORDER BY start_at DESC LIMIT 1`
  );
  const season = Number(seasonRow.rows[0]?.season_number) || 2;

  await q(`DELETE FROM check_ins WHERE username=$1`, [DEMO_USERNAME]);
  for (let i = 0; i < 9; i++) {
    await q(`INSERT INTO check_ins (username, check_in_date) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [
      DEMO_USERNAME,
      isoDaysAgo(now, i).slice(0, 10),
    ]);
  }
  await q(`DELETE FROM user_streaks WHERE username=$1`, [DEMO_USERNAME]);
  await q(
    `INSERT INTO user_streaks (username, streak_type, current_streak, longest_streak, last_activity_date)
     VALUES ($1,'daily',9,14,$2)`,
    [DEMO_USERNAME, isoDaysAgo(now, 0).slice(0, 10)]
  );

  await q(`DELETE FROM user_quests WHERE username=$1`, [DEMO_USERNAME]);
  const tmpl = await q(
    `SELECT id FROM quest_templates WHERE frequency='daily' AND type NOT LIKE 'TEST%' AND type <> 'D_ADMIN_FREE_300XP' ORDER BY id LIMIT 4`
  );
  for (let day = 1; day <= 10; day++) {
    for (const t of tmpl.rows.slice(0, 2 + (day % 3))) {
      const d = isoDaysAgo(now, day, 18);
      await q(
        `INSERT INTO user_quests (username, quest_template_id, status, progress, target, season_number, expires_at, completed_at, created_at, updated_at)
         VALUES ($1,$2,'completed',1,1,$3,$4,$5,$6,$5)`,
        [DEMO_USERNAME, t.id, season, isoDaysAgo(now, day, 23), d, isoDaysAgo(now, day, 7)]
      );
    }
  }

  await q(`DELETE FROM user_notifications WHERE username=$1`, [DEMO_USERNAME]);
  const notifs: Array<[string, string, string, number, boolean]> = [
    ["receipt_verified", "Receipt verified", "Your Migros receipt was verified and points were added.", 5, true],
    ["reward_topup", "Points added", "You earned 320 points from this week's receipts.", 4, true],
    ["extra_hidden_cost", "Hidden cost found", "41.80 TL of hidden cost was found on your last receipt.", 1, false],
  ];
  for (const [type, title, body, dago, read] of notifs) {
    await q(
      `INSERT INTO user_notifications (username, type, title, body, payload, read_at, created_at)
       VALUES ($1,$2,$3,$4,'{}'::jsonb,$5,$6)`,
      [DEMO_USERNAME, type, title, body, read ? isoDaysAgo(now, dago, 20) : null, isoDaysAgo(now, dago, 18)]
    );
  }

  await q(`INSERT INTO badges (key, title, description, icon_url) VALUES
    ('genesis_tier_spark','Spark','Reached the Spark tier in the Genesis season.','✨'),
    ('genesis_tier_ember','Ember','Reached the Ember tier in the Genesis season.','✨'),
    ('genesis_tier_flame','Flame','Reached the Flame tier in the Genesis season.','✨'),
    ('genesis_tier_forge','Forge','Reached the Forge tier in the Genesis season.','✨'),
    ('genesis_participant','Genesis Participant','Took part in the Genesis season.','🎖')
    ON CONFLICT (key) DO NOTHING`);
  await q(`DELETE FROM user_badges WHERE username=$1`, [DEMO_USERNAME]);
  for (const [key, dago] of [
    ["genesis_participant", 28],
    ["genesis_tier_spark", 22],
    ["genesis_tier_ember", 12],
    ["genesis_tier_flame", 4],
    ["genesis_tier_forge", 1],
  ] as const) {
    await q(
      `INSERT INTO user_badges (username, badge_id, earned_at) SELECT $1, id, $2 FROM badges WHERE key=$3`,
      [DEMO_USERNAME, isoDaysAgo(now, dago), key]
    );
  }

  const achTiers: Array<[string, string, number]> = [
    ["ach_merchant_atlas_3", "City Slicker", 80],
    ["ach_aisle_explorer_3", "Bazaar Sage", 70],
    ["ach_the_regular_1", "Regular", 60],
    ["ach_coming_up_4", "City Boss", 50],
    ["ach_receipt_stack_2", "Fat Wallet", 40],
    ["ach_sharp_eye_3", "Bill Reader", 30],
  ];
  for (const [key, title, dago] of achTiers) {
    await q(
      `INSERT INTO badges (key, title, description, icon_url) VALUES ($1,$2,$3,'🏅') ON CONFLICT (key) DO NOTHING`,
      [key, title, `Achievement tier: ${title}.`]
    );
    await q(
      `INSERT INTO user_badges (username, badge_id, earned_at) SELECT $1, id, $2 FROM badges WHERE key=$3 ON CONFLICT DO NOTHING`,
      [DEMO_USERNAME, isoDaysAgo(now, dago), key]
    );
  }

  await q(`DELETE FROM budgets WHERE username=$1`, [DEMO_USERNAME]);
  for (const [cat, amount] of [["grocery", 14000], ["restaurant", 8000], ["fuel", 6000]] as const) {
    await q(
      `INSERT INTO budgets (id, username, category, period, amount, currency, active, updated_at, version)
       VALUES ($1,$2,$3,'monthly',$4,'TRY',true,now(),1)`,
      [randomUUID(), DEMO_USERNAME, cat, amount]
    );
  }

  await q(`DELETE FROM shopping_list_items WHERE username=$1`, [DEMO_USERNAME]);
  const shopping = ["Süt (2 lt)", "Yumurta (30'lu)", "Zeytinyağı", "Kedi maması", "Bulaşık deterjanı", "Filtre kahve"];
  for (let i = 0; i < shopping.length; i++) {
    await q(
      `INSERT INTO shopping_list_items (username, name, position, raw_input, source, completed_at)
       VALUES ($1,$2,$3,$2,'manual',$4)`,
      [DEMO_USERNAME, shopping[i], i, i < 2 ? isoDaysAgo(now, 1) : null]
    );
  }

  await q(`DELETE FROM service_providers WHERE username=$1`, [DEMO_USERNAME]);
  const providers: Array<[string, string, number, number]> = [
    ["CK Boğaziçi Elektrik", "electricity", 18, 1450],
    ["İSKİ", "water", 9, 520],
    ["İGDAŞ", "gas", 25, 980],
    ["Türk Telekom", "internet", 22, 649.5],
    ["Netflix", "streaming", 12, 229.99],
    ["Spotify", "digital_subscription", 4, 119.99],
    ["YouTube Premium", "streaming", 27, 179.99],
  ];
  for (const [name, cat, day, expected] of providers) {
    await q(
      `INSERT INTO service_providers (username, category, name, payment_day, reminder_days_before, reminder_same_day, reminder_hour, is_active, expected_amount, last_paid_at)
       VALUES ($1,$2,$3,$4,'{3}'::int[],true,10,true,$5,$6)`,
      [DEMO_USERNAME, cat, name, day, expected, isoDaysAgo(now, 20)]
    );
  }

  await q(`DELETE FROM insight_events WHERE username=$1`, [DEMO_USERNAME]);
  const insights: Array<[string, string, string, number, number]> = [
    ["category_drift", "Dining is taking a larger share", "Restaurant and cafe spending is 9 points higher than the previous 30 days.", 0.85, 2140],
    ["past_self", "Ahead of the same day last quarter", "Spend to date this month is 12% above the same day across the last 3 months.", 0.8, 1660],
    ["impulse_fingerprint", "Saturday evening window", "A cluster of larger baskets lands between 17:00 and 22:00 on Saturdays.", 0.7, 940],
  ];
  for (const [kind, title, summary, conf, impact] of insights) {
    await q(
      `INSERT INTO insight_events (id, username, kind, state, title, summary, confidence, monetary_impact, currency, payload, detected_at, updated_at, version)
       VALUES ($1,$2,$3,'detected',$4,$5,$6,$7,'TRY','{}'::jsonb,$8,now(),1)`,
      [randomUUID(), DEMO_USERNAME, kind, title, summary, conf, impact, isoDaysAgo(now, 2)]
    );
  }
}
