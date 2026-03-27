import type {
  GenDelveState,
  HeartbeatState,
  NezhaState,
  TianziState,
} from "@/lib/server/tianezha-simulation";
import type { LoadedIdentity } from "@/lib/simulation/types";
import { buildTrainingQuests } from "@/lib/tianshi/trainingBuilder";

export type TianezhaOpportunity = {
  badgeHint?: string;
  description: string;
  href: string;
  id: string;
  kind: "bitclaw" | "gendelve" | "nezha" | "system" | "tianzi";
  rewardHint?: string;
  title: string;
  trainingHint?: string;
};

type OpportunityInputs = {
  gendelve: GenDelveState;
  heartbeat: HeartbeatState;
  loadedIdentity: LoadedIdentity | null;
  nezha: NezhaState;
  tianzi: TianziState;
};

export function buildTianezhaOpportunities(inputs: OpportunityInputs) {
  const opportunities: TianezhaOpportunity[] = [];

  if (!inputs.loadedIdentity) {
    opportunities.push({
      description:
        "Load your wallet to unlock BitClaw, seeded simulation state, and your wallet-bound Hermes companion.",
      href: "/bitclaw",
      id: "load-profile",
      kind: "system",
      rewardHint: "5% first profile load lane",
      title: "Enter the world",
      trainingHint: "Wallet-first onboarding",
    });

    return {
      opportunities,
      quests: buildTrainingQuests({
        hasLoadedIdentity: false,
        hasNezhaPositions: false,
        hasPosts: false,
        hasTianziPositions: false,
      }),
    };
  }

  opportunities.push({
    badgeHint: "Oracle Initiate",
    description: `${inputs.tianzi.question.title} is live now. YES is ${(inputs.tianzi.book.yesPrice * 100).toFixed(0)}% and the window is still open.`,
    href: `/tianzi?question=${encodeURIComponent(inputs.tianzi.question.id)}&from=chat`,
    id: "tianzi-live-question",
    kind: "tianzi",
    rewardHint: "Prediction rewards + accuracy streaks",
    title: "Take the live Tianzi position",
    trainingHint: "Learn YES/NO, timing, and window risk",
  });

  const primaryMarket = inputs.nezha.markets[0];
  if (primaryMarket) {
    opportunities.push({
      badgeHint: "Leverage Cadet",
      description: `${primaryMarket.title} is live in Nezha. Practice a disciplined long or short before taking a larger simulated risk.`,
      href: `/nezha?market=${encodeURIComponent(primaryMarket.id)}&from=chat`,
      id: "nezha-live-market",
      kind: "nezha",
      rewardHint: "Trading rewards + discipline badges",
      title: "Practice a Nezha long or short",
      trainingHint: "Learn leverage, funding, and liquidation risk",
    });
  }

  opportunities.push({
    badgeHint: "Signal Scribe",
    description: "Post a thesis note or reaction from BitClaw so BolClaw and Tianshi can pick it up.",
    href: `/bitclaw/${encodeURIComponent(inputs.loadedIdentity.profile.bitClawProfileId)}?compose=1&from=chat`,
    id: "bitclaw-compose",
    kind: "bitclaw",
    rewardHint: "Good data lane + social progression",
    title: "Send a BolClaw thesis from BitClaw",
    trainingHint: "Learn how profile identity becomes public voice",
  });

  if (!inputs.loadedIdentity.verification.verificationTick && inputs.gendelve.worlds.length) {
    opportunities.push({
      badgeHint: "Civic Key",
      description: "GenDelve is the only place that needs a real verification transfer. Everything else stays simulation-first.",
      href: "/gendelve?from=chat",
      id: "gendelve-verify",
      kind: "gendelve",
      rewardHint: "Governance rewards + verification unlock",
      title: "Unlock narrow governance access",
      trainingHint: "Learn the difference between simulation play and real governance",
    });
  }

  if (inputs.heartbeat.runtime.simulationEnabled) {
    opportunities.push({
      description: `${inputs.heartbeat.snapshot.activeAgentIds.length} RA agents are active in the current heartbeat window.`,
      href: "/tianshi?from=chat",
      id: "tianshi-live-runtime",
      kind: "system",
      rewardHint: "Live narration and social-finance world context",
      title: "Read Tianshi's live world call",
      trainingHint: "Learn how the public brain interprets the world",
    });
  }

  return {
    opportunities: opportunities.slice(0, 4),
    quests: buildTrainingQuests({
      hasLoadedIdentity: true,
      hasNezhaPositions: inputs.nezha.positions.length > 0,
      hasPosts: false,
      hasTianziPositions: inputs.tianzi.profilePositions.length > 0,
    }),
  };
}
