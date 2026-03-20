import { NextRequest, NextResponse } from "next/server";

import { loadNewsFeed } from "@/lib/server/news";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category") ?? "solana";
  const query = request.nextUrl.searchParams.get("query") ?? "";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "6");
  const rssFeeds = request.nextUrl.searchParams.getAll("rss");

  try {
    const feed = await loadNewsFeed({ category, query, limit, rssFeeds });
    return NextResponse.json(feed);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load market news",
      },
      { status: 400 },
    );
  }
}
