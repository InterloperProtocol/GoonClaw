import { NextResponse } from "next/server";

import { getGoonBookFeed, listGoonBookProfiles } from "@/lib/server/goonbook";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get("limit") || "40");
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(requestedLimit, 100))
      : 40;

    return NextResponse.json({
      items: await getGoonBookFeed(limit),
      profiles: listGoonBookProfiles(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Couldn't load GoonBook.",
      },
      { status: 500 },
    );
  }
}
