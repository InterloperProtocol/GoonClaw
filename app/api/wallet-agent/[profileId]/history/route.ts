import { NextResponse } from "next/server";

import { getWalletHermesAgent } from "@/lib/tianshi/walletAgentManager";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const walletAgent = await getWalletHermesAgent(profileId);

    if (!walletAgent) {
      return NextResponse.json({ error: "Wallet-Hermes history not found." }, { status: 404 });
    }

    return NextResponse.json({
      history: [
        {
          guidance: walletAgent.guidance,
          recordedAt: walletAgent.updatedAt,
          summary: walletAgent.summary,
        },
      ],
      walletAgent,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load wallet-Hermes history.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
