import { NextRequest, NextResponse } from "next/server";

import { getOrCreateGuestSession } from "@/lib/server/guest";
import { assertGuestEnabled } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";
import { getSession } from "@/lib/server/repository";
import { dispatchSessionStop } from "@/lib/server/worker-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const session = await getOrCreateGuestSession();
  const denied = await assertGuestEnabled(session.id)
    .then(() => null)
    .catch((error) =>
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "This user has been disabled by the admin.",
        },
        { status: 403 },
      ),
    );
  if (denied) return denied;

  const { sessionId } = await params;
  const record = await getSession(sessionId);
  if (!record || record.wallet !== session.id) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ item: record });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    assertSameOriginMutation(request);
    const session = await getOrCreateGuestSession();
    const denied = await assertGuestEnabled(session.id)
      .then(() => null)
      .catch((error) =>
        NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "This user has been disabled by the admin.",
          },
          { status: 403 },
        ),
      );
    if (denied) return denied;

    const { sessionId } = await params;
    const record = await getSession(sessionId);
    if (!record || record.wallet !== session.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const stopped = await dispatchSessionStop(sessionId);
    return NextResponse.json({ item: stopped });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to stop session",
      },
      {
        status:
          error instanceof Error && error.message.includes("Cross-") ? 403 : 400,
      },
    );
  }
}
