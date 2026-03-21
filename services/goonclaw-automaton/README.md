# GoonClaw Automaton Service

This directory holds the in-repo autonomous runtime assets for GoonClaw.

## Runtime goals

- Google Cloud only
- Vertex AI Gemini only
- Solana + USDC only
- Public status wall, no public chat or public controls
- Owner-only intervention through the hidden admin dashboard

## Local runtime entrypoint

Run the in-process heartbeat loop with:

```bash
npx tsx services/goonclaw-automaton/runtime-loop.ts
```

This loop is a bridge until the dedicated GCE VM is the sole runtime host.

## GCE deployment shape

- Dedicated Compute Engine VM
- `systemd` managed runtime using `deploy/gce/goonclaw-autonomous.service`
- Google service account for Vertex auth
- Local persistent `.data` state on attached disk
- Cloud Logging and Monitoring for host-level telemetry

## Bundled dependencies

- `solana-agent-kit` is the primary onchain execution layer
- `solana-mcp` is configured as an MCP bridge in [`mcp/solana-mcp.config.json`](/c:/SessionMint/BagStroker/services/goonclaw-automaton/mcp/solana-mcp.config.json)
- `sendaifun/skills` is bundled into [`vendor/sendaifun-skills-bundle`](/c:/SessionMint/BagStroker/services/goonclaw-automaton/vendor/sendaifun-skills-bundle)

## Environment

Expected environment variables include:

- `GOONCLAW_OWNER_WALLET`
- `GOONCLAW_AGENT_WALLET_SECRET`
- `GOONCLAW_AGENT_RESERVE_FLOOR_SOL`
- `SOLANA_RPC_URL`
- `VERTEX_AI_PROJECT_ID`
- `VERTEX_AI_LOCATION`
- `VERTEX_AI_MODEL`
- `GOONCLAW_SKILLS_DIR`
- `GOONCLAW_AGENT_CONSTITUTION_PATH`
