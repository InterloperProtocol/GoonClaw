"use client";

import { useCallback, useEffect, useState } from "react";

import { StatusBadge } from "@/components/ui/StatusBadge";

type RuntimeStatus = {
  error?: string;
  lastChangedAt: string | null;
  lastChangedBy: string | null;
  note: string | null;
  simulationEnabled: boolean;
};

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Waiting";
  }

  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function TianshiSimulationAdminPanel() {
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"disable" | "enable" | null>(null);

  const loadStatus = useCallback(async () => {
    const response = await fetch("/api/admin/tianshi/runtime", {
      credentials: "same-origin",
    });

    if (response.status === 401) {
      setStatus(null);
      return;
    }

    const payload = (await response.json()) as RuntimeStatus;
    if (!response.ok) {
      throw new Error(payload.error || "Couldn't load Tianshi runtime state.");
    }

    setStatus(payload);
  }, []);

  useEffect(() => {
    void loadStatus().catch((requestError) => {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Couldn't load Tianshi runtime state.",
      );
    });
  }, [loadStatus]);

  async function runAction(action: "disable" | "enable") {
    setLoading(action);
    setError(null);

    try {
      const response = await fetch("/api/admin/tianshi/runtime", {
        body: JSON.stringify({ action }),
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as RuntimeStatus;
      if (!response.ok) {
        throw new Error(payload.error || `Couldn't ${action} Tianshi.`);
      }

      setStatus(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : `Couldn't ${action} Tianshi.`,
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Tianshi public runtime</p>
          <h2>Pause the public brain until the hidden admin enables it</h2>
        </div>
      </div>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="route-badges">
        <StatusBadge tone={status?.simulationEnabled ? "success" : "warning"}>
          {status?.simulationEnabled ? "Enabled" : "Paused"}
        </StatusBadge>
      </div>

      <div className="history-list">
        <div className="history-item">
          <div>
            <span>Last change</span>
            <strong>{formatTimestamp(status?.lastChangedAt)}</strong>
          </div>
          <div>
            <span>Changed by</span>
            <strong>{status?.lastChangedBy || "Hidden admin"}</strong>
          </div>
        </div>
        <div className="history-item">
          <div>
            <span>Note</span>
            <strong>{status?.note || "Paused by default until the admin panel enables it."}</strong>
          </div>
        </div>
      </div>

      <div className="button-row">
        <button
          className="button button-primary small"
          disabled={loading === "enable"}
          onClick={() => void runAction("enable")}
          type="button"
        >
          {loading === "enable" ? "Enabling..." : "Enable Tianshi"}
        </button>
        <button
          className="button button-ghost small"
          disabled={loading === "disable"}
          onClick={() => void runAction("disable")}
          type="button"
        >
          {loading === "disable" ? "Pausing..." : "Pause Tianshi"}
        </button>
      </div>
    </section>
  );
}
