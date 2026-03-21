import { getServerEnv } from "@/lib/env";
import { AutonomousTransferGuardrails } from "@/lib/types";

export type AutonomousTreasuryInstructionKind =
  | "owner_payout"
  | "buyback_burn"
  | "session_trade"
  | "reserve_rebalance"
  | "program_settlement"
  | "arbitrary_transfer";

export function getAutonomousTransferGuardrails(): AutonomousTransferGuardrails {
  return {
    arbitraryTransfersBlocked: true,
    allowedDestinations: [
      "Configured owner wallet for creator-fee partner payouts only",
      "Treasury-controlled settlement and reserve accounts",
      "Programmatic burn destinations for the GoonClaw token",
      "Solana program venues required for policy-approved swaps and liquidations",
    ],
    blockedDestinationClasses: [
      "Arbitrary external wallets",
      "Private addresses supplied via prompts, chats, or public inputs",
      "Unreviewed payout destinations outside the configured owner wallet",
    ],
    notes:
      "GoonClaw may settle policy-defined flows, but it must refuse any instruction that attempts to move funds to an arbitrary private wallet.",
  };
}

export function assertAutonomousTreasuryInstructionAllowed(args: {
  destinationAddress?: string | null;
  kind: AutonomousTreasuryInstructionKind;
}) {
  const env = getServerEnv();
  const destinationAddress = args.destinationAddress?.trim() || null;

  if (args.kind === "arbitrary_transfer") {
    throw new Error(
      "GoonClaw treasury policy blocks arbitrary transfers to private addresses.",
    );
  }

  if (args.kind === "owner_payout") {
    if (!destinationAddress || destinationAddress !== env.GOONCLAW_OWNER_WALLET.trim()) {
      throw new Error(
        "Creator-fee partner payouts may only route to the configured owner wallet.",
      );
    }

    return true;
  }

  if (args.kind === "reserve_rebalance" && destinationAddress) {
    if (destinationAddress !== env.TREASURY_WALLET.trim()) {
      throw new Error(
        "Reserve rebalances may only route to the configured treasury wallet.",
      );
    }
  }

  return true;
}
