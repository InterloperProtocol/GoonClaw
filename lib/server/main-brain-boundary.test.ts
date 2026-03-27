import { describe, expect, it } from "vitest";

import {
  assertMainBrainPromptEnvelopeLockedToParent,
  buildMainBrainBoundaryStatus,
  createMainBrainPromptEnvelope,
} from "@/lib/server/main-brain-boundary";

describe("main brain boundary", () => {
  it("derives public-safe fingerprints and markers without exposing raw secrets", () => {
    const status = buildMainBrainBoundaryStatus({
      keyStart: "start-secret",
      keyEnd: "end-secret",
      signature: "signature-secret",
    });

    expect(status.configured).toBe(true);
    expect(status.boundaryFingerprint).toHaveLength(24);
    expect(status.keyStartFingerprint).toHaveLength(16);
    expect(status.keyEndFingerprint).toHaveLength(16);
    expect(status.signatureFingerprint).toHaveLength(16);
    expect(status.promptStartToken).toContain("TIANSHI_PARENT_START");
    expect(status.promptEndToken).toContain("TIANSHI_PARENT_END");
    expect(status.promptStartToken).not.toContain("start-secret");
    expect(status.promptEndToken).not.toContain("end-secret");
    expect(status.rawSecretsIncluded).toBe(false);
    expect(status.subAgentsMayMutateParent).toBe(false);
  });

  it("creates a parent-locked prompt envelope", () => {
    const envelope = createMainBrainPromptEnvelope({
      scope: "child-proposal:request_trade",
      payload: {
        childBrainId: "bolclaw",
        rationale: "Test envelope",
      },
    });

    expect(envelope.parentBrainId).toBe("tianshi");
    expect(envelope.payloadFingerprint).toHaveLength(24);
    expect(() => assertMainBrainPromptEnvelopeLockedToParent(envelope)).not.toThrow();
  });
});
