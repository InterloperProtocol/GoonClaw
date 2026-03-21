import { NextResponse } from "next/server";

import { getOrCreateGuestSession } from "@/lib/server/guest";
import { assertGuestEnabled } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";
import {
  getLivestreamState,
  verifyLivestreamRequestPayment,
} from "@/lib/server/livestream";

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    const guestSession = await getOrCreateGuestSession();
    await assertGuestEnabled(guestSession.id);
    const body = (await request.json()) as {
      requestId?: string;
      signature?: string;
    };

    if (!body.requestId || !body.signature) {
      return NextResponse.json(
        { error: "requestId and signature are required" },
        { status: 400 },
      );
    }

    const item = await verifyLivestreamRequestPayment(
      guestSession.id,
      body.requestId,
      body.signature,
    );
    const state = await getLivestreamState(guestSession.id);
    return NextResponse.json({ item, state });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to verify queue payment",
      },
      {
        status:
          error instanceof Error && error.message.includes("Cross-") ? 403 : 400,
      },
    );
  }
}
