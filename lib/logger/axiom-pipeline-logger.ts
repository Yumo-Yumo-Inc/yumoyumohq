/**
 * Axiom Pipeline Logger
 *
 * Sends the full pipeline log buffer directly to Axiom via HTTP (SDK),
 * bypassing Vercel's stdout truncation limit (~256 lines).
 * Falls back silently if AXIOM_TOKEN is not set (local dev).
 */
import { Axiom } from "@axiomhq/js";

let _client: Axiom | null = null;

function getClient(): Axiom | null {
  if (!process.env.AXIOM_TOKEN) return null;
  if (!_client) {
    _client = new Axiom({ token: process.env.AXIOM_TOKEN });
  }
  return _client;
}

export interface PipelineLogMeta {
  requestId: string;
  receiptId?: string;
  username?: string;
  durationMs?: number;
  status?: "completed" | "error";
  errorMessage?: string;
}

/**
 * Flushes the full log buffer to Axiom as a single structured event.
 * Non-blocking: never throws, pipeline is not affected on failure.
 */
export async function flushPipelineLog(
  meta: PipelineLogMeta,
  logBuffer: string[]
): Promise<void> {
  const client = getClient();
  if (!client || logBuffer.length === 0) return;

  const dataset = process.env.AXIOM_DATASET ?? "pipeline-logs";

  try {
    client.ingest(dataset, [
      {
        _time: new Date().toISOString(),
        ...meta,
        logLineCount: logBuffer.length,
        fullLog: logBuffer.join("\n"),
      },
    ]);
    await client.flush();
  } catch {
    // Non-blocking — do not break the pipeline
  }
}
