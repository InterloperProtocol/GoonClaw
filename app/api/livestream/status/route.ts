import { NextResponse } from "next/server";

import { getOrCreateGuestSession } from "@/lib/server/guest";
import { getLivestreamState } from "@/lib/server/livestream";

export async function GET() {
  const guestSession = await getOrCreateGuestSession();
  const state = await getLivestreamState(guestSession.id);
  return NextResponse.json(state);
}
