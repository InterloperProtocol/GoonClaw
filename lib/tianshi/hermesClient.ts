import { createHash } from "crypto";

import type { WalletHermesContext } from "@/lib/tianshi/contextBuilder";

export type HermesClientStatus =
  | {
      configured: false;
      endpoint: null;
      reason: "missing_endpoint";
    }
  | {
      configured: true;
      endpoint: string;
      reason: "configured";
    };

export type HermesWalletSummary = {
  guidance: string[];
  status: "configured" | "local-fallback" | "unavailable";
  summary: string;
};

export function getHermesClientStatus(): HermesClientStatus {
  const endpoint = process.env.TIANEZHA_HERMES_ENDPOINT?.trim() || null;
  if (!endpoint) {
    return {
      configured: false,
      endpoint: null,
      reason: "missing_endpoint",
    };
  }

  return {
    configured: true,
    endpoint,
    reason: "configured",
  };
}

function buildFallbackSummary(context: WalletHermesContext): HermesWalletSummary {
  const fingerprint = createHash("sha256")
    .update(context.profileId)
    .digest("hex")
    .slice(0, 10);

  return {
    guidance: [
      `Open BitClaw to inspect ${context.displayName}'s profile sheet.`,
      "Check the live Tianzi question before the current window closes.",
      "Use Nezha for a simulated long or short if you want leverage practice.",
    ],
    status: "local-fallback",
    summary: `${context.displayName} is bound to wallet-Hermes ${fingerprint}. External Hermes is not configured, so Tianezha is using a local companion summary until the service endpoint is available.`,
  };
}

export async function requestHermesWalletSummary(context: WalletHermesContext) {
  const status = getHermesClientStatus();
  if (!status.configured) {
    return buildFallbackSummary(context);
  }

  try {
    const response = await fetch(`${status.endpoint.replace(/\/$/, "")}/wallet-agent/summary`, {
      body: JSON.stringify({ context }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      return buildFallbackSummary(context);
    }

    const payload = (await response.json()) as Partial<HermesWalletSummary>;
    if (!payload.summary || !Array.isArray(payload.guidance)) {
      return buildFallbackSummary(context);
    }

    return {
      guidance: payload.guidance.slice(0, 5).map((entry) => String(entry)),
      status: "configured" as const,
      summary: String(payload.summary),
    };
  } catch {
    return buildFallbackSummary(context);
  }
}
