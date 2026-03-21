import { NextResponse } from "next/server";

import {
  requireInternalAdminSession,
  stopSessionFromAdmin,
} from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    assertSameOriginMutation(request);
    await requireInternalAdminSession();
    const { sessionId } = await params;
    const item = await stopSessionFromAdmin(sessionId);
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Couldn't stop the stream.",
      },
      { status: 400 },
    );
  }
}
