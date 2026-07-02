/**
 * LLM-based Travel Receipt Extractor
 * 
 * Uses LLM to extract structured travel price summary from OCR text
 * when table layout is lost during PDF→PNG→Vision OCR conversion.
 */

import OpenAI from "openai";

export interface TravelLLMExtraction {
  fare: number | null;
  taxes_and_fees: number | null;
  seat_selection: number | null;
  total: number | null;
  currency: string | null;
  date: string | null;
}

/**
 * Rule-based travel summary (from TravelPriceSummaryExtractor)
 */
export interface RuleBasedTravelSummary {
  fare: number | null;
  taxesAndFees: number | null;
  seatSelection: number | null;
  total: number | null;
}

/**
 * Reconcile LLM extraction with rule-based extraction
 * 
 * This ensures that when rule-based extractor finds explicit labels (e.g., "Koltuk Seçimi", "Vergiler ve ücretler"),
 * those values take precedence over LLM guesses, preventing mis-labeling.
 */
export function reconcileTravelSummary(
  llm: TravelLLMExtraction,
  rb: RuleBasedTravelSummary
): TravelLLMExtraction {
  const result = { ...llm };

  // If rule-based has both seatSelection and taxesAndFees, trust it for labels.
  // This is the most reliable case: explicit labels found by rule-based extractor.
  if (rb.seatSelection != null && rb.taxesAndFees != null) {
    // 1) Always prefer rule-based taxes for taxes_and_fees
    result.taxes_and_fees = rb.taxesAndFees;

    // 2) Always prefer rule-based seatSelection for seat_selection
    result.seat_selection = rb.seatSelection;
    
    console.log(`[travel-llm-extractor] Reconciliation: Using rule-based labels (seatSelection=${rb.seatSelection}, taxesAndFees=${rb.taxesAndFees})`);
  }

  // If only one of them exists, still use it to fill in missing fields
  if (rb.seatSelection != null && result.seat_selection == null) {
    result.seat_selection = rb.seatSelection;
    console.log(`[travel-llm-extractor] Reconciliation: Filled missing seat_selection from rule-based (${rb.seatSelection})`);
  }
  if (rb.taxesAndFees != null && (result.taxes_and_fees == null || result.taxes_and_fees === 0)) {
    result.taxes_and_fees = rb.taxesAndFees;
    console.log(`[travel-llm-extractor] Reconciliation: Filled missing/zero taxes_and_fees from rule-based (${rb.taxesAndFees})`);
  }

  return result;
}

const aiService = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

/**
 * Extract travel price summary using LLM
 * 
 * This function uses LLM to reconstruct travel price summary from OCR text
 * when labels and amounts appear on separate lines due to lost table layout.
 */
export async function extractTravelPriceSummaryWithLLM(
  ocrText: string
): Promise<TravelLLMExtraction | null> {
  if (!aiService) {
    console.warn("[travel-llm-extractor] OpenAI API key not configured, skipping LLM extraction");
    return null;
  }

  const systemPrompt = `You are a travel receipt extraction system. Extract structured information from OCR text.

TASK:

You will receive travel OCR text. Using that text, extract:

Fare (or "Ücret")

Taxes & Fees (or "Vergiler ve ücretler")

Seat Selection (or "Koltuk Seçimi")

Total (amount paid by customer)

Currency (TRY, TL, USD, EUR, etc.)

Date (booking date or flight date, ISO format yyyy-mm-dd if possible)

IMPORTANT DOMAIN RULES:

"Taxes & fees" or "Vergiler ve ücretler" is NOT VAT. Do not treat it as VAT.

If label and amount are not on the same line, search the following 1–3 lines to associate them.

Ignore masked credit card numbers like 540062***98 (do not parse as amounts).

If multiple currencies appear, choose the one used in the Total payment line.

Do not invent numbers. If a field is missing, set it to null.

SEAT SELECTION vs TAXES & FEES - CRITICAL DISTINCTION:

Treat any line that contains words like:
- Turkish: "Koltuk Seçimi", "Koltuk Secimi", "Koltuk seçimi", "Koltuk" with a price
- English: "Seat selection", "Seat fee", "Seat(s)", "Seat selection fee"
as seat_selection, NOT taxes_and_fees.

Treat any line that contains words like:
- Turkish: "Vergiler ve ücretler", "Vergi ve ücretler", "Vergiler ve ucretler"
- English: "Taxes & fees", "Taxes and fees", "Tax and fees", "Airport taxes", "Government fees"
as taxes_and_fees, NOT seat_selection.

If both a seat line and a taxes line exist in the same summary table, the JSON MUST correctly map:
- seat_selection = amount from the seat selection line
- taxes_and_fees = amount from the taxes & fees line

Do NOT set taxes_and_fees to the seat selection amount just because it is the only "extra" line. Always respect the explicit label.

Example (Turkish):

Fiyat Özeti:
Ücret: 1.386,67 TRY
Vergiler ve ücretler: 2.494,87 TRY
Koltuk Seçimi: 245,28 TRY
Toplam: 4.126,82 TRY

Correct JSON:
{
  "fare": 1386.67,
  "taxes_and_fees": 2494.87,
  "seat_selection": 245.28,
  "total": 4126.82,
  "currency": "TRY",
  "date": null
}

TAXES & FEES EXTRACTION (multiple patterns):

1. Trip.com style: Look for lines containing "Vergiler ve ücretler", "Taxes & fees", "taxes and fees" and extract the amount from the same line or next 1-3 lines.

2. BudgetAir/Travix style: Look for patterns like:
   - "Adult ticket(s) (incl. taxes $154.80) US$ 259.00"
   - "(incl. taxes $XXX)"
   - "(incl. taxes XXX USD/TL/EUR)"
   - "(incl. taxes XXX)"
   
   In these patterns:
   - Extract the amount inside the parentheses as taxes_and_fees (e.g., 154.80 from "(incl. taxes $154.80)")
   - Extract the amount after the parentheses as total (e.g., 259.00 from "US$ 259.00")
   - If both forms appear, prefer the more explicit numeric amount next to "taxes" or inside the parentheses.

FARE EXTRACTION:

1. Trip.com style: Look for lines labelled "Ücret" or "Fare" and extract the corresponding amount.

2. BudgetAir style: If there is no separate base fare line (only "Adult ticket(s) (incl. taxes $XXX) US$ YYY"), you may leave fare as null. The base fare can be computed as total - taxes_and_fees if needed.

OUTPUT FORMAT (STRICT JSON):

Always output JSON only, no text, no explanations, no comments. Format:

{
  "fare": number or null,
  "taxes_and_fees": number or null,
  "seat_selection": number or null,
  "total": number or null,
  "currency": string or null,
  "date": string or null
}

CONTROL RULES:

Deterministic output.

Do not use VAT extraction logic.

Do not add extra fields.

Do not output natural language.

Do not output code fences or markdown.

Do not summarize or explain anything.`;

  const userPrompt = `Extract travel price summary from this OCR text:

${ocrText}`;

  // Define modelName outside try block so it's accessible in catch block
  const modelName = process.env.AI_MODEL_NAME || "gpt-4.1-mini";

  try {
    let completion;
    try {
      completion = await aiService.chat.completions.create({
        model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
        temperature: 0, // Deterministic output
        max_tokens: 500,
        response_format: { type: "json_object" }, // Force JSON output
      });
    } catch (formatError: unknown) {
      // If response_format fails, retry without it
      console.warn("[travel-llm-extractor] response_format failed, retrying without it");
      completion = await aiService.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0,
        max_tokens: 500,
      });
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      console.error("[travel-llm-extractor] LLM returned empty response");
      return null;
    }

    // Parse JSON response
    let parsed: TravelLLMExtraction;
    try {
      // Remove any markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("[travel-llm-extractor] Failed to parse LLM response as JSON:", content);
      return null;
    }

    // Validate structure
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("fare" in parsed) ||
      !("taxes_and_fees" in parsed) ||
      !("seat_selection" in parsed) ||
      !("total" in parsed) ||
      !("currency" in parsed) ||
      !("date" in parsed)
    ) {
      console.error("[travel-llm-extractor] LLM response missing required fields:", parsed);
      return null;
    }

    // Validate types
    const validated: TravelLLMExtraction = {
      fare: typeof parsed.fare === "number" ? parsed.fare : null,
      taxes_and_fees: typeof parsed.taxes_and_fees === "number" ? parsed.taxes_and_fees : null,
      seat_selection: typeof parsed.seat_selection === "number" ? parsed.seat_selection : null,
      total: typeof parsed.total === "number" ? parsed.total : null,
      currency: typeof parsed.currency === "string" ? parsed.currency : null,
      date: typeof parsed.date === "string" ? parsed.date : null,
    };

    console.log("[travel-llm-extractor] LLM extraction successful:", validated);
    return validated;
  } catch (error: any) {
    console.error("[travel-llm-extractor] LLM extraction error:", error);
    
    // Try fallback to gpt-3.5-turbo if model not found
    if (error?.code === "model_not_found" && modelName !== "gpt-3.5-turbo") {
      console.warn("[travel-llm-extractor] Model not found, trying gpt-3.5-turbo as fallback");
      try {
        const fallbackCompletion = await aiService.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          temperature: 0,
          max_tokens: 500,
          response_format: { type: "json_object" },
        });

        const fallbackContent = fallbackCompletion.choices[0]?.message?.content;
        if (fallbackContent) {
          const cleaned = fallbackContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleaned);
          
          const validated: TravelLLMExtraction = {
            fare: typeof parsed.fare === "number" ? parsed.fare : null,
            taxes_and_fees: typeof parsed.taxes_and_fees === "number" ? parsed.taxes_and_fees : null,
            seat_selection: typeof parsed.seat_selection === "number" ? parsed.seat_selection : null,
            total: typeof parsed.total === "number" ? parsed.total : null,
            currency: typeof parsed.currency === "string" ? parsed.currency : null,
            date: typeof parsed.date === "string" ? parsed.date : null,
          };
          
          console.log("[travel-llm-extractor] LLM extraction successful (fallback):", validated);
          return validated;
        }
      } catch (fallbackError) {
        console.error("[travel-llm-extractor] Fallback also failed:", fallbackError);
      }
    }
    
    return null;
  }
}

