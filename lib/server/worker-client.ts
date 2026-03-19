import { allowInProcessWorker, getServerEnv } from "@/lib/env";
import { startRuntimeSession, stopRuntimeSession } from "@/lib/server/worker-runtime";
import { SessionStartInput } from "@/lib/types";

function shouldUseInProcessWorker() {
  const env = getServerEnv();
  if (allowInProcessWorker()) {
    return true;
  }

  if (!env.WORKER_URL) {
    throw new Error(
      "WORKER_URL must be configured when ALLOW_IN_PROCESS_WORKER is false",
    );
  }

  return false;
}

async function callWorker(path: string, body: unknown) {
  const env = getServerEnv();
  const response = await fetch(`${env.WORKER_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.WORKER_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Worker request failed");
  }

  return response.json();
}

export async function dispatchSessionStart(input: SessionStartInput) {
  if (shouldUseInProcessWorker()) {
    return startRuntimeSession(input);
  }

  return callWorker("/sessions/start", input);
}

export async function dispatchSessionStop(sessionId: string) {
  if (shouldUseInProcessWorker()) {
    return stopRuntimeSession(sessionId);
  }

  return callWorker("/sessions/stop", { sessionId });
}
