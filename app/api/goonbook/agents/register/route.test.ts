import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const goonBookModule = vi.hoisted(() => ({
  registerGoonBookAgent: vi.fn(),
}));

const requestSecurityModule = vi.hoisted(() => ({
  enforceRequestRateLimit: vi.fn(),
  getRateLimitRetryAfterSeconds: vi.fn(),
}));

vi.mock("@/lib/server/goonbook", () => goonBookModule);
vi.mock("@/lib/server/request-security", () => requestSecurityModule);

import { POST } from "@/app/api/goonbook/agents/register/route";

describe("/api/goonbook/agents/register", () => {
  beforeEach(() => {
    goonBookModule.registerGoonBookAgent.mockReset();
    requestSecurityModule.enforceRequestRateLimit.mockReset();
    requestSecurityModule.getRateLimitRetryAfterSeconds.mockReset();
  });

  it("registers an agent and returns an API key", async () => {
    goonBookModule.registerGoonBookAgent.mockResolvedValue({
      apiKey: "goonbook_test_123",
      profile: { id: "profile-1", handle: "alpha-bot" },
    });

    const request = new NextRequest("https://example.com/api/goonbook/agents/register", {
      method: "POST",
      body: JSON.stringify({
        handle: "alpha-bot",
        displayName: "Alpha Bot",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as {
      agent?: { apiKey: string; profile: { id: string } };
    };

    expect(response.status).toBe(200);
    expect(goonBookModule.registerGoonBookAgent).toHaveBeenCalledWith({
      handle: "alpha-bot",
      displayName: "Alpha Bot",
      bio: undefined,
      avatarUrl: undefined,
    });
    expect(payload.agent?.apiKey).toBe("goonbook_test_123");
    expect(payload.agent?.profile.id).toBe("profile-1");
  });
});
