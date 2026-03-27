import { CORE_QUESTS, type TianezhaQuestStatus } from "@/lib/server/progression";

type TrainingInputs = {
  hasLoadedIdentity: boolean;
  hasPosts: boolean;
  hasTianziPositions: boolean;
  hasNezhaPositions: boolean;
};

export type TianezhaQuest = {
  description: string;
  id: string;
  rewardHint: string;
  status: TianezhaQuestStatus;
  title: string;
};

export function buildTrainingQuests(inputs: TrainingInputs): TianezhaQuest[] {
  return CORE_QUESTS.map((quest) => {
    let status: TianezhaQuestStatus = "live";

    if (quest.id === "first-profile-load") {
      status = inputs.hasLoadedIdentity ? "complete" : "live";
    } else if (!inputs.hasLoadedIdentity) {
      status = "locked";
    } else if (quest.id === "first-bolclaw-post") {
      status = inputs.hasPosts ? "complete" : "live";
    } else if (quest.id === "first-tianzi-position") {
      status = inputs.hasTianziPositions ? "complete" : "live";
    } else if (quest.id === "first-nezha-trade") {
      status = inputs.hasNezhaPositions ? "complete" : "live";
    }

    return {
      ...quest,
      status,
    };
  });
}
