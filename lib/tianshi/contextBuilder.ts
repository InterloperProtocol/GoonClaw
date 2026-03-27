import type { IdentityProfile, LoadedIdentity } from "@/lib/simulation/types";

export type WalletHermesContext = {
  bitClawProfileId: string;
  chain: IdentityProfile["chain"];
  displayName: string;
  profileId: string;
  publicLabel: string;
  rank: number;
  rewardTotal: number;
  simulationHandle: string;
  walletAddress: string;
};

export function buildWalletHermesContext(
  profile: IdentityProfile,
  loadedIdentity?: LoadedIdentity | null,
): WalletHermesContext {
  return {
    bitClawProfileId: profile.bitClawProfileId,
    chain: profile.chain,
    displayName: profile.displayName,
    profileId: profile.id,
    publicLabel: profile.publicLabel,
    rank: loadedIdentity?.rewardLedger.rank ?? profile.rank,
    rewardTotal: loadedIdentity?.rewardLedger.totalRewards ?? 0,
    simulationHandle: profile.simulationHandle,
    walletAddress: profile.walletAddress,
  };
}
