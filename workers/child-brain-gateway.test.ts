import { describe, expect, it } from "vitest";

import { createChildBrainProposal } from "@/workers/child-brain-gateway";

describe("child brain gateway", () => {
  it("forwards child trade requests to the sovereign parent", () => {
    const { proposal, auditEvent } = createChildBrainProposal({
      brainId: "bolclaw",
      action: "request_trade",
      rationale: "Stream momentum is spiking and needs parent review.",
      requestedLamports: 10_000_000n,
    });

    expect(proposal.parentBrainId).toBe("tianshi");
    expect(proposal.childBrainId).toBe("bolclaw");
    expect(proposal.requestedLamports).toBe("10000000");
    expect(proposal.parentBoundary.parentBrainId).toBe("tianshi");
    expect(proposal.parentBoundary.subAgentsMayMutateParent).toBe(false);
    expect(proposal.parentBoundary.rawSecretsIncluded).toBe(false);
    expect(proposal.parentBoundary.promptStartToken).toContain(
      "TIANSHI_PARENT_START",
    );
    expect(proposal.parentBoundary.promptEndToken).toContain(
      "TIANSHI_PARENT_END",
    );
    expect(auditEvent.type).toBe("CHILD_PROPOSAL_RECEIVED");
  });

  it("rejects capabilities a child brain does not own", () => {
    expect(() =>
      createChildBrainProposal({
        brainId: "bolclaw",
        action: "surface_wallet_intel",
        rationale: "Try to access a restricted capability.",
      }),
    ).toThrow(/not constitutionally allowed/i);
  });
});
