"use client";

import { useMemo, useState } from "react";

import { SiteNav } from "@/components/SiteNav";
import { LaunchonomicsEvaluation, LaunchonomicsTier } from "@/lib/types";

type Props = {
  accessTokenSymbol: string;
  freeAccessUntil: string;
  launchAt: string;
};

const tierLabels: Record<LaunchonomicsTier, string> = {
  none: "No qualifying tier",
  monthly: "Monthly subscription",
  yearly: "Yearly subscription",
  five_year: "5-year subscription",
  lifetime: "Lifetime subscription",
};

function formatDate(value?: string) {
  if (!value) return "Not earned";
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function plusMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function plusHours(iso: string, hours: number) {
  return new Date(new Date(iso).getTime() + hours * 60 * 60_000).toISOString();
}

export function LaunchonomicsClient({
  accessTokenSymbol,
  freeAccessUntil,
  launchAt,
}: Props) {
  const [wallet, setWallet] = useState("");
  const [result, setResult] = useState<LaunchonomicsEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const freeUntilLabel = formatDate(freeAccessUntil);
  const launchAtLabel = launchAt ? formatDate(launchAt) : "Not configured";

  const fallbackWindows = useMemo(
    () =>
      launchAt
        ? {
            first10MinutesEndsAt: plusMinutes(launchAt, 10),
            firstHourEndsAt: plusHours(launchAt, 1),
            first12HoursEndsAt: plusHours(launchAt, 12),
            first24HoursEndsAt: plusHours(launchAt, 24),
          }
        : null,
    [launchAt],
  );

  const windows = result?.windows ?? fallbackWindows;

  async function lookup() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/launchonomics?wallet=${encodeURIComponent(wallet.trim())}`,
      );
      const payload = (await response.json()) as {
        error?: string;
        item?: LaunchonomicsEvaluation;
      };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || "Failed to load LaunchONomics status");
      }

      setResult(payload.item);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load LaunchONomics status",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <SiteNav />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">LaunchONomics</p>
          <h1>Early trading windows turn into long-term access.</h1>
          <p className="hero-summary">
            GoonClaw stays open for everyone until {freeUntilLabel}. After that,
            LaunchONomics uses Helius wallet history for {accessTokenSymbol} to
            score early traders without wallet connect on this page.
          </p>
          <div className="hero-badges">
            <span>First 10 minutes: 5 years</span>
            <span>First hour: yearly</span>
            <span>First 12 hours: monthly</span>
            <span>Held through 24 hours: lifetime + verified</span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="toast-banner">
            <strong>Launch start</strong>
            <p>{launchAt ? launchAtLabel : "Set a launch date to activate the checker."}</p>
          </div>
          <div className="toast-banner">
            <strong>Public lookup</strong>
            <p>
              Paste any Solana wallet and the app will evaluate its launch-day
              tier from Helius transfer history.
            </p>
          </div>
        </div>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <section className="dashboard-grid">
        <div className="dashboard-column">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Wallet Check</p>
                <h2>Evaluate a launch wallet</h2>
              </div>
            </div>

            <label className="field">
              <span>Solana wallet</span>
              <input
                value={wallet}
                onChange={(event) => setWallet(event.target.value)}
                placeholder="Paste a wallet address"
              />
            </label>

            <div className="button-row">
              <button
                className="button button-primary"
                disabled={loading || !wallet.trim()}
                onClick={() => void lookup()}
              >
                {loading ? "Checking..." : "Check LaunchONomics"}
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Windows</p>
                <h2>Reward map</h2>
              </div>
            </div>

            <div className="history-list">
              <div className="history-item">
                <div>
                  <span>0-10 minutes</span>
                  <strong>5-year subscription</strong>
                </div>
                <div>
                  <span>Window end</span>
                  <strong>
                    {windows ? formatDate(windows.first10MinutesEndsAt) : "Not configured"}
                  </strong>
                </div>
              </div>
              <div className="history-item">
                <div>
                  <span>0-1 hour</span>
                  <strong>Yearly subscription</strong>
                </div>
                <div>
                  <span>Window end</span>
                  <strong>
                    {windows ? formatDate(windows.firstHourEndsAt) : "Not configured"}
                  </strong>
                </div>
              </div>
              <div className="history-item">
                <div>
                  <span>0-12 hours</span>
                  <strong>Monthly subscription</strong>
                </div>
                <div>
                  <span>Window end</span>
                  <strong>
                    {windows ? formatDate(windows.first12HoursEndsAt) : "Not configured"}
                  </strong>
                </div>
              </div>
              <div className="history-item">
                <div>
                  <span>Hold through 24h</span>
                  <strong>Lifetime + verified badge</strong>
                </div>
                <div>
                  <span>Hold deadline</span>
                  <strong>
                    {windows ? formatDate(windows.first24HoursEndsAt) : "Not configured"}
                  </strong>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="dashboard-column">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Result</p>
                <h2>Wallet status</h2>
              </div>
            </div>

            {result ? (
              <>
                <div className="session-card">
                  <div>
                    <span>Tier</span>
                    <strong>{tierLabels[result.tier]}</strong>
                  </div>
                  <div>
                    <span>Badge</span>
                    <strong>{result.badge === "none" ? "None" : result.badge}</strong>
                  </div>
                  <div>
                    <span>First trade</span>
                    <strong>{formatDate(result.firstTradeAt)}</strong>
                  </div>
                  <div>
                    <span>24h hold</span>
                    <strong>{result.heldThrough24Hours ? "Yes" : "No"}</strong>
                  </div>
                </div>

                <p className="hero-summary">{result.summary}</p>

                <div className="history-list">
                  <div className="history-item">
                    <div>
                      <span>Qualifying trades</span>
                      <strong>{result.qualifyingTradeCount}</strong>
                    </div>
                    <div>
                      <span>Current balance</span>
                      <strong>
                        {result.currentBalance !== undefined
                          ? `${result.currentBalance} ${result.currentBalanceSymbol}`
                          : "Unknown"}
                      </strong>
                    </div>
                  </div>
                  <div className="history-item">
                    <div>
                      <span>Subscription ends</span>
                      <strong>
                        {result.subscriptionEndsAt
                          ? formatDate(result.subscriptionEndsAt)
                          : result.tier === "lifetime"
                            ? "Never"
                            : "No subscription"}
                      </strong>
                    </div>
                    <div>
                      <span>Launch-day trade</span>
                      <strong>{result.tradedWithin24Hours ? "Yes" : "No"}</strong>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="empty-state">
                No wallet checked yet. Paste an address to see its LaunchONomics
                tier, badge, and hold status.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
