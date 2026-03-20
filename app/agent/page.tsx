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
        title="A clear view of what powers GoonClaw."
        summary={
          <>
            This page keeps the behind-the-scenes essentials in one place, from
            access delivery and payments to AI services and supporting tools.
          </>
        }
        badges={[
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
              <p className="eyebrow">AI features</p>
              <strong>Vertex AI Gemini</strong>
              <span>AI service readiness is tracked here in one place.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Purpose</p>
              <strong>Behind-the-scenes clarity</strong>
              <span>Payments, tools, and platform status without the guesswork.</span>
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
