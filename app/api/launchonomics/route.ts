import { NextRequest, NextResponse } from "next/server";

import { getLaunchonomicsEvaluation } from "@/lib/server/launchonomics";

function getStatusCode(message: string) {
  if (message.includes("configured")) return 503;
  if (message.includes("Helius request failed")) return 502;
  return 400;
}

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet")?.trim();
  if (!wallet) {
    return NextResponse.json(
      { error: "wallet is required" },
      { status: 400 },
    );
  }

  try {
    const item = await getLaunchonomicsEvaluation(wallet);
    return NextResponse.json({ item });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to evaluate LaunchONomics status";
    return NextResponse.json(
      { error: message },
      { status: getStatusCode(message) },
    );
  }
}
