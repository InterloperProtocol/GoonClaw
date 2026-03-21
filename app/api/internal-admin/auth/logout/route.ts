import { NextResponse } from "next/server";

import { clearInternalAdminSession } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    await clearInternalAdminSession();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to lock dashboard",
      },
      {
        status:
          error instanceof Error && error.message.includes("Cross-") ? 403 : 400,
      },
    );
  }
}
