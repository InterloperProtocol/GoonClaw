import { nowIso, sha256Hex } from "@/lib/utils";
import { FIRESTORE_SIM_COLLECTIONS } from "@/lib/simulation/constants";
import type { IdentityProfile, LoadedIdentity, WalletHermesAgent } from "@/lib/simulation/types";
import { simGet, simUpsert } from "@/lib/server/tianezha-sim-store";
import { buildWalletHermesContext } from "@/lib/tianshi/contextBuilder";
import { requestHermesWalletSummary } from "@/lib/tianshi/hermesClient";

export function buildWalletHermesAgentId(profileId: string) {
  return `wallet-hermes:${profileId}`;
}

export async function ensureWalletHermesAgent(
  profile: IdentityProfile,
  loadedIdentity?: LoadedIdentity | null,
) {
  const id = buildWalletHermesAgentId(profile.id);
  const existing = await simGet<WalletHermesAgent>(
    FIRESTORE_SIM_COLLECTIONS.walletHermesAgents,
    id,
  );
  const context = buildWalletHermesContext(profile, loadedIdentity);
  const hermesSummary = await requestHermesWalletSummary(context);
  const timestamp = nowIso();

  return simUpsert(FIRESTORE_SIM_COLLECTIONS.walletHermesAgents, {
    companionLabel: existing?.companionLabel || `Hermes for ${profile.displayName}`,
    createdAt: existing?.createdAt || timestamp,
    guidance: hermesSummary.guidance,
    id,
    lastContextDigest: sha256Hex(JSON.stringify(context)),
    profileId: profile.id,
    serviceStatus: hermesSummary.status,
    summary: hermesSummary.summary,
    updatedAt: timestamp,
    walletAddress: profile.walletAddress,
  } satisfies WalletHermesAgent);
}

export async function getWalletHermesAgent(profileId: string) {
  return simGet<WalletHermesAgent>(
    FIRESTORE_SIM_COLLECTIONS.walletHermesAgents,
    buildWalletHermesAgentId(profileId),
  );
}
