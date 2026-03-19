import Link from "next/link";

import { AgentOpsPanel } from "@/components/AgentOpsPanel";
import { FaqPanel } from "@/components/FaqPanel";
import { SiteNav } from "@/components/SiteNav";
import { getPublicEnv } from "@/lib/env";

export default function Home() {
  const config = getPublicEnv();
  const freeUntilLabel = new Date(config.NEXT_PUBLIC_FREE_ACCESS_UNTIL).toLocaleString(
    "en-US",
    {
      dateStyle: "long",
      timeStyle: "short",
    },
  );

  return (
    <div className="app-shell">
      <SiteNav />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">GoonClaw</p>
          <h1>Personal and livestream token control, now under one name.</h1>
          <p className="hero-summary">
            GoonClaw combines a private control room, a public livestream panel,
            chart sync, crypto news, and tokenized-agent automation. The guest
            window stays open until {freeUntilLabel}; after that, LaunchONomics
            can score wallets that traded {config.NEXT_PUBLIC_ACCESS_TOKEN_SYMBOL}.
          </p>
          <div className="hero-badges">
            <span>Personal room at /goonclaw</span>
            <span>Public livestream queue at /livestream</span>
            <span>OpenClaw + Pump + Vertex AI Gemini</span>
            <span>API-only Autoblow, Handy, and REST support</span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="toast-banner">
            <strong>Agent policy</strong>
            <p>
              cNFTs are intended to be issued by the agent from creator-fee
              revenue, with a reserve floor, timed issuance windows, and
              buybacks handled from the remaining share. The hosted agent target
              is Vertex AI Gemini on Google Cloud.
            </p>
          </div>
          <div className="button-row">
            <Link className="button button-secondary" href="/launchonomics">
              Check LaunchONomics
            </Link>
            <Link className="button button-primary" href="/goonclaw">
              Open Personal
            </Link>
            <Link className="button button-ghost" href="/livestream">
              Open Livestream
            </Link>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-column">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Personal</p>
                <h2>Chart + video + device control</h2>
              </div>
            </div>
            <p className="hero-summary">
              Load your own video or stream embed, pick a device, and drive it
              from a live chart without leaving the control room.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/goonclaw">
                Open /goonclaw
              </Link>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">LaunchONomics</p>
                <h2>Check wallet tiers now</h2>
              </div>
            </div>
            <p className="hero-summary">
              Paste any wallet to see whether it earned monthly, yearly, 5-year,
              or lifetime access from launch-day trading behavior.
            </p>
            <div className="button-row">
              <Link className="button button-primary" href="/launchonomics">
                Go to /launchonomics
              </Link>
            </div>
          </section>
        </div>

        <div className="dashboard-column">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Livestream</p>
                <h2>Stream + chart + payment control</h2>
              </div>
            </div>
            <p className="hero-summary">
              The public room now keeps the stream, chart, queue, and crypto
              news on one surface so paid control requests are easier to follow.
            </p>
            <div className="button-row">
              <Link className="button button-secondary" href="/livestream">
                Go to /livestream
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-secondary">
        <div className="dashboard-column">
          <AgentOpsPanel />
        </div>
        <div className="dashboard-column">
          <FaqPanel />
        </div>
      </section>
    </div>
  );
}
