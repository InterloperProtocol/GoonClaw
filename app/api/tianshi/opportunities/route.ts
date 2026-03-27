import { NextResponse } from "next/server";

import { buildTianezhaChatPayload } from "@/lib/server/tianezha-simulation";

export async function GET() {
  try {
    const payload = await buildTianezhaChatPayload();
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load Tianezha opportunities.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
