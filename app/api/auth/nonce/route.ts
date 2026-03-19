import { NextRequest, NextResponse } from "next/server";

import { createAuthChallenge } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { wallet?: string };
  if (!body.wallet) {
    return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  }

  const challenge = await createAuthChallenge(body.wallet, request.nextUrl.origin);
  return NextResponse.json({
    wallet: challenge.wallet,
    message: challenge.message,
    expiresAt: challenge.expiresAt,
  });
}
