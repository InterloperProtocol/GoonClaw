import { NextResponse } from "next/server";

import { requireInternalAdminSession } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";
import {
  getTianshiRuntimeControl,
  setTianshiRuntimeControl,
} from "@/lib/server/tianshi-runtime-control";

export async function GET() {
  try {
    await requireInternalAdminSession();
    return NextResponse.json(getTianshiRuntimeControl());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load Tianshi runtime state.";
    const status = message === "Admin authentication required" ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    const admin = await requireInternalAdminSession();
    const payload = (await request.json()) as {
      action?: "disable" | "enable";
      note?: string;
    };

    if (!payload.action || !["disable", "enable"].includes(payload.action)) {
      return NextResponse.json({ error: "A valid runtime action is required." }, { status: 400 });
    }

    const simulationEnabled = payload.action === "enable";
    const next = setTianshiRuntimeControl({
      lastChangedBy: admin.username,
      note:
        payload.note?.trim() ||
        (simulationEnabled
          ? "Enabled from the hidden admin panel."
          : "Paused from the hidden admin panel."),
      simulationEnabled,
    });

    return NextResponse.json(next);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't update Tianshi runtime state.";
    const status =
      message === "Admin authentication required"
        ? 401
        : message.includes("Cross-")
          ? 403
          : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
