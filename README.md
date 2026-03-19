# GoonClaw

GoonClaw is a Next.js control surface for token-driven device sessions, livestream payments, crypto news, and tokenized-agent operations.

The public deployment is hosted on Firebase App Hosting in Google Cloud, and the agent model scaffold now targets Vertex AI Gemini via the Google Gen AI SDK.

## Surfaces

- `/eligibility`: wallet lookup plus manual subscription cNFT claim
- `/goonclaw`: personal panel with chart, video or stream embed, saved-device control, news, and agent status
- `/livestream`: public stream panel with chart, payment queue, news, and device-control requests
- `/launchonomics`: legacy route for the eligibility checker
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
- `@google/genai`

## Agent Model Scaffold

- subscription cNFTs are now sent manually after an eligibility check
- creator fees default to `50%` cNFT pool and `50%` buybacks
- reserve floor defaults to `1 SOL`
- LaunchONomics determines whether a wallet qualifies for a subscription cNFT
- invoice preview readiness is exposed through `/api/agent/status`
- hosted model defaults to `gemini-2.5-flash` on Vertex AI

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
- Vertex AI Gemini project, region, and model overrides

## Hosting

- Firebase project: `goonclaw-app`
- App Hosting URL: `https://goonclaw--goonclaw-app.us-east4.hosted.app`
- App Hosting backend: `goonclaw`
- Vertex AI access is granted to the App Hosting compute service account with `roles/aiplatform.user`

## Notes

- The news panel is wired against the `cryptocurrency.cv` API surfaced by the `free-crypto-news` reference.
- The UI theme is tuned toward the Solana Launchpad UI reference, while agent and audit work is documented in `docs/reference-stack.md`.
