import { NextResponse } from "next/server";

import { requireInternalAdminSession } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";
import { getSimChainSummary } from "@/lib/server/sim-chain";
import {
  getTianshiRuntimeControl,
  setTianshiRuntimeControl,
} from "@/lib/server/tianshi-runtime-control";

type PrivateBotCommand = "enable_tianshi" | "pause_tianshi" | "runtime_status";

export async function GET() {
  try {
    await requireInternalAdminSession();
    return NextResponse.json({
      actions: ["runtime_status", "enable_tianshi", "pause_tianshi"],
      runtime: getTianshiRuntimeControl(),
      simChain: getSimChainSummary(),
      transport: "private-wechat-adapter",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load the private WeChat bot summary.";
    const status = message === "Admin authentication required" ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    const admin = await requireInternalAdminSession();
    const payload = (await request.json()) as { command?: PrivateBotCommand; note?: string };

    if (!payload.command) {
      return NextResponse.json({ error: "A private bot command is required." }, { status: 400 });
    }

    if (payload.command === "runtime_status") {
      return NextResponse.json({
        ok: true,
        runtime: getTianshiRuntimeControl(),
        simChain: getSimChainSummary(),
      });
    }

    if (payload.command === "enable_tianshi" || payload.command === "pause_tianshi") {
      const runtime = setTianshiRuntimeControl({
        lastChangedBy: admin.username,
        note:
          payload.note?.trim() ||
          (payload.command === "enable_tianshi"
            ? "Enabled from the private WeChat operator bot."
            : "Paused from the private WeChat operator bot."),
        simulationEnabled: payload.command === "enable_tianshi",
      });

      return NextResponse.json({ ok: true, runtime });
    }

    return NextResponse.json({ error: "Unsupported private bot command." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't run the private WeChat bot command.";
    const status =
      message === "Admin authentication required"
        ? 401
        : message.includes("Cross-")
          ? 403
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
