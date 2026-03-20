import { NextResponse } from "next/server";

import { requireWalletSession } from "@/lib/server/auth";
import { claimCnftEntitlement } from "@/lib/server/entitlements";
import { getOrder } from "@/lib/server/repository";

export async function POST(request: Request) {
  const session = await requireWalletSession().catch(() => null);
  if (!session) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = (await request.json()) as { signature?: string };
  if (!body.signature) {
    return NextResponse.json({ error: "Signature is required" }, { status: 400 });
  }

  const existing = await getOrder(body.signature);
  if (existing && existing.wallet !== session.wallet) {
    return NextResponse.json(
      { error: "This payment signature is already claimed by another wallet" },
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
        error: "This payment is already being processed",
      },
      { status: 202 },
    );
  }

  if (existing?.status === "failed") {
    return NextResponse.json(
      {
        error:
          existing.error ||
          "This payment was already processed and needs a quick review",
      },
      { status: 409 },
    );
  }

  try {
    const entitlement = await claimCnftEntitlement(session.wallet, body.signature);
    return NextResponse.json({ ok: true, entitlement });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't send the access pass" },
      { status: 400 },
    );
  }
}
