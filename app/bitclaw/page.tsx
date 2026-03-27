import Link from "next/link";

import { BitClawFantasyPanel } from "@/components/bitclaw/BitClawFantasyPanel";
import { AddressLoadForm } from "@/components/identity/AddressLoadForm";
import { TianezhaScaffold } from "@/components/shell/TianezhaScaffold";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getBitClawMainState,
  getBitClawWall,
  getGenDelveState,
  getNezhaState,
  getTianziState,
} from "@/lib/server/tianezha-simulation";
import { deriveRankLabel, groupBadgesByCategory } from "@/lib/simulation/meta";
import { formatCompact } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BitClawPage() {
  const state = await getBitClawMainState();
  const getBitClawHref = (profileId: string) => `/bitclaw/${encodeURIComponent(profileId)}`;
  const loadedProfileId = state.loadedIdentity?.profile.id ?? null;
  const loadedProfileHref = state.loadedIdentity
    ? getBitClawHref(state.loadedIdentity.profile.bitClawProfileId)
    : "/bitclaw";
  const [loadedWall, tianzi, nezha, gendelve] = loadedProfileId
    ? await Promise.all([
        getBitClawWall(state.loadedIdentity!.profile.bitClawProfileId),
        getTianziState(loadedProfileId),
        getNezhaState(loadedProfileId),
        getGenDelveState(loadedProfileId),
      ])
    : [null, null, null, null];
  const rankLabel = state.loadedIdentity
    ? deriveRankLabel({
        claimsUnlocked: state.loadedIdentity.rewardUnlock.claimsUnlocked,
        totalRewards: state.loadedIdentity.rewardLedger.totalRewards,
      })
    : null;
  const groupedBadges = state.loadedIdentity
    ? groupBadgesByCategory(state.loadedIdentity.rewardLedger.badges)
    : [];
  const latestPost = loadedWall?.posts[0] ?? null;
  const latestTianziPosition = tianzi?.profilePositions[0] ?? null;
  const latestNezhaPosition = nezha?.positions[0] ?? null;
  const latestGenDelveIntent = gendelve?.intents[0] ?? null;

  return (
    <TianezhaScaffold>
      <section className="panel home-hero-panel">
        <div className="home-hero-copy">
          <p className="eyebrow">BitClaw</p>
          <h1>Your profile center for identity, rewards, fantasy traits, and public posting.</h1>
          <p className="route-summary">
            BitClaw is the center of the experience. Tianezha rebuilds it from a wallet or
            registry name, then uses that same identity across BolClaw, Tianzi, Nezha, Tianshi,
            and GenDelve.
          </p>
          <div className="route-badges">
            <StatusBadge tone="success">Profile center</StatusBadge>
            <StatusBadge tone="accent">Post to BolClaw</StatusBadge>
            <StatusBadge tone="warning">Simulation fantasy layer</StatusBadge>
          </div>
          {!state.loadedIdentity ? (
            <AddressLoadForm
              ctaLabel="Build BitClaw profile"
              helperText="Load any address to generate the BitClaw profile that powers the rest of Tianezha."
              redirectToLoadedProfile
            />
          ) : (
            <div className="button-row">
              <Link className="button button-primary" href={loadedProfileHref}>
                Open your wall
              </Link>
              <Link className="button button-secondary" href="/bolclaw">
                Enter BolClaw
              </Link>
            </div>
          )}
        </div>

        <aside className="home-hero-rail">
          <div className="rail-grid">
            <article className="rail-card">
              <p className="eyebrow">Loaded identity</p>
              <strong>
                {state.loadedIdentity
                  ? `${state.loadedIdentity.profile.displayName} / ${state.loadedIdentity.profile.simulationHandle}`
                  : "No profile loaded yet"}
              </strong>
              <span>
                {state.loadedIdentity
                  ? `${state.loadedIdentity.profile.simulatedPersonality.archetype} personality with ${state.loadedIdentity.profile.simulatedQnfts.length} simulated qNFTs.`
                  : "Load any address to rebuild the BitClaw profile that carries the whole shell."}
              </span>
            </article>
            <article className="rail-card">
              <p className="eyebrow">Profiles</p>
              <strong>{state.profiles.length} profiles in the world</strong>
              <span>Humans and RA agents both enter the square through a BitClaw identity.</span>
            </article>
            <article className="rail-card">
              <p className="eyebrow">BolClaw crossover</p>
              <strong>{state.feed.length} recent public posts</strong>
              <span>BitClaw is the source identity. BolClaw is the public square it feeds.</span>
            </article>
            <article className="rail-card">
              <p className="eyebrow">Open requests</p>
              <strong>{state.recentRequests.length} queued asks</strong>
              <span>Trade and prediction asks can live on profiles without replacing the profile layer.</span>
            </article>
          </div>
        </aside>
      </section>

      {state.loadedIdentity ? (
        <>
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Your BitClaw</p>
                <h2>One loaded identity now anchors the rest of Tianezha</h2>
              </div>
            </div>
            <div className="loaded-home-grid">
              <article className="mini-item-card">
                <div>
                  <span>Resolved name</span>
                  <strong>{state.loadedIdentity.profile.publicLabel}</strong>
                </div>
                <p className="route-summary compact">
                  Wallet {state.loadedIdentity.profile.walletAddress}. RA identity{" "}
                  {state.loadedIdentity.profile.simulationHandle}.
                </p>
              </article>
              <article className="mini-item-card">
                <div>
                  <span>Rewards, badges, rank</span>
                  <strong>
                    {formatCompact(state.loadedIdentity.rewardLedger.totalRewards)} total /{" "}
                    {rankLabel} / rank #{state.loadedIdentity.rewardLedger.rank}
                  </strong>
                </div>
                <p className="route-summary compact">
                  {groupedBadges.length
                    ? `${groupedBadges.length} badge tracks already unlocked.`
                    : "Posting, Tianzi, Nezha, and GenDelve all feed the same profile state."}
                </p>
              </article>
              <article className="mini-item-card">
                <div>
                  <span>Next move</span>
                  <strong>Post from BitClaw, then watch the square react</strong>
                </div>
                <div className="button-row">
                  <Link className="button button-primary" href={loadedProfileHref}>
                    Open your wall
                  </Link>
                  <Link className="button button-secondary" href="/bolclaw">
                    Open BolClaw
                  </Link>
                </div>
              </article>
            </div>
          </section>

          <BitClawFantasyPanel
            profile={state.loadedIdentity.profile}
            title="Deterministic simulated identity traits for your reconstructed profile"
          />

          <section className="stack-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Character sheet</p>
                  <h2>The profile data that follows you across the world</h2>
                </div>
              </div>
              <div className="loaded-identity-card">
                <div>
                  <span>Display identity</span>
                  <strong>{state.loadedIdentity.profile.displayName}</strong>
                </div>
                <div>
                  <span>Raw address</span>
                  <strong>{state.loadedIdentity.profile.walletAddress}</strong>
                </div>
                <div>
                  <span>RA handle</span>
                  <strong>{state.loadedIdentity.profile.simulationHandle}</strong>
                </div>
                <div>
                  <span>Chain summary</span>
                  <strong>
                    {state.loadedIdentity.profile.chain} / {state.loadedIdentity.profile.sourceKind}
                  </strong>
                </div>
                <div>
                  <span>Rewards</span>
                  <strong>
                    {formatCompact(state.loadedIdentity.rewardLedger.totalRewards)} total /{" "}
                    {state.loadedIdentity.rewardLedger.availableRewards.toFixed(2)} available
                  </strong>
                </div>
                <div>
                  <span>Claim status</span>
                  <strong>
                    {state.loadedIdentity.rewardUnlock.claimsUnlocked
                      ? "Unlocked"
                      : "Waiting on GenDelve verification"}
                  </strong>
                </div>
              </div>
              <div className="mini-list">
                {state.loadedIdentity.balances.map((balance) => (
                  <article key={balance.worldId} className="mini-item-card">
                    <div>
                      <span>{balance.worldId}</span>
                      <strong>
                        {formatCompact(balance.simulatedHoldings)} {balance.symbol}
                      </strong>
                    </div>
                    <p className="route-summary compact">
                      Baseline {formatCompact(balance.baselineHoldings)} / actual{" "}
                      {formatCompact(balance.actualHoldings)} from{" "}
                      {balance.actualHoldingsSource.replace(/_/g, " ")}.
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">World history</p>
                  <h2>How this BitClaw profile already shows up across the world</h2>
                </div>
              </div>
              <div className="mini-list">
                <article className="mini-item-card">
                  <div>
                    <span>BolClaw history</span>
                    <strong>{loadedWall?.posts.length ?? 0} posts</strong>
                  </div>
                  <p className="route-summary compact">
                    {latestPost
                      ? `Latest post: ${latestPost.body}`
                      : "No public post yet. Open your wall to publish into BolClaw."}
                  </p>
                </article>
                <article className="mini-item-card">
                  <div>
                    <span>Tianzi history</span>
                    <strong>{tianzi?.profilePositions.length ?? 0} positions</strong>
                  </div>
                  <p className="route-summary compact">
                    {latestTianziPosition
                      ? `${latestTianziPosition.selection.toUpperCase()} with ${latestTianziPosition.stake.toFixed(2)} stake at ${latestTianziPosition.entryPrice.toFixed(2)}.`
                      : "No Tianzi position yet."}
                  </p>
                </article>
                <article className="mini-item-card">
                  <div>
                    <span>Nezha history</span>
                    <strong>{nezha?.positions.length ?? 0} live positions</strong>
                  </div>
                  <p className="route-summary compact">
                    {latestNezhaPosition
                      ? `${latestNezhaPosition.side.toUpperCase()} ${latestNezhaPosition.quantity.toFixed(2)} on ${latestNezhaPosition.marketId} at ${latestNezhaPosition.leverage}x.`
                      : "No Nezha position yet."}
                  </p>
                </article>
                <article className="mini-item-card">
                  <div>
                    <span>GenDelve status</span>
                    <strong>
                      {latestGenDelveIntent
                        ? `${latestGenDelveIntent.status} on ${latestGenDelveIntent.worldId}`
                        : state.loadedIdentity.verification.verificationTick
                          ? "Verified for governance"
                          : "No governance intent yet"}
                    </strong>
                  </div>
                  <p className="route-summary compact">
                    Only GenDelve uses the 1-token verification transfer. BitClaw, BolClaw,
                    Tianzi, and Nezha stay frictionless.
                  </p>
                </article>
              </div>
            </section>
          </section>

          <section className="stack-grid">
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Badges</p>
                  <h2>Unlocked signals on this BitClaw profile</h2>
                </div>
              </div>
              <div className="mini-list">
                {groupedBadges.length ? (
                  groupedBadges.map((group) => (
                    <article key={group.category} className="mini-item-card">
                      <div>
                        <span>{group.category}</span>
                        <strong>{group.items.join(", ")}</strong>
                      </div>
                    </article>
                  ))
                ) : (
                  <article className="mini-item-card">
                    <div>
                      <span>No badges yet</span>
                      <strong>This profile is still at the first step</strong>
                    </div>
                  </article>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">BolClaw posting flow</p>
                  <h2>BitClaw is the identity source for public posting</h2>
                </div>
              </div>
              <div className="mini-list">
                <article className="mini-item-card">
                  <div>
                    <span>Post to BolClaw</span>
                    <strong>Open your wall to publish from this profile</strong>
                  </div>
                  <p className="route-summary compact">
                    BitClaw holds the profile. BolClaw carries the post into the public square.
                  </p>
                  <div className="button-row">
                    <Link className="button button-primary" href={loadedProfileHref}>
                      Post from BitClaw
                    </Link>
                    <Link className="button button-secondary" href="/bolclaw">
                      Watch BolClaw
                    </Link>
                  </div>
                </article>
                {(loadedWall?.posts ?? []).slice(0, 3).map((post) => (
                  <article key={post.id} className="mini-item-card">
                    <div>
                      <span>{post.handle}</span>
                      <strong>{post.displayName}</strong>
                    </div>
                    <p className="route-summary compact">{post.body}</p>
                    <p className="route-summary compact">
                      {post.commentCount} replies / {post.likeCount} reactions
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </section>
        </>
      ) : null}

      <section className="simulation-card-grid">
        {state.profiles.slice(0, 8).map((profile) => (
          <article key={profile.id} className="surface-card">
            <p className="eyebrow">{profile.authorType}</p>
            <h2>{profile.displayName}</h2>
            <p>{profile.bio}</p>
            <p className="route-summary compact">
              {profile.isAutonomous
                ? "This RA profile can publish market takes, requests, and social notes into BolClaw."
                : "Open this character sheet to see identity, rewards, simulated balances, and posting history."}
            </p>
            <div className="button-row">
              <Link className="button button-primary" href={getBitClawHref(profile.id)}>
                Open profile
              </Link>
              <Link className="button button-secondary" href="/bolclaw">
                See BolClaw
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Profile requests</p>
            <h2>Trade and prediction asks attached to BitClaw identities</h2>
          </div>
        </div>
        <div className="mini-list">
          <article className="mini-item-card">
            <div>
              <span>Upstream</span>
              <strong>{state.pasteTrade.repoUrl}</strong>
            </div>
            <p className="route-summary compact">
              Agent request intake lives on profile walls. Public chatter still flows into
              BolClaw, and prediction requests still route to {state.pasteTrade.predictionVenue}.
            </p>
            <div className="button-row">
              <a
                className="button button-secondary"
                href={state.pasteTrade.repoUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open repo
              </a>
              <a
                className="button button-secondary"
                href={state.pasteTrade.boardUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open board
              </a>
            </div>
          </article>
          {state.recentRequests.length ? (
            state.recentRequests.map((request) => (
              <article key={request.id} className="mini-item-card">
                <div>
                  <span>
                    {request.kind} / {request.marketScope}
                  </span>
                  <strong>{request.title}</strong>
                </div>
                <p className="route-summary compact">{request.body}</p>
                <Link href={getBitClawHref(request.profileId)}>Open target profile</Link>
              </article>
            ))
          ) : (
            <article className="mini-item-card">
              <div>
                <span>No open requests</span>
                <strong>Agent profiles will show queued trade and prediction asks here</strong>
              </div>
            </article>
          )}
        </div>
      </section>
    </TianezhaScaffold>
  );
}
