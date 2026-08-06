/**
 * Leveled debug gate for the receipt money path (analyze / upload / pricing /
 * post-process / hidden cost).
 *
 * debug() writes through console.log so request-console-capture still ships
 * the buffer to Axiom. Setting PIPELINE_LOG_LEVEL=quiet silences debug lines
 * (stdout AND the Axiom buffer) without touching call sites; warn/error always
 * pass through. Default keeps today's verbosity.
 */

function debugEnabled(): boolean {
  return process.env.PIPELINE_LOG_LEVEL !== "quiet";
}

export const pipelineLog = {
  debug(...args: unknown[]): void {
    if (debugEnabled()) console.log(...args);
  },
  warn(...args: unknown[]): void {
    console.warn(...args);
  },
  error(...args: unknown[]): void {
    console.error(...args);
  },
};
