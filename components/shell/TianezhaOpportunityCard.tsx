import Link from "next/link";

import type { TianezhaOpportunity } from "@/lib/tianshi/opportunityEngine";
import { formatOpportunityRewardHint } from "@/lib/tianshi/formatters";

export function TianezhaOpportunityCard({ opportunity }: { opportunity: TianezhaOpportunity }) {
  return (
    <article className="mini-item-card opportunity-card">
      <div>
        <span>{formatOpportunityRewardHint(opportunity.kind, opportunity.rewardHint)}</span>
        <strong>{opportunity.title}</strong>
      </div>
      <p className="route-summary compact">{opportunity.description}</p>
      {opportunity.trainingHint ? (
        <p className="route-summary compact">
          Learn: {opportunity.trainingHint}
          {opportunity.badgeHint ? ` · Badge path: ${opportunity.badgeHint}` : ""}
        </p>
      ) : null}
      <div className="button-row">
        <Link className="button button-secondary" href={opportunity.href}>
          Open
        </Link>
      </div>
    </article>
  );
}
