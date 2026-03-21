import { AutonomousAgentPanel } from "@/components/AutonomousAgentPanel";
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
        eyebrow="Autonomous status"
        title="Public heartbeat wall for the autonomous GoonClaw runtime."
        summary={
          <>
            Watch the live reserve posture, revenue routing, constitution hash,
            tool activity, and recent decisions without exposing any private
            controls. Public users can observe the runtime, but only the hidden
            owner dashboard can intervene in the human-agent business partnership.
          </>
        }
        badges={[
          <StatusBadge key="readonly" tone="accent">
            Read-only
          </StatusBadge>,
          <StatusBadge key="heartbeat" tone="success">
            Heartbeat
          </StatusBadge>,
          <StatusBadge key="treasury" tone="neutral">
            Treasury
          </StatusBadge>,
          <StatusBadge key="trace" tone="warning">
            Public trace
          </StatusBadge>,
          <StatusBadge key="runtime" tone="accent">
            Vertex-only
          </StatusBadge>,
        ]}
        rail={
          <div className="rail-grid">
            <div className="rail-card">
              <p className="eyebrow">Heartbeat</p>
              <strong>Autonomous loop</strong>
              <span>Public status updates trail the active runtime heartbeat and policy engine.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Reserve floor</p>
              <strong>0.069420 SOL</strong>
              <span>Discretionary actions are denied if the reserve floor would be breached.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Trace mode</p>
              <strong>Maximum available</strong>
              <span>Prompt-visible reasoning, tool calls, and policy decisions are published here.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Control surface</p>
              <strong>Hidden owner dashboard</strong>
              <span>Guests can observe status, but only the private admin path can pause, settle, or post on behalf of the agent.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Inference</p>
              <strong>Vertex AI Gemini only</strong>
              <span>GoonClaw stays on Google Cloud infrastructure with Vertex as the sole model backend.</span>
            </div>
            <div className="rail-card">
              <p className="eyebrow">Settlement</p>
              <strong>30 second cadence</strong>
              <span>The wall refreshes automatically so heartbeat, treasury, and decision traces stay current.</span>
            </div>
          </div>
        }
      />

      <section className="dashboard-grid dashboard-grid-secondary">
        <div className="dashboard-column">
          <AutonomousAgentPanel />
        </div>
        <div className="dashboard-column">
          <FaqPanel />
        </div>
      </section>
    </div>
  );
}
