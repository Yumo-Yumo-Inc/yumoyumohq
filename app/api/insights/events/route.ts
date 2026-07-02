import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  bulkUpsertInsightEvents,
  listInsightEvents,
  setInsightEventState,
  upsertInsightEvent,
  type InsightEventUpsertInput,
} from "@/lib/insights/events/server";
import type { InsightEventKind, InsightEventState } from "@/lib/offline/types";

const VALID_KINDS: InsightEventKind[] = [
  "own_price_track",
  "impulse_fingerprint",
  "category_drift",
  "past_self",
];

const VALID_STATES: InsightEventState[] = [
  "detected",
  "viewed",
  "committed",
  "dismissed",
  "snoozed",
];

function isKind(value: unknown): value is InsightEventKind {
  return typeof value === "string" && (VALID_KINDS as string[]).includes(value);
}

function isState(value: unknown): value is InsightEventState {
  return typeof value === "string" && (VALID_STATES as string[]).includes(value);
}

export async function GET(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;
    const events = await listInsightEvents(username, {
      since: since || null,
      limit: Number.isFinite(limit) ? limit : undefined,
    });
    return NextResponse.json({ events });
  } catch (error) {
    console.error("[api/insights/events] GET failed:", error);
    return NextResponse.json({ error: "Failed to load insight events" }, { status: 500 });
  }
}

/**
 * POST — upsert one or many insight events.
 *
 * Accepts either a single `event` object or an `events` array (used by the
 * orchestrator when running the full behavior-engine pass server-side).
 */
export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      event?: Partial<InsightEventUpsertInput>;
      events?: Partial<InsightEventUpsertInput>[];
    };

    if (Array.isArray(body.events)) {
      const valid: InsightEventUpsertInput[] = [];
      for (const candidate of body.events) {
        if (!isKind(candidate?.kind) || !candidate?.title) continue;
        valid.push({
          id: candidate.id,
          kind: candidate.kind,
          state: isState(candidate.state) ? candidate.state : "detected",
          title: String(candidate.title),
          summary: candidate.summary ?? null,
          confidence: typeof candidate.confidence === "number" ? candidate.confidence : 0.5,
          monetaryImpact:
            typeof candidate.monetaryImpact === "number" ? candidate.monetaryImpact : null,
          currency: candidate.currency ?? null,
          payload: candidate.payload ?? {},
          detectedAt: candidate.detectedAt ?? null,
        });
      }
      const saved = await bulkUpsertInsightEvents(username, valid);
      return NextResponse.json({ events: saved });
    }

    const single = body.event;
    if (!single || !isKind(single.kind) || !single.title) {
      return NextResponse.json(
        { error: "event.kind and event.title are required" },
        { status: 400 }
      );
    }
    const event = await upsertInsightEvent(username, {
      id: single.id,
      kind: single.kind,
      state: isState(single.state) ? single.state : "detected",
      title: String(single.title),
      summary: single.summary ?? null,
      confidence: typeof single.confidence === "number" ? single.confidence : 0.5,
      monetaryImpact: typeof single.monetaryImpact === "number" ? single.monetaryImpact : null,
      currency: single.currency ?? null,
      payload: single.payload ?? {},
      detectedAt: single.detectedAt ?? null,
    });
    if (!event) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    return NextResponse.json({ event });
  } catch (error) {
    console.error("[api/insights/events] POST failed:", error);
    return NextResponse.json({ error: "Failed to save insight event" }, { status: 500 });
  }
}

/**
 * PATCH — transition an event's state (viewed / committed / dismissed / snoozed).
 *
 * When transitioning to `committed`, the caller may also include
 * `spawnedCommitmentId` so the loop is closed.
 */
export async function PATCH(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      id?: string;
      state?: string;
      spawnedCommitmentId?: string | null;
    };
    if (!body.id || !isState(body.state)) {
      return NextResponse.json(
        { error: "id and a valid state are required" },
        { status: 400 }
      );
    }
    const event = await setInsightEventState(username, body.id, body.state, {
      spawnedCommitmentId: body.spawnedCommitmentId ?? null,
    });
    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (error) {
    console.error("[api/insights/events] PATCH failed:", error);
    return NextResponse.json({ error: "Failed to update insight event" }, { status: 500 });
  }
}
