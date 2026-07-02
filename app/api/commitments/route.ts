import { NextResponse } from "next/server";
import { getSessionUsername } from "@/lib/auth/session";
import {
  deleteCommitment,
  listCommitments,
  setCommitmentStatus,
  upsertCommitment,
  type CommitmentUpsertInput,
} from "@/lib/commitments/server";
import type { CommitmentKind, CommitmentStatus } from "@/lib/offline/types";

const VALID_KINDS: CommitmentKind[] = [
  "price_watch",
  "time_rule",
  "category_cap",
  "merchant_diet",
  "restock_reminder",
  "streak_goal",
  "ritual_swap",
];

const VALID_STATUSES: CommitmentStatus[] = ["active", "paused", "completed", "dismissed"];

function isKind(value: unknown): value is CommitmentKind {
  return typeof value === "string" && (VALID_KINDS as string[]).includes(value);
}

function isStatus(value: unknown): value is CommitmentStatus {
  return typeof value === "string" && (VALID_STATUSES as string[]).includes(value);
}

export async function GET() {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const commitments = await listCommitments(username);
    return NextResponse.json({ commitments });
  } catch (error) {
    console.error("[api/commitments] GET failed:", error);
    return NextResponse.json({ error: "Failed to load commitments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Partial<CommitmentUpsertInput>;
    if (!isKind(body.kind) || !body.title) {
      return NextResponse.json(
        { error: "kind and title are required; kind must be one of the supported values" },
        { status: 400 }
      );
    }
    const commitment = await upsertCommitment(username, {
      id: body.id,
      kind: body.kind,
      status: isStatus(body.status) ? body.status : "active",
      sourceEventId: body.sourceEventId ?? null,
      title: String(body.title),
      description: body.description ?? null,
      params: body.params ?? {},
      progress: typeof body.progress === "number" ? body.progress : 0,
      target: typeof body.target === "number" ? body.target : null,
      currency: body.currency ?? null,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      lastEvaluatedAt: body.lastEvaluatedAt ?? null,
    });
    if (!commitment) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }
    return NextResponse.json({ commitment });
  } catch (error) {
    console.error("[api/commitments] POST failed:", error);
    return NextResponse.json({ error: "Failed to save commitment" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as { id?: string; status?: string };
    if (!body.id || !isStatus(body.status)) {
      return NextResponse.json(
        { error: "id and a valid status are required" },
        { status: 400 }
      );
    }
    const commitment = await setCommitmentStatus(username, body.id, body.status);
    if (!commitment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ commitment });
  } catch (error) {
    console.error("[api/commitments] PATCH failed:", error);
    return NextResponse.json({ error: "Failed to update commitment" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const username = await getSessionUsername();
  if (!username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const deleted = await deleteCommitment(username, id);
    if (!deleted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/commitments] DELETE failed:", error);
    return NextResponse.json({ error: "Failed to delete commitment" }, { status: 500 });
  }
}
