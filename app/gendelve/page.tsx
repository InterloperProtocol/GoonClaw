import { GenDelvePanelClient } from "@/components/gendelve/GenDelvePanelClient";
import { TianezhaScaffold } from "@/components/shell/TianezhaScaffold";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  getBnbVerificationTarget,
  getSolanaVerificationTarget,
} from "@/lib/server/tianezha-chain-data";
import {
  getCurrentLoadedIdentity,
  getGenDelveState,
} from "@/lib/server/tianezha-simulation";

export const dynamic = "force-dynamic";

export default async function GenDelvePage() {
  const loadedIdentity = await getCurrentLoadedIdentity();
  const gendelve = await getGenDelveState(loadedIdentity?.profile.id);

  return (
    <TianezhaScaffold>
      <section className="panel home-hero-panel">
        <div className="home-hero-copy">
          <p className="eyebrow">GenDelve</p>
          <h1>Narrow, real governance for the two live $CAMIUP worlds.</h1>
          <p className="route-summary">
            GenDelve is the only part of Tianezha that needs a real 1-token verification transfer,
            and only for $CAMIUP on Solana or BNB. Profile loading, BitClaw, BolClaw, Tianzi, and
            Nezha do not require that step.
          </p>
          <div className="route-badges">
            <StatusBadge tone="success">Real governance</StatusBadge>
            <StatusBadge tone="accent">Owner verification</StatusBadge>
            <StatusBadge tone="warning">Solana + BNB only</StatusBadge>
          </div>
        </div>
      </section>

      <section className="stack-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Actions</p>
              <h2>Open or verify governance activity</h2>
            </div>
          </div>
          <GenDelvePanelClient
            intents={gendelve.intents.map((intent) => ({
              chain: intent.chain,
              choice: intent.choice,
              id: intent.id,
              status: intent.status,
              requiredTokenAmount: intent.requiredTokenAmount,
              verificationMemo: intent.verificationMemo || null,
              verificationTarget: intent.verificationTarget,
              verificationTransactionId: intent.verificationTransactionId || null,
              verificationTokenAddress: intent.verificationTokenAddress,
              worldId: intent.worldId,
            }))}
            ownerChallenge={
              gendelve.ownerChallenge
                ? {
                    chain: gendelve.ownerChallenge.chain,
                    memo: gendelve.ownerChallenge.memo,
                    recommendedWallet: gendelve.ownerChallenge.recommendedWallet,
                    verificationTarget: gendelve.ownerChallenge.verificationTarget,
                    verificationTransactionHint:
                      gendelve.ownerChallenge.verificationTransactionHint,
                  }
                : null
            }
            verificationTargets={{
              bnb: getBnbVerificationTarget(),
              solana: getSolanaVerificationTarget(),
            }}
            worlds={gendelve.worlds.map((world) => ({
              chain: world.chain,
              displayName: world.displayName,
              id: world.id,
              requiredTokenAmount: "1",
              tokenAddress: world.contractAddress || "",
              verificationTarget:
                world.chain === "solana"
                  ? getSolanaVerificationTarget()
                  : getBnbVerificationTarget(),
            }))}
          />
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Owner challenge</p>
              <h2>Verification memo for the loaded profile</h2>
            </div>
          </div>
          <div className="mini-item-card">
            <div>
              <span>Recommended chain</span>
              <strong>{gendelve.ownerChallenge?.chain || "Load a profile"}</strong>
            </div>
              <p className="route-summary compact">
                {gendelve.ownerChallenge
                  ? `${gendelve.ownerChallenge.verificationTransactionHint} Memo ${gendelve.ownerChallenge.memo} for wallet ${gendelve.ownerChallenge.recommendedWallet}.`
                  : "Load a profile to generate a verification memo."}
              </p>
            </div>
        </section>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Vote intents</p>
            <h2>Recent GenDelve activity</h2>
          </div>
        </div>
        <div className="mini-list">
          {gendelve.intents.length ? (
            gendelve.intents.map((intent) => (
              <article key={intent.id} className="mini-item-card">
                <div>
                  <span>{intent.status}</span>
                  <strong>{intent.worldId}</strong>
                </div>
                <p className="route-summary compact">
                  {intent.choice} after sending {intent.requiredTokenAmount} $CAMIUP to{" "}
                  {intent.verificationTarget}.
                </p>
              </article>
            ))
          ) : (
            <article className="mini-item-card">
              <div>
                <span>No intents yet</span>
                <strong>Governance starts here</strong>
              </div>
              <p className="route-summary compact">
                Create a vote intent only when you want GenDelve governance. The rest of the app
                stays frictionless.
              </p>
            </article>
          )}
        </div>
      </section>
    </TianezhaScaffold>
  );
}
