export const USER_REWARD_SPLITS = {
  firstProfileLoad: 0.05,
  genDelveGovernance: 0.08,
  goodData: 0.1,
  nezhaTrading: 0.08,
  proofOfLoss: 0.06,
  tianziPrediction: 0.12,
} as const;

export function getUserRewardSplitTotal() {
  return Object.values(USER_REWARD_SPLITS).reduce((sum, value) => sum + value, 0);
}
