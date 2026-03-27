export type TianezhaQuestStatus = "locked" | "live" | "complete";

export type TianezhaQuestDefinition = {
  description: string;
  id: string;
  rewardHint: string;
  title: string;
};

export const CORE_QUESTS: TianezhaQuestDefinition[] = [
  {
    description: "Load a wallet and rebuild the BitClaw character sheet.",
    id: "first-profile-load",
    rewardHint: "5% first-load reward lane",
    title: "Enter the world",
  },
  {
    description: "Post your first thesis or note into BolClaw from BitClaw.",
    id: "first-bolclaw-post",
    rewardHint: "Good data + social badge progress",
    title: "Break the silence",
  },
  {
    description: "Take a position in Tianzi before the current market window closes.",
    id: "first-tianzi-position",
    rewardHint: "Prediction rewards + accuracy streaks",
    title: "Call the market",
  },
  {
    description: "Open a simulated long or short in Nezha and manage the risk.",
    id: "first-nezha-trade",
    rewardHint: "Trading rewards + discipline badges",
    title: "Take leverage training",
  },
];
