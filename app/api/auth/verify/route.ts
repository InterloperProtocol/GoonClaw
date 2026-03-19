import { NextResponse } from "next/server";

import {
  consumeAuthChallenge,
  createWalletSession,
  verifyWalletSignature,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    wallet?: string;
    signature?: string;
    message?: string;
  };

  if (!body.wallet || !body.signature || !body.message) {
    return NextResponse.json(
      { error: "wallet, message, and signature are required" },
      { status: 400 },
    );
  }

  const challenge = await consumeAuthChallenge(body.wallet).catch((error: Error) => {
    throw new Error(error.message);
  });

  if (challenge.message !== body.message) {
    return NextResponse.json({ error: "Signed message mismatch" }, { status: 400 });
  }

  const valid = verifyWalletSignature(body.wallet, body.message, body.signature);
  if (!valid) {
    return NextResponse.json({ error: "Invalid wallet signature" }, { status: 401 });
  }

  const session = await createWalletSession(body.wallet);
  return NextResponse.json({
    ok: true,
    wallet: session.wallet,
    expiresAt: session.expiresAt,
  });
}
