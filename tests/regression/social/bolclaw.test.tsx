import { upsertHumanBitClawProfile, addBitClawComment, toggleBitClawPostLike } from "@/lib/server/bitclaw";
import { renderHtml } from "@/tests/regression/helpers/render";

vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));

import BolClawPage from "@/app/bolclaw/page";
import {
  createBitClawWallPost,
  getBolClawState,
  loadOrCreateIdentity,
} from "@/lib/server/tianezha-simulation";

describe("BolClaw social flows", () => {
  it("loads the public feed with or without a profile and keeps the BitClaw source identity obvious", async () => {
    const publicHtml = renderHtml(await BolClawPage());
    expect(publicHtml).toContain("The public square for posts, replies, reactions, and world chatter.");
    expect(publicHtml).toContain("Load a BitClaw profile first");

    const loaded = await loadOrCreateIdentity("vitalik.eth");
    const loadedHtml = renderHtml(await BolClawPage());
    expect(loadedHtml).toContain(loaded.profile.displayName);
    expect(loadedHtml).toContain(loaded.profile.simulationHandle);
    expect(loadedHtml).toContain("BolClaw follows the BitClaw profile you already loaded");
  });

  it("shows new BitClaw posts in BolClaw and links authors back to the correct BitClaw profile", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");
    await createBitClawWallPost(
      loaded.profile.bitClawProfileId,
      "BolClaw should carry this world note.",
    );

    const html = renderHtml(await BolClawPage());

    expect(html).toContain("BolClaw should carry this world note.");
    expect(html).toContain(`/bitclaw/${encodeURIComponent(loaded.profile.bitClawProfileId)}`);
  });

  it("updates replies and reactions correctly across the shared feed", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");
    const created = await createBitClawWallPost(
      loaded.profile.bitClawProfileId,
      "React to this public square post.",
    );
    const viewer = await upsertHumanBitClawProfile({
      bio: "Watching BolClaw for thesis notes.",
      displayName: "Viewer Human",
      guestId: "viewer-guest",
      handle: "viewer-human",
    });

    await toggleBitClawPostLike({
      actorProfileId: viewer.id,
      postId: created.id,
    });
    await addBitClawComment({
      actorProfileId: viewer.id,
      body: "Reply attached.",
      postId: created.id,
    });

    const state = await getBolClawState();
    const updated = state.feed.find((entry) => entry.id === created.id);

    expect(updated?.likeCount).toBe(1);
    expect(updated?.commentCount).toBe(1);
    expect(updated?.comments[0]?.handle).toBe("viewer-human");
  });

  it("renders both human and RA-agent profiles in the social world and keeps empty personal history non-breaking", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");

    const state = await getBolClawState();
    expect(state.loadedIdentity?.profile.id).toBe(loaded.profile.id);
    expect(state.activeMasks.length).toBeGreaterThan(0);
    expect(state.activeMasks.every((entry) => entry.agent.simulationHandle.startsWith("#RA-"))).toBe(
      true,
    );

    const html = renderHtml(await BolClawPage());
    expect(html).toContain("No public post yet. Open your BitClaw wall to send the first one.");
    expect(html).toContain(loaded.profile.displayName);
  });
});
