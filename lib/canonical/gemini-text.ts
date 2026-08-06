/**
 * Shared Gemini plain-text generation helper for canonicalization LLM calls.
 *
 * All canonicalization reasoning (product normalize, product RAC, merchant
 * RAC) goes through Gemini: the OpenAI account ran out of quota in production,
 * which silently disabled every OpenAI-backed decision layer. Output is always
 * labeled plain text (T1), never JSON.
 *
 * Server-only.
 */

if (typeof window !== "undefined") {
  throw new Error("lib/canonical/gemini-text is server-only.");
}

export function getGeminiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "";
}

/** Call Gemini for plain-text generation. Returns text, or null when no key; throws on HTTP error. */
export async function callGeminiText(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string | null> {
  const apiKey = getGeminiKey();
  if (!apiKey) {
    console.warn("[gemini-text] GEMINI_API_KEY not set");
    return null;
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(data.error?.message ?? `Gemini HTTP ${res.status}`);
  }
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? null
  );
}
