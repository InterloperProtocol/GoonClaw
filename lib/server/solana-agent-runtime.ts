import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";

import { getServerEnv } from "@/lib/env";

function parseSecretKey(secret: string) {
  const trimmed = secret.trim();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed) as number[];
      return Uint8Array.from(parsed);
    }

    return bs58.decode(trimmed);
  } catch {
    return null;
  }
}

export function getSolanaAgentRuntimeStatus() {
  const env = getServerEnv();
  const secretKey = parseSecretKey(env.GOONCLAW_AGENT_WALLET_SECRET);

  if (!secretKey) {
    return {
      configured: false,
      walletAddress: null,
      actionNames: [] as string[],
      blockedActionNames: [
        "arbitrary-transfer",
        "external-wallet-withdrawal",
      ] as string[],
    };
  }

  try {
    const keypair = Keypair.fromSecretKey(secretKey);

    return {
      configured: true,
      walletAddress: keypair.publicKey.toBase58(),
      actionNames: [
        "solana-agent-kit-runtime",
        "token-plugin",
        "defi-plugin",
        "misc-plugin",
        "solana-mcp-bridge",
      ],
      blockedActionNames: [
        "arbitrary-transfer",
        "external-wallet-withdrawal",
      ],
    };
  } catch {
    return {
      configured: false,
      walletAddress: null,
      actionNames: [] as string[],
      blockedActionNames: [
        "arbitrary-transfer",
        "external-wallet-withdrawal",
      ] as string[],
    };
  }
}
