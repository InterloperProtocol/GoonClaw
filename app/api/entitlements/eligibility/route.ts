import { NextResponse } from "next/server";

import { PublicKey } from "@solana/web3.js";

import { claimEligibilitySubscriptionCnft } from "@/lib/server/entitlements";
import { getEntitlement } from "@/lib/server/repository";

function normalizeWallet(value: string) {
  return new PublicKey(value.trim()).toBase58();
}

function getStatusCode(message: string) {
  if (message.includes("not eligible")) return 403;
  if (message.includes("configured")) return 503;
  if (message.includes("Helius request failed")) return 502;
  return 400;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { wallet?: string };
  if (!body.wallet?.trim()) {
    return NextResponse.json({ error: "wallet is required" }, { status: 400 });
  }

  let wallet: string;
  try {
    wallet = normalizeWallet(body.wallet);
  } catch {
    return NextResponse.json(
      { error: "wallet must be a valid Solana address" },
      { status: 400 },
    );
  }

  const existing = await getEntitlement(wallet);
  if (existing?.status === "active" || existing?.type === "cnft") {
    return NextResponse.json({
      ok: true,
      reused: true,
      entitlement: existing,
    });
  }

  try {
    const entitlement = await claimEligibilitySubscriptionCnft(wallet);
    return NextResponse.json({ ok: true, reused: false, entitlement });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to mint the subscription cNFT";
    return NextResponse.json(
      { error: message },
      { status: getStatusCode(message) },
    );
  }
}
