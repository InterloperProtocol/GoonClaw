import { NextResponse } from "next/server";

import {
  getHeartbeatState,
  getHybridFutarchyState,
  getTianziState,
} from "@/lib/server/tianezha-simulation";
import { getSimChainSummary } from "@/lib/server/sim-chain";
import { getTianshiRuntimeControl } from "@/lib/server/tianshi-runtime-control";

export async function GET() {
  try {
    const [heartbeat, hybridFutarchy, tianzi] = await Promise.all([
      getHeartbeatState(),
      getHybridFutarchyState(),
      getTianziState(),
    ]);

    return NextResponse.json({
      heartbeat,
      hybridFutarchy,
      runtime: getTianshiRuntimeControl(),
      simChain: getSimChainSummary(),
      tianzi: {
        book: tianzi.book,
        question: tianzi.question,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load the public Tianshi summary.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
