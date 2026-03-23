import { NextResponse } from "next/server";

import { queueAutonomousTradeDirective } from "@/lib/server/autonomous-agent";
import { requireInternalAdminSession } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    await requireInternalAdminSession();

    const body = (await request.json()) as {
      bucket?: "tradingUsdc" | "sessionTradeUsdc";
      isPumpCoin?: boolean;
      marketMint?: string;
      rationale?: string;
      requestedUsdc?: number;
      revenueClass?: "creator_fee" | "goonclaw_chartsync" | "third_party_chartsync_commission";
      symbol?: string;
    };

    if (!body.marketMint || !body.symbol || !body.rationale || !body.requestedUsdc) {
      return NextResponse.json(
        {
          error:
            "marketMint, symbol, rationale, and requestedUsdc are required to queue a trade directive.",
        },
        { status: 400 },
      );
    }

    const directive = queueAutonomousTradeDirective({
      bucket: body.bucket,
      isPumpCoin: body.isPumpCoin,
      marketMint: body.marketMint,
      rationale: body.rationale,
      requestedUsdc: body.requestedUsdc,
      revenueClass: body.revenueClass,
      symbol: body.symbol,
    });

    return NextResponse.json({
      directive,
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Couldn't queue autonomous trade directive.";
    const status = message === "Admin authentication required" ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
