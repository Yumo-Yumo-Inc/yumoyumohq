import { NextResponse } from "next/server";
import { sql, warmUpConnection } from "@/lib/db/client";
import type { LeaderboardEntry } from "@/lib/mock/types";
import { getSessionUsername } from "@/lib/auth/session";
import { getPrimaryAdmin, isAdminUser } from "@/lib/auth/admin-users";

// Check if database is available
function isDatabaseAvailable(): boolean {
  if (typeof window !== "undefined") {
    return false;
  }
  return !!(process.env.NEW_DB_DATABASE_URL || process.env.DATABASE_URL) && sql !== null;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 600
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "season";
    const username = await getSessionUsername();
    const isAdmin = username !== null && isAdminUser(username);

    if (!isDatabaseAvailable() || !sql) {
      console.log("[api/leaderboard] DATABASE_URL not set, returning empty leaderboard");
      return NextResponse.json({ leaderboard: [] });
    }

    const dbSql = sql;
    await warmUpConnection();

    // Calculate date filters based on type
    let cutoffDate: Date | null = null;
    const now = new Date();
    
    if (type === "daily") {
      cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cutoffDate.setHours(0, 0, 0, 0);
    } else if (type === "weekly") {
      cutoffDate = new Date(now);
      cutoffDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      cutoffDate.setHours(0, 0, 0, 0);
    }
    // "season" = seasonXP (user_profiles), "global" = hidden_cost, daily/weekly = date filter
    // "airdrop" = cumulative contribution_points (primary airdrop metric)

    const leaderboard = await withRetry(async () => {
      // Query to get user statistics from receipts
      // Exclude admin users from leaderboard
      let rows;
      
      // Filter out admin users from leaderboard
      // For each admin user, add a condition to exclude them
      // Only show users with honor > 0 (COALESCE for missing column pre-migration)
      const honorFilter = dbSql`AND (up.honor IS NULL OR up.honor > 0)`;

      if (type === "airdrop") {
        rows = await dbSql`
          SELECT
            up.username,
            COALESCE(MAX(r.wallet_address), '') as address,
            COALESCE(up.display_name, up.username) as display_name,
            up.avatar_url as avatar_url,
            COALESCE(up.streak, 0)::int as streak,
            COALESCE(uct.contribution_points, 0)::float as contribution_points,
            COALESCE(uct.receipt_contribution_points, 0)::float as receipt_contribution_points,
            COALESCE(uct.quest_contribution_points, 0)::float as quest_contribution_points,
            COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified'), 0) as hidden_cost_uncovered,
            COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') as receipts_verified,
            up.honor as honor
          FROM user_profiles up
          LEFT JOIN receipts r ON r.username = up.username
          LEFT JOIN user_contribution_totals uct ON uct.username = up.username
          WHERE up.username IS NOT NULL
            AND up.username != ${getPrimaryAdmin()}
            AND (up.honor IS NULL OR up.honor > 0)
          GROUP BY up.username, up.display_name, up.avatar_url, up.streak, up.honor,
                   uct.contribution_points, uct.receipt_contribution_points, uct.quest_contribution_points
          HAVING COALESCE(uct.contribution_points, 0) > 0
          ORDER BY COALESCE(uct.contribution_points, 0) DESC, COALESCE(up.streak, 0) DESC, hidden_cost_uncovered DESC
          LIMIT 100
        `;
      } else if (type === "season") {
        const seasonRows = await dbSql`
          SELECT
            up.username,
            COALESCE(MAX(r.wallet_address), '') as address,
            COALESCE(up.display_name, up.username) as display_name,
            up.avatar_url as avatar_url,
            COALESCE(up.season_xp, 0)::int as season_xp,
            COALESCE(up.streak, 0)::int as streak,
            COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified'), 0) as hidden_cost_uncovered,
            COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') as receipts_verified,
            up.honor as honor,
            COALESCE(uct.contribution_points, 0)::float as contribution_points,
            COALESCE(uct.receipt_contribution_points, 0)::float as receipt_contribution_points,
            COALESCE(uct.quest_contribution_points, 0)::float as quest_contribution_points
          FROM user_profiles up
          LEFT JOIN receipts r ON r.username = up.username
          LEFT JOIN user_contribution_totals uct ON uct.username = up.username
          WHERE up.username IS NOT NULL
            AND up.username != ${getPrimaryAdmin()}
            ${honorFilter}
          GROUP BY up.username, up.display_name, up.avatar_url, up.season_xp, up.streak, up.honor,
                   uct.contribution_points, uct.receipt_contribution_points, uct.quest_contribution_points
          HAVING COALESCE(up.season_xp, 0) > 0 OR COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') > 0
          ORDER BY COALESCE(up.season_xp, 0) DESC, up.streak DESC, hidden_cost_uncovered DESC
          LIMIT 100
        `;
        rows = seasonRows;
      } else if (cutoffDate) {
        rows = await dbSql`
          SELECT
            r.username,
            COALESCE(r.wallet_address, '') as address,
            COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') as receipts_verified,
            COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified'), 0) as hidden_cost_uncovered,
            MAX(r.created_at) as last_receipt_date,
            COALESCE(up.display_name, r.username) as display_name,
            up.avatar_url as avatar_url,
            up.honor as honor,
            COALESCE(uct.contribution_points, 0)::float as contribution_points,
            COALESCE(uct.receipt_contribution_points, 0)::float as receipt_contribution_points,
            COALESCE(uct.quest_contribution_points, 0)::float as quest_contribution_points
          FROM receipts r
          LEFT JOIN user_profiles up ON r.username = up.username
          LEFT JOIN user_contribution_totals uct ON uct.username = r.username
          WHERE r.username IS NOT NULL
            AND r.username != ${getPrimaryAdmin()}
            AND r.created_at >= ${cutoffDate.toISOString()}
            AND (r.status = 'analyzed' OR r.status = 'verified')
            ${honorFilter}
          GROUP BY r.username, r.wallet_address, up.display_name, up.avatar_url, up.honor,
                   uct.contribution_points, uct.receipt_contribution_points, uct.quest_contribution_points
          HAVING COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') > 0
          ORDER BY hidden_cost_uncovered DESC, receipts_verified DESC
          LIMIT 100
        `;
      } else {
        rows = await dbSql`
          SELECT
            r.username,
            COALESCE(r.wallet_address, '') as address,
            COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') as receipts_verified,
            COALESCE(SUM(r.hidden_cost_core) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified'), 0) as hidden_cost_uncovered,
            MAX(r.created_at) as last_receipt_date,
            COALESCE(up.display_name, r.username) as display_name,
            up.avatar_url as avatar_url,
            up.honor as honor,
            COALESCE(uct.contribution_points, 0)::float as contribution_points,
            COALESCE(uct.receipt_contribution_points, 0)::float as receipt_contribution_points,
            COALESCE(uct.quest_contribution_points, 0)::float as quest_contribution_points
          FROM receipts r
          LEFT JOIN user_profiles up ON r.username = up.username
          LEFT JOIN user_contribution_totals uct ON uct.username = r.username
          WHERE r.username IS NOT NULL
            AND r.username != ${getPrimaryAdmin()}
            AND (r.status = 'analyzed' OR r.status = 'verified')
            ${honorFilter}
          GROUP BY r.username, r.wallet_address, up.display_name, up.avatar_url, up.honor,
                   uct.contribution_points, uct.receipt_contribution_points, uct.quest_contribution_points
          HAVING COUNT(*) FILTER (WHERE r.status = 'analyzed' OR r.status = 'verified') > 0
          ORDER BY hidden_cost_uncovered DESC, receipts_verified DESC
          LIMIT 100
        `;
      }
      
      console.log(`[api/leaderboard] Found ${rows.length} users for ${type} leaderboard`);

      // Get all usernames to fetch their receipt dates for streak calculation
      const usernames = rows.map((row: any) => row.username);
      
      // Fetch distinct receipt dates for each user to calculate streaks
      const receiptDatesByUser: Record<string, Set<string>> = {};
      if (usernames.length > 0) {
        // Initialize sets for all users
        for (const username of usernames) {
          receiptDatesByUser[username] = new Set();
        }
        
        // Query receipt dates for all users in the leaderboard
        // Use postgres.js template tag with array parameter
        let dateRows: any[] = [];
        
        // Process in batches to avoid query size limits
        const batchSize = 50;
        for (let i = 0; i < usernames.length; i += batchSize) {
          const batch = usernames.slice(i, i + batchSize);
          
          // Use postgres.js template tag with ANY operator for array
          const batchResults = await dbSql`
            SELECT DISTINCT
              r.username,
              DATE(r.created_at)::text as receipt_date
            FROM receipts r
            WHERE r.username = ANY(${batch}::text[])
              AND (r.status = 'analyzed' OR r.status = 'verified')
            ORDER BY r.username, receipt_date DESC
          `;
          
          dateRows = dateRows.concat(batchResults);
        }
        
        console.log(`[api/leaderboard] 📅 Fetched ${dateRows.length} receipt date records for ${usernames.length} users`);
        
        for (const dateRow of dateRows) {
          const username = dateRow.username;
          let receiptDate = dateRow.receipt_date;
          if (username && receiptDate) {
            // Normalize date string (remove time if present, ensure YYYY-MM-DD format)
            // PostgreSQL DATE() returns string in format 'YYYY-MM-DD'
            if (receiptDate instanceof Date) {
              receiptDate = receiptDate.toISOString().split('T')[0];
            } else if (typeof receiptDate === 'string') {
              receiptDate = receiptDate.split('T')[0].split(' ')[0];
            }
            
            if (receiptDatesByUser[username]) {
              receiptDatesByUser[username].add(receiptDate);
            }
          }
        }
        
        // Debug: log receipt dates for first few users
        const sampleUsers = usernames.slice(0, 3);
        for (const username of sampleUsers) {
          const dates = Array.from(receiptDatesByUser[username] || []).sort().reverse().slice(0, 5);
          console.log(`[api/leaderboard] 📅 ${username}: ${receiptDatesByUser[username]?.size || 0} unique dates, recent = ${dates.join(', ')}`);
        }
      }

      // Helper function to calculate streak days
      const calculateStreak = (username: string): number => {
        const receiptDates = receiptDatesByUser[username];
        if (!receiptDates || receiptDates.size === 0) {
          return 0;
        }

        // Get today's date at midnight (UTC)
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split('T')[0];

        // Check if user has a receipt today
        if (!receiptDates.has(todayStr)) {
          // If no receipt today, check yesterday
          const yesterday = new Date(today);
          yesterday.setUTCDate(yesterday.getUTCDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (!receiptDates.has(yesterdayStr)) {
            // No receipt today or yesterday, streak is broken
            return 0;
          }
          
          // Start counting from yesterday
          const currentDate = new Date(yesterday);
          let streak = 1;
          
          // Count backwards for consecutive days (max 365 days to prevent infinite loop)
          let daysChecked = 0;
          while (daysChecked < 365) {
            currentDate.setUTCDate(currentDate.getUTCDate() - 1);
            const dateStr = currentDate.toISOString().split('T')[0];
            if (receiptDates.has(dateStr)) {
              streak++;
              daysChecked++;
            } else {
              break;
            }
          }
          
          return streak;
        }

        // User has a receipt today, count backwards
        const currentDate = new Date(today);
        let streak = 1;
        
        // Count backwards for consecutive days (max 365 days to prevent infinite loop)
        let daysChecked = 0;
        while (daysChecked < 365) {
          currentDate.setUTCDate(currentDate.getUTCDate() - 1);
          const dateStr = currentDate.toISOString().split('T')[0];
          if (receiptDates.has(dateStr)) {
            streak++;
            daysChecked++;
          } else {
            break;
          }
        }
        
        return streak;
      };

      // Convert to LeaderboardEntry format
      const entries: LeaderboardEntry[] = rows.map((row: any, index: number) => {
        // Season type: use check-in streak from user_profiles; else receipt streak
        const streakDays = type === "season"
          ? (parseInt(row.streak, 10) || 0)
          : calculateStreak(row.username);

        if (index < 3) {
          const dates = Array.from(receiptDatesByUser[row.username] || []).sort().reverse().slice(0, 3);
          console.log(`[api/leaderboard] ${type === "season" ? "📌" : "🔥"} ${row.username}: streak=${streakDays}, dates=${dates.join(', ')}`);
        }
        
        // Badges (can be enhanced later based on achievements)
        const badges: string[] = [];
        if (row.receipts_verified >= 100) badges.push("🏆");
        if (row.receipts_verified >= 50) badges.push("⭐");
        if (row.receipts_verified >= 10) badges.push("🔥");
        if (parseFloat(row.hidden_cost_uncovered) >= 10000) badges.push("💰");

        return {
          rank: index + 1,
          username: row.username || "",
          address: row.address || "",
          displayName: row.display_name || row.username || "Unknown",
          avatarUrl: row.avatar_url || null,
          receiptsVerified: parseInt(row.receipts_verified) || 0,
          hiddenCostUncovered: parseFloat(row.hidden_cost_uncovered) || 0,
          streakDays,
          badges,
          honor: row.honor != null ? parseInt(row.honor, 10) : 50,
          contributionPoints: parseFloat(row.contribution_points) || 0,
          receiptContributionPoints: parseFloat(row.receipt_contribution_points) || 0,
          questContributionPoints: parseFloat(row.quest_contribution_points) || 0,
        };
      });

      // Admin-only: attach all-time receipt and quest contribution totals per user.
      if (isAdmin && usernames.length > 0) {
        const totalBintByUser: Record<string, number> = {};
        const totalBintBonusByUser: Record<string, number> = {};
        for (const u of usernames) {
          totalBintByUser[u] = 0;
          totalBintBonusByUser[u] = 0;
        }
        try {
          const bintRows = await dbSql`
            SELECT r.username, COALESCE(SUM(r.hidden_cost_core), 0)::float as total_bint
            FROM receipts r
            WHERE r.username = ANY(${usernames}::text[])
              AND (r.status = 'analyzed' OR r.status = 'verified')
            GROUP BY r.username
          `;
          for (const row of bintRows as any[]) {
            if (row?.username != null) totalBintByUser[row.username] = parseFloat(row.total_bint) || 0;
          }
        } catch (e) {
          console.warn("[api/leaderboard] total receipt contribution query failed:", e);
        }
        try {
          const bintBalanceRows = await dbSql`
            SELECT username, COALESCE(bint_balance, 0)::float as val
            FROM user_profiles
            WHERE username = ANY(${usernames}::text[])
          `;
          for (const row of bintBalanceRows as any[]) {
            if (row?.username != null) totalBintBonusByUser[row.username] = (totalBintBonusByUser[row.username] || 0) + (parseFloat(row.val) || 0);
          }
          const bintBonusRows = await dbSql`
            SELECT r.username, COALESCE(SUM(rr.bint_bonus_amount), 0)::float as val
            FROM receipts r
            LEFT JOIN receipt_rewards rr ON r.receipt_id = rr.receipt_id
            WHERE r.username = ANY(${usernames}::text[])
              AND (r.status = 'analyzed' OR r.status = 'verified')
            GROUP BY r.username
          `;
          for (const row of bintBonusRows as any[]) {
            if (row?.username != null) totalBintBonusByUser[row.username] = (totalBintBonusByUser[row.username] || 0) + (parseFloat(row.val) || 0);
          }
          const bintRefereeRows = await dbSql`
            SELECT r.username, COALESCE(SUM(rrl.amount_bint_referee), 0)::float as val
            FROM receipts r
            JOIN referral_reward_log rrl ON r.receipt_id = rrl.receipt_id
            WHERE r.username = ANY(${usernames}::text[])
            GROUP BY r.username
          `;
          for (const row of bintRefereeRows as any[]) {
            if (row?.username != null) totalBintBonusByUser[row.username] = (totalBintBonusByUser[row.username] || 0) + (parseFloat(row.val) || 0);
          }
          const bintReferrerRows = await dbSql`
            SELECT rr.referrer_username as username, COALESCE(SUM(rrl.amount_bint_referrer), 0)::float as val
            FROM referral_relationships rr
            JOIN referral_reward_log rrl ON rr.id = rrl.referral_relationship_id
            WHERE rr.referrer_username = ANY(${usernames}::text[])
            GROUP BY rr.referrer_username
          `;
          for (const row of bintReferrerRows as any[]) {
            if (row?.username != null) totalBintBonusByUser[row.username] = (totalBintBonusByUser[row.username] || 0) + (parseFloat(row.val) || 0);
          }
        } catch (e) {
          console.warn("[api/leaderboard] total quest contribution query failed:", e);
        }
        entries.forEach((entry, index) => {
          const row = rows[index];
          const uname = row?.username;
          if (typeof uname === "string") {
            (entry as any).totalAyumo = totalBintByUser[uname] ?? 0;
            (entry as any).totalRyumo = totalBintBonusByUser[uname] ?? 0;
          }
        });
      }

      return entries;
    });

    return NextResponse.json({ leaderboard });
  } catch (error: any) {
    console.error("[api/leaderboard] error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leaderboard",
      },
      { status: 500 }
    );
  }
}