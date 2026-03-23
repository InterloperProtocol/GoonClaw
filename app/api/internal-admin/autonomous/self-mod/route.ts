import { NextResponse } from "next/server";

import { queueAutonomousSelfModificationProposal } from "@/lib/server/autonomous-agent";
import { requireInternalAdminSession } from "@/lib/server/internal-admin";
import { assertSameOriginMutation } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    assertSameOriginMutation(request);
    await requireInternalAdminSession();

    const body = (await request.json()) as {
      summary?: string;
      title?: string;
      tuningPatch?: {
        preferredSessionTradeMint?: string | null;
        preferredSessionTradeSymbol?: string | null;
        preferredTreasuryTradeMint?: string | null;
        preferredTreasuryTradeSymbol?: string | null;
        replicationTemplateLabel?: string | null;
      };
    };

    if (!body.title || !body.summary || !body.tuningPatch) {
      return NextResponse.json(
        {
          error:
            "title, summary, and tuningPatch are required to queue a self-mod proposal.",
        },
        { status: 400 },
      );
    }

    const proposal = queueAutonomousSelfModificationProposal({
      summary: body.summary,
      title: body.title,
      tuningPatch: body.tuningPatch,
    });

    return NextResponse.json({
      ok: true,
      proposal,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Couldn't queue autonomous self-mod proposal.";
    const status = message === "Admin authentication required" ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
