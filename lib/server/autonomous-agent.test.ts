import { beforeEach, describe, expect, it } from "vitest";

import {
  applyAutonomousRevenueAllocation,
  performAutonomousControl,
  tickAutonomousHeartbeat,
} from "@/lib/server/autonomous-agent";
import {
  getAutonomousSnapshot,
  resetAutonomousStoreForTests,
  setAutonomousSnapshot,
} from "@/lib/server/autonomous-store";
import { assertAutonomousTreasuryInstructionAllowed } from "@/lib/server/autonomous-treasury-policy";

describe("autonomous agent policy", () => {
  beforeEach(() => {
    resetAutonomousStoreForTests();
  });

  it("routes creator fees to owner, burn, and trading buckets", () => {
    const current = getAutonomousSnapshot();
    const result = applyAutonomousRevenueAllocation(
      "creator_fee",
      100,
      current.revenueBuckets,
    );

    expect(result.allocated.ownerUsdc).toBe(49);
    expect(result.allocated.burnUsdc).toBe(41);
    expect(result.allocated.tradingUsdc).toBe(10);
    expect(result.allocated.reserveUsdc).toBe(0);
    expect(result.allocated.sessionTradeUsdc).toBe(0);
    expect(result.nextBuckets.totalProcessedUsdc).toBe(100);
  });

  it("routes goonclaw chartsync revenue into burn and session trading", () => {
    const current = getAutonomousSnapshot();
    const result = applyAutonomousRevenueAllocation(
      "goonclaw_chartsync",
      20,
      current.revenueBuckets,
    );

    expect(result.allocated.burnUsdc).toBe(10);
    expect(result.allocated.sessionTradeUsdc).toBe(10);
    expect(result.allocated.ownerUsdc).toBe(0);
    expect(result.allocated.reserveUsdc).toBe(0);
  });

  it("degrades the runtime when reserve falls below the hard floor", () => {
    const current = getAutonomousSnapshot();
    setAutonomousSnapshot({
      ...current,
      reserveSol: 0.05,
    });

    const next = tickAutonomousHeartbeat("reserve breach test");

    expect(next.runtimePhase).toBe("degraded");
    expect(next.latestPolicyDecision).toContain("Reserve floor breach detected");
  });

  it("force-liquidates open positions", () => {
    const current = getAutonomousSnapshot();
    setAutonomousSnapshot({
      ...current,
      positions: [
        {
          id: "position-1",
          status: "open",
          source: "goonclaw_chartsync",
          marketMint: "mint-1",
          symbol: "TEST",
          entryUsdc: 12,
          currentUsdc: 11.5,
          rationale: "test",
          openedAt: new Date().toISOString(),
        },
      ],
    });

    const next = performAutonomousControl("force_liquidate", "test liquidation");

    expect(next.runtimePhase).toBe("liquidating");
    expect(next.positions[0]?.status).toBe("closed");
    expect(next.positions[0]?.exitUsdc).toBe(11.5);
  });

  it("records self-mod approval through owner control", () => {
    const next = performAutonomousControl("approve_self_mod");

    expect(next.selfModification.pendingProposal).toBeNull();
    expect(next.selfModification.lastOutcome).toContain("Owner approved");
  });

  it("blocks arbitrary private-address transfers", () => {
    expect(() =>
      assertAutonomousTreasuryInstructionAllowed({
        destinationAddress: "ArbitraryWallet111111111111111111111111111111",
        kind: "arbitrary_transfer",
      }),
    ).toThrow(/blocks arbitrary transfers/i);
  });

  it("only allows partner payouts to the configured owner wallet", () => {
    expect(() =>
      assertAutonomousTreasuryInstructionAllowed({
        destinationAddress: "ArbitraryWallet111111111111111111111111111111",
        kind: "owner_payout",
      }),
    ).toThrow(/configured owner wallet/i);
  });
});
