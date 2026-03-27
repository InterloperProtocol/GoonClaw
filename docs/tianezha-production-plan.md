# Tianezha Integrated Production Plan v2

## Summary
- Save this plan in the repo and execute it incrementally without rewriting the whole app.
- Keep public names exactly `Tianezha`, `BitClaw`, `BolClaw`, `Tianzi`, `Nezha`, `Tianshi`, and `GenDelve`.
- Keep internal names `QE-1205Q` and `RA-#NAME` internal only.
- Keep the public exclusions locked: no livestreaming layer, no separate public HeartBeat page, no wallet connect for normal use, and no heavy cloned headers across pages.
- Use the existing scaffold pieces as the pivot rather than restarting the product.
- Treat the left-panel Tianezha chat as both the onboarding guide and the opportunity dispatcher for the financial RPG layer.

## Architecture
- Move the Tianezha chat to the permanent left rail on desktop.
- Keep the wallet/profile loader directly below the chat.
- Keep active page content in the center.
- Use the right side for contextual sidecards and world panels.
- On mobile, show the chat first, the loader second, then the rest of the world UI.
- Normalize raw EVM, raw Solana, ENS, SNS/`.sol`, `.bnb`, and other safe public wallet identities.
- Rebuild BitClaw from public data, seed simulation state, attach history, connect reward hooks, and lazy-create a wallet-bound Hermes companion.
- Keep Hermes external. Tianezha only owns thin adapters for context, formatting, publishing, public/private routing, and wallet-agent management.
- Keep HeartBeat merged into Tianshi.
- Keep Tianshi paused by default until enabled from the hidden admin panel.
- Replace the reward-ledger source of truth with one single-server simulated `$CAMIUP` chain over time.
- Keep the exact hybrid formula everywhere: `0.42 Governance Share + 0.42 Futarchy Share + 0.16 Revenue Share`.

## First Execution Slice
- Left panel shell layout.
- Persistent Tianezha chat.
- Wallet/profile loader below chat.
- Profile reconstruction hooks.
- Wallet-Hermes scaffolding.
- Opportunity-card scaffolding.
- Training/perk scaffolding.
- BitClaw fantasy generation and posting hook.
- Tianshi page structure and disabled-by-default gate.
- Hermes adapter scaffolding.
- Telegram extension scaffolding.
- Reward tracking hooks.

## Done Criteria
- UI exists.
- State persists.
- Actions work.
- Invalid input is handled.
- Naming is correct.
- Regression tests pass.

## No Feature Drops
- Keep the left-shell rule.
- Keep the wallet-Hermes rule.
- Keep the public/private agent split.
- Keep the Telegram split.
- Keep merged Tianshi/HeartBeat.
- Keep the shared human/agent simulation pool.
- Keep GenDelve narrow and real.
- Keep Percolator protections and Merkle coherence.
- Keep the new chat-driven financial RPG opportunity layer.
