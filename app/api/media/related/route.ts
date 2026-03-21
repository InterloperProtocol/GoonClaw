import { NextRequest, NextResponse } from "next/server";

import { loadRelatedYouTubeUrls } from "@/lib/server/media";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim() ?? "";

  if (!url) {
    return NextResponse.json({ error: "Missing media URL" }, { status: 400 });
  }

  const items = await loadRelatedYouTubeUrls(url);
  return NextResponse.json({ items });
}
