import { existsSync, readFileSync } from "fs";
import os from "os";
import path from "path";

import { getInvoiceIdPDA } from "@pump-fun/agent-payments-sdk";
import { PublicKey } from "@solana/web3.js";

import { getServerEnv } from "@/lib/env";
import { AgentOpsStatus, ReferenceStatus } from "@/lib/types";

function readPackageVersions() {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const fallback = {
    pumpSdk: "unknown",
    agentPaymentsSdk: "unknown",
  };

  if (!existsSync(packageJsonPath)) {
    return fallback;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      dependencies?: Record<string, string>;
    };

    return {
      pumpSdk: packageJson.dependencies?.["@pump-fun/pump-sdk"] ?? "missing",
      agentPaymentsSdk:
        packageJson.dependencies?.["@pump-fun/agent-payments-sdk"] ?? "missing",
    };
  } catch {
    return fallback;
  }
}

function safePublicKey(value?: string) {
  if (!value?.trim()) return null;

  try {
    return new PublicKey(value.trim());
  } catch {
    return null;
  }
}

function buildReferences(versions: {
  pumpSdk: string;
  agentPaymentsSdk: string;
}): ReferenceStatus[] {
  const codexHome = path.join(os.homedir(), ".codex");

  return [
    {
      id: "openclaw",
      label: "OpenClaw",
      ready: existsSync(path.join(process.cwd(), "Refs", "openclaw")),
      note: "Reference repo mirrored in Refs/openclaw.",
    },
    {
      id: "pump-sdk",
      label: "Pump SDK",
      ready: versions.pumpSdk !== "missing",
      note: `Using ${versions.pumpSdk}.`,
    },
    {
      id: "agent-payments",
      label: "Agent Payments SDK",
      ready: versions.agentPaymentsSdk !== "missing",
      note: `Using ${versions.agentPaymentsSdk} for invoice-ready tokenized-agent flows.`,
    },
    {
      id: "pump-tokenized-agents-skill",
      label: "Pump tokenized-agents skill",
      ready: existsSync(path.join(codexHome, "skills", "tokenized-agents")),
      note: "Installed into ~/.codex/skills/tokenized-agents.",
    },
    {
      id: "free-crypto-news",
      label: "Free Crypto News",
      ready: existsSync(path.join(process.cwd(), "Refs", "free-crypto-news")),
      note: "Backs the in-app news panel via cryptocurrency.cv.",
    },
    {
      id: "launchpad-ui",
      label: "Solana Launchpad UI",
      ready: existsSync(path.join(process.cwd(), "Refs", "solana-launchpad-ui")),
      note: "Used as the visual theme reference for the GoonClaw surfaces.",
    },
    {
      id: "auditkit",
      label: "AuditKit",
      ready: existsSync(path.join(process.cwd(), "Refs", "AuditKit")),
      note: "Local audit reference is available for follow-on hardening work.",
    },
  ];
}

export function getAgentOpsStatus(): AgentOpsStatus {
  const env = getServerEnv();
  const versions = readPackageVersions();

  const tokenMint =
    process.env.AGENT_TOKEN_MINT_ADDRESS?.trim() ||
    process.env.GOONCLAW_TOKEN_MINT?.trim() ||
    env.BAGSTROKE_TOKEN_MINT ||
    "";
  const currencyMint = process.env.CURRENCY_MINT?.trim() || "";

  const tokenMintKey = safePublicKey(tokenMint);
  const currencyMintKey = safePublicKey(currencyMint);
  const now = Math.floor(Date.now() / 1000);

  let invoicePreviewId: string | undefined;
  if (tokenMintKey && currencyMintKey) {
    try {
      const [invoiceId] = getInvoiceIdPDA(
        tokenMintKey,
        currencyMintKey,
        1_000_000,
        now,
        now,
        now + 15 * 60,
      );
      invoicePreviewId = invoiceId.toBase58();
    } catch {
      invoicePreviewId = undefined;
    }
  }

  const creatorFeeCnftSharePct = Number(
    process.env.GOONCLAW_CREATOR_FEE_CNFT_SHARE_PCT ?? "50",
  );
  const creatorFeeBuybackSharePct = Number(
    process.env.GOONCLAW_BUYBACK_SHARE_PCT ??
      `${Math.max(0, 100 - creatorFeeCnftSharePct)}`,
  );
  const reserveFloorSol = Number(process.env.GOONCLAW_RESERVE_SOL ?? "1");
  const cnftIntervalMinutes = Number(
    process.env.GOONCLAW_CNFT_INTERVAL_MINUTES ?? "10",
  );

  return {
    tokenMint,
    autoScanEnabled: Boolean(tokenMintKey && env.SOLANA_RPC_URL),
    reserveFloorSol,
    cnftIntervalMinutes,
    creatorFeeCnftSharePct,
    creatorFeeBuybackSharePct,
    invoiceVerificationReady: Boolean(tokenMintKey && currencyMintKey),
    invoicePreviewId,
    paymentCurrencyMint: currencyMint,
    cnftCollectionConfigured: Boolean(env.ACCESS_CNFT_COLLECTION),
    cnftTreeConfigured: Boolean(env.ACCESS_CNFT_TREE),
    cnftAuthorityConfigured: Boolean(env.ACCESS_CNFT_AUTHORITY_SECRET),
    references: buildReferences(versions),
  };
}
