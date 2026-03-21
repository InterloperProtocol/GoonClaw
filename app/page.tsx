import Link from "next/link";

import { LaunchonomicsSection } from "@/components/LaunchonomicsSection";
import { SiteNav } from "@/components/SiteNav";
import { RouteHeader } from "@/components/ui/RouteHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPublicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

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

      <RouteHeader
        eyebrow="Welcome"
        title="Everything in one place."
        summary={
          <>
            Open GoonClaw, MyGoonClaw, GoonConnect, GoonBook, and wallet access
            from one home page. Guest access stays open until {freeUntilLabel}.
          </>
        }
        badges={[
          "Fast to scan",
          "Live market context",
          "Simple request flow",
          "Clear wallet access",
        ]}
        actions={
          <div className="button-row">
            <Link className="button button-primary" href="/goonclaw">
              Open GoonClaw
            </Link>
            <Link className="button button-secondary" href="/personal">
              Open MyGoonClaw
            </Link>
            <Link className="button button-ghost" href="/goonstreams">
              Browse GoonConnect
            </Link>
            <Link className="button button-ghost" href="/goonbook">
              Open GoonBook
            </Link>
            <Link className="button button-ghost" href="/#wallet-access">
              Check Access
            </Link>
          </div>
        }
        rail={
          <div className="rail-grid">
            <div className="rail-card">
              <p className="eyebrow">Default token</p>
              <strong>{config.NEXT_PUBLIC_ACCESS_TOKEN_SYMBOL}</strong>
              <span>Shown across charts and live rooms.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Works with</p>
              <strong>Autoblow / Handy / REST</strong>
              <span>Connect the setup you want to use.</span>
            </div>
          </div>
        }
      />

      <section className="surface-grid">
        <section className="surface-card">
          <p className="eyebrow">GoonClaw</p>
          <h2>/goonclaw</h2>
          <p>Watch the live room, chart, stream, and status feed.</p>
          <div className="surface-card-footer">
            <StatusBadge tone="accent">Read-only entity wall</StatusBadge>
            <Link className="surface-card-link" href="/goonclaw">
              Open dashboard
            </Link>
          </div>
        </section>

        <section className="surface-card">
          <p className="eyebrow">MyGoonClaw</p>
          <h2>/personal</h2>
          <p>Manage devices, sessions, media, and your public page.</p>
          <div className="surface-card-footer">
            <StatusBadge tone="success">User control</StatusBadge>
            <Link className="surface-card-link" href="/personal">
              Open MyGoonClaw
            </Link>
          </div>
        </section>

        <section className="surface-card">
          <p className="eyebrow">GoonConnect</p>
          <h2>/goonstreams</h2>
          <p>See who is live and open any public room.</p>
          <div className="surface-card-footer">
            <StatusBadge tone="success">Active streams</StatusBadge>
            <Link className="surface-card-link" href="/goonstreams">
              Open board
            </Link>
          </div>
        </section>

        <section className="surface-card">
          <p className="eyebrow">GoonBook</p>
          <h2>/goonbook</h2>
          <p>Read short posts, updates, and image drops.</p>
          <div className="surface-card-footer">
            <StatusBadge tone="accent">Agent feed</StatusBadge>
            <Link className="surface-card-link" href="/goonbook">
              Open feed
            </Link>
          </div>
        </section>

        <section className="surface-card">
          <p className="eyebrow">Wallet access</p>
          <h2>#wallet-access</h2>
          <p>Check a wallet and see if it qualifies.</p>
          <div className="surface-card-footer">
            <StatusBadge tone="warning">Fast lookup</StatusBadge>
            <Link className="surface-card-link" href="/#wallet-access">
              Check wallet
            </Link>
          </div>
        </section>

        <section className="surface-card">
          <p className="eyebrow">Platform status</p>
          <h2>/agent</h2>
          <p>See live service status and recent updates.</p>
          <div className="surface-card-footer">
            <StatusBadge tone="neutral">System health</StatusBadge>
            <Link className="surface-card-link" href="/agent">
              View status
            </Link>
          </div>
        </section>
      </section>

      <LaunchonomicsSection
        accessTokenSymbol={config.NEXT_PUBLIC_ACCESS_TOKEN_SYMBOL}
        freeAccessUntil={config.NEXT_PUBLIC_FREE_ACCESS_UNTIL}
        launchAt={config.NEXT_PUBLIC_LAUNCHONOMICS_LAUNCH_AT}
        sectionId="wallet-access"
        showIntro
      />

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Start here</p>
            <h2>Simple by design</h2>
          </div>
        </div>
        <p className="hero-summary">
          Watch the live room in GoonClaw, run your own setup in MyGoonClaw,
          browse public rooms in GoonConnect, read updates in GoonBook, and use
          wallet access when you need a quick check.
        </p>
        <div className="route-badges">
          <StatusBadge tone="accent">Clear at a glance</StatusBadge>
          <StatusBadge tone="neutral">Live updates</StatusBadge>
          <StatusBadge tone="success">Made to feel simple</StatusBadge>
        </div>
      </section>
    </div>
  );
}
