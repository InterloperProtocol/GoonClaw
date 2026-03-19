# GoonClaw

GoonClaw is a Next.js control surface for token-driven device sessions, livestream payments, crypto news, and tokenized-agent operations.

## Surfaces

- `/goonclaw`: personal panel with chart, video or stream embed, saved-device control, news, and agent status
- `/livestream`: public stream panel with chart, payment queue, news, and device-control requests
- `/launchonomics`: wallet scoring for access tiers
- `/bagstroke` and `/personal`: legacy redirects to `/goonclaw`
- `/streamer`: legacy redirect to `/livestream`

## Integrated References

- `Refs/openclaw`: OpenClaw reference repo
- `Refs/free-crypto-news`: free crypto news API reference
- `Refs/solana-launchpad-ui`: UI theme reference
- `Refs/AuditKit`: audit reference material
- `PUMPREF/pump-fun-skills`: local pump-fun skill reference repo
- `~/.codex/skills/tokenized-agents`: installed Pump tokenized-agent Codex skill

## Packages

- `@pump-fun/pump-sdk`
- `@pump-fun/agent-payments-sdk`

## Agent Model Scaffold

- creator fees default to `50%` cNFT issuance and `50%` buybacks
- reserve floor defaults to `1 SOL`
- cNFT issuance cadence defaults to every `10 minutes`
- token-mint scanning arms automatically when `AGENT_TOKEN_MINT_ADDRESS` or `GOONCLAW_TOKEN_MINT` is configured
- invoice preview readiness is exposed through `/api/agent/status`

## Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Env Setup

Start from `.env.example`. The app is ready for later wiring of:

- GoonClaw token mint and burn values
- stream and video embed URLs
- cNFT collection, tree, and authority secrets
- Helius and Birdeye API keys
- agent payment currency and token mint addresses

## Notes

- The news panel is wired against the `cryptocurrency.cv` API surfaced by the `free-crypto-news` reference.
- The UI theme is tuned toward the Solana Launchpad UI reference, while agent and audit work is documented in `docs/reference-stack.md`.
