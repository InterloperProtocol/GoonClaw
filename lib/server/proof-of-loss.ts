export type ProofOfLossCandidate = {
  leverage: number;
  liquidated: boolean;
  realizedPnl: number;
};

export function qualifiesForProofOfLoss(candidate: ProofOfLossCandidate) {
  if (candidate.liquidated) {
    return false;
  }

  if (candidate.realizedPnl >= 0) {
    return false;
  }

  return candidate.leverage <= 5;
}
