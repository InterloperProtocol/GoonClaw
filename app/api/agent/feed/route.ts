import { NextResponse } from "next/server";

import { getAutonomousFeed } from "@/lib/server/autonomous-agent";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") || "24");
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : 24;

    return NextResponse.json(getAutonomousFeed(limit));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Couldn't load autonomous agent feed.",
      },
      { status: 500 },
    );
  }
}
