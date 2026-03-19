import { NextResponse } from "next/server";

import { requireWalletSession } from "@/lib/server/auth";
import { claimBurnEntitlement } from "@/lib/server/entitlements";
import { getOrder } from "@/lib/server/repository";

export async function POST(request: Request) {
  const session = await requireWalletSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as { signature?: string };
  if (!body.signature) {
    return NextResponse.json({ error: "signature is required" }, { status: 400 });
  }

  const existing = await getOrder(body.signature);
  if (existing && existing.wallet !== session.wallet) {
    return NextResponse.json(
      { error: "This burn signature is already claimed by another wallet" },
      { status: 409 },
    );
  }

  if (existing?.status === "completed") {
    return NextResponse.json({
      ok: true,
      wallet: session.wallet,
      reused: true,
    });
  }

  if (existing?.status === "pending") {
    return NextResponse.json(
      {
        ok: false,
        processing: true,
        error: "This burn is already being processed",
      },
      { status: 202 },
    );
  }

  try {
    const entitlement = await claimBurnEntitlement(session.wallet, body.signature);
    return NextResponse.json({ ok: true, entitlement });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify burn" },
      { status: 400 },
    );
  }
}
