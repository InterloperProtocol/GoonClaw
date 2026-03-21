import { NextResponse } from "next/server";

import {
  enableGuestAccount,
  requireInternalAdminSession,
} from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";
import { getPublicStreamProfile } from "@/lib/server/repository";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guestId: string }> },
) {
  try {
    assertSameOriginMutation(request);
    await requireInternalAdminSession();
    const { guestId } = await params;
    const profile = await getPublicStreamProfile(guestId);

    const item = await enableGuestAccount({
      guestId,
      slug: profile?.slug,
    });

    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Couldn't enable that user.",
      },
      { status: 400 },
    );
  }
}
