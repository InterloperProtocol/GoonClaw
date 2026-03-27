vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));
vi.mock("@/lib/server/tianezha-chain-data", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/tianezha-chain-data")>(
    "@/lib/server/tianezha-chain-data",
  );

  return {
    ...actual,
    verifyBnbTokenTransferToTarget: vi.fn(async (args: { expectedFrom: string; transactionId: string }) => ({
      ok: true,
      transactionId: args.transactionId,
      verifiedWallet: args.expectedFrom,
    })),
    verifySolanaTokenTransferToTarget: vi.fn(
      async (args: { expectedFrom: string; transactionId: string }) => ({
        ok: true,
        transactionId: args.transactionId,
        verifiedWallet: args.expectedFrom,
      }),
    ),
  };
});

import { GET as getGenDelve, POST as postGenDelve } from "@/app/api/gendelve/route";
import GenDelvePage from "@/app/gendelve/page";
import { renderHtml } from "@/tests/regression/helpers/render";

import {
  createGenDelveVoteIntent,
  getGenDelveState,
  getHybridFutarchyState,
  loadOrCreateIdentity,
} from "@/lib/server/tianezha-simulation";

describe("GenDelve governance flows", () => {
  it("renders the governance page with the narrow real-governance copy and no placeholder receiver text", async () => {
    const publicHtml = renderHtml(await GenDelvePage());

    expect(publicHtml).toContain("Narrow, real governance for the two live $CAMIUP worlds.");
    expect(publicHtml).toContain("only for $CAMIUP on Solana or BNB");
    expect(publicHtml).toContain("The rest of the app stays frictionless.");
    expect(publicHtml).not.toContain("placeholder contract");
    expect(publicHtml).not.toContain("fake receiver");
    expect(publicHtml).not.toContain("000000000000000000000000000000000000dead");
  });

  it("loads with a profile, exposes vote actions only here, and returns state through the route", async () => {
    const profile = await loadOrCreateIdentity("alice.sol");

    const html = renderHtml(await GenDelvePage());
    const response = await getGenDelve();
    const payload = (await response.json()) as { gendelve: Awaited<ReturnType<typeof getGenDelveState>> };

    expect(html).toContain("Create vote intent");
    expect(html).toContain("Verify holder tick");
    expect(html).toContain("Challenge memo");
    expect(payload.gendelve.ownerChallenge?.recommendedWallet).toBe(profile.profile.walletAddress);
    expect(payload.gendelve.worlds.map((world) => world.chain).sort()).toEqual(["bnb", "solana"]);
  });

  it("requires a real verification receipt before a vote can be verified and updates governance share after success", async () => {
    await loadOrCreateIdentity("alice.sol");
    const before = await getHybridFutarchyState();

    const createResponse = await postGenDelve(
      new Request("http://test.local/api/gendelve", {
        body: JSON.stringify({
          action: "createVote",
          choice: "support",
          worldId: "camiup-sol",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const created = (await createResponse.json()) as {
      intent: { id: string; status: string; worldId: string };
    };

    expect(createResponse.status).toBe(200);
    expect(created.intent.status).toBe("pending");

    const invalidVerify = await postGenDelve(
      new Request("http://test.local/api/gendelve", {
        body: JSON.stringify({
          action: "verifyVote",
          intentId: created.intent.id,
          transactionId: "",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(invalidVerify.status).toBe(400);

    const verifyResponse = await postGenDelve(
      new Request("http://test.local/api/gendelve", {
        body: JSON.stringify({
          action: "verifyVote",
          intentId: created.intent.id,
          transactionId: "solana-signature-1",
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const verified = (await verifyResponse.json()) as {
      intent: { status: string; verificationTransactionId: string };
    };
    const after = await getHybridFutarchyState();

    expect(verifyResponse.status).toBe(200);
    expect(verified.intent.status).toBe("verified");
    expect(verified.intent.verificationTransactionId).toBe("solana-signature-1");
    expect(
      after.worlds.find((world) => world.worldId === "camiup-sol")?.governanceShare,
    ).toBeGreaterThan(
      before.worlds.find((world) => world.worldId === "camiup-sol")?.governanceShare ?? 0,
    );
  });

  it("lets non-governance-chain profiles use the app but blocks them from affecting governance", async () => {
    const loaded = await loadOrCreateIdentity("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");

    expect(loaded.profile.chain).toBe("bitcoin");
    await expect(
      createGenDelveVoteIntent({
        choice: "support",
        profileId: loaded.profile.id,
        worldId: "camiup-sol",
      }),
    ).rejects.toThrow("Load the Solana holder profile before opening a Solana $CAMIUP vote.");
  });
});
