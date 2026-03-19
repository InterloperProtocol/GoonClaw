"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { SiteNav } from "@/components/SiteNav";
import {
  EntitlementRecord,
  LaunchonomicsEvaluation,
  LaunchonomicsTier,
} from "@/lib/types";

type Props = {
  accessTokenSymbol: string;
  freeAccessUntil: string;
  launchAt: string;
};

type ClaimResponse = {
  ok?: boolean;
  reused?: boolean;
  entitlement?: EntitlementRecord | null;
  error?: string;
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
  const searchParams = useSearchParams();
  const queryWallet = searchParams.get("wallet")?.trim() || "";
  const autoLookupRef = useRef<string>("");

  const [wallet, setWallet] = useState(queryWallet);
  const [result, setResult] = useState<LaunchonomicsEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
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
  const canClaim = Boolean(result && result.tier !== "none");

  const lookup = useCallback(async (targetWallet = wallet.trim()) => {
    if (!targetWallet) return;

    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/launchonomics?wallet=${encodeURIComponent(targetWallet)}`,
      );
      const payload = (await response.json()) as {
        error?: string;
        item?: LaunchonomicsEvaluation;
      };
      if (!response.ok || !payload.item) {
        throw new Error(payload.error || "Failed to load eligibility");
      }

      setWallet(targetWallet);
      setResult(payload.item);
    } catch (requestError) {
      setResult(null);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load eligibility",
      );
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  async function claimSubscriptionCnft() {
    if (!result || result.tier === "none") return;

    setClaiming(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/entitlements/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: result.wallet }),
      });
      const payload = (await response.json()) as ClaimResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Failed to mint the subscription cNFT");
      }

      if (payload.reused) {
        if (payload.entitlement?.type === "burn") {
          setNotice("This wallet already has an active burn-based entitlement.");
        } else {
          setNotice("This wallet already has a subscription cNFT claim on record.");
        }
        return;
      }

      setNotice("Subscription cNFT minted to the eligible wallet.");
    } catch (claimError) {
      setError(
        claimError instanceof Error
          ? claimError.message
          : "Failed to mint the subscription cNFT",
      );
    } finally {
      setClaiming(false);
    }
  }

  useEffect(() => {
    if (!queryWallet || autoLookupRef.current === queryWallet) {
      return;
    }

    autoLookupRef.current = queryWallet;
    setWallet(queryWallet);
    void lookup(queryWallet);
  }, [lookup, queryWallet]);

  return (
    <div className="app-shell">
      <SiteNav />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Eligibility</p>
          <h1>Check a wallet, then manually send the subscription cNFT.</h1>
          <p className="hero-summary">
            GoonClaw stays open for everyone until {freeUntilLabel}. After that,
            this page uses LaunchONomics and Helius wallet history for {accessTokenSymbol}
            to check subscription eligibility. Nothing is auto-sent anymore: a person
            reviews the wallet and manually clicks the receive button.
          </p>
          <div className="hero-badges">
            <span>Manual subscription claims</span>
            <span>Wallet lookup without wallet connect</span>
            <span>LaunchONomics review flow</span>
            <span>Receive cNFT only after eligibility check</span>
          </div>
        </div>
        <div className="hero-actions">
          <div className="toast-banner">
            <strong>Launch start</strong>
            <p>{launchAt ? launchAtLabel : "Set a launch date to activate the checker."}</p>
          </div>
          <div className="toast-banner">
            <strong>Manual review flow</strong>
            <p>
              Enter a wallet, check its tier, and only then click
              &nbsp;<strong>Receive subscription cNFT</strong>.
            </p>
          </div>
        </div>
      </section>

      {notice ? <p className="toast-banner">{notice}</p> : null}
      {error ? <p className="error-banner">{error}</p> : null}

      <section className="dashboard-grid">
        <div className="dashboard-column">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Wallet Check</p>
                <h2>Evaluate subscription eligibility</h2>
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
                {loading ? "Checking..." : "Check eligibility"}
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
                <h2>Eligibility status</h2>
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

                <div className="button-row">
                  <button
                    className="button button-primary"
                    disabled={!canClaim || claiming}
                    onClick={() => void claimSubscriptionCnft()}
                  >
                    {claiming ? "Minting..." : "Receive subscription cNFT"}
                  </button>
                </div>

                {!canClaim ? (
                  <p className="empty-state">
                    This wallet does not qualify for a subscription cNFT right now.
                  </p>
                ) : (
                  <p className="empty-state">
                    Manual flow: the cNFT is only sent after this button is clicked.
                  </p>
                )}
              </>
            ) : (
              <p className="empty-state">
                No wallet checked yet. Paste an address to review its LaunchONomics
                tier and manually send the subscription cNFT if it qualifies.
              </p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
