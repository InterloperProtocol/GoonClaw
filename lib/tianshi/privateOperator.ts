import { getHermesClientStatus } from "@/lib/tianshi/hermesClient";

export function getPrivateOperatorStatus() {
  const hermes = getHermesClientStatus();

  return {
    adminOnly: true,
    hermesConfigured: hermes.configured,
    operatorSurface: "private",
    telegramOperatorBotReady: Boolean(process.env.TIANEZHA_PRIVATE_TELEGRAM_TOKEN?.trim()),
  };
}
