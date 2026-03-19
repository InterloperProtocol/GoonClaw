import { NextResponse } from "next/server";

import { getWalletSession } from "@/lib/server/auth";
import { revalidateCnftAccess } from "@/lib/server/entitlements";
import { getEntitlement } from "@/lib/server/repository";

export async function GET() {
  const session = await getWalletSession();
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      hasAccess: false,
    });
  }

  const current = await getEntitlement(session.wallet);
  const entitlement = await revalidateCnftAccess(session.wallet, current);

  return NextResponse.json({
    authenticated: true,
    wallet: session.wallet,
    hasAccess: entitlement?.status === "active",
    entitlement,
  });
}
