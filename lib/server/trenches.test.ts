import { describe, expect, it } from "vitest";

import {
  buildFallbackTrenchesSummary,
  extractRecentPostSnippets,
  extractTwitterHandleFromUrls,
} from "@/lib/server/trenches";

describe("trenches helpers", () => {
  it("extracts an X handle from known social URLs", () => {
    expect(
      extractTwitterHandleFromUrls([
        "https://example.com",
        "https://x.com/TrenchWizard",
      ]),
    ).toBe("TrenchWizard");
  });

  it("pulls post-like snippets out of Jina X markdown", () => {
    const snippets = extractRecentPostSnippets(`
Title: Demo

## Demo posts

[Demo](https://x.com/demo)

[@demo](https://x.com/demo)

[22h](https://x.com/demo/status/1)

Building the cleanest Solana launch flow for meme traders.

Quote

[21h](https://x.com/demo/status/2)

We just shipped faster alerts and better chart context for the community.
`);

    expect(snippets).toEqual([
      "Building the cleanest Solana launch flow for meme traders.",
      "We just shipped faster alerts and better chart context for the community.",
    ]);
  });

  it("builds a readable fallback summary from token narratives", () => {
    expect(
      buildFallbackTrenchesSummary([
        {
          address: "pumpTokenOne",
          name: "Token One",
          symbol: "ONE",
          dexId: "pumpswap",
          pairUrl: "https://dexscreener.com/solana/one",
          marketCapUsd: 250_000,
          liquidityUsd: 40_000,
          volume24hUsd: 150_000,
          priceChange24hPct: 18,
          boostScore: 10,
          description: "An AI automation meme for builders.",
          twitterHandle: "tokenone",
          twitterUrl: "https://x.com/tokenone",
          websiteUrl: "https://token.one",
          recentPosts: ["Builders keep sharing AI agent automations and tooling."],
          narrative: "An AI automation meme for builders.",
        },
      ]),
    ).toContain("ONE are leading the current trench pulse");
  });
});
