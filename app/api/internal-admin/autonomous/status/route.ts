import { NextResponse } from "next/server";

import { getAutonomousStatus } from "@/lib/server/autonomous-agent";
import { getInternalAdminSession } from "@/lib/server/internal-admin";

export async function GET() {
  try {
    const currentAdmin = await getInternalAdminSession();
    if (!currentAdmin) {
      return NextResponse.json(
        { error: "Admin authentication required" },
        { status: 401 },
      );
    }

    return NextResponse.json(getAutonomousStatus());
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Couldn't load autonomous runtime status.",
      },
      { status: 500 },
    );
  }
}
