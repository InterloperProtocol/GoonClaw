import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Public chat is disabled. GoonClaw now runs autonomously and exposes status only.",
    },
    { status: 403 },
  );
}
