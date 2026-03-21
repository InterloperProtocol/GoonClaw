import { NextResponse } from "next/server";

import { clearWalletSession } from "@/lib/server/auth";
import { assertSameOriginMutation } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    await clearWalletSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to clear wallet session",
      },
      {
        status:
          error instanceof Error && error.message.includes("Cross-") ? 403 : 400,
      },
    );
  }
}
