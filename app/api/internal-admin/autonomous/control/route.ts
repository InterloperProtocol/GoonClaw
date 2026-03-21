import { NextResponse } from "next/server";

import { performAutonomousControl } from "@/lib/server/autonomous-agent";
import { requireInternalAdminSession } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";
import { AutonomousControlAction } from "@/lib/types";

const ALLOWED_ACTIONS = new Set<AutonomousControlAction>([
  "wake",
  "pause",
  "resume",
  "force_settle",
  "force_liquidate",
  "approve_self_mod",
  "reject_self_mod",
  "trigger_replication",
  "halt_replication",
]);

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    await requireInternalAdminSession();

    const body = (await request.json()) as {
      action?: AutonomousControlAction;
      note?: string;
    };

    if (!body.action || !ALLOWED_ACTIONS.has(body.action)) {
      return NextResponse.json(
        { error: "A valid autonomous control action is required." },
        { status: 400 },
      );
    }

    const result = performAutonomousControl(body.action, body.note?.trim());
    return NextResponse.json({
      ok: true,
      runtimePhase: result.runtimePhase,
      latestPolicyDecision: result.latestPolicyDecision,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Couldn't run autonomous runtime control.";
    const status = message === "Admin authentication required" ? 401 : 500;

    return NextResponse.json(
      {
        error: message,
      },
      { status },
    );
  }
}
