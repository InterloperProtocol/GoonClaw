import { NextRequest, NextResponse } from "next/server";

import { loadChartSnapshot } from "@/lib/server/chart";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ contractAddress: string }> },
) {
  const { contractAddress } = await params;
  if (!contractAddress) {
    return NextResponse.json({ error: "contractAddress is required" }, { status: 400 });
  }

  try {
    const snapshot = await loadChartSnapshot(contractAddress);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chart lookup failed" },
      { status: 400 },
    );
  }
}
