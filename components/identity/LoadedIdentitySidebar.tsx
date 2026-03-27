import Link from "next/link";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { getSimChainSummary } from "@/lib/server/sim-chain";
import {
  getBitClawWall,
  getCurrentLoadedIdentity,
  getGenDelveState,
  getHeartbeatState,
  getNezhaState,
  getTianziState,
} from "@/lib/server/tianezha-simulation";
import { deriveRankLabel } from "@/lib/simulation/meta";
import { formatCompact } from "@/lib/utils";

export async function LoadedIdentitySidebar() {
  const loadedIdentity = await getCurrentLoadedIdentity();
  const loadedBitClawHref = loadedIdentity
    ? `/bitclaw/${encodeURIComponent(loadedIdentity.profile.bitClawProfileId)}`
    : "/bitclaw";
  const [wall, tianzi, nezha, gendelve, heartbeat] = loadedIdentity
    ? await Promise.all([
        getBitClawWall(loadedIdentity.profile.bitClawProfileId),
        getTianziState(loadedIdentity.profile.id),
        getNezhaState(loadedIdentity.profile.id),
        getGenDelveState(loadedIdentity.profile.id),
        getHeartbeatState(),
      ])
    : await Promise.all([
        Promise.resolve(null),
        getTianziState(),
        getNezhaState(),
        getGenDelveState(),
        getHeartbeatState(),
      ]);
  const simChain = getSimChainSummary();
  const rankLabel = loadedIdentity
    ? deriveRankLabel({
        claimsUnlocked: loadedIdentity.rewardUnlock.claimsUnlocked,
        totalRewards: loadedIdentity.rewardLedger.totalRewards,
      })
    : null;

  return (
    <div className="loaded-sidebar-shell">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">BitClaw state</p>
            <h2>{loadedIdentity ? "Your character sheet" : "World-side profile preview"}</h2>
          </div>
          {loadedIdentity ? (
            <StatusBadge tone={loadedIdentity.rewardUnlock.claimsUnlocked ? "success" : "warning"}>
              {loadedIdentity.rewardUnlock.claimsUnlocked ? "Rewards unlocked" : "Verification pending"}
            </StatusBadge>
          ) : null}
        </div>

        {!loadedIdentity ? (
          <div className="mini-list">
            <article className="mini-item-card">
              <div>
                <span>Identity rule</span>
                <strong>No signup. No wallet connect.</strong>
              </div>
              <p className="route-summary compact">
                Enter a wallet, ENS, SNS, or .bnb name and Tianezha rebuilds the profile state from
                there.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Financial RPG layer</span>
                <strong>Training, badges, streaks, and quests unlock after load</strong>
              </div>
              <p className="route-summary compact">
                The left-panel chat teaches the move. BitClaw, Tianzi, Nezha, and GenDelve remain
                the canonical play surfaces.
              </p>
            </article>
          </div>
        ) : (
          <div className="mini-list">
            <article className="mini-item-card">
              <div>
                <span>Profile</span>
                <strong>
                  {loadedIdentity.profile.displayName} / {loadedIdentity.profile.simulationHandle}
                </strong>
              </div>
              <p className="route-summary compact">
                Wallet {loadedIdentity.profile.walletAddress}. Rank {rankLabel} and #
                {loadedIdentity.rewardLedger.rank}.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Wallet-Hermes</span>
                <strong>
                  {loadedIdentity.walletHermesAgent?.companionLabel || "Companion unavailable"}
                </strong>
              </div>
              <p className="route-summary compact">
                {loadedIdentity.walletHermesAgent?.summary ||
                  "Hermes is not available yet for this wallet."}
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Fantasy layer</span>
                <strong>
                  {loadedIdentity.profile.simulatedPersonality.archetype} /{" "}
                  {loadedIdentity.profile.simulatedQnfts.length} qNFTs
                </strong>
              </div>
              <p className="route-summary compact">
                Personality, avatar, and qNFTs are simulated profile fantasy features that persist
                with the same wallet.
              </p>
            </article>
            <div className="button-row">
              <Link className="button button-primary" href={loadedBitClawHref}>
                Open BitClaw
              </Link>
              <Link className="button button-secondary" href="/bolclaw">
                Open BolClaw
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">World now</p>
            <h2>Simulation finance pulse</h2>
          </div>
        </div>
        <div className="mini-list">
          <article className="mini-item-card">
            <div>
              <span>Tianzi</span>
              <strong>{tianzi.question.title}</strong>
            </div>
            <p className="route-summary compact">
              YES {(tianzi.book.yesPrice * 100).toFixed(1)}%. The left chat can route you in when a
              new prediction window opens.
            </p>
          </article>
          <article className="mini-item-card">
            <div>
              <span>Nezha</span>
              <strong>
                {nezha.positions.length} positions / {nezha.markets.length} simulated books
              </strong>
            </div>
            <p className="route-summary compact">
              Practice long, short, leverage, and liquidation discipline without live custody.
            </p>
          </article>
          <article className="mini-item-card">
            <div>
              <span>Tianshi</span>
              <strong>
                {heartbeat.runtime.simulationEnabled
                  ? `${heartbeat.snapshot.activeAgentIds.length} / 42 active`
                  : "Paused until enabled from admin"}
              </strong>
            </div>
            <p className="route-summary compact">
              {heartbeat.runtime.note ||
                "The public brain narrates the world once the runtime is live."}
            </p>
          </article>
          <article className="mini-item-card">
            <div>
              <span>GenDelve</span>
              <strong>
                {gendelve.ownerChallenge ? "Verification ready" : `${gendelve.worlds.length} live worlds`}
              </strong>
            </div>
            <p className="route-summary compact">
              Only GenDelve uses the real 1-token verification transfer on Solana and BNB.
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Economics</p>
            <h2>Simulation chain and rewards</h2>
          </div>
        </div>
        <div className="mini-list">
          <article className="mini-item-card">
            <div>
              <span>Supply</span>
              <strong>{formatCompact(simChain.totalSupply)} total / {formatCompact(simChain.devWalletAllocation)} dev wallet</strong>
            </div>
            <p className="route-summary compact">
              The remaining {formatCompact(simChain.emissionPool)} emits through the simulated chain.
            </p>
          </article>
          <article className="mini-item-card">
            <div>
              <span>Block split</span>
              <strong>
                {Math.round(simChain.proofOfStakeShare * 100)}% holders / {Math.round(simChain.userRewardShare * 100)}% players
              </strong>
            </div>
            <p className="route-summary compact">
              Solana and BNB holder rewards are proportional. User lanes cover good data, Tianzi,
              Nezha, GenDelve, onboarding, and Proof of Loss.
            </p>
          </article>
          {loadedIdentity ? (
            <article className="mini-item-card">
              <div>
                <span>Profile rewards</span>
                <strong>
                  {formatCompact(loadedIdentity.rewardLedger.totalRewards)} total / {wall?.posts.length ?? 0} posts
                </strong>
              </div>
              <p className="route-summary compact">
                Rewards, badges, rank, and post history stay tied to this BitClaw identity.
              </p>
            </article>
          ) : null}
        </div>
      </section>
    </div>
  );
}
