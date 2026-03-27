import Link from "next/link";

import { AddressLoadForm } from "@/components/identity/AddressLoadForm";
import { TianezhaChatClient } from "@/components/shell/TianezhaChatClient";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

export async function LoadedIdentityRail() {
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

  const rankLabel = loadedIdentity
    ? deriveRankLabel({
        claimsUnlocked: loadedIdentity.rewardUnlock.claimsUnlocked,
        totalRewards: loadedIdentity.rewardLedger.totalRewards,
      })
    : null;
  const worldSummary = tianzi.worldQuotes.map(({ world }) => world.displayName).join(" / ");
  const railIntro = loadedIdentity
    ? `You are guiding ${loadedIdentity.profile.displayName} as ${loadedIdentity.profile.simulationHandle}. Explain their BitClaw profile, what BolClaw is saying, what Tianzi predicts, what Nezha is pricing, what Tianshi sees, and whether GenDelve is ready.`
    : "Explain Tianezha clearly. Tell the player to enter a wallet address or ENS, SNS, or .bnb name, then describe how BitClaw, BolClaw, Tianzi, Nezha, Tianshi, and GenDelve open after the profile is rebuilt.";

  return (
    <div className="loaded-rail-shell">
      <section className="panel loaded-rail-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Tianezha rail</p>
            <h2>{loadedIdentity ? "Your loaded profile and world state" : "Enter the world"}</h2>
          </div>
        </div>

        <AddressLoadForm
          ctaLabel={loadedIdentity ? "Rebuild profile" : "Enter world"}
          helperText="No signup. No wallet connect. Enter any address, ENS, SNS, or .bnb name."
        />

        {!loadedIdentity ? (
          <div className="mini-list">
            <article className="mini-item-card">
              <div>
                <span>What Tianezha is</span>
                <strong>Simulation-first financial RPG and social-finance world</strong>
              </div>
              <p className="route-summary compact">
                Enter a wallet or registry name and Tianezha rebuilds the BitClaw profile that
                anchors the rest of the shell.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>What happens after load</span>
                <strong>BitClaw first, then the full world opens</strong>
              </div>
              <p className="route-summary compact">
                BitClaw becomes your profile, BolClaw becomes your public square, and the same
                identity carries into Tianzi, Nezha, Tianshi, and GenDelve.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>World now</span>
                <strong>{heartbeat.snapshot.activeAgentIds.length} / 42 RA agents active</strong>
              </div>
              <p className="route-summary compact">
                Tianzi is asking {tianzi.question.title} while Nezha is pricing{" "}
                {nezha.markets.length} simulated perp books.
              </p>
            </article>
          </div>
        ) : (
          <div className="loaded-rail-sections">
            <section className="loaded-rail-section">
              <div className="loaded-rail-heading">
                <div>
                  <p className="eyebrow">Loaded profile</p>
                  <h3>{loadedIdentity.profile.displayName}</h3>
                </div>
                <StatusBadge tone={loadedIdentity.rewardUnlock.claimsUnlocked ? "success" : "warning"}>
                  {loadedIdentity.rewardUnlock.claimsUnlocked ? "Verified owner" : "Unverified wall"}
                </StatusBadge>
              </div>
              <div className="loaded-identity-card">
                <div>
                  <span>Resolved name</span>
                  <strong>{loadedIdentity.profile.publicLabel}</strong>
                </div>
                <div>
                  <span>Wallet</span>
                  <strong>{loadedIdentity.profile.walletAddress}</strong>
                </div>
                <div>
                  <span>RA identity</span>
                  <strong>{loadedIdentity.profile.simulationHandle}</strong>
                </div>
                <div>
                  <span>Chain summary</span>
                  <strong>
                    {loadedIdentity.profile.chain} / {loadedIdentity.profile.sourceKind}
                  </strong>
                </div>
                <div>
                  <span>Rewards and rank</span>
                  <strong>
                    {formatCompact(loadedIdentity.rewardLedger.totalRewards)} / {rankLabel} / #
                    {loadedIdentity.rewardLedger.rank}
                  </strong>
                </div>
                <div>
                  <span>BitClaw posting</span>
                  <strong>{wall?.posts.length ?? 0} public posts</strong>
                </div>
              </div>
              <article className="mini-item-card">
                <div>
                  <span>Simulated fantasy layer</span>
                  <strong>
                    {loadedIdentity.profile.simulatedPersonality.archetype} /{" "}
                    {loadedIdentity.profile.simulatedQnfts.length} qNFTs
                  </strong>
                </div>
                <p className="route-summary compact">
                  Personality, avatar, and qNFTs are simulated profile fantasy elements, not live
                  custody assets.
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
            </section>

            <section className="loaded-rail-section">
              <div className="loaded-rail-heading">
                <div>
                  <p className="eyebrow">World now</p>
                  <h3>What the loaded world is doing right now</h3>
                </div>
              </div>
              <div className="loaded-identity-card">
                <div>
                  <span>Tianzi</span>
                  <strong>{tianzi.question.title}</strong>
                </div>
                <div>
                  <span>Nezha</span>
                  <strong>
                    {nezha.positions.length} positions / {nezha.markets.length} books
                  </strong>
                </div>
                <div>
                  <span>Tianshi</span>
                  <strong>{heartbeat.snapshot.activeAgentIds.length} / 42 active</strong>
                </div>
                <div>
                  <span>GenDelve</span>
                  <strong>
                    {gendelve.intents.length
                      ? `${gendelve.intents.length} intents`
                      : loadedIdentity.verification.verificationTick
                        ? "Verified for governance"
                        : "Not verified yet"}
                  </strong>
                </div>
                <div>
                  <span>BolClaw</span>
                  <strong>{wall?.posts.length ?? 0} profile posts</strong>
                </div>
                <div>
                  <span>World summary</span>
                  <strong>{worldSummary}</strong>
                </div>
              </div>
              <div className="mini-list">
                {loadedIdentity.balances.map((balance) => (
                  <article key={balance.worldId} className="mini-item-card">
                    <div>
                      <span>{balance.worldId}</span>
                      <strong>
                        {formatCompact(balance.simulatedHoldings)} {balance.symbol}
                      </strong>
                    </div>
                    <p className="route-summary compact">
                      Baseline {formatCompact(balance.baselineHoldings)}. Actual{" "}
                      {formatCompact(balance.actualHoldings)}. Lookup{" "}
                      {balance.actualHoldingsSource.replace(/_/g, " ")}.
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>

      <TianezhaChatClient
        heading={loadedIdentity ? "Ask about your loaded world" : "Ask how Tianezha works"}
        initialMessage={railIntro}
        placeholder={
          loadedIdentity
            ? "What should I do next with this profile?"
            : "What happens after I enter an address?"
        }
        variant="rail"
      />
    </div>
  );
}
