import { NextRequest, NextResponse } from "next/server";

import { resolveMediaSource } from "@/lib/server/media";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url")?.trim() ?? "";
  const parentHost =
    request.nextUrl.searchParams.get("parentHost")?.trim() || "localhost";

  if (!url) {
    return NextResponse.json({ error: "Missing media URL" }, { status: 400 });
  }

  try {
    const media = await resolveMediaSource(url, parentHost);

    if (!media) {
      return NextResponse.json(
        { error: "Could not resolve a playable or embeddable media source" },
        { status: 404 },
      );
    }

    return NextResponse.json(media);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to resolve media source",
      },
      { status: 400 },
    );
  }
}
