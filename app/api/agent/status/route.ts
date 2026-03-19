import { NextResponse } from "next/server";

import { getAgentOpsStatus } from "@/lib/server/agent-ops";

export async function GET() {
  return NextResponse.json(getAgentOpsStatus());
}
