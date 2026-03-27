import { NextResponse } from "next/server";

import {
  getHeartbeatState,
  getHybridFutarchyState,
  getTianziState,
} from "@/lib/server/tianezha-simulation";
import { getServerEnv } from "@/lib/env";
import { getSimChainSummary } from "@/lib/server/sim-chain";
import { getTianshiRuntimeControl } from "@/lib/server/tianshi-runtime-control";
import {
  buildTianshiBotSurfaceStatuses,
  TIANSHI_BRAIN_MEMORY,
} from "@/lib/tianshi/brainMemory";

export async function GET() {
  try {
    const env = getServerEnv();
    const [heartbeat, hybridFutarchy, tianzi] = await Promise.all([
      getHeartbeatState(),
      getHybridFutarchyState(),
      getTianziState(),
    ]);

    return NextResponse.json({
      heartbeat,
      hybridFutarchy,
      botSurfaces: buildTianshiBotSurfaceStatuses({
        telegramRelayConfigured: Boolean(
          env.TIANSHI_TELEGRAM_BOT_TOKEN && env.TIANSHI_TELEGRAM_CHAT_ID,
        ),
        wechatRelayConfigured: Boolean(env.TIANSHI_WECHAT_WEBHOOK_URL),
      }),
      brainMemory: TIANSHI_BRAIN_MEMORY,
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
