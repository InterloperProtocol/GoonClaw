import type { LoadedIdentity } from "@/lib/simulation/types";

export function formatWalletHermesHeading(loadedIdentity: LoadedIdentity | null) {
  if (!loadedIdentity) {
    return "Enter a wallet and I'll load your character.";
  }

  return `Hermes is riding with ${loadedIdentity.profile.displayName}.`;
}

export function buildWalletHermesIntro(loadedIdentity: LoadedIdentity | null) {
  if (!loadedIdentity) {
    return "Enter a wallet address and I'll load your character. Once your BitClaw profile is live, I can guide you into BolClaw, Tianzi, Nezha, Tianshi, and GenDelve.";
  }

  const rewardLine = loadedIdentity.rewardUnlock.claimsUnlocked
    ? `Rewards are unlocked and rank is #${loadedIdentity.rewardLedger.rank}.`
    : "Rewards are still locked behind a real GenDelve verification action.";

  return `${loadedIdentity.profile.displayName} is loaded as ${loadedIdentity.profile.simulationHandle}. ${rewardLine} I can point you toward live predictions, long or short setups, posting opportunities, and training quests.`;
}

export function formatOpportunityRewardHint(label: string, rewardHint?: string) {
  return rewardHint ? `${label} · ${rewardHint}` : label;
}
