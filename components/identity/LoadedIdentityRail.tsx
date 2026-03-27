import Link from "next/link";

import { AddressLoadForm } from "@/components/identity/AddressLoadForm";
import { TianezhaChatClient } from "@/components/shell/TianezhaChatClient";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getSimChainSummary } from "@/lib/server/sim-chain";
import {
  getCurrentLoadedIdentity,
  getGenDelveState,
  getHeartbeatState,
  getNezhaState,
  getTianziState,
} from "@/lib/server/tianezha-simulation";
import { formatCompact } from "@/lib/utils";
import { buildWalletHermesIntro, formatWalletHermesHeading } from "@/lib/tianshi/formatters";
import { buildTianezhaOpportunities } from "@/lib/tianshi/opportunityEngine";

export async function LoadedIdentityRail() {
  const loadedIdentity = await getCurrentLoadedIdentity();
  const [tianzi, nezha, gendelve, heartbeat] = loadedIdentity
    ? await Promise.all([
        getTianziState(loadedIdentity.profile.id),
        getNezhaState(loadedIdentity.profile.id),
        getGenDelveState(loadedIdentity.profile.id),
        getHeartbeatState(),
      ])
    : await Promise.all([
        getTianziState(),
        getNezhaState(),
        getGenDelveState(),
        getHeartbeatState(),
      ]);
  const opportunityState = buildTianezhaOpportunities({
    gendelve,
    heartbeat,
    loadedIdentity,
    nezha,
    tianzi,
  });
  const loadedBitClawHref = loadedIdentity
    ? `/bitclaw/${encodeURIComponent(loadedIdentity.profile.bitClawProfileId)}`
    : "/bitclaw";

  return (
    <div className="loaded-rail-shell">
      <TianezhaChatClient
        contextKey={loadedIdentity?.profile.id || "anonymous"}
        heading={formatWalletHermesHeading(loadedIdentity)}
        initialMessage={buildWalletHermesIntro(loadedIdentity)}
        initialOpportunities={opportunityState.opportunities}
        initialQuests={opportunityState.quests}
        initialRuntime={heartbeat.runtime}
        initialSimChain={getSimChainSummary()}
        placeholder={
          loadedIdentity
            ? "Ask for the next prediction, long or short setup, reward path, or quest."
            : "Enter a wallet first, then ask how the world works."
        }
        variant="rail"
      />

      <section className="panel loaded-rail-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Wallet loader</p>
            <h2>{loadedIdentity ? "Switch or rebuild your character" : "Enter the world"}</h2>
          </div>
          <StatusBadge tone={loadedIdentity ? "success" : "accent"}>
            {loadedIdentity ? "Character loaded" : "Awaiting wallet"}
          </StatusBadge>
        </div>

        <AddressLoadForm
          ctaLabel={loadedIdentity ? "Reload character" : "Enter world"}
          helperText="Enter any wallet, ENS, SNS, or .bnb name. No signup and no wallet connect."
        />

        {!loadedIdentity ? (
          <div className="mini-list">
            <article className="mini-item-card">
              <div>
                <span>What Tianezha is</span>
                <strong>Simulation-first financial RPG and social-finance world</strong>
              </div>
              <p className="route-summary compact">
                Your wallet becomes a character sheet. The same identity then carries into
                BitClaw, BolClaw, Tianzi, Nezha, Tianshi, and GenDelve.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>What the left chat does</span>
                <strong>Guide, teach, and dispatch live opportunities</strong>
              </div>
              <p className="route-summary compact">
                It can surface predictions, long and short training, badges, perks, and quests as
                they unlock.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Current world</span>
                <strong>{tianzi.question.title}</strong>
              </div>
              <p className="route-summary compact">
                Nezha is pricing {nezha.markets.length} books and Tianshi is{" "}
                {heartbeat.runtime.simulationEnabled ? "live" : "paused by default"}.
              </p>
            </article>
          </div>
        ) : (
          <div className="mini-list">
            <article className="mini-item-card">
              <div>
                <span>Loaded identity</span>
                <strong>
                  {loadedIdentity.profile.displayName} / {loadedIdentity.profile.simulationHandle}
                </strong>
              </div>
              <p className="route-summary compact">
                Wallet {loadedIdentity.profile.walletAddress}. Rewards{" "}
                {formatCompact(loadedIdentity.rewardLedger.totalRewards)} and rank #
                {loadedIdentity.rewardLedger.rank}.
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Wallet-Hermes</span>
                <strong>
                  {loadedIdentity.walletHermesAgent?.serviceStatus || "local-fallback"}
                </strong>
              </div>
              <p className="route-summary compact">
                {loadedIdentity.walletHermesAgent?.summary ||
                  "Hermes will summarize the profile once the companion service is available."}
              </p>
            </article>
            <article className="mini-item-card">
              <div>
                <span>Fast travel</span>
                <strong>Jump into the main play surfaces</strong>
              </div>
              <div className="button-row">
                <Link className="button button-primary" href={loadedBitClawHref}>
                  Open BitClaw
                </Link>
                <Link className="button button-secondary" href="/tianzi">
                  Open Tianzi
                </Link>
              </div>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
