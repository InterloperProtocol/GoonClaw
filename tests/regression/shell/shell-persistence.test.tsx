import { POST as postChat } from "@/app/api/tianezha/chat/route";
import { renderHtml } from "@/tests/regression/helpers/render";

vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));

import BitClawPage from "@/app/bitclaw/page";
import BolClawPage from "@/app/bolclaw/page";
import GenDelvePage from "@/app/gendelve/page";
import NezhaPage from "@/app/nezha/page";
import TianshiPage from "@/app/tianshi/page";
import TianziPage from "@/app/tianzi/page";
import { LoadedIdentityRail } from "@/components/identity/LoadedIdentityRail";
import {
  getCurrentLoadedIdentity,
  getNezhaState,
  getTianziState,
  loadOrCreateIdentity,
  placePerpOrder,
  placePredictionStake,
  createBitClawWallPost,
} from "@/lib/server/tianezha-simulation";

describe("shell persistence and Tianezha chatbot context", () => {
  it("guides anonymous users before profile load and answers through the Tianezha chat route", async () => {
    const railHtml = renderHtml(await LoadedIdentityRail());
    const response = await postChat(
      new Request("http://test.local/api/tianezha/chat", {
        body: JSON.stringify({ message: "what happens after I enter an address?" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const payload = (await response.json()) as {
      opportunities?: Array<{ title: string }>;
      quests?: Array<{ title: string }>;
      reply: string;
    };

    expect(railHtml).toContain("Wallet loader");
    expect(railHtml).toContain("Enter the world");
    expect(payload.reply).toContain("Enter a wallet address and I'll load your character.");
    expect(payload.opportunities?.length).toBeGreaterThan(0);
  });

  it("keeps one loaded identity synchronized across BitClaw, BolClaw, Tianzi, Nezha, Tianshi, and GenDelve", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");
    const tianzi = await getTianziState(loaded.profile.id);
    const nezha = await getNezhaState(loaded.profile.id);

    await createBitClawWallPost(loaded.profile.bitClawProfileId, "Persistent world post.");
    await placePredictionStake({
      profileId: loaded.profile.id,
      questionId: tianzi.question.id,
      selection: "yes",
      stake: 25,
    });
    await placePerpOrder({
      leverage: 2,
      marketId: nezha.markets[0]!.id,
      orderType: "market",
      profileId: loaded.profile.id,
      quantity: 2,
      reduceOnly: false,
      side: "long",
    });

    await expect(getCurrentLoadedIdentity()).resolves.toMatchObject({
      profile: { id: loaded.profile.id },
    });

    const railHtml = renderHtml(await LoadedIdentityRail());
    const bitclawHtml = renderHtml(await BitClawPage());
    const bolclawHtml = renderHtml(await BolClawPage());
    const tianziHtml = renderHtml(await TianziPage());
    const nezhaHtml = renderHtml(await NezhaPage());
    const tianshiHtml = renderHtml(await TianshiPage());
    const gendelveHtml = renderHtml(await GenDelvePage());

    expect(railHtml).toContain(loaded.profile.displayName);
    expect(railHtml).toContain("Wallet-Hermes");
    expect(bitclawHtml).toContain("Persistent world post.");
    expect(bitclawHtml).toContain("1 positions");
    expect(bolclawHtml).toContain("Persistent world post.");
    expect(tianziHtml).toContain(tianzi.question.title);
    expect(nezhaHtml).toContain("Open positions");
    expect(tianshiHtml).toContain("Paused by default");
    expect(gendelveHtml).toContain("GenDelve");
  });

  it("updates chatbot context when profiles switch", async () => {
    const first = await loadOrCreateIdentity("vitalik.eth");
    const firstReplyResponse = await postChat(
      new Request("http://test.local/api/tianezha/chat", {
        body: JSON.stringify({ message: "what is live right now?" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const firstReply = (await firstReplyResponse.json()) as { reply: string };

    const second = await loadOrCreateIdentity("alice.sol");
    const secondReplyResponse = await postChat(
      new Request("http://test.local/api/tianezha/chat", {
        body: JSON.stringify({ message: "what is live right now?" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
    );
    const secondReply = (await secondReplyResponse.json()) as { reply: string };

    expect(firstReply.reply).toContain(first.profile.displayName);
    expect(secondReply.reply).toContain(second.profile.displayName);
    expect(secondReply.reply).not.toContain(first.profile.displayName);
  });
});
