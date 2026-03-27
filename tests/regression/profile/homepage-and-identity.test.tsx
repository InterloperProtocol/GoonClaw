import { POST as loadIdentity } from "@/app/api/identity/load/route";
import { expectInOrder, renderHtml } from "@/tests/regression/helpers/render";

vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));

import HomePage from "@/app/page";
import {
  getCurrentLoadedIdentity,
  loadOrCreateIdentity,
} from "@/lib/server/tianezha-simulation";

describe("homepage and identity reconstruction", () => {
  it("renders the homepage entry flow and 3x2 module grid in the exact public order", async () => {
    const html = renderHtml(await HomePage());

    expect(html).toContain("Enter a wallet. Rebuild your BitClaw profile. Enter the world.");
    expect(html).toContain("The left panel stays persistent across the shell.");
    expect(html).toContain("Persistent Tianezha left shell");
    expectInOrder(html, [
      "BitClaw",
      "BolClaw",
      "Tianzi",
      "Nezha",
      "Tianshi",
      "GenDelve",
    ]);
    expect(html).toContain("$CAMIUP Solana Pump World");
    expect(html).toContain("$CAMIUP BNB Four.meme World");
    expect(html).not.toContain("HeartBeat");
    expect(html).not.toContain("runtime wall");
    expect(html).not.toContain("diagnostics");
    expect(html).not.toContain("seams");
  });

  it("shows the loaded-profile homepage state after a profile is reconstructed", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");

    const html = renderHtml(await HomePage());

    expect(html).toContain("Your BitClaw profile is now the center of the shell");
    expect(html).toContain(loaded.profile.displayName);
    expect(html).toContain(loaded.profile.simulationHandle);
    expect(html).toContain("Personality, avatar, and qNFTs are simulated profile fantasy elements.");
    expect(html).toContain("Open BitClaw");
  });

  it("accepts valid wallet and registry inputs without signup or wallet connect", async () => {
    const evm = await loadOrCreateIdentity("0x8f31a56bc0d4f1ed90aa5d79f501ab3419810001");
    expect(evm.profile.chain).toBe("ethereum");
    expect(evm.profile.simulationHandle).toMatch(/^#RA-/);
    expect(evm.profile.walletAddress).toBe("0x8f31a56bc0d4f1ed90aa5d79f501ab3419810001");

    const solana = await loadOrCreateIdentity("7KxQJt5WJQWQ9L4djfM5cVgsA3fRw9pVQY1FQ6qBrsF7");
    expect(solana.profile.chain).toBe("solana");
    expect(solana.profile.simulationHandle).toMatch(/^#RA-/);

    const ens = await loadOrCreateIdentity("vitalik.eth");
    expect(ens.profile.publicLabel).toBe("vitalik.eth");
    expect(ens.aliases.some((alias) => alias.alias === "vitalik.eth")).toBe(true);
    expect(ens.aliases.some((alias) => alias.reservedToWallet === ens.profile.walletAddress)).toBe(
      true,
    );

    const sns = await loadOrCreateIdentity("alice.sol");
    expect(sns.profile.publicLabel).toBe("alice.sol");
    expect(sns.profile.chain).toBe("solana");

    const bnb = await loadOrCreateIdentity("amber.bnb");
    expect(bnb.profile.publicLabel).toBe("amber.bnb");
    expect(bnb.profile.chain).toBe("bnb");
  });

  it("returns a clean empty-input error through the identity route", async () => {
    const response = await loadIdentity(
      new Request("http://test.local/api/identity/load", {
        body: JSON.stringify({ input: "" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Enter an address or registry name.",
    });
  });

  it("returns a clean invalid-input error and preserves the previously loaded profile", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");

    const response = await loadIdentity(
      new Request("http://test.local/api/identity/load", {
        body: JSON.stringify({ input: "not-a-wallet" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: "Enter a valid wallet address or supported registry name",
    });

    await expect(getCurrentLoadedIdentity()).resolves.toMatchObject({
      profile: { id: loaded.profile.id },
    });
  });
});
