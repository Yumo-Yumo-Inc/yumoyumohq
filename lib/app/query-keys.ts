export const PROFILE_QUERY_KEY = ["profile"] as const;
export const NOTIFICATIONS_QUERY_KEY = ["notifications"] as const;
export const QUESTS_DAILY_QUERY_KEY = ["quests", "daily"] as const;
export const DASHBOARD_QUERY_KEY = (period: string) =>
  ["dashboard", period] as const;
export const RECEIPTS_QUERY_KEY = (params: {
  page: number;
  pageSize: number;
  search?: string;
  statusFilter?: string;
  /** Admin uses /api/receipts; others use local cache — must differ for React Query */
  isAdmin?: boolean;
}) => ["receipts", params] as const;
