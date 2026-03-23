import { getServerEnv } from "@/lib/env";
import { tickAutonomousHeartbeat } from "@/lib/server/autonomous-agent";
import { bootstrapGoonclawTelegramBot } from "@/lib/server/goonclaw-telegram";

declare global {
  var __goonclawAutonomousRuntimeStarted: boolean | undefined;
  var __goonclawAutonomousRuntimeTicking: boolean | undefined;
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

  const runCycle = async (reason: string) => {
    if (global.__goonclawAutonomousRuntimeTicking) {
      console.warn(`[goonclaw-automaton] skipped overlapping cycle reason=${reason}`);
      return;
    }

    global.__goonclawAutonomousRuntimeTicking = true;
    try {
      const snapshot = await tickAutonomousHeartbeat(reason);
      console.log(
        `[goonclaw-automaton] heartbeat ${snapshot.heartbeatAt} phase=${snapshot.runtimePhase} decision="${snapshot.latestPolicyDecision}"`,
      );
    } catch (error) {
      console.warn(`[goonclaw-automaton] heartbeat failed reason=${reason}`, error);
    } finally {
      global.__goonclawAutonomousRuntimeTicking = false;
    }
  };

  void runCycle("server bootstrap");
  setInterval(() => {
    void runCycle("cloud run heartbeat");
  }, intervalMs);

  return true;
}
