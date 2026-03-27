export type TianshiBrainMemoryCategory =
  | "agents"
  | "doctrine"
  | "memory"
  | "risk"
  | "strategy"
  | "workflow";

export type TianshiBrainMemoryStatus = "active" | "locked" | "research";

export type TianshiBrainMemoryEntry = {
  id: string;
  title: string;
  category: TianshiBrainMemoryCategory;
  status: TianshiBrainMemoryStatus;
  summary: string;
  commitments: string[];
  source: string;
};

export type TianshiBotSurfaceStatus = {
  id: string;
  label: string;
  mode: "public" | "private";
  route: string;
  relayConfigured: boolean;
  bindingSupported: boolean;
  notes: string;
};

export type TianshiBrainMemory = {
  worldSummary: string;
  stableLaws: string[];
  agentRoles: string[];
  entries: TianshiBrainMemoryEntry[];
};

export const TIANSHI_BRAIN_MEMORY: TianshiBrainMemory = {
  worldSummary:
    "Tianezha is one shared world. Tianshi is the public brain, the operator root stays private, and Telegram/WeChat are extensions of the same state rather than separate products.",
  stableLaws: [
    "profile first",
    "public brain, private root",
    "state is the product",
    "simulation before friction",
    "bots are surfaces of the same world",
    "critique belongs inside the world",
    "naming should stay stable",
  ],
  agentRoles: [
    "Architect Agent",
    "Shell Agent",
    "State Agent",
    "Story Agent",
    "Builder Agent",
    "Test Agent",
    "Memory Agent",
    "Operator Agent",
    "Market Agent",
    "Mentor Agent",
  ],
  entries: [
    {
      id: "native-doctrine",
      title: "Tianezha Native Doctrine",
      category: "doctrine",
      status: "active",
      summary:
        "The product stays world-native: profile first, public brain/private root, simulation before friction, and bots as shell extensions rather than forks.",
      commitments: [
        "Keep Telegram and WeChat attached to the same world state.",
        "Keep private operator powers off public bot surfaces.",
        "Treat critique as product data, not an external interruption.",
      ],
      source: "Hyper Flow master archive + Tianezha founder doctrine",
    },
    {
      id: "interface-assembly",
      title: "Hyper Flow Interface Assembly",
      category: "workflow",
      status: "active",
      summary:
        "Build from named boxes, define interfaces before code, assign an owner to each box, and preserve the public contract while internals evolve.",
      commitments: [
        "One box owns one truth.",
        "Define interface promises before implementation details.",
        "Keep humans inside one product world instead of disconnected tools.",
      ],
      source: "Hyper Flow Interface Assembly Handbook",
    },
    {
      id: "runtime-memory-bank",
      title: "Visible Memory Bank",
      category: "memory",
      status: "active",
      summary:
        "Tianshi should retain a visible memory bank so the human and the agent can keep shared context over time.",
      commitments: [
        "Track notes, patterns, prompts, interfaces, decisions, deprecated ideas, and build history.",
        "Expose memory as a readable product surface instead of hidden prompt state.",
        "Use memory to preserve what worked and retire what drifted.",
      ],
      source: "Hyper Flow memory-bank pack",
    },
    {
      id: "market-subagents",
      title: "Role and Subagent Market",
      category: "agents",
      status: "active",
      summary:
        "The workflow separates responsibilities into clear roles so Tianshi can think, build, test, remember, operate, and mentor without collapsing every concern into one prompt.",
      commitments: [
        "Every box gets one primary owner.",
        "Market/operator roles stay subordinate to the parent brain.",
        "Human mentoring remains a first-class interface, not an afterthought.",
      ],
      source: "Hyper Flow role-system + subagent-market docs",
    },
    {
      id: "defi-risk-stack",
      title: "Locked DeFi Risk Stack",
      category: "risk",
      status: "active",
      summary:
        "Fast strategy code may propose trades, but only the audited control plane can approve them through sizing, drawdown, market-quality, mutation, and replay checks.",
      commitments: [
        "Use capped sizing, quarter-Kelly clipping, and hard position caps.",
        "Respect drawdown tiers, circuit breakers, and exits-only states.",
        "Require evidence bundles and replay artifacts for live risk.",
      ],
      source: "Founder-supplied DeFi control-plane doctrine",
    },
    {
      id: "polymarket-clawbot-research",
      title: "Polymarket / OpenClaw Research Lane",
      category: "strategy",
      status: "research",
      summary:
        "OpenClaw-style Polymarket loops are tracked as research playbooks, not as permission to automate live capital without replay evidence and explicit live-mode approval.",
      commitments: [
        "Weather-style slower markets stay the preferred learning lane.",
        "Fast BTC loop ideas remain high-risk and review-gated.",
        "No live promotion without replay, microstructure checks, and operator acknowledgement.",
      ],
      source: "Founder-supplied Polymarket / Clawbot notes",
    },
  ],
};

export function buildTianshiBotSurfaceStatuses(args: {
  telegramRelayConfigured: boolean;
  wechatRelayConfigured: boolean;
}) {
  return [
    {
      id: "public-telegram",
      label: "Telegram public bot",
      mode: "public" as const,
      route: "/api/bots/public-telegram",
      relayConfigured: args.telegramRelayConfigured,
      bindingSupported: true,
      notes: "Public-safe world summary, profile binding, feed reading, and market previews.",
    },
    {
      id: "public-wechat",
      label: "WeChat public bot",
      mode: "public" as const,
      route: "/api/bots/public-wechat",
      relayConfigured: args.wechatRelayConfigured,
      bindingSupported: true,
      notes: "Mirrors the same safe public shell as Telegram and stays attached to the same product state.",
    },
    {
      id: "private-telegram",
      label: "Telegram private operator",
      mode: "private" as const,
      route: "/api/bots/private-telegram",
      relayConfigured: args.telegramRelayConfigured,
      bindingSupported: false,
      notes: "Admin-only runtime controls remain private.",
    },
    {
      id: "private-wechat",
      label: "WeChat private operator",
      mode: "private" as const,
      route: "/api/bots/private-wechat",
      relayConfigured: args.wechatRelayConfigured,
      bindingSupported: false,
      notes: "Private operator controls stay separate from the public bot surface.",
    },
  ] satisfies TianshiBotSurfaceStatus[];
}
