import { AgentOpsPanel } from "@/components/AgentOpsPanel";
import { FaqPanel } from "@/components/FaqPanel";
import { SiteNav } from "@/components/SiteNav";
import { RouteHeader } from "@/components/ui/RouteHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default function AgentPage() {
  return (
    <div className="app-shell">
      <SiteNav />

      <RouteHeader
        eyebrow="Platform status"
        title="Read-only status for the private operator stack."
        summary={
          <>
            This page keeps the behind-the-scenes essentials in one place, from
            access delivery and payments to AI services and supporting tools.
            It is status-only. Private control stays in VS Code, not in the guest UI.
          </>
        }
        badges={[
          <StatusBadge key="readonly" tone="accent">
            Read-only
          </StatusBadge>,
          <StatusBadge key="health" tone="success">
            Service health
          </StatusBadge>,
          <StatusBadge key="audit" tone="neutral">
            Payments
          </StatusBadge>,
          <StatusBadge key="manual" tone="warning">
            Access delivery
          </StatusBadge>,
          <StatusBadge key="runtime" tone="accent">
            AI services
          </StatusBadge>,
        ]}
        rail={
          <div className="rail-grid">
            <div className="rail-card">
              <p className="eyebrow">Access delivery</p>
              <strong>Sent after review</strong>
              <span>Wallet access is checked before a pass is delivered.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Refresh</p>
              <strong>30 second cadence</strong>
              <span>Platform health stays current without reloading the page.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Control surface</p>
              <strong>VS Code only</strong>
              <span>Guests can view status here, but they cannot use the private agent.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Purpose</p>
              <strong>Behind-the-scenes clarity</strong>
              <span>Payments, logs, and readiness without exposing private controls.</span>
            </div>
          </div>
        }
      />

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
