import { NextResponse } from "next/server";

import type { ReceiptContext } from "@/app/api/receipt/analyze/types";
import {
  DuplicateError,
  PipelineError,
  RejectionError,
  ValidationError,
} from "@/app/api/receipt/analyze/types";
import {
  duplicateContextHasEnrichmentData,
  enrichOriginalReceiptFromDuplicateContext,
  isDuplicateEnrichEnabled,
} from "@/lib/receipt/duplicate-enrich-original";
import {
  PUBLIC_ANALYZE_FAILURE_MESSAGE,
  PUBLIC_RECEIPT_REJECTION_MESSAGE,
  toPublicAnalyzeMessage,
} from "@/lib/receipt/public-response";

export async function mapAnalyzeError(error: unknown, context?: ReceiptContext): Promise<NextResponse> {
  console.error("[Pipeline] âŒ Error:", error);

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: error.message, details: error.details, code: error.errorCode },
      { status: error.statusCode }
    );
  }

  if (error instanceof RejectionError) {
    const publicMessage = context?.isAdmin
      ? error.message
      : toPublicAnalyzeMessage(error.message, {
          fallback: PUBLIC_RECEIPT_REJECTION_MESSAGE,
          treatAsRejection: true,
        });
    const response: any = {
      error: publicMessage,
      rejected: true,
      rejectionReasons: context?.isAdmin ? error.reasons : [publicMessage],
    };

    if (context?.isAdmin && error.gateConfidence !== undefined) {
      response.gateConfidence = error.gateConfidence;
    }

    if (context?.isAdmin) {
      const receiptGateResult = (context as any).receiptGateResult;
      const llmResult = (context as any).llmResult;
      const fraudSignals = (context as any).fraudSignals;
      const marginViolation = (context as any).marginViolation || (context as any).marginViolationInfo;
      const placesResult = (context as any).placesResult;

      response.adminBreakdown = {
        receiptGate: receiptGateResult ? {
          docType: receiptGateResult.docType,
          confidence: receiptGateResult.confidence,
          structureEvidenceCount: receiptGateResult.structureEvidenceCount,
          passed: receiptGateResult.passed,
          evidenceScores: receiptGateResult.evidenceScores || {},
          reasons: receiptGateResult.reasons || [],
        } : null,
        ocr: {
          textPreview: context.fullText?.substring(0, 1000) || "No OCR text available",
          fullText: context.fullText || "No OCR text available",
          lineCount: context.ocrLines?.length || 0,
          lines: context.ocrLines?.slice(0, 20) || [],
          pdfText: context.pdfText || null,
          usePdfText: context.usePdfText || false,
        },
        extraction: {
          merchantName: context.merchantName || "Not extracted",
          merchantAddress: context.merchantAddress || null,
          merchantPlaceId: context.merchantPlaceId || null,
          category: context.category || null,
          utilityType: context.utilityType || null,
          date: context.date || null,
          time: context.time || null,
          totalPaid: context.totalPaid || 0,
          vatAmount: context.vatAmount || 0,
          vatRate: context.vatRate || null,
          serviceCharge: context.serviceCharge || null,
          currency: context.currency || "N/A",
          currencySymbol: context.currencySymbol || "N/A",
        },
        llm: llmResult ? {
          total: llmResult?.total || null,
          total_raw: llmResult?.total_raw || null,
          vat: llmResult?.vat || null,
          vat_raw: llmResult?.vat_raw || null,
          merchantName: llmResult?.merchantName || null,
          category: llmResult?.category || null,
          utilityType: llmResult?.utilityType || null,
          date: llmResult?.date || null,
          confidence: llmResult?.confidence || null,
          reasoning: llmResult?.reasoning || null,
          hasTotal: (llmResult?.total || 0) > 0,
        } : null,
        fraud: fraudSignals ? {
          fraudScore: fraudSignals.fraudScore || 0,
          riskLevel: fraudSignals.riskLevel || "unknown",
          isValid: fraudSignals.isValid || false,
          rejectionReasons: fraudSignals.rejectionReasons || [],
          warnings: fraudSignals.warnings || [],
          checks: fraudSignals.checks || {},
        } : null,
        qualityHonor: (context as any).qualityHonorResult
          ? {
              level: (context as any).qualityHonorResult.level,
              honorDelta: (context as any).qualityHonorResult.honorDelta,
              rewardPct: (context as any).qualityHonorResult.rewardPct,
              honorBonusApplied: (context as any).qualityHonorResult.honorBonusApplied,
              reasons: (context as any).qualityHonorResult.reasons,
              securityReasons: (context as any).qualityHonorResult.securityReasons,
              qualityScore: (context as any).qualityHonorResult.qualityScore,
            }
          : null,
        marginViolation: marginViolation ? {
          hasViolation: marginViolation.hasViolation || false,
          violations: marginViolation.violations || [],
          margins: marginViolation.margins || {},
          minRequired: marginViolation.minRequired || {},
        } : null,
        places: placesResult ? {
          placeId: placesResult.placeId || null,
          placeName: placesResult.placeName || null,
          countryCode: placesResult.countryCode || null,
          types: placesResult.types || [],
          domain: placesResult.domain || null,
        } : null,
        metadata: {
          receiptId: context.receiptId || null,
          filename: context.filename || null,
          isPdf: context.isPdf || false,
          originalIsPdf: context.originalIsPdf || false,
          detectedCountry: context.detectedCountry || null,
          hasExif: context.hasExif || false,
          location: context.location || null,
        },
      };

      console.log(`[handlePipelineError] ğŸ” Admin breakdown added for user: ${context.username || "unknown"}`);
      console.log(`[handlePipelineError] ğŸ“Š Breakdown summary:`, {
        hasReceiptGate: !!receiptGateResult,
        hasLLM: !!llmResult,
        hasFraud: !!fraudSignals,
        hasMarginViolation: !!marginViolation,
        hasPlaces: !!placesResult,
        ocrLines: context.ocrLines?.length || 0,
        extractedTotal: context.totalPaid || 0,
      });
    }

    return NextResponse.json(response, { status: 400 });
  }

  if (error instanceof DuplicateError) {
    const existingId = error.existingReceiptId?.trim();
    if (
      context?.isAdmin &&
      isDuplicateEnrichEnabled() &&
      existingId &&
      duplicateContextHasEnrichmentData(context)
    ) {
      try {
        const enriched = await enrichOriginalReceiptFromDuplicateContext(existingId, context);
        if (enriched.ok) {
          console.log(
            `[Pipeline] duplicate enrich â†’ ${existingId} fields=${enriched.fieldsUpdated.join(",")} postProcess=${enriched.postProcessOk}`
          );
          return NextResponse.json({
            duplicateResolved: true,
            message: "Admin duplicate enrich: original record updated.",
            existingReceiptId: enriched.originalReceiptId,
            duplicateType: error.duplicateType,
            originalUsername: error.existingUsername,
            fieldsUpdated: enriched.fieldsUpdated,
            postProcessOk: enriched.postProcessOk,
            postProcessState: enriched.postProcessState,
            postProcessError: enriched.postProcessError,
            uploadAttemptReceiptId: context?.receiptId ?? null,
          });
        }
        console.warn("[Pipeline] duplicate enrich failed:", enriched.error);
      } catch (duplicateEnrichError) {
        console.error("[Pipeline] duplicate enrich exception:", duplicateEnrichError);
      }
    }
    return NextResponse.json(
      context?.isAdmin
        ? {
            error: error.message,
            duplicateType: error.duplicateType,
            existingReceiptId: error.existingReceiptId,
            existingUsername: error.existingUsername,
          }
        : {
            error: error.message,
            duplicateType: error.duplicateType,
          },
      { status: 409 }
    );
  }

  if (error instanceof PipelineError) {
    const publicMessage = context?.isAdmin
      ? error.message
      : toPublicAnalyzeMessage(error.message, {
          fallback: PUBLIC_ANALYZE_FAILURE_MESSAGE,
        });
    return NextResponse.json(
      context?.isAdmin
        ? { error: error.message, details: error.details }
        : { error: publicMessage },
      { status: error.statusCode }
    );
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  return NextResponse.json(
    context?.isAdmin
      ? { error: "Failed to analyze receipt", details: errorMessage }
      : { error: PUBLIC_ANALYZE_FAILURE_MESSAGE },
    { status: 500 }
  );
}
