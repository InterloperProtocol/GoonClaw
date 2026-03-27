import type { TianezhaQuest } from "@/lib/tianshi/trainingBuilder";

export function TianezhaQuestPanel({ quests }: { quests: TianezhaQuest[] }) {
  if (!quests.length) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Training and perks</p>
          <h2>Financial RPG quest log</h2>
        </div>
      </div>
      <div className="mini-list">
        {quests.map((quest) => (
          <article key={quest.id} className="mini-item-card">
            <div>
              <span>{quest.status}</span>
              <strong>{quest.title}</strong>
            </div>
            <p className="route-summary compact">{quest.description}</p>
            <p className="route-summary compact">{quest.rewardHint}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
