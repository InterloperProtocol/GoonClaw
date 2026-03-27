import { NextResponse } from "next/server";

import { requireInternalAdminSession } from "@/lib/server/internal-admin";
import { getSimChainSummary } from "@/lib/server/sim-chain";
import { getTianshiRuntimeControl } from "@/lib/server/tianshi-runtime-control";
import { getHermesClientStatus } from "@/lib/tianshi/hermesClient";

export async function GET() {
  try {
    await requireInternalAdminSession();

    return NextResponse.json({
      hermes: getHermesClientStatus(),
      publisher: {
        privateOperatorRoute: "/api/bots/private-telegram",
        privateWechatOperatorRoute: "/api/bots/private-wechat",
        publicBotRoute: "/api/bots/public-telegram",
        publicWechatBotRoute: "/api/bots/public-wechat",
        publicSummaryRoute: "/api/tianshi/public-summary",
      },
      runtime: getTianshiRuntimeControl(),
      simChain: getSimChainSummary(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load Tianshi publisher state.";
    const status = message === "Admin authentication required" ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
