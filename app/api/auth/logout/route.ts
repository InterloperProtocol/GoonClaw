import { NextResponse } from "next/server";

import { clearWalletSession } from "@/lib/server/auth";

export async function POST() {
  await clearWalletSession();
  return NextResponse.json({ ok: true });
}
