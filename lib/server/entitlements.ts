import { randomUUID } from "crypto";

import { getServerEnv } from "@/lib/env";
import { EntitlementRecord, OrderRecord } from "@/lib/types";
import { nowIso } from "@/lib/utils";
import {
  getEntitlement,
  saveOrder,
  upsertEntitlement,
} from "@/lib/server/repository";
import {
  verifyBurnSignature,
  verifyTransferToTreasury,
  walletOwnsAccessCnft,
} from "@/lib/server/solana";
import { mintAccessCnft } from "@/lib/server/cnft";
import { getLaunchonomicsEvaluation } from "@/lib/server/launchonomics";

function buildEntitlement(
  wallet: string,
  type: "cnft" | "burn",
  referenceSignature: string,
  assetId?: string,
  notes?: string,
): EntitlementRecord {
  return {
    id: randomUUID(),
    wallet,
    type,
    status: "active",
    referenceSignature,
    assetId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lastVerifiedAt: nowIso(),
    cacheExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    notes,
  };
}

export async function claimCnftEntitlement(wallet: string, signature: string) {
  const existingEntitlement = await getEntitlement(wallet);
  if (
    existingEntitlement?.type === "cnft" &&
    existingEntitlement.referenceSignature === signature &&
    existingEntitlement.status === "active"
  ) {
    return existingEntitlement;
  }

  const env = getServerEnv();
  const payment = await verifyTransferToTreasury(signature, wallet);
  if (!payment.ok) {
    throw new Error(payment.error ?? "Payment verification failed");
  }

  const expectedLamports = BigInt(Math.round(Number(env.ACCESS_CNFT_PRICE_SOL) * 1_000_000_000));
  if (payment.lamports < expectedLamports) {
    throw new Error(
      `Expected ${expectedLamports.toString()} lamports, found ${payment.lamports.toString()}`,
    );
  }

  const order: OrderRecord = {
    id: randomUUID(),
    wallet,
    flow: "purchase",
    status: "pending",
    signature,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    amountRaw: payment.lamports.toString(),
  };
  await saveOrder(order);

  try {
    const mintResult = await mintAccessCnft(wallet);
    const entitlement = buildEntitlement(
      wallet,
      "cnft",
      signature,
      mintResult.signature,
    );
    await upsertEntitlement(entitlement);
    await saveOrder({
      ...order,
      status: "completed",
      updatedAt: nowIso(),
      entitlementId: entitlement.id,
    });

    return entitlement;
  } catch (error) {
    await saveOrder({
      ...order,
      status: "failed",
      updatedAt: nowIso(),
      error: error instanceof Error ? error.message : "Failed to mint cNFT",
    });
    throw error;
  }
}

export async function claimBurnEntitlement(wallet: string, signature: string) {
  const existingEntitlement = await getEntitlement(wallet);
  if (
    existingEntitlement?.type === "burn" &&
    existingEntitlement.referenceSignature === signature &&
    existingEntitlement.status === "active"
  ) {
    return existingEntitlement;
  }

  const burn = await verifyBurnSignature(signature, wallet);
  if (!burn.ok) {
    throw new Error(burn.error ?? "Burn verification failed");
  }

  const order: OrderRecord = {
    id: randomUUID(),
    wallet,
    flow: "burn",
    status: "completed",
    signature,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    amountRaw: burn.amount.toString(),
  };
  await saveOrder(order);

  const entitlement = buildEntitlement(wallet, "burn", signature);
  await upsertEntitlement(entitlement);
  await saveOrder({
    ...order,
    entitlementId: entitlement.id,
  });
  return entitlement;
}

export async function claimEligibilitySubscriptionCnft(wallet: string) {
  const existingEntitlement = await getEntitlement(wallet);
  if (existingEntitlement?.status === "active") {
    return existingEntitlement;
  }

  if (existingEntitlement?.type === "cnft") {
    return existingEntitlement;
  }

  const evaluation = await getLaunchonomicsEvaluation(wallet);
  if (evaluation.tier === "none") {
    throw new Error("Wallet is not eligible for a subscription cNFT");
  }

  const mintResult = await mintAccessCnft(wallet);
  const entitlement = buildEntitlement(
    wallet,
    "cnft",
    `launchonomics:${evaluation.tier}:${evaluation.launchAt}`,
    mintResult.signature,
    `Manual LaunchONomics subscription claim for ${evaluation.tier} tier`,
  );
  await upsertEntitlement(entitlement);
  return entitlement;
}

export async function revalidateCnftAccess(wallet: string, current: EntitlementRecord | null) {
  if (!current || current.type !== "cnft" || current.status !== "active") {
    return current;
  }

  const cacheExpiresAt = current.cacheExpiresAt
    ? new Date(current.cacheExpiresAt).getTime()
    : 0;
  if (cacheExpiresAt > Date.now()) {
    return current;
  }

  const ownsAsset = await walletOwnsAccessCnft(wallet);
  const next: EntitlementRecord = {
    ...current,
    status: ownsAsset ? "active" : "revoked",
    updatedAt: nowIso(),
    lastVerifiedAt: nowIso(),
    cacheExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
    notes: ownsAsset ? undefined : "Access pass not currently held by wallet",
  };

  await upsertEntitlement(next);
  return next;
}
