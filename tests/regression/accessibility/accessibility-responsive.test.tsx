import { readFileSync } from "fs";
import path from "path";

import React from "react";

import { AddressLoadForm } from "@/components/identity/AddressLoadForm";
import { GenDelvePanelClient } from "@/components/gendelve/GenDelvePanelClient";
import { NezhaOrderForm } from "@/components/nezha/NezhaOrderForm";
import { TianezhaChatClient } from "@/components/shell/TianezhaChatClient";
import { TianziTradeForm } from "@/components/tianzi/TianziTradeForm";
import { renderHtml } from "@/tests/regression/helpers/render";

describe("accessibility and responsive sanity", () => {
  it("keeps labels attached to the primary inputs and buttons in core flows", () => {
    const addressHtml = renderHtml(
      <AddressLoadForm ctaLabel="Enter world" helperText="Test helper" />,
    );
    const tianziHtml = renderHtml(<TianziTradeForm questionId="tianzi:test" />);
    const nezhaHtml = renderHtml(<NezhaOrderForm marketId="nezha:test" />);
    const chatHtml = renderHtml(
      <TianezhaChatClient initialMessage="Hello" heading="Chat" placeholder="Ask something" />,
    );
    const gendelveHtml = renderHtml(
      <GenDelvePanelClient
        intents={[]}
        ownerChallenge={null}
        verificationTargets={{
          bnb: "0x8f31a56bc0d4f1ed90aa5d79f501ab3419810def",
          solana: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
        }}
        worlds={[
          {
            chain: "solana",
            displayName: "$CAMIUP Solana Pump World",
            id: "camiup-sol",
            requiredTokenAmount: "1",
            tokenAddress: "So11111111111111111111111111111111111111112",
            verificationTarget: "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
          },
        ]}
      />,
    );

    expect(addressHtml).toContain("Identity input");
    expect(addressHtml).toContain("Enter world");
    expect(tianziHtml).toContain("Side");
    expect(tianziHtml).toContain("Stake");
    expect(nezhaHtml).toContain("Side");
    expect(nezhaHtml).toContain("Quantity");
    expect(nezhaHtml).toContain("Leverage");
    expect(chatHtml).toContain("Message");
    expect(chatHtml).toContain("Send");
    expect(gendelveHtml).toContain("World");
    expect(gendelveHtml).toContain("Vote");
    expect(gendelveHtml).toContain("Receipt id");
  });

  it("includes visible focus rules and mobile layout rules for the homepage grid and right rail", () => {
    const css = readFileSync(path.resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(css).toContain(":focus-visible");
    expect(css).toContain(".module-grid-3x2");
    expect(css).toContain(".loaded-rail-shell");
    expect(css).toContain("@media (max-width: 1180px)");
    expect(css).toContain("@media (max-width: 720px)");
    expect(css).toContain("overflow-wrap: anywhere");
  });
});
