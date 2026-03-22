import { getServerEnv } from "@/lib/env";
import { tickAutonomousHeartbeat } from "@/lib/server/autonomous-agent";
import { bootstrapGoonclawTelegramBot } from "@/lib/server/goonclaw-telegram";

declare global {
  var __goonclawAutonomousRuntimeStarted: boolean | undefined;
}

export function startAutonomousRuntimeLoop() {
  if (global.__goonclawAutonomousRuntimeStarted) {
    return false;
  }

  const env = getServerEnv();
  if (env.GOONCLAW_AUTONOMOUS_ENABLED !== "true") {
    return false;
  }

  global.__goonclawAutonomousRuntimeStarted = true;

  const intervalMinutes = Math.max(
    1,
    Number(env.GOONCLAW_SETTLEMENT_INTERVAL_MINUTES) || 1,
  );
  const intervalMs = intervalMinutes * 60_000;

  console.log(
    `[goonclaw-automaton] runtime bootstrap at ${new Date().toISOString()} interval=${intervalMinutes}m`,
  );

  void bootstrapGoonclawTelegramBot()
    .then((enabled) => {
      if (enabled) {
        console.log("[goonclaw-automaton] telegram relay ready");
      }
    })
    .catch((error) => {
      console.warn("[goonclaw-automaton] telegram bootstrap failed", error);
    });

  const bootSnapshot = tickAutonomousHeartbeat("server bootstrap");
  console.log(
    `[goonclaw-automaton] heartbeat ${bootSnapshot.heartbeatAt} phase=${bootSnapshot.runtimePhase} decision="${bootSnapshot.latestPolicyDecision}"`,
  );

  setInterval(() => {
    const snapshot = tickAutonomousHeartbeat("cloud run heartbeat");
    console.log(
      `[goonclaw-automaton] heartbeat ${snapshot.heartbeatAt} phase=${snapshot.runtimePhase} decision="${snapshot.latestPolicyDecision}"`,
    );
  }, intervalMs);

  return true;
}
