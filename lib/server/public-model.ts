import { GoogleGenAI } from "@google/genai";

import { getServerEnv } from "@/lib/env";

function getPublicModelConfig() {
  const env = getServerEnv();
  const usesVertexAi = env.GOOGLE_GENAI_USE_VERTEXAI === "true";
  const projectId = env.VERTEX_AI_PROJECT_ID?.trim();
  const location = env.VERTEX_AI_LOCATION?.trim();
  const model = env.VERTEX_AI_MODEL?.trim();

  return {
    configured:
      env.AGENT_MODEL_PROVIDER === "vertex-ai-gemini" &&
      usesVertexAi &&
      Boolean(projectId) &&
      Boolean(location) &&
      Boolean(model),
    projectId,
    location,
    model,
  };
}

export function isPublicModelConfigured() {
  return getPublicModelConfig().configured;
}

export function createPublicModelClient() {
  const config = getPublicModelConfig();
  if (!config.configured || !config.projectId || !config.location) {
    throw new Error("Public chat model is not configured");
  }

  return new GoogleGenAI({
    vertexai: true,
    project: config.projectId,
    location: config.location,
  });
}

export async function generatePublicModelText(
  prompt: string,
  options?: {
    temperature?: number;
    maxOutputTokens?: number;
  },
) {
  const config = getPublicModelConfig();
  if (!config.configured || !config.model) {
    throw new Error("Public chat model is not configured");
  }

  const client = createPublicModelClient();
  const response = await client.models.generateContent({
    model: config.model,
    contents: prompt,
    config: {
      temperature: options?.temperature ?? 0.4,
      maxOutputTokens: options?.maxOutputTokens ?? 500,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Public chat model returned an empty response");
  }

  return text;
}
