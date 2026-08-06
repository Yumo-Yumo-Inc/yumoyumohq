/**
 * Time-aware platform support leaderboard.
 *
 * Gross score = airdrop core (cPoints × merchant diversity × receipt volume)
 *             + platform support bonuses (canonical discovery, corrections, category/doc diversity)
 * Net score   = gross − honesty penalties
 * Fair score  = net / tenure normalization
 *
 * Airdrop alignment: same contribution_point_events + duplicate_of exclusion +
 * distinct merchant / receipt aggregates as lib/airdrop/build-campaign.ts.
 */

import { sql, type SqlTaggedTemplate } from "@/lib/db/client";
import { getPrimaryAdmin } from "@/lib/auth/admin-users";
import {
  SUPPORT_SCORE_HALF_LIFE_DAYS,
  SUPPORT_BONUS_WEIGHTS,
  SUPPORT_HONESTY_PENALTIES,
  supportFairScore,
  supportIntegrityRatio,
  supportNetScore,
  roundSupportScore,
  type SupportScorePeriod,
} from "@/config/support-score";
import { computeSupportGrossScore } from "@/lib/support-score/compute-gross";

type SupportLeaderboardEntry = {
  rank: number;
  username: string;
  displayName: string | null;
  country: string | null;
  avatarUrl: string | null;
  fairScore: number;
  grossScore: number;
  netDecayedScore: number;
  penaltyScore: number;
  integrityRatio: number;
  tenureDays: number;
  contributionPoints: number;
  distinctMerchants: number;
  receiptCount: number;
  diversityMultiplier: number;
  receiptMultiplier: number;
  airdropCoreScore: number;
  airdropCoreWeighted: number;
  discoveryScore: number;
  otherBonusScore: number;
  supportBonusScore: number;
  discoveryPoints: number;
  productLinePoints: number;
  productCategoryPoints: number;
  correctionPoints: number;
  categoryPoints: number;
  documentTypePoints: number;
  counts: {
    merchantDiscoveries: number;
    productLineDiscoveries: number;
    productCategoryDiscoveries: number;
    corrections: number;
    merchantCategoryDiversity: number;
    documentTypeDiversity: number;
    duplicateMarked: number;
    sameUserContentRepeats: number;
    contentHashRepeats: number;
    rejectedUploads: number;
    rejectedCorrections: number;
    contradictionCorrections: number;
  };
  firstContributionAt: string | null;
  lastContributionAt: string | null;
};

export type SupportLeaderboardResult = {
  period: SupportScorePeriod;
  useDecay: boolean;
  halfLifeDays: number;
  generatedAt: string;
  entries: SupportLeaderboardEntry[];
};

type RawRow = {
  username: string;
  display_name: string | null;
  country: string | null;
  avatar_url: string | null;
  contribution_points: number;
  distinct_merchants: number;
  receipt_count: number;
  support_bonus_points: number;
  discovery_points: number;
  product_line_points: number;
  product_category_points: number;
  correction_points: number;
  category_points: number;
  document_type_points: number;
  merchant_discoveries: number;
  product_line_discoveries: number;
  product_category_discoveries: number;
  corrections: number;
  merchant_category_diversity: number;
  document_type_diversity: number;
  penalty_score: number;
  duplicate_marked: number;
  same_user_content_repeats: number;
  content_hash_repeats: number;
  rejected_uploads: number;
  rejected_corrections: number;
  contradiction_corrections: number;
  first_contribution_at: string | null;
  last_contribution_at: string | null;
  tenure_days: number;
};

function periodCutoff(period: SupportScorePeriod): Date | null {
  if (period === "30d") {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (period === "90d") {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d;
  }
  return null;
}

export async function buildSupportLeaderboard(opts: {
  period?: SupportScorePeriod;
  limit?: number;
  excludeAdmin?: boolean;
  honorFilter?: boolean;
}): Promise<SupportLeaderboardResult> {
  if (!sql) {
    return {
      period: opts.period ?? "decayed",
      useDecay: (opts.period ?? "decayed") === "decayed",
      halfLifeDays: SUPPORT_SCORE_HALF_LIFE_DAYS,
      generatedAt: new Date().toISOString(),
      entries: [],
    };
  }

  const period = opts.period ?? "decayed";
  const limit = Math.min(200, Math.max(1, opts.limit ?? 50));
  const useDecay = period === "decayed";
  const cutoff = periodCutoff(period);
  const excludeAdmin = opts.excludeAdmin ?? true;
  const honorFilter = opts.honorFilter ?? true;
  const admin = excludeAdmin ? getPrimaryAdmin() : "";
  const b = SUPPORT_BONUS_WEIGHTS;
  const p = SUPPORT_HONESTY_PENALTIES;

  const dbSql = sql as SqlTaggedTemplate;
  const rows = (await dbSql`
    WITH contribution_raw AS (
      SELECT
        e.username,
        e.points_delta,
        e.created_at,
        e.source_type
      FROM contribution_point_events e
      LEFT JOIN receipts r
        ON e.source_type = 'receipt_verified' AND r.receipt_id = e.reference_id
      WHERE e.username IS NOT NULL
        AND e.points_delta > 0
        AND (
          e.source_type <> 'receipt_verified'
          OR (r.receipt_id IS NOT NULL AND r.duplicate_of IS NULL)
        )
    ),
    contribution_filtered AS (
      SELECT *
      FROM contribution_raw
      WHERE (${cutoff}::timestamptz IS NULL OR created_at >= ${cutoff}::timestamptz)
        AND (${excludeAdmin}::boolean = false OR username <> ${admin})
    ),
    contribution_by_user AS (
      SELECT
        username,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              points_delta::double precision / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE points_delta::double precision
          END
        ), 0)::double precision AS contribution_points,
        MIN(created_at) AS first_contribution_at,
        MAX(created_at) AS last_contribution_at
      FROM contribution_filtered
      GROUP BY username
    ),
    receipt_agg AS (
      SELECT
        r.username,
        COUNT(*)::int AS receipt_count,
        COUNT(DISTINCT COALESCE(r.merchant_id::text, LOWER(TRIM(r.merchant_name))))::int AS distinct_merchants
      FROM receipts r
      WHERE r.username IS NOT NULL
        AND r.duplicate_of IS NULL
        AND LOWER(r.status) IN ('verified', 'saved', 'analyzed')
        AND (${cutoff}::timestamptz IS NULL OR r.created_at >= ${cutoff}::timestamptz)
        AND (${excludeAdmin}::boolean = false OR r.username <> ${admin})
      GROUP BY r.username
    ),
    support_bonus_events AS (
      SELECT
        m.first_receipt_username AS username,
        m.created_at,
        ${b.merchantDiscovery}::double precision AS base_points,
        'merchant_discovery'::text AS kind
      FROM merchants m
      WHERE m.first_receipt_username IS NOT NULL

      UNION ALL

      SELECT
        pld.username,
        pld.first_at AS created_at,
        ${b.productLineDiscovery}::double precision,
        'product_line_discovery'::text
      FROM (
        SELECT username, created_at AS first_at,
          ROW_NUMBER() OVER (
            PARTITION BY canonical_id ORDER BY created_at ASC, receipt_id ASC
          ) AS rn
        FROM (
          SELECT r.username, r.created_at, r.receipt_id, rli.canonical_id
          FROM receipt_line_items rli
          INNER JOIN receipts r ON r.receipt_id = rli.receipt_id
          WHERE rli.canonical_id IS NOT NULL
            AND r.username IS NOT NULL
            AND r.duplicate_of IS NULL
            AND LOWER(r.status) IN ('verified', 'saved', 'analyzed')
        ) canonical_lines
      ) pld
      WHERE pld.rn = 1

      UNION ALL

      SELECT
        pcd.username,
        pcd.first_at AS created_at,
        ${b.productCategoryDiscovery}::double precision,
        'product_category_discovery'::text
      FROM (
        SELECT
          r.username,
          MIN(r.created_at) AS first_at
        FROM receipt_line_items rli
        INNER JOIN receipts r ON r.receipt_id = rli.receipt_id
        INNER JOIN canonical_products cp ON cp.id::text = rli.canonical_id
        WHERE rli.canonical_id IS NOT NULL
          AND r.username IS NOT NULL
          AND r.duplicate_of IS NULL
          AND LOWER(r.status) IN ('verified', 'saved', 'analyzed')
          AND NULLIF(TRIM(cp.category_path), '') IS NOT NULL
        GROUP BY r.username, LOWER(TRIM(cp.category_path))
      ) pcd

      UNION ALL

      SELECT
        c.username,
        c.created_at,
        ${b.correctionSubmit}::double precision,
        'correction'::text
      FROM receipt_corrections c
      INNER JOIN receipts r ON r.receipt_id = c.receipt_id AND r.duplicate_of IS NULL

      UNION ALL

      SELECT
        cfr.username,
        cfr.first_at AS created_at,
        ${b.merchantCategoryDiversity}::double precision,
        'merchant_category_diversity'::text
      FROM (
        SELECT username, MIN(created_at) AS first_at
        FROM receipts
        WHERE duplicate_of IS NULL
          AND username IS NOT NULL
          AND LOWER(status) IN ('verified', 'saved', 'analyzed')
          AND NULLIF(LOWER(TRIM(merchant_category)), '') IS NOT NULL
        GROUP BY username, LOWER(TRIM(merchant_category))
      ) cfr

      UNION ALL

      SELECT
        dfr.username,
        dfr.first_at AS created_at,
        ${b.documentTypeDiversity}::double precision,
        'document_type_diversity'::text
      FROM (
        SELECT username, MIN(created_at) AS first_at
        FROM receipts
        WHERE duplicate_of IS NULL
          AND username IS NOT NULL
          AND LOWER(status) IN ('verified', 'saved', 'analyzed')
          AND NULLIF(LOWER(TRIM(document_type)), '') IS NOT NULL
          AND LOWER(TRIM(document_type)) <> 'unknown'
        GROUP BY username, LOWER(TRIM(document_type))
      ) dfr
    ),
    support_bonus_filtered AS (
      SELECT sbe.*
      FROM support_bonus_events sbe
      WHERE sbe.username IS NOT NULL
        AND sbe.created_at IS NOT NULL
        AND (${cutoff}::timestamptz IS NULL OR sbe.created_at >= ${cutoff}::timestamptz)
        AND (${excludeAdmin}::boolean = false OR sbe.username <> ${admin})
    ),
    support_bonus_by_user AS (
      SELECT
        username,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE base_points
          END
        ), 0)::double precision AS support_bonus_points,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE base_points
          END
        ) FILTER (WHERE kind IN ('merchant_discovery', 'product_line_discovery', 'product_category_discovery')), 0)::double precision AS discovery_points,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE base_points
          END
        ) FILTER (WHERE kind = 'product_line_discovery'), 0)::double precision AS product_line_points,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE base_points
          END
        ) FILTER (WHERE kind = 'product_category_discovery'), 0)::double precision AS product_category_points,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE base_points
          END
        ) FILTER (WHERE kind = 'correction'), 0)::double precision AS correction_points,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE base_points
          END
        ) FILTER (WHERE kind = 'merchant_category_diversity'), 0)::double precision AS category_points,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE base_points
          END
        ) FILTER (WHERE kind = 'document_type_diversity'), 0)::double precision AS document_type_points,
        COUNT(*) FILTER (WHERE kind = 'merchant_discovery')::int AS merchant_discoveries,
        COUNT(*) FILTER (WHERE kind = 'product_line_discovery')::int AS product_line_discoveries,
        COUNT(*) FILTER (WHERE kind = 'product_category_discovery')::int AS product_category_discoveries,
        COUNT(*) FILTER (WHERE kind = 'correction')::int AS corrections,
        COUNT(*) FILTER (WHERE kind = 'merchant_category_diversity')::int AS merchant_category_diversity,
        COUNT(*) FILTER (WHERE kind = 'document_type_diversity')::int AS document_type_diversity,
        MIN(created_at) AS bonus_first_at,
        MAX(created_at) AS bonus_last_at
      FROM support_bonus_filtered
      GROUP BY username
    ),
    honesty_events AS (
      SELECT r.username, r.created_at, ${p.duplicateMarked}::double precision AS base_points, 'duplicate_marked'::text AS kind
      FROM receipts r WHERE r.username IS NOT NULL AND r.duplicate_of IS NOT NULL
      UNION ALL
      SELECT sur.username, sur.created_at, ${p.sameUserContentRepeat}::double precision, 'same_user_content_repeat'::text
      FROM (
        SELECT username, created_at, receipt_id,
          ROW_NUMBER() OVER (PARTITION BY username, content_hash ORDER BY created_at ASC, receipt_id ASC) AS rn
        FROM receipts
        WHERE username IS NOT NULL AND content_hash IS NOT NULL
          AND LOWER(status) IN ('verified', 'saved', 'analyzed', 'rejected')
      ) sur WHERE sur.rn > 1
      UNION ALL
      SELECT gcr.username, gcr.created_at, ${p.contentHashGlobalRepeat}::double precision, 'content_hash_repeat'::text
      FROM (
        SELECT username, created_at, receipt_id,
          ROW_NUMBER() OVER (PARTITION BY content_hash ORDER BY created_at ASC, receipt_id ASC) AS rn
        FROM receipts
        WHERE username IS NOT NULL AND content_hash IS NOT NULL
          AND LOWER(status) IN ('verified', 'saved', 'analyzed') AND duplicate_of IS NULL
      ) gcr WHERE gcr.rn > 1
      UNION ALL
      SELECT r.username, r.created_at, ${p.rejectedUpload}::double precision, 'rejected_upload'::text
      FROM receipts r WHERE r.username IS NOT NULL AND LOWER(r.status) = 'rejected'
      UNION ALL
      SELECT c.username, c.created_at, ${p.rejectedCorrection}::double precision, 'rejected_correction'::text
      FROM receipt_corrections c WHERE c.username IS NOT NULL AND c.status = 'rejected'
      UNION ALL
      SELECT c.username, c.created_at, ${p.contradictionCorrection}::double precision, 'contradiction_correction'::text
      FROM receipt_corrections c WHERE c.username IS NOT NULL AND c.contradiction_flag = true
    ),
    filtered_honesty AS (
      SELECT he.*
      FROM honesty_events he
      WHERE he.username IS NOT NULL AND he.created_at IS NOT NULL
        AND (${cutoff}::timestamptz IS NULL OR he.created_at >= ${cutoff}::timestamptz)
        AND (${excludeAdmin}::boolean = false OR he.username <> ${admin})
    ),
    penalty_by_user AS (
      SELECT
        fh.username,
        COALESCE(SUM(
          CASE
            WHEN ${useDecay}::boolean THEN
              fh.base_points / (
                1.0 + EXTRACT(EPOCH FROM (NOW() - fh.created_at)) / 86400.0
                / ${SUPPORT_SCORE_HALF_LIFE_DAYS}::double precision
              )
            ELSE fh.base_points
          END
        ), 0)::double precision AS penalty_score,
        COUNT(*) FILTER (WHERE fh.kind = 'duplicate_marked')::int AS duplicate_marked,
        COUNT(*) FILTER (WHERE fh.kind = 'same_user_content_repeat')::int AS same_user_content_repeats,
        COUNT(*) FILTER (WHERE fh.kind = 'content_hash_repeat')::int AS content_hash_repeats,
        COUNT(*) FILTER (WHERE fh.kind = 'rejected_upload')::int AS rejected_uploads,
        COUNT(*) FILTER (WHERE fh.kind = 'rejected_correction')::int AS rejected_corrections,
        COUNT(*) FILTER (WHERE fh.kind = 'contradiction_correction')::int AS contradiction_corrections
      FROM filtered_honesty fh
      GROUP BY fh.username
    ),
    user_base AS (
      SELECT username FROM contribution_by_user
      UNION
      SELECT username FROM support_bonus_by_user
    ),
    tenure_base AS (
      SELECT username, MIN(ts) AS first_ever_at
      FROM (
        SELECT username, created_at AS ts FROM contribution_filtered
        UNION ALL
        SELECT username, created_at AS ts FROM support_bonus_filtered
      ) t
      WHERE username IS NOT NULL AND ts IS NOT NULL
      GROUP BY username
    )
    SELECT
      ub.username,
      COALESCE(up.display_name, u.display_name, ub.username) AS display_name,
      COALESCE(up.country, u.country) AS country,
      up.avatar_url,
      COALESCE(cb.contribution_points, 0)::double precision AS contribution_points,
      COALESCE(ra.distinct_merchants, 0)::int AS distinct_merchants,
      COALESCE(ra.receipt_count, 0)::int AS receipt_count,
      COALESCE(sb.support_bonus_points, 0)::double precision AS support_bonus_points,
      COALESCE(sb.discovery_points, 0)::double precision AS discovery_points,
      COALESCE(sb.product_line_points, 0)::double precision AS product_line_points,
      COALESCE(sb.product_category_points, 0)::double precision AS product_category_points,
      COALESCE(sb.correction_points, 0)::double precision AS correction_points,
      COALESCE(sb.category_points, 0)::double precision AS category_points,
      COALESCE(sb.document_type_points, 0)::double precision AS document_type_points,
      COALESCE(sb.merchant_discoveries, 0)::int AS merchant_discoveries,
      COALESCE(sb.product_line_discoveries, 0)::int AS product_line_discoveries,
      COALESCE(sb.product_category_discoveries, 0)::int AS product_category_discoveries,
      COALESCE(sb.corrections, 0)::int AS corrections,
      COALESCE(sb.merchant_category_diversity, 0)::int AS merchant_category_diversity,
      COALESCE(sb.document_type_diversity, 0)::int AS document_type_diversity,
      COALESCE(pb.penalty_score, 0)::double precision AS penalty_score,
      COALESCE(pb.duplicate_marked, 0)::int AS duplicate_marked,
      COALESCE(pb.same_user_content_repeats, 0)::int AS same_user_content_repeats,
      COALESCE(pb.content_hash_repeats, 0)::int AS content_hash_repeats,
      COALESCE(pb.rejected_uploads, 0)::int AS rejected_uploads,
      COALESCE(pb.rejected_corrections, 0)::int AS rejected_corrections,
      COALESCE(pb.contradiction_corrections, 0)::int AS contradiction_corrections,
      LEAST(cb.first_contribution_at, sb.bonus_first_at) AS first_contribution_at,
      GREATEST(cb.last_contribution_at, sb.bonus_last_at) AS last_contribution_at,
      GREATEST(
        1.0,
        EXTRACT(EPOCH FROM (
          NOW() - COALESCE(tb.first_ever_at, cb.first_contribution_at, sb.bonus_first_at)
        )) / 86400.0
      )::double precision AS tenure_days
    FROM user_base ub
    LEFT JOIN contribution_by_user cb ON cb.username = ub.username
    LEFT JOIN receipt_agg ra ON ra.username = ub.username
    LEFT JOIN support_bonus_by_user sb ON sb.username = ub.username
    LEFT JOIN penalty_by_user pb ON pb.username = ub.username
    LEFT JOIN tenure_base tb ON tb.username = ub.username
    LEFT JOIN user_profiles up ON up.username = ub.username
    LEFT JOIN users u ON u.username = ub.username
    WHERE (${honorFilter}::boolean = false OR up.honor IS NULL OR up.honor > 0)
      AND (COALESCE(cb.contribution_points, 0) > 0 OR COALESCE(sb.support_bonus_points, 0) > 0)
    ORDER BY
      COALESCE(cb.contribution_points, 0) DESC,
      COALESCE(ra.receipt_count, 0) DESC,
      ub.username ASC
    LIMIT ${limit * 3}
  `) as RawRow[];

  const entries: SupportLeaderboardEntry[] = rows.map((row) => {
    const otherBonusPoints =
      (Number(row.correction_points) || 0) +
      (Number(row.category_points) || 0) +
      (Number(row.document_type_points) || 0);
    const grossBreakdown = computeSupportGrossScore({
      contributionPoints: Number(row.contribution_points) || 0,
      distinctMerchants: Number(row.distinct_merchants) || 0,
      receiptCount: Number(row.receipt_count) || 0,
      discoveryPoints: Number(row.discovery_points) || 0,
      otherBonusPoints,
    });
    const penaltyScore = Number(row.penalty_score) || 0;
    const grossScore = grossBreakdown.grossScore;
    const netDecayedScore = supportNetScore(grossScore, penaltyScore);
    const tenureDays = Number(row.tenure_days) || 1;
    const integrityRatio = roundSupportScore(supportIntegrityRatio(grossScore, penaltyScore));
    const fairScore = roundSupportScore(supportFairScore(netDecayedScore, tenureDays));

    return {
      rank: 0,
      username: row.username,
      displayName: row.display_name,
      country: row.country,
      avatarUrl: row.avatar_url,
      fairScore,
      grossScore,
      netDecayedScore: roundSupportScore(netDecayedScore),
      penaltyScore: roundSupportScore(penaltyScore),
      integrityRatio,
      tenureDays: roundSupportScore(tenureDays),
      contributionPoints: grossBreakdown.contributionPoints,
      distinctMerchants: grossBreakdown.distinctMerchants,
      receiptCount: grossBreakdown.receiptCount,
      diversityMultiplier: grossBreakdown.diversityMultiplier,
      receiptMultiplier: grossBreakdown.receiptMultiplier,
      airdropCoreScore: grossBreakdown.airdropCoreScore,
      airdropCoreWeighted: grossBreakdown.airdropCoreWeighted,
      discoveryScore: grossBreakdown.discoveryScore,
      otherBonusScore: grossBreakdown.otherBonusScore,
      supportBonusScore: grossBreakdown.supportBonusScore,
      discoveryPoints: roundSupportScore(Number(row.discovery_points) || 0),
      productLinePoints: roundSupportScore(Number(row.product_line_points) || 0),
      productCategoryPoints: roundSupportScore(Number(row.product_category_points) || 0),
      correctionPoints: roundSupportScore(Number(row.correction_points) || 0),
      categoryPoints: roundSupportScore(Number(row.category_points) || 0),
      documentTypePoints: roundSupportScore(Number(row.document_type_points) || 0),
      counts: {
        merchantDiscoveries: Number(row.merchant_discoveries) || 0,
        productLineDiscoveries: Number(row.product_line_discoveries) || 0,
        productCategoryDiscoveries: Number(row.product_category_discoveries) || 0,
        corrections: Number(row.corrections) || 0,
        merchantCategoryDiversity: Number(row.merchant_category_diversity) || 0,
        documentTypeDiversity: Number(row.document_type_diversity) || 0,
        duplicateMarked: Number(row.duplicate_marked) || 0,
        sameUserContentRepeats: Number(row.same_user_content_repeats) || 0,
        contentHashRepeats: Number(row.content_hash_repeats) || 0,
        rejectedUploads: Number(row.rejected_uploads) || 0,
        rejectedCorrections: Number(row.rejected_corrections) || 0,
        contradictionCorrections: Number(row.contradiction_corrections) || 0,
      },
      firstContributionAt: row.first_contribution_at,
      lastContributionAt: row.last_contribution_at,
    };
  });

  entries.sort((a, b) => b.fairScore - a.fairScore || b.netDecayedScore - a.netDecayedScore);
  const ranked = entries.slice(0, limit);
  ranked.forEach((e, i) => {
    e.rank = i + 1;
  });

  return {
    period,
    useDecay,
    halfLifeDays: SUPPORT_SCORE_HALF_LIFE_DAYS,
    generatedAt: new Date().toISOString(),
    entries: ranked,
  };
}
