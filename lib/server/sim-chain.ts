export const SIM_CHAIN_TOTAL_SUPPLY = 2_100_000_000;
export const SIM_CHAIN_DEV_WALLET_ALLOCATION = 100_000_000;
export const SIM_CHAIN_EMISSION_POOL = SIM_CHAIN_TOTAL_SUPPLY - SIM_CHAIN_DEV_WALLET_ALLOCATION;
export const SIM_CHAIN_BLOCK_INTERVAL_MINUTES = 10;

export type SimChainSummary = {
  blockIntervalMinutes: number;
  devWalletAllocation: number;
  emissionPool: number;
  proofOfStakeShare: number;
  totalSupply: number;
  userRewardShare: number;
};

export function getSimChainSummary(): SimChainSummary {
  return {
    blockIntervalMinutes: SIM_CHAIN_BLOCK_INTERVAL_MINUTES,
    devWalletAllocation: SIM_CHAIN_DEV_WALLET_ALLOCATION,
    emissionPool: SIM_CHAIN_EMISSION_POOL,
    proofOfStakeShare: 0.51,
    totalSupply: SIM_CHAIN_TOTAL_SUPPLY,
    userRewardShare: 0.49,
  };
}
