# GoonClaw Reference Stack

This repo includes or depends on the following external references requested for the GoonClaw build.

## Local Refs

- `Refs/openclaw`
  - Source: `https://github.com/openclaw/openclaw`
  - Purpose: OpenClaw development reference for agent and tool workflows.

- `Refs/free-crypto-news`
  - Source: `https://github.com/nirholas/free-crypto-news`
  - Purpose: backs the in-app news panel through the `cryptocurrency.cv` news API.

- `Refs/solana-launchpad-ui`
  - Source: `https://github.com/nirholas/solana-launchpad-ui`
  - Purpose: visual direction for the GoonClaw dashboard theme.

- `Refs/AuditKit`
  - Source: `https://github.com/nirholas/AuditKit`
  - Purpose: auditing and review reference for later hardening.

- `PUMPREF/pump-fun-skills`
  - Source: `https://github.com/pump-fun/pump-fun-skills`
  - Purpose: local skill and reference repo for pump-fun agent flows.

## Installed Codex Skill

- `~/.codex/skills/tokenized-agents`
  - Installed from `pump-fun/pump-fun-skills`
  - Purpose: tokenized-agent workflow reference inside Codex.

## npm Packages

- `@pump-fun/pump-sdk`
  - Present in `package.json`
  - Used for Pump ecosystem integration work.

- `@pump-fun/agent-payments-sdk`
  - Present in `package.json`
  - Used in `lib/server/agent-ops.ts` to preview invoice PDA readiness.

## Panels Added

- Personal panel:
  - chart
  - video or stream embed
  - device control
  - crypto news
  - agent ops

- Livestream panel:
  - stream embed
  - chart
  - payment queue and request controls
  - crypto news
  - agent ops

## Agent Policy Captured In UI

- cNFTs are intended to be issued by the agent from creator-fee revenue
- `50%` of creator fees route to cNFT issuance by default
- the remainder routes to token buybacks
- the agent maintains a `1 SOL` reserve floor by default
- cNFT issuance cadence defaults to `10 minutes`
- the agent status panel reports whether token-mint scanning is armed
