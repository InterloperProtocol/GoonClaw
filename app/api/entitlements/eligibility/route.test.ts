import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const authModule = vi.hoisted(() => ({
  requireWalletSession: vi.fn(),
}));

const entitlementsModule = vi.hoisted(() => ({
  claimEligibilitySubscriptionCnft: vi.fn(),
}));

const repositoryModule = vi.hoisted(() => ({
  getEntitlement: vi.fn(),
}));

const requestSecurityModule = vi.hoisted(() => ({
  assertSameOriginMutation: vi.fn(),
  enforceRequestRateLimit: vi.fn(),
  getRateLimitRetryAfterSeconds: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => authModule);
vi.mock("@/lib/server/entitlements", () => entitlementsModule);
vi.mock("@/lib/server/repository", () => repositoryModule);
vi.mock("@/lib/server/request-security", () => requestSecurityModule);

import { POST } from "@/app/api/entitlements/eligibility/route";

describe("/api/entitlements/eligibility", () => {
  beforeEach(() => {
    authModule.requireWalletSession.mockReset();
    entitlementsModule.claimEligibilitySubscriptionCnft.mockReset();
    repositoryModule.getEntitlement.mockReset();
    requestSecurityModule.assertSameOriginMutation.mockReset();
    requestSecurityModule.enforceRequestRateLimit.mockReset();
    requestSecurityModule.getRateLimitRetryAfterSeconds.mockReset();
  });

  it("requires an authenticated wallet session", async () => {
    authModule.requireWalletSession.mockRejectedValue(
      new Error("Authentication required"),
    );

    const request = new NextRequest(
      "https://example.com/api/entitlements/eligibility",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
    const response = await POST(request);
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(401);
    expect(payload.error).toBe("Authentication required");
    expect(entitlementsModule.claimEligibilitySubscriptionCnft).not.toHaveBeenCalled();
  });

  it("rejects claims for a different wallet than the authenticated session", async () => {
    authModule.requireWalletSession.mockResolvedValue({
      wallet: "11111111111111111111111111111112",
    });

    const request = new NextRequest(
      "https://example.com/api/entitlements/eligibility",
      {
        method: "POST",
        body: JSON.stringify({
          wallet: "11111111111111111111111111111113",
        }),
      },
    );
    const response = await POST(request);
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(403);
    expect(payload.error).toBe(
      "The requested wallet must match the authenticated wallet",
    );
    expect(entitlementsModule.claimEligibilitySubscriptionCnft).not.toHaveBeenCalled();
  });

  it("claims using the authenticated wallet session", async () => {
    authModule.requireWalletSession.mockResolvedValue({
      wallet: "11111111111111111111111111111112",
    });
    repositoryModule.getEntitlement.mockResolvedValue(null);
    entitlementsModule.claimEligibilitySubscriptionCnft.mockResolvedValue({
      id: "ent-1",
      wallet: "11111111111111111111111111111112",
      type: "cnft",
      status: "active",
    });

    const request = new NextRequest(
      "https://example.com/api/entitlements/eligibility",
      {
        method: "POST",
        body: JSON.stringify({
          wallet: "11111111111111111111111111111112",
        }),
      },
    );
    const response = await POST(request);
    const payload = (await response.json()) as {
      ok?: boolean;
      reused?: boolean;
      entitlement?: { id: string };
    };

    expect(response.status).toBe(200);
    expect(repositoryModule.getEntitlement).toHaveBeenCalledWith(
      "11111111111111111111111111111112",
    );
    expect(entitlementsModule.claimEligibilitySubscriptionCnft).toHaveBeenCalledWith(
      "11111111111111111111111111111112",
    );
    expect(payload.ok).toBe(true);
    expect(payload.reused).toBe(false);
    expect(payload.entitlement?.id).toBe("ent-1");
  });
});
