/**
 * Public API for receipt database operations
 * SERVER-ONLY: Do not import in client components
 */

// Re-export everything from queries
export {
    getAllReceipts,
    getAllReceiptsAll,
    getReceiptById,
    getReceiptsByDateRange,
    getReceiptsForInsights,
    getReceiptsAllForInsights,
    getReceiptsByDateRangeForInsights,
    getReceiptCount,
    getReceiptCountAll,
    getReceiptLogsForAdmin,
    getReceiptOcrForAdmin,
  } from "./queries/select";
  export type { ReceiptLogRow, ReceiptOcrRow } from "./queries/select";
  
  export { insertReceipt } from "./queries/insert";
  export { deleteReceipt } from "./queries/delete";
  export { checkDuplicateReceipt } from "./duplicate/check";
  export type { DuplicateCheckResult } from "./types";