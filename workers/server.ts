import Fastify from "fastify";

import { getServerEnv } from "../lib/env";
import {
  listRuntimeSessions,
  rehydrateRuntimeSessions,
  startRuntimeSession,
  stopRuntimeSession,
} from "../lib/server/worker-runtime";
import { SessionStartInput } from "../lib/types";

type StopBody = {
  sessionId?: string;
};

function unauthorizedError() {
  const error = new Error("Unauthorized");
  error.name = "UnauthorizedError";
  return error;
}

async function buildServer() {
  const env = getServerEnv();
  const app = Fastify({
    logger: true,
  });

  app.addHook("onRequest", async (request) => {
    if (request.url === "/healthz") {
      return;
    }

    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token || token !== env.WORKER_TOKEN) {
      throw unauthorizedError();
    }
  });

  app.get("/healthz", async () => ({
    ok: true,
    runtimeSessions: listRuntimeSessions().length,
    timestamp: new Date().toISOString(),
  }));

  app.get("/sessions/status", async () => ({
    items: listRuntimeSessions(),
  }));

  app.post<{ Body: SessionStartInput }>("/sessions/start", async (request, reply) => {
    const body = request.body;
    if (!body?.wallet || !body.contractAddress || !body.deviceId || !body.mode) {
      return reply.code(400).send({
        error: "wallet, contractAddress, deviceId, and mode are required",
      });
    }

    const item = await startRuntimeSession(body);
    return { item };
  });

  app.post<{ Body: StopBody }>("/sessions/stop", async (request, reply) => {
    const sessionId = request.body?.sessionId;
    if (!sessionId) {
      return reply.code(400).send({ error: "sessionId is required" });
    }

    const item = await stopRuntimeSession(sessionId);
    return { ok: true, item };
  });

  app.post("/sessions/reconcile", async () => rehydrateRuntimeSessions());

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof Error && error.name === "UnauthorizedError") {
      return reply.code(401).send({ error: error.message });
    }

    request.log.error(error);
    return reply.code(500).send({
      error: error instanceof Error ? error.message : "Worker request failed",
    });
  });

  return app;
}

async function main() {
  const app = await buildServer();
  const recovered = await rehydrateRuntimeSessions();
  if (recovered.recovered.length || recovered.skipped.length) {
    app.log.info({
      recovered: recovered.recovered.map((session) => session.id),
      skipped: recovered.skipped,
    }, "runtime sessions reconciled");
  }

  const port = Number(process.env.PORT || 8080);
  await app.listen({
    host: "0.0.0.0",
    port,
  });
}

void main();
