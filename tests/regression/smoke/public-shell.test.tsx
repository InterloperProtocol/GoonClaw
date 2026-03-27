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

  it("renders the left shell before profile load with chatbot guidance and address entry help", async () => {
    const html = renderHtml(await LoadedIdentityRail());

    expect(html).toContain("Tianezha chat");
    expect(html).toContain("Wallet loader");
    expect(html).toContain("Enter the world");
    expect(html).toContain("Guide, teach, and dispatch live opportunities");
    expect(html).toContain("Enter any wallet, ENS, SNS, or .bnb name.");
  });

  it("updates the left shell after profile load and keeps the loaded identity visible", async () => {
    const loaded = await loadOrCreateIdentity("vitalik.eth");

    const html = renderHtml(await LoadedIdentityRail());

    expect(html).toContain("Hermes is riding with");
    expect(html).toContain("Switch or rebuild your character");
    expect(html).toContain(loaded.profile.displayName);
    expect(html).toContain(loaded.profile.simulationHandle);
    expect(html).toContain("Wallet-Hermes");
    expect(html).toContain("Take the live Tianzi position");
  });
});
