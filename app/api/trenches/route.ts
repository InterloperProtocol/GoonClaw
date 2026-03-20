import { NextResponse } from "next/server";

import { getTrenchesPulse } from "@/lib/server/trenches";

export async function GET() {
  try {
    const pulse = await getTrenchesPulse();
    return NextResponse.json(pulse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The trench monitor is unavailable right now.",
      },
      { status: 500 },
    );
  }
}
