import { GoogleGenAI } from "@google/genai";

import { getServerEnv } from "@/lib/env";
import { AgentModelStatus } from "@/lib/types";

export function getAgentModelStatus(): AgentModelStatus {
  const env = getServerEnv();
  const provider = env.AGENT_MODEL_PROVIDER;
  const usesVertexAi = env.GOOGLE_GENAI_USE_VERTEXAI === "true";
  const projectId = env.VERTEX_AI_PROJECT_ID;
  const location = env.VERTEX_AI_LOCATION;
  const model = env.VERTEX_AI_MODEL;

  return {
    provider,
    model,
    projectId,
    location,
    usesVertexAi,
    configured: provider === "vertex-ai-gemini" && usesVertexAi && Boolean(projectId),
  };
}

export function createAgentModelClient() {
  const status = getAgentModelStatus();
  if (!status.configured) {
    throw new Error("Vertex AI Gemini runtime is not configured");
  }

  return new GoogleGenAI({
    vertexai: true,
    project: status.projectId,
    location: status.location,
  });
}
