import { NextResponse } from "next/server";

import { getOrCreateGuestSession } from "@/lib/server/guest";
import { listSessions } from "@/lib/server/repository";
import { dispatchSessionStart, dispatchSessionStop } from "@/lib/server/worker-client";
import { SessionStartInput } from "@/lib/types";

export async function GET() {
  const session = await getOrCreateGuestSession();

  const items = await listSessions(session.id);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await getOrCreateGuestSession();

  const body = (await request.json()) as Omit<SessionStartInput, "wallet">;
  if (!body.contractAddress || !body.deviceId || !body.mode) {
    return NextResponse.json(
      { error: "contractAddress, deviceId, and mode are required" },
      { status: 400 },
    );
  }

  const existing = await listSessions(session.id);
  await Promise.all(
    existing
      .filter((item) => item.status === "active" || item.status === "starting")
      .map((item) => dispatchSessionStop(item.id)),
  );

  const next = await dispatchSessionStart({
    wallet: session.id,
    contractAddress: body.contractAddress,
    deviceId: body.deviceId,
    mode: body.mode,
  });

  return NextResponse.json({ item: next });
}
