import { allowInProcessWorker } from "@/lib/env";
import { startAutonomousRuntimeLoop } from "@/lib/server/autonomous-runtime";
import { startLivestreamRuntimeLoop } from "@/lib/server/livestream-runtime";
import { rehydrateRuntimeSessions } from "@/lib/server/worker-runtime";

declare global {
  var __goonclawNodeInstrumentationRegistered: boolean | undefined;
}

async function bootstrapInProcessRuntimeSessions() {
  if (!allowInProcessWorker()) {
    return;
  }

  try {
    const { recovered, skipped } = await rehydrateRuntimeSessions();
    console.log(
      `[goonclaw-runtime] recovered=${recovered.length} skipped=${skipped.length}`,
    );
  } catch (error) {
    console.warn("[goonclaw-runtime] failed to recover in-process sessions", error);
  }
}

export async function registerNodeInstrumentation() {
  if (global.__goonclawNodeInstrumentationRegistered) {
    return;
  }

  global.__goonclawNodeInstrumentationRegistered = true;
  await bootstrapInProcessRuntimeSessions();
  startAutonomousRuntimeLoop();
  startLivestreamRuntimeLoop();
}
