"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeEligibilityCta() {
  const router = useRouter();
  const [wallet, setWallet] = useState("");

  function openEligibility() {
    const query = wallet.trim()
      ? `?wallet=${encodeURIComponent(wallet.trim())}`
      : "";
    router.push(`/eligibility${query}`);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Eligibility</p>
          <h2>Check a wallet and send the subscription cNFT manually</h2>
        </div>
      </div>

      <label className="field">
        <span>Wallet address</span>
        <input
          value={wallet}
          onChange={(event) => setWallet(event.target.value)}
          placeholder="Paste a Solana wallet"
        />
      </label>

      <div className="button-row">
        <button
          className="button button-primary"
          disabled={!wallet.trim()}
          onClick={openEligibility}
        >
          Check eligibility
        </button>
      </div>
    </section>
  );
}
