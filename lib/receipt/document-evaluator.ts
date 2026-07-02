/**
 * document-evaluator.ts — Referee layer (Layer B)
 *
 * Product decision (2026-05-23): LLM free-form interpreter + two-stage evaluation.
 * Document type taxonomy: per the product decision (2026-05-23).
 *
 * PHILOSOPHY — revised 2026-05-23:
 *   LLM Stage 1 + Stage 2 already recognized and interpreted the document. The
 *   referee does not produce a score and threshold it — it trusts the LLM's
 *   judgment and decides based only on the NATURE OF THE DOCUMENT TYPE:
 *
 *     - "other" → no record (outside the Financial OS)
 *     - handwritten_tab / order_summary / bank_statement → recorded, no reward
 *     - utility_bill → reward if the LLM signals it was paid, record-only otherwise
 *     - everything else → record + reward
 *
 *   Abuse control is behavioral, not score-based:
 *     - Per-receipt maximum reward cap
 *     - Per-user (per level) daily maximum reward cap
 *   These are enforced in the pricing layer; the referee does not touch them.
 *
 *   paymentProofSignals is kept for the record — it is written to the DB as
 *   an audit log so the question "what supported this receipt's reward
 *   decision?" can be answered later.
 */

import type {
  DocumentTypeV2,
  LLMVisionStage1V2Output,
  LLMVisionStage2V2Output,
  PaymentProofSignalsV2,
  FraudSignalsV2,
} from "@/app/api/receipt/analyze/validators/llm-output-schema";

// ────────────────────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────────────────────

export type RewardEligibilityState =
  | "eligible"                // Earns a reward
  | "ineligible_type"         // Document type does not grant a reward, by policy
  | "ineligible_conditional"  // utility_bill: no paid signal found
  | "rejected_short_circuit"; // not_a_document or prompt_injection_attempt

export interface ExpenseRecord {
  documentType: DocumentTypeV2;
  documentTypeConfidence: number;
  merchantName: string | null;
  totalPaid: number | null;
  vatAmount: number | null;
  vatRate: number | null;
  date: string | null;
  time: string | null;
  currency: string | null;
  countryCode: string | null;
  paymentMethod: string | null;
  paymentTerminal: string | null;
  /** Mid/low-confidence fields that the user may be prompted to confirm. */
  fieldsNeedingConfirmation: string[];
}

export interface EvaluationNotes {
  /** Audit log only — NOT used as a decision input. Persisted to DB so we
   *  can trace later why a document was treated the way it was. */
  paymentProofSignals: PaymentProofSignalsV2;
  fraudFlags: string[];
  rewardEligibilityReason: string;
  reviewQueue: "none" | "user_confirm" | "admin_review" | "abuse_log";
}

export interface DocumentEvaluation {
  documentType: DocumentTypeV2;
  rewardEligibility: RewardEligibilityState;
  expenseRecord: ExpenseRecord | null;   // null only when rejected_short_circuit
  evaluationNotes: EvaluationNotes;
  summary: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Per-type policy table (mirror of taxonomy doc)
// ────────────────────────────────────────────────────────────────────────────

type RewardDefault = "open" | "closed" | "conditional";

interface DocumentTypePolicy {
  /** Record the expense in the user's history regardless of signals. */
  acceptAsExpense: boolean;
  /** Whether this document type can earn a reward at all. */
  rewardDefault: RewardDefault;
}

const DOCUMENT_TYPE_POLICY: Record<DocumentTypeV2, DocumentTypePolicy> = {
  e_invoice:             { acceptAsExpense: true,  rewardDefault: "open" },
  e_archive:             { acceptAsExpense: true,  rewardDefault: "open" },
  physical_receipt:      { acceptAsExpense: true,  rewardDefault: "open" },
  pos_slip:              { acceptAsExpense: true,  rewardDefault: "open" },
  restaurant_tab:        { acceptAsExpense: true,  rewardDefault: "open" },
  screenshot_of_payment: { acceptAsExpense: true,  rewardDefault: "open" },
  parking_ticket:        { acceptAsExpense: true,  rewardDefault: "open" },
  transport_ticket:      { acceptAsExpense: true,  rewardDefault: "open" },
  utility_bill:          { acceptAsExpense: true,  rewardDefault: "conditional" },
  handwritten_tab:       { acceptAsExpense: true,  rewardDefault: "closed" },
  order_summary:         { acceptAsExpense: true,  rewardDefault: "closed" },
  bank_statement:        { acceptAsExpense: true,  rewardDefault: "closed" },
  other:                 { acceptAsExpense: false, rewardDefault: "closed" },
};

// ────────────────────────────────────────────────────────────────────────────
// Conditional rule for utility_bill — "is this bill paid?"
// ────────────────────────────────────────────────────────────────────────────
//
// LLM already extracted the paymentMethod and paymentDetails fields in Stage 2.
// If it captured a payment method such as "credit_card" / "debit_card" /
// "bank_transfer" / "cash", or picked up a bank_ref / pos_terminal signal,
// the bill is considered paid. Otherwise it is treated as still due.

function utilityBillLooksPaid(
  stage1: LLMVisionStage1V2Output,
  stage2: LLMVisionStage2V2Output | null
): boolean {
  if (stage1.paymentProofSignals.bank_ref || stage1.paymentProofSignals.pos_terminal) {
    return true;
  }
  const method = stage2?.paymentDetails.paymentMethod.value;
  if (method && method !== "other") return true;
  return false;
}

// ────────────────────────────────────────────────────────────────────────────
// User-confirm fields (Stage 2 confidence < 0.7)
// ────────────────────────────────────────────────────────────────────────────

const USER_CONFIRM_THRESHOLD = 0.7;

// Critical fields the user can quickly answer if the LLM left them empty.
// Null values get queued the same way low-confidence values do — we'd rather
// ask the user than guess.
function fieldsNeedingConfirmation(stage2: LLMVisionStage2V2Output): string[] {
  const out: string[] = [];
  const checks: [string, { confidence: number; value: unknown }][] = [
    ["merchant.name", stage2.merchant.name],
    ["transaction.total", stage2.transaction.total],
    ["transaction.date", stage2.transaction.date],
  ];
  for (const [name, field] of checks) {
    const isMissing = field.value == null || field.value === "";
    const lowConfidence =
      field.value != null && field.confidence < USER_CONFIRM_THRESHOLD;
    if (isMissing || lowConfidence) {
      out.push(name);
    }
  }
  return out;
}

function buildExpenseRecord(
  stage1: LLMVisionStage1V2Output,
  stage2: LLMVisionStage2V2Output
): ExpenseRecord {
  return {
    documentType: stage1.documentType,
    documentTypeConfidence: stage1.documentTypeConfidence,
    merchantName: stage2.merchant.name.value,
    totalPaid: stage2.transaction.total.value,
    vatAmount: stage2.transaction.vat.value,
    vatRate: stage2.transaction.vatRate.value,
    date: stage2.transaction.date.value,
    time: stage2.transaction.time.value,
    currency: stage2.transaction.currency.value,
    countryCode: stage2.countryCode.value,
    paymentMethod: stage2.paymentDetails.paymentMethod.value,
    paymentTerminal: stage2.paymentTerminal.value,
    fieldsNeedingConfirmation: fieldsNeedingConfirmation(stage2),
  };
}

function activeFraudFlags(fraud: FraudSignalsV2): string[] {
  return (Object.entries(fraud) as [keyof FraudSignalsV2, boolean][])
    .filter(([, v]) => v)
    .map(([k]) => k);
}

// ────────────────────────────────────────────────────────────────────────────
// Main evaluator — trusts the LLM's decision
// ────────────────────────────────────────────────────────────────────────────

export function evaluateDocument(
  stage1: LLMVisionStage1V2Output,
  stage2: LLMVisionStage2V2Output | null
): DocumentEvaluation {
  const docType = stage1.documentType;
  const fraud = stage1.fraudSignals;
  const fraudFlags = activeFraudFlags(fraud);
  const signals = stage1.paymentProofSignals;
  const policy = DOCUMENT_TYPE_POLICY[docType];

  const baseNotes = (reason: string, reviewQueue: EvaluationNotes["reviewQueue"]): EvaluationNotes => ({
    paymentProofSignals: signals,
    fraudFlags,
    rewardEligibilityReason: reason,
    reviewQueue,
  });

  if (!policy) {
    return {
      documentType: docType,
      rewardEligibility: "ineligible_type",
      expenseRecord: null,
      evaluationNotes: baseNotes(`Unknown document type "${docType}" — no policy match`, "admin_review"),
      summary: `REJECTED: unknown documentType=${docType} — no policy match`,
    };
  }

  // ── LLM-as-judge path ──────────────────────────────────────────────────────
  // If Stage 2 returned a judgment, that IS the decision. The code does not
  // second-guess the LLM. This is the new mainline path.
  if (stage2 && stage2.judgment) {
    const j = stage2.judgment;
    const expenseRecord = buildExpenseRecord(stage1, stage2);

    if (j.rewardDecision === "reject") {
      return {
        documentType: docType,
        rewardEligibility: "rejected_short_circuit",
        expenseRecord: null,
        evaluationNotes: baseNotes(`LLM rejected: ${j.reasoning}`, "none"),
        summary: `REJECTED by LLM: ${j.reasoning}`,
      };
    }

    if (j.rewardDecision === "record_only") {
      return {
        documentType: docType,
        rewardEligibility: "ineligible_conditional",
        expenseRecord,
        evaluationNotes: baseNotes(`LLM: record-only — ${j.reasoning}`, "none"),
        summary: `RECORD-ONLY by LLM: ${j.reasoning}`,
      };
    }

    // reward_eligible
    let reviewQueue: EvaluationNotes["reviewQueue"] = "none";
    if (expenseRecord.fieldsNeedingConfirmation.length > 0) {
      reviewQueue = "user_confirm";
    }
    return {
      documentType: docType,
      rewardEligibility: "eligible",
      expenseRecord,
      evaluationNotes: {
        paymentProofSignals: signals,
        fraudFlags,
        rewardEligibilityReason: `LLM: reward-eligible — ${j.reasoning}`,
        reviewQueue,
      },
      summary: `ELIGIBLE by LLM (${docType}): ${j.reasoning}`,
    };
  }

  // ── Fallback path — LLM didn't provide a judgment (legacy / Stage 2 fail)
  // Old policy-table behaviour below, kept as a safety net.

  // ── Hard reject: not_a_document ─────────────────────────────────────────
  if (fraud.not_a_document) {
    return {
      documentType: docType,
      rewardEligibility: "rejected_short_circuit",
      expenseRecord: null,
      evaluationNotes: baseNotes("Image is not a document (Stage 1: not_a_document)", "none"),
      summary: `REJECTED: not_a_document — no expense recorded, no reward`,
    };
  }

  // ── Hard reject: prompt injection (only when document is recognized) ────
  // Safety net: if the LLM was uncertain about classification, an
  // injection flag is likely a false positive. Only abuse-log when the
  // document is clearly classified AND high confidence.
  if (fraud.prompt_injection_attempt) {
    const isHighConfidenceInjection =
      docType !== "other" && stage1.documentTypeConfidence >= 0.7;
    return {
      documentType: docType,
      rewardEligibility: "rejected_short_circuit",
      expenseRecord: null,
      evaluationNotes: baseNotes(
        isHighConfidenceInjection
          ? "Prompt injection attempt detected on a recognized document — abuse log"
          : "Prompt injection flag set but document is uncertain — soft reject (no account flag)",
        isHighConfidenceInjection ? "abuse_log" : "none"
      ),
      summary: isHighConfidenceInjection
        ? `REJECTED: prompt_injection_attempt — abuse log + account flag`
        : `REJECTED: low-confidence injection flag on uncertain document — soft reject`,
    };
  }

  // ── Document type not eligible for expense record ("other") ─────────────
  if (!policy.acceptAsExpense) {
    return {
      documentType: docType,
      rewardEligibility: "ineligible_type",
      expenseRecord: null,
      evaluationNotes: baseNotes(
        `Document type "${docType}" not eligible for expense record`,
        stage1.documentTypeConfidence < 0.5 ? "user_confirm" : "none"
      ),
      summary: `REJECTED: documentType=${docType} — not an expense document`,
    };
  }

  // ── Stage 2 failed → record-only fallback ───────────────────────────────
  if (!stage2) {
    return {
      documentType: docType,
      rewardEligibility: "ineligible_conditional",
      expenseRecord: null,
      evaluationNotes: baseNotes("Stage 2 extraction missing — cannot evaluate reward", "admin_review"),
      summary: `REVIEW: documentType=${docType}, Stage 2 missing — admin queue`,
    };
  }

  const expenseRecord = buildExpenseRecord(stage1, stage2);

  // ── Reward eligibility — driven by documentType policy, NOT score ───────
  let rewardEligibility: RewardEligibilityState;
  let rewardReason: string;

  if (policy.rewardDefault === "closed") {
    rewardEligibility = "ineligible_type";
    rewardReason = `Document type "${docType}" is record-only — no reward by policy`;
  } else if (policy.rewardDefault === "conditional") {
    if (utilityBillLooksPaid(stage1, stage2)) {
      rewardEligibility = "eligible";
      rewardReason = `Conditional type "${docType}" cleared — payment indicator present`;
    } else {
      rewardEligibility = "ineligible_conditional";
      rewardReason = `Conditional type "${docType}" — no payment indicator (unpaid bill)`;
    }
  } else {
    // "open" — trust the LLM. If it classified the document and extracted
    // a total, the reward layer takes over.
    rewardEligibility = "eligible";
    rewardReason = `Document type "${docType}" is reward-eligible — LLM confidence ${stage1.documentTypeConfidence.toFixed(2)}`;
  }

  // ── Review queue triggers (independent of reward decision) ───────────────
  let reviewQueue: EvaluationNotes["reviewQueue"] = "none";
  if (fraud.duplicate_text || fraud.digital_overlay) {
    reviewQueue = "admin_review";
  } else if (
    stage1.documentTypeConfidence < 0.5 ||
    expenseRecord.fieldsNeedingConfirmation.length > 0
  ) {
    reviewQueue = "user_confirm";
  }

  const summary =
    `documentType=${docType} (${stage1.documentTypeConfidence.toFixed(2)}) ` +
    `reward=${rewardEligibility} review=${reviewQueue}` +
    (fraudFlags.length ? ` fraud=${fraudFlags.join(",")}` : "");

  return {
    documentType: docType,
    rewardEligibility,
    expenseRecord,
    evaluationNotes: {
      paymentProofSignals: signals,
      fraudFlags,
      rewardEligibilityReason: rewardReason,
      reviewQueue,
    },
    summary,
  };
}
