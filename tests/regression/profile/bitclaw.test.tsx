vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));

import { renderHtml } from "@/tests/regression/helpers/render";

import BitClawPage from "@/app/bitclaw/page";
import BitClawWallPage from "@/app/bitclaw/[slug]/page";
import {
  createBitClawWallPost,
  getBitClawMainState,
  getBolClawState,
  loadOrCreateIdentity,
} from "@/lib/server/tianezha-simulation";

describe("BitClaw profile flows", () => {
  it("shows the loaded profile as the center of the experience with simulated fantasy traits", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");

    const html = renderHtml(await BitClawPage());

    expect(html).toContain("BitClaw is the center of the experience.");
    expect(html).toContain("Character sheet");
    expect(html).toContain(loaded.profile.publicLabel);
    expect(html).toContain(loaded.profile.walletAddress);
    expect(html).toContain(loaded.profile.simulationHandle);
    expect(html).toContain("Rewards");
    expect(html).toContain("Claim status");
    expect(html).toContain("BolClaw history");
    expect(html).toContain("Tianzi history");
    expect(html).toContain("Nezha history");
    expect(html).toContain("GenDelve status");
    expect(html).toContain("Simulated avatar");
    expect(html).toContain("Simulated personality");
    expect(html).toContain("Simulated qNFT collection");
    expect(html).toContain("does not represent a live wallet image or custody asset");
    expect(html).toContain("not live on-chain custody assets");
  });

  it("renders the BitClaw wall composer so the profile can post into BolClaw", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");

    const html = renderHtml(
      await BitClawWallPage({
        params: Promise.resolve({ slug: loaded.profile.bitClawProfileId }),
      }),
    );

    expect(html).toContain("Post from this profile into the public square");
    expect(html).toContain("Post to BolClaw from this BitClaw profile");
    expect(html).toContain("Simulation wall");
    expect(html).toContain("Recent posts");
  });

  it("publishes from BitClaw into BolClaw and keeps the author linked to the correct profile", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");
    const post = await createBitClawWallPost(
      loaded.profile.bitClawProfileId,
      "BitClaw sends this thesis into BolClaw.",
    );

    const bolclaw = await getBolClawState();

    expect(bolclaw.feed.some((entry) => entry.id === post.id)).toBe(true);
    expect(
      bolclaw.feed.some(
        (entry) =>
          entry.id === post.id && entry.profileId === loaded.profile.bitClawProfileId,
      ),
    ).toBe(true);
  });

  it("switches BitClaw cleanly when the loaded profile changes and keeps profile cards unique", async () => {
    await loadOrCreateIdentity("vitalik.eth");
    await loadOrCreateIdentity("alice.sol");

    const state = await getBitClawMainState();
    const html = renderHtml(await BitClawPage());

    expect(state.loadedIdentity?.profile.publicLabel).toBe("alice.sol");
    expect(html).toContain("alice.sol");
    expect(html).not.toContain("vitalik.eth / #RA-vitalik.eth");

    const uniqueProfileIds = new Set(state.profiles.map((profile) => profile.id));
    expect(uniqueProfileIds.size).toBe(state.profiles.length);
  });
});
