import type { IdentityProfile } from "@/lib/simulation/types";

export function BitClawFantasyPanel({
  profile,
  title = "Simulated fantasy layer",
}: {
  profile: IdentityProfile;
  title?: string;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">BitClaw fantasy layer</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="bitclaw-fantasy-grid">
        <article className="mini-item-card">
          <div>
            <span>Simulated avatar</span>
            <strong>{profile.simulatedAvatar.label}</strong>
          </div>
          <div
            aria-label={`Simulated avatar for ${profile.displayName}`}
            className="bitclaw-generated-avatar"
            style={{
              background: profile.simulatedAvatar.background,
              color: profile.simulatedAvatar.foreground,
            }}
          >
            {profile.simulatedAvatar.sigil}
          </div>
          <p className="route-summary compact">
            This avatar is simulated for BitClaw and does not represent a live wallet image or
            custody asset.
          </p>
        </article>

        <article className="mini-item-card">
          <div>
            <span>Simulated personality</span>
            <strong>{profile.simulatedPersonality.archetype}</strong>
          </div>
          <p className="route-summary compact">{profile.simulatedPersonality.summary}</p>
          <p className="route-summary compact">
            Traits: {profile.simulatedPersonality.traits.join(" / ")}.
          </p>
        </article>

        <article className="mini-item-card">
          <div>
            <span>Simulated qNFT collection</span>
            <strong>{profile.simulatedQnfts.length} fantasy pieces</strong>
          </div>
          <div className="mini-list">
            {profile.simulatedQnfts.map((item) => (
              <article key={item.id} className="mini-item-card">
                <div>
                  <span>{item.rarity}</span>
                  <strong>{item.label}</strong>
                </div>
                <p className="route-summary compact">{item.lore}</p>
              </article>
            ))}
          </div>
          <p className="route-summary compact">
            qNFTs here are simulated collectibles inside Tianezha, not live on-chain custody
            assets.
          </p>
        </article>
      </div>
    </section>
  );
}
