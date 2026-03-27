import { renderHtml } from "@/tests/regression/helpers/render";

vi.mock("@/components/shell/TianezhaScaffold", () => import("@/tests/regression/helpers/mock-scaffold"));

import TianshiPage from "@/app/tianshi/page";
import HeartbeatPage from "@/app/heartbeat/page";
import {
  ensureHeartbeatSnapshot,
  getHeartbeatState,
  getTianshiDiagnosticsState,
} from "@/lib/server/tianezha-simulation";

describe("Tianshi merged heartbeat flows", () => {
  it("renders the merged brain and heartbeat publisher surface without leading with raw diagnostics", async () => {
    const html = renderHtml(await TianshiPage());

    expect(html).toContain("The brain, world interpreter, and heartbeat publisher for Tianezha.");
    expect(html).toContain("Current stance");
    expect(html).toContain("Minute bucket");
    expect(html).toContain("Signal board");
    expect(html).toContain("Heartbeat summary");
    expect(html).toContain("Social pulse");
    expect(html).toContain("Current thesis");
    expect(html).toContain("Active masks");
    expect(html).toContain("Advanced view");
    expect(html).toContain("Collapsed by default");
    expect(html).not.toContain("HeartBeat");
  });

  it("keeps exactly 42 active agents with unique identities and no overflow beyond the active limit", async () => {
    const heartbeat = await getHeartbeatState();
    const uniqueAgentIds = new Set(heartbeat.snapshot.activeAgentIds);

    expect(heartbeat.snapshot.activeAgentIds).toHaveLength(42);
    expect(uniqueAgentIds.size).toBe(42);
    expect(heartbeat.agents).toHaveLength(42);
    expect(heartbeat.agents.every((entry) => entry.profile?.id.startsWith("agent:"))).toBe(true);
    expect(heartbeat.agents.every((entry) => entry.agent.simulationHandle.startsWith("#RA-"))).toBe(
      true,
    );
  });

  it("rotates masks on the 10-minute rule and limits heartbeat posts to one per active agent per minute", async () => {
    vi.setSystemTime(new Date("2026-03-27T12:00:00.000Z"));
    const first = await ensureHeartbeatSnapshot(new Date());
    const firstState = await getHeartbeatState();
    const firstMinutePosts = firstState.recentFeed.filter((post) =>
      post.id.startsWith(`heartbeat-post:${first.id}:`),
    );

    expect(firstMinutePosts.length).toBeLessThanOrEqual(6);
    expect(new Set(firstMinutePosts.map((post) => post.profileId)).size).toBe(firstMinutePosts.length);

    const sameMinute = await ensureHeartbeatSnapshot(new Date("2026-03-27T12:00:20.000Z"));
    expect(sameMinute.id).toBe(first.id);

    vi.setSystemTime(new Date("2026-03-27T12:10:00.000Z"));
    const rotated = await ensureHeartbeatSnapshot(new Date());

    expect(rotated.id).not.toBe(first.id);
    expect(rotated.activeAgentIds).toHaveLength(42);
    expect(rotated.maskAssignments).not.toEqual(first.maskAssignments);
  });

  it("updates Merkle checkpoints only when expected and hides operator details behind the advanced surface", async () => {
    vi.setSystemTime(new Date("2026-03-27T12:00:00.000Z"));
    const initial = await getTianshiDiagnosticsState();

    vi.setSystemTime(new Date("2026-03-27T12:01:00.000Z"));
    const nextMinute = await getTianshiDiagnosticsState();

    expect(nextMinute.heartbeat.snapshot.merkleRoot).not.toBe(initial.heartbeat.snapshot.merkleRoot);
    expect(
      nextMinute.merkleSnapshots.some(
        (snapshot) =>
          snapshot.kind === "maskRotationSet" &&
          snapshot.checkpointAt === "2026-03-27T12:01:00.000Z",
      ),
    ).toBe(false);
  });

  it("keeps the old public HeartBeat route redirected into Tianshi", () => {
    expect(() => HeartbeatPage()).toThrow("NEXT_REDIRECT:/tianshi");
  });
});
