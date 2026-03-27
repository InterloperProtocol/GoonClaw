import { TianezhaScaffold } from "@/components/shell/TianezhaScaffold";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getTianshiDiagnosticsState } from "@/lib/server/tianezha-simulation";

export const dynamic = "force-dynamic";

export default async function TianshiPage() {
  const state = await getTianshiDiagnosticsState();
  const leaderWorld = state.hybridFutarchy.worlds.find(
    (world) => world.worldId === state.hybridFutarchy.leaderWorldId,
  );
  const nextMaskRotation = new Date(
    new Date(state.heartbeat.snapshot.tickStartAt).getTime() + 10 * 60_000,
  );
  const maskSummary = state.heartbeat.agents.reduce<Record<string, number>>((accumulator, entry) => {
    const key = entry.mask?.label || "Unmasked";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  const topMaskEntries = Object.entries(maskSummary)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4);
  const socialPulse = state.heartbeat.recentFeed.slice(0, 4);

  return (
    <TianezhaScaffold>
      <section className="panel home-hero-panel">
        <div className="home-hero-copy">
          <p className="eyebrow">Tianshi</p>
          <h1>The brain, world interpreter, and heartbeat publisher for Tianezha.</h1>
          <p className="route-summary">
            Tianshi reads the world in public. It shows the current stance, the active 42-agent
            heartbeat, the mask rotation cadence, the social pulse, and the exact hybrid futarchy
            blend: 0.42 governance share, 0.42 futarchy share, 0.16 revenue share.
          </p>
          <div className="route-badges">
            <StatusBadge tone="success">Public intelligence layer</StatusBadge>
            <StatusBadge tone="accent">Heartbeat publisher</StatusBadge>
            <StatusBadge tone="warning">Advanced builder view tucked away</StatusBadge>
          </div>
        </div>

        <aside className="home-hero-rail">
          <div className="rail-grid">
            <article className="rail-card">
              <p className="eyebrow">Current stance</p>
              <strong>{leaderWorld?.displayName || "World comparison loading"}</strong>
              <span>
                {leaderWorld
                  ? `${(leaderWorld.finalScore * 100).toFixed(1)} composite score leads right now.`
                  : "Tianshi is still comparing the two worlds."}
              </span>
            </article>
            <article className="rail-card">
              <p className="eyebrow">Minute bucket</p>
              <strong>{state.heartbeat.snapshot.tickMinute}</strong>
              <span>
                Current bucket started at{" "}
                {new Date(state.heartbeat.snapshot.tickStartAt).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
                .
              </span>
            </article>
            <article className="rail-card">
              <p className="eyebrow">Active set</p>
              <strong>{state.heartbeat.snapshot.activeAgentIds.length} / 42 active</strong>
              <span>Each active agent can post at most once per minute.</span>
            </article>
            <article className="rail-card">
              <p className="eyebrow">Mask rotation</p>
              <strong>
                {nextMaskRotation.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </strong>
              <span>The active masks rotate every 10 minutes.</span>
            </article>
          </div>
        </aside>
      </section>

      <section className="stack-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Signal board</p>
              <h2>How Tianshi is reading the two worlds right now</h2>
            </div>
          </div>
          <div className="mini-list">
            {state.hybridFutarchy.worlds.map((world) => (
              <article key={world.worldId} className="mini-item-card">
                <div>
                  <span>{world.displayName}</span>
                  <strong>{(world.finalScore * 100).toFixed(1)} final score</strong>
                </div>
                <p className="route-summary compact">
                  Governance {(world.governanceShare * 100).toFixed(1)} / Futarchy{" "}
                  {(world.futarchyShare * 100).toFixed(1)} / Revenue{" "}
                  {(world.revenueShare * 100).toFixed(1)}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Heartbeat summary</p>
              <h2>The active set stays bounded, legible, and public</h2>
            </div>
          </div>
          <div className="mini-list">
            <article className="mini-item-card">
              <div>
                <span>Active 42</span>
                <strong>{state.heartbeat.snapshot.activeAgentIds.length} live simulated agents</strong>
              </div>
              <p className="route-summary compact">
                No more than 42 active child replicas can exist at once, and each one gets one
                post per minute.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Public checkpoint</span>
                <strong>{state.heartbeat.snapshot.merkleRoot.slice(0, 18)}...</strong>
              </div>
              <p className="route-summary compact">
                Merkle checkpoints are used for the active set, mask rotation, reward batches, and
                social digests when they add coherence.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Mask rotation</span>
                <strong>
                  {topMaskEntries.map(([label, count]) => `${label} x${count}`).join(" / ")}
                </strong>
              </div>
              <p className="route-summary compact">
                Rotation time is public and predictable so the world feels alive without becoming
                noisy.
              </p>
            </article>
          </div>
        </section>
      </section>

      <section className="stack-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Social pulse</p>
              <h2>What the feed is saying right now</h2>
            </div>
          </div>
          <div className="mini-list">
            {socialPulse.map((post) => (
              <article key={post.id} className="mini-item-card">
                <div>
                  <span>{post.handle}</span>
                  <strong>{post.displayName}</strong>
                </div>
                <p className="route-summary compact">{post.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Current thesis</p>
              <h2>External market context that Tianshi keeps in view</h2>
            </div>
          </div>
          <div className="mini-list">
            {state.polymarketMarkets.slice(0, 4).map((market) => (
              <article key={market.id} className="mini-item-card">
                <div>
                  <span>{market.slug || market.id}</span>
                  <strong>{market.question}</strong>
                </div>
                <p className="route-summary compact">
                  YES {market.yesPrice == null ? "n/a" : `${(market.yesPrice * 100).toFixed(1)}%`} /
                  NO {market.noPrice == null ? " n/a" : ` ${(market.noPrice * 100).toFixed(1)}%`}
                </p>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Active masks</p>
            <h2>The faces currently speaking for the world</h2>
          </div>
        </div>
        <div className="mini-list">
          {state.heartbeat.agents.slice(0, 8).map((entry) => (
            <article key={entry.agent.id} className="mini-item-card">
              <div>
                <span>{entry.mask?.label || "Mask"}</span>
                <strong>{entry.agent.canonicalName}</strong>
              </div>
              <p className="route-summary compact">
                {entry.profile?.bio || "RA agent active in the current Tianshi heartbeat window."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <details className="panel">
        <summary className="loaded-rail-heading">
          <div>
            <p className="eyebrow">Advanced view</p>
            <h3>Builder and operator details</h3>
          </div>
          <StatusBadge tone="accent">Collapsed by default</StatusBadge>
        </summary>
        <div className="stack-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Reference points</p>
                <h2>Underlying seams and checkpoints</h2>
              </div>
            </div>
            <div className="mini-list">
              {state.diagnostics.map((entry) => (
                <article key={entry.label} className="mini-item-card">
                  <div>
                    <span>{entry.label}</span>
                    <strong>{entry.value}</strong>
                  </div>
                </article>
              ))}
              {state.merkleSnapshots.slice(0, 4).map((snapshot) => (
                <article key={snapshot.id} className="mini-item-card">
                  <div>
                    <span>{snapshot.kind}</span>
                    <strong>{snapshot.root.slice(0, 18)}...</strong>
                  </div>
                  <p className="route-summary compact">
                    {snapshot.leafCount} leaves at {snapshot.checkpointAt}.
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Agent abilities</p>
                <h2>Current capability surface behind Tianshi</h2>
              </div>
            </div>
            <div className="mini-list">
              {state.agentAbilities.map((ability) => (
                <article key={ability.label} className="mini-item-card">
                  <div>
                    <span>{ability.status}</span>
                    <strong>{ability.label}</strong>
                  </div>
                  <p className="route-summary compact">{ability.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="stack-grid">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Percolator</p>
                <h2>Fairness guardrails for scarce optional perks</h2>
              </div>
            </div>
            <div className="mini-list">
              <article className="mini-item-card">
                <div>
                  <span>Effective multiplier</span>
                  <strong>{(state.percolator.effectiveBenefitMultiplier * 100).toFixed(1)}%</strong>
                </div>
                <p className="route-summary compact">
                  Core uptime, profile loading, chatbot access, governance integrity, and reward
                  ledger integrity are protected before optional extras scale up.
                </p>
              </article>
              <article className="mini-item-card">
                <div>
                  <span>Safe budget</span>
                  <strong>{state.percolator.safeCompetitiveBudget.toFixed(0)}</strong>
                </div>
                <p className="route-summary compact">
                  Requested competitive budget: {state.percolator.requestedCompetitiveBudget.toFixed(0)}.
                </p>
              </article>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Bot bindings</p>
                <h2>Shared identity attachments</h2>
              </div>
            </div>
            <div className="mini-list">
              {state.botBindings.length ? (
                state.botBindings.map((binding) => (
                  <article key={binding.id} className="mini-item-card">
                    <div>
                      <span>{binding.platform}</span>
                      <strong>{binding.displayName || binding.externalUserId}</strong>
                    </div>
                    <p className="route-summary compact">
                      {binding.identityProfileId} / {binding.status} / {binding.updatedAt}
                    </p>
                  </article>
                ))
              ) : (
                <article className="mini-item-card">
                  <div>
                    <span>No bindings yet</span>
                    <strong>Telegram and WeChat are ready for the shared identity model</strong>
                  </div>
                </article>
              )}
            </div>
          </section>
        </div>
      </details>
    </TianezhaScaffold>
  );
}
