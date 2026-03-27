export type PublicPublisherDecision = {
  channel: "bolclaw" | "left-chat" | "tianshi";
  reason: string;
  visible: boolean;
};

export function decidePublicVisibility(channel: PublicPublisherDecision["channel"]) {
  switch (channel) {
    case "tianshi":
      return {
        channel,
        reason: "Tianshi narrates the world in public.",
        visible: true,
      } satisfies PublicPublisherDecision;
    case "left-chat":
      return {
        channel,
        reason: "The left chat can guide the currently loaded identity.",
        visible: true,
      } satisfies PublicPublisherDecision;
    default:
      return {
        channel,
        reason: "BolClaw stays readable, so public publishing must stay selective.",
        visible: true,
      } satisfies PublicPublisherDecision;
  }
}
