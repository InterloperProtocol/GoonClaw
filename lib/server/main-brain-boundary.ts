import { createHash } from "crypto";

import { getServerEnv } from "@/lib/env";
import type {
  MainBrainBoundaryPromptEnvelope,
  MainBrainBoundaryStatus,
} from "@/lib/types/brains";

type MainBrainBoundarySecrets = {
  readonly keyStart: string;
  readonly keyEnd: string;
  readonly signature: string;
};

function hashHex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function toFingerprint(input: string): string | null {
  const normalized = input.trim();
  return normalized ? hashHex(normalized).slice(0, 16) : null;
}

function buildPromptToken(position: "start" | "end", fingerprint: string | null) {
  const suffix = fingerprint ?? "unconfigured";
  return `<<TIANSHI_PARENT_${position.toUpperCase()}::${suffix}>>`;
}

function normalizeSecrets(
  secrets: Partial<MainBrainBoundarySecrets>,
): MainBrainBoundarySecrets {
  return {
    keyStart: secrets.keyStart?.trim() || "",
    keyEnd: secrets.keyEnd?.trim() || "",
    signature: secrets.signature?.trim() || "",
  };
}

export function buildMainBrainBoundaryStatus(
  secrets: Partial<MainBrainBoundarySecrets>,
): MainBrainBoundaryStatus {
  const normalized = normalizeSecrets(secrets);
  const keyStartFingerprint = toFingerprint(normalized.keyStart);
  const keyEndFingerprint = toFingerprint(normalized.keyEnd);
  const signatureFingerprint = toFingerprint(normalized.signature);
  const configured = Boolean(
    keyStartFingerprint && keyEndFingerprint && signatureFingerprint,
  );
  const boundaryFingerprint = configured
    ? hashHex(
        [
          normalized.keyStart,
          normalized.keyEnd,
          normalized.signature,
          "tianshi-parent-boundary",
        ].join("::"),
      ).slice(0, 24)
    : null;

  return {
    configured,
    parentBrainId: "tianshi",
    boundaryFingerprint,
    keyStartFingerprint,
    keyEndFingerprint,
    signatureFingerprint,
    promptStartToken: buildPromptToken("start", keyStartFingerprint),
    promptEndToken: buildPromptToken("end", keyEndFingerprint),
    rawSecretsIncluded: false,
    subAgentsMayMutateParent: false,
    promptPolicy: "env-derived-signature-envelope",
  };
}

export function getMainBrainBoundaryStatus(): MainBrainBoundaryStatus {
  const env = getServerEnv();

  return buildMainBrainBoundaryStatus({
    keyStart: env.TIANSHI_PARENT_BRAIN_KEY_START,
    keyEnd: env.TIANSHI_PARENT_BRAIN_KEY_END,
    signature: env.TIANSHI_PARENT_BRAIN_SIGNATURE,
  });
}

export function createMainBrainPromptEnvelope(args: {
  scope: string;
  payload: Readonly<Record<string, unknown>> | string;
}): MainBrainBoundaryPromptEnvelope {
  const status = getMainBrainBoundaryStatus();
  const payloadText =
    typeof args.payload === "string" ? args.payload : JSON.stringify(args.payload);

  return {
    parentBrainId: "tianshi",
    scope: args.scope,
    boundaryFingerprint: status.boundaryFingerprint,
    payloadFingerprint: hashHex(
      [
        status.boundaryFingerprint ?? "unconfigured-boundary",
        args.scope,
        payloadText,
      ].join("::"),
    ).slice(0, 24),
    promptStartToken: status.promptStartToken,
    promptEndToken: status.promptEndToken,
    rawSecretsIncluded: false,
    subAgentsMayMutateParent: false,
  };
}

export function assertMainBrainPromptEnvelopeLockedToParent(
  envelope: MainBrainBoundaryPromptEnvelope,
) {
  if (envelope.parentBrainId !== "tianshi") {
    throw new Error("Main-brain boundary envelope is not locked to Tianshi.");
  }

  if (envelope.subAgentsMayMutateParent) {
    throw new Error("Sub-agents may not mutate the sovereign parent brain.");
  }

  if (envelope.rawSecretsIncluded) {
    throw new Error("Main-brain boundary envelope must never expose raw secrets.");
  }

  if (
    !envelope.promptStartToken.includes("TIANSHI_PARENT_START") ||
    !envelope.promptEndToken.includes("TIANSHI_PARENT_END")
  ) {
    throw new Error("Main-brain boundary envelope is missing the expected markers.");
  }
}
