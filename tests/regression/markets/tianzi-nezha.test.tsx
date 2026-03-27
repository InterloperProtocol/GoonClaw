import { renderHtml } from "@/tests/regression/helpers/render";

vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));

import BitClawPage from "@/app/bitclaw/page";
import HomePage from "@/app/page";
import NezhaPage from "@/app/nezha/page";
import TianziPage from "@/app/tianzi/page";
import {
  getCurrentLoadedIdentity,
  getNezhaState,
  getTianziState,
  loadOrCreateIdentity,
  placePerpOrder,
  placePredictionStake,
} from "@/lib/server/tianezha-simulation";

describe("Tianzi and Nezha market flows", () => {
  it("renders the current Tianzi market and keeps homepage preview copy consistent", async () => {
    const tianzi = await getTianziState();
    const homeHtml = renderHtml(await HomePage());
    const tianziHtml = renderHtml(await TianziPage());

    expect(tianziHtml).toContain(tianzi.question.title);
    expect(tianziHtml).toContain("FinalScore = 0.42 governance + 0.42 futarchy + 0.16 revenue.");
    expect(homeHtml).toContain(tianzi.question.title);
  });

  it("places a simulated Tianzi position and reflects it back into BitClaw history", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");
    const before = await getTianziState(loaded.profile.id);

    await placePredictionStake({
      profileId: loaded.profile.id,
      questionId: before.question.id,
      selection: "yes",
      stake: 25,
    });

    const after = await getTianziState(loaded.profile.id);
    const bitclawHtml = renderHtml(await BitClawPage());

    expect(after.profilePositions).toHaveLength(1);
    expect(after.profilePositions[0]?.selection).toBe("yes");
    expect(after.profilePositions[0]?.stake).toBe(25);
    expect(bitclawHtml).toContain("Tianzi history");
    expect(bitclawHtml).toContain("1 positions");
  });

  it("resolves closed Tianzi markets and rejects new stakes after close", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");
    const initial = await getTianziState(loaded.profile.id);

    vi.setSystemTime(new Date(new Date(initial.question.closesAt).getTime() + 60_000));

    const resolved = await getTianziState(loaded.profile.id);

    expect(resolved.question.id).not.toBe(initial.question.id);
    await expect(
      placePredictionStake({
        profileId: loaded.profile.id,
        questionId: initial.question.id,
        selection: "no",
        stake: 10,
      }),
    ).rejects.toThrow("That Tianzi question is no longer open");
  });

  it("opens long and short Nezha positions, supports closing, and persists position state across refresh", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");
    expect(loaded.verification.verificationTick).toBe(false);

    const initial = await getNezhaState(loaded.profile.id);
    const [firstMarket, secondMarket] = initial.markets;
    expect(firstMarket).toBeTruthy();
    expect(secondMarket).toBeTruthy();

    await placePerpOrder({
      leverage: 2,
      marketId: firstMarket!.id,
      orderType: "market",
      profileId: loaded.profile.id,
      quantity: 5,
      reduceOnly: false,
      side: "long",
    });
    await placePerpOrder({
      leverage: 3,
      marketId: secondMarket!.id,
      orderType: "market",
      profileId: loaded.profile.id,
      quantity: 4,
      reduceOnly: false,
      side: "short",
    });

    const withPositions = await getNezhaState(loaded.profile.id);
    const longPosition = withPositions.positions.find((position) => position.marketId === firstMarket!.id);
    const shortPosition = withPositions.positions.find((position) => position.marketId === secondMarket!.id);

    expect(longPosition).toBeTruthy();
    expect(longPosition?.side).toBe("long");
    expect(longPosition?.entryPrice).toBeGreaterThan(0);
    expect(longPosition?.markPrice).toBeGreaterThan(0);
    expect(longPosition?.leverage).toBe(2);
    expect(longPosition?.liquidationPrice).toBeGreaterThan(0);
    expect(typeof longPosition?.pnlUnrealized).toBe("number");
    expect(shortPosition?.side).toBe("short");

    await placePerpOrder({
      leverage: 2,
      marketId: firstMarket!.id,
      orderType: "market",
      profileId: loaded.profile.id,
      quantity: 5,
      reduceOnly: true,
      side: "short",
    });

    const afterClose = await getNezhaState(loaded.profile.id);
    expect(afterClose.positions.some((position) => position.marketId === firstMarket!.id)).toBe(
      false,
    );
    expect(afterClose.positions.some((position) => position.marketId === secondMarket!.id)).toBe(
      true,
    );

    const refreshed = await getNezhaState(loaded.profile.id);
    expect(refreshed.positions).toEqual(afterClose.positions);
  });

  it("updates BitClaw history for Nezha and swaps visible market history when profiles switch", async () => {
    const first = await loadOrCreateIdentity("vitalik.eth");
    const firstMarkets = await getNezhaState(first.profile.id);

    await placePerpOrder({
      leverage: 2,
      marketId: firstMarkets.markets[0]!.id,
      orderType: "market",
      profileId: first.profile.id,
      quantity: 3,
      reduceOnly: false,
      side: "long",
    });

    const firstBitclawHtml = renderHtml(await BitClawPage());
    expect(firstBitclawHtml).toContain("Nezha history");
    expect(firstBitclawHtml).toContain("1 live positions");

    const second = await loadOrCreateIdentity("alice.sol");
    const secondState = await getNezhaState(second.profile.id);
    const currentLoaded = await getCurrentLoadedIdentity();
    const nezhaHtml = renderHtml(await NezhaPage());

    expect(currentLoaded?.profile.id).toBe(second.profile.id);
    expect(secondState.positions).toHaveLength(0);
    expect(nezhaHtml).toContain("No positions yet");
  });
});
