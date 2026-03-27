# Simulation-First Refactor Plan

Date: 2026-03-27

This plan records the current Tianezha public-product refactor. It follows the updated product truth:

1. BitClaw
2. BolClaw
3. Tianzi
4. Nezha
5. Tianshi
6. GenDelve

## Audit

- Naming mismatches found:
  - Public nav still listed `HeartBeat` separately.
  - Loaded profile handles were still generated as `#ID-...` instead of `#RA-...`.
  - Tianshi hero copy still framed the page as diagnostics.
  - BolClaw still referenced `HeartBeat masks`.
  - GenDelve still described itself as the only live on-chain action instead of narrow governance.

- Shell mismatches found:
  - The right rail existed, but it did not include a persistent Tianezha chatbot.
  - The right rail was profile-heavy and not strong enough as a world guide.
  - Homepage chat lived in the body instead of the persistent rail.

- Product-model mismatches found:
  - Homepage still treated HeartBeat as a separate public concept.
  - BitClaw did not expose the required simulated personality, avatar, and qNFT layer.
  - Tianshi felt like a diagnostics page instead of a public intelligence layer.

## Page-by-page fix list

### Homepage

- Copy changes:
  - Make the first promise: enter wallet, rebuild profile, enter world.
  - Explain Tianezha as the shell, not one module in the grid.
  - Keep the exact hybrid futarchy formula visible.

- Component changes:
  - Reuse `AddressLoadForm` as the primary CTA.
  - Remove homepage-local chat dependency.

- Layout changes:
  - Use a 3x2 grid in the required order.
  - Keep supporting world cards outside the grid.

- Nav and shell changes:
  - Let the persistent right rail handle chat and profile guidance.

### BitClaw

- Copy changes:
  - Reframe as the center of identity, rewards, fantasy traits, and public posting.
  - Be explicit that personality, avatar, and qNFTs are simulated.

- Component changes:
  - Add a deterministic fantasy-layer panel.
  - Keep the existing BitClaw-to-BolClaw composer flow.

- Layout changes:
  - Put the loaded identity summary ahead of secondary profile lists.

### BolClaw

- Copy changes:
  - Keep BolClaw as the public square.
  - Tie every post back to BitClaw identity.

- Component changes:
  - Reuse BitClaw profile links everywhere.

- Layout changes:
  - Keep public feed first, world chatter second.

### Tianzi

- Copy changes:
  - Emphasize prediction + futarchy.
  - Repeat the exact 0.42 / 0.42 / 0.16 formula.

- Component changes:
  - Keep the current trading form.

- Layout changes:
  - Put world-score explanation alongside the active market.

### Nezha

- Copy changes:
  - Emphasize simulated perps tied to the loaded BitClaw profile.

- Component changes:
  - Keep the order-entry surface and positions list.

- Layout changes:
  - Preserve market cards, but keep the profile consequence language clearer.

### Tianshi

- Copy changes:
  - Replace diagnostics-first language with stance, heartbeat, pulse, and signal language.
  - Explain mask rotation and bounded active-set rules in public language.

- Component changes:
  - Reuse heartbeat and hybrid-futarchy state.
  - Move raw diagnostics behind collapsible advanced panels.

- Layout changes:
  - Lead with current stance, minute bucket, active 42, and mask rotation.

### GenDelve

- Copy changes:
  - Make GenDelve feel narrow and trustworthy.
  - Clarify that only Solana and BNB `$CAMIUP` matter for real governance.

- Component changes:
  - Keep verification and vote-intent flows, but avoid broad app-gating language.

- Layout changes:
  - Put governance actions before secondary explanatory panels.
