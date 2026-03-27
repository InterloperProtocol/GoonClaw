import { NextResponse } from "next/server";

import { getLoadedIdentityByProfileId } from "@/lib/server/tianezha-simulation";
import { getWalletHermesAgent } from "@/lib/tianshi/walletAgentManager";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  try {
    const { profileId } = await params;
    const [loadedIdentity, walletAgent] = await Promise.all([
      getLoadedIdentityByProfileId(profileId).catch(() => null),
      getWalletHermesAgent(profileId),
    ]);

    if (!loadedIdentity && !walletAgent) {
      return NextResponse.json({ error: "Wallet-Hermes agent not found." }, { status: 404 });
    }

    return NextResponse.json({
      loadedIdentity,
      walletAgent,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load the wallet-Hermes agent.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
