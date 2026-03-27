import React from "react";

import { expectInOrder, renderHtml } from "@/tests/regression/helpers/render";

import { loadOrCreateIdentity } from "@/lib/server/tianezha-simulation";
import { LoadedIdentityRail } from "@/components/identity/LoadedIdentityRail";
import { SiteNav } from "@/components/SiteNav";

describe("public shell smoke", () => {
  it("renders the public nav in the final module order without a HeartBeat entry", () => {
    globalThis.__testPathname = "/";

    const html = renderHtml(<SiteNav />);

    expectInOrder(html, [
      "BitClaw",
      "BolClaw",
      "Tianzi",
      "Nezha",
      "Tianshi",
      "GenDelve",
    ]);
    expect(html).not.toContain("HeartBeat");
    expect(html).not.toContain(">Livestream<");
  });

  it("renders the right rail before profile load with chatbot guidance and address entry help", async () => {
    const html = renderHtml(await LoadedIdentityRail());

    expect(html).toContain("Tianezha rail");
    expect(html).toContain("Enter the world");
    expect(html).toContain("Tianezha chat");
    expect(html).toContain("Ask how Tianezha works");
    expect(html).toContain("No signup. No wallet connect.");
    expect(html).toContain("BitClaw first, then the full world opens");
  });

  it("updates the right rail after profile load and keeps the loaded identity visible", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");

    const html = renderHtml(await LoadedIdentityRail());

    expect(html).toContain("Your loaded profile and world state");
    expect(html).toContain("Ask about your loaded world");
    expect(html).toContain(loaded.profile.displayName);
    expect(html).toContain(loaded.profile.simulationHandle);
    expect(html).toContain("Simulated fantasy layer");
    expect(html).toContain("World summary");
  });
});
