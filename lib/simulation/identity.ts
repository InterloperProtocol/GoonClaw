import type { ChainFamily, IdentitySourceKind } from "@/lib/simulation/types";

type ParsedIdentityInput = {
  chain: ChainFamily;
  displayLabel: string;
  normalizedAddress: string;
  sourceKind: IdentitySourceKind;
  walletAddress: string;
};

function looksLikeEvmAddress(input: string) {
  return /^0x[a-f0-9]{40}$/i.test(input);
}

function looksLikeSolanaAddress(input: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input);
}

function looksLikeBitcoinAddress(input: string) {
  return /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{20,}$/i.test(input);
}

function looksLikeSupportedRegistryName(input: string, suffix: ".eth" | ".sol" | ".bnb") {
  return new RegExp(`^[a-z0-9][a-z0-9-]{0,62}\\${suffix}$`, "i").test(input);
}

export function detectChainFamily(input: string): ChainFamily {
  const value = input.trim();

  if (value.endsWith(".eth")) {
    return "ethereum";
  }
  if (value.endsWith(".sol")) {
    return "solana";
  }
  if (value.endsWith(".bnb")) {
    return "bnb";
  }
  if (/^bnb:/i.test(value) || /^bsc:/i.test(value)) {
    return "bnb";
  }
  if (/^eth:/i.test(value) || value.startsWith("0x")) {
    return "ethereum";
  }
  if (/^sol:/i.test(value) || looksLikeSolanaAddress(value)) {
    return "solana";
  }
  if (looksLikeBitcoinAddress(value)) {
    return "bitcoin";
  }

  return "other";
}

export function normalizeAddressInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter an address or registry name");
  }

  const chain = detectChainFamily(trimmed);

  if (trimmed.endsWith(".eth")) {
    if (!looksLikeSupportedRegistryName(trimmed, ".eth")) {
      throw new Error("Enter a valid ENS name");
    }
    return {
      chain,
      displayLabel: trimmed.toLowerCase(),
      normalizedAddress: trimmed.toLowerCase(),
      sourceKind: "ens" as const,
      walletAddress: trimmed.toLowerCase(),
    } satisfies ParsedIdentityInput;
  }

  if (trimmed.endsWith(".sol")) {
    if (!looksLikeSupportedRegistryName(trimmed, ".sol")) {
      throw new Error("Enter a valid SNS name");
    }
    return {
      chain,
      displayLabel: trimmed.toLowerCase(),
      normalizedAddress: trimmed.toLowerCase(),
      sourceKind: "sns" as const,
      walletAddress: trimmed.toLowerCase(),
    } satisfies ParsedIdentityInput;
  }

  if (trimmed.endsWith(".bnb")) {
    if (!looksLikeSupportedRegistryName(trimmed, ".bnb")) {
      throw new Error("Enter a valid .bnb name");
    }
    return {
      chain,
      displayLabel: trimmed.toLowerCase(),
      normalizedAddress: trimmed.toLowerCase(),
      sourceKind: "spaceid" as const,
      walletAddress: trimmed.toLowerCase(),
    } satisfies ParsedIdentityInput;
  }

  const normalizedAddress = trimmed
    .replace(/^(eth|sol|bnb|bsc):/i, "")
    .trim();

  if (chain === "ethereum" || chain === "bnb") {
    if (!looksLikeEvmAddress(normalizedAddress)) {
      throw new Error("Enter a valid EVM wallet address");
    }
  } else if (chain === "solana") {
    if (!looksLikeSolanaAddress(normalizedAddress)) {
      throw new Error("Enter a valid Solana wallet address");
    }
  } else if (chain === "bitcoin") {
    if (!looksLikeBitcoinAddress(normalizedAddress)) {
      throw new Error("Enter a valid Bitcoin wallet address");
    }
  } else {
    throw new Error("Enter a valid wallet address or supported registry name");
  }

  return {
    chain,
    displayLabel: normalizedAddress,
    normalizedAddress:
      chain === "ethereum" || chain === "bnb"
        ? normalizedAddress.toLowerCase()
        : normalizedAddress,
    sourceKind: "address" as const,
    walletAddress:
      chain === "ethereum" || chain === "bnb"
        ? normalizedAddress.toLowerCase()
        : normalizedAddress,
  } satisfies ParsedIdentityInput;
}

export function buildIdentityProfileId(chain: ChainFamily, normalizedAddress: string) {
  return `identity:${chain}:${normalizedAddress}`;
}

export function buildSimulationHandle(displayLabel: string) {
  const clean = displayLabel.trim().replace(/^#/, "");
  return clean.startsWith("RA-") || clean.startsWith("#RA-")
    ? `#${clean.replace(/^#/, "")}`
    : `#RA-${clean}`;
}

export function buildBitClawHandle(displayLabel: string) {
  const normalized = displayLabel
    .trim()
    .toLowerCase()
    .replace(/^#ra-/, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.length >= 3) {
    return normalized.slice(0, 24);
  }

  return `ra-${normalized || "entry"}`;
}

export function shortenAddress(value: string) {
  if (value.length < 12) {
    return value;
  }

  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
