import { getServerEnv } from "@/lib/env";
import { AutonomousFeedEvent } from "@/lib/types";

function shouldBroadcastEvent(event: AutonomousFeedEvent) {
  return ["heartbeat", "policy", "decision", "trade", "revenue", "burn"].includes(
    event.kind,
  );
}

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

function getWechatConfig() {
  const env = getServerEnv();
  return {
    botName: env.TIANSHI_WECHAT_BOT_NAME,
    channelLabel: env.TIANSHI_WECHAT_CHANNEL_LABEL,
    webhookUrl: env.TIANSHI_WECHAT_WEBHOOK_URL,
  };
}

function canUseWechat() {
  return Boolean(getWechatConfig().webhookUrl);
}

function formatWechatMessage(event: AutonomousFeedEvent) {
  const { botName, channelLabel } = getWechatConfig();
  const lines = [
    `${botName} ${event.kind}`,
    event.title,
    event.detail,
    "",
    `channel=${channelLabel}`,
  ];

  if (event.rawTrace.length) {
    lines.push("", "trace");
    for (const trace of event.rawTrace.slice(0, 8)) {
      lines.push(`- ${trace}`);
    }
  }

  return truncate(lines.join("\n"), 3200);
}

export function isTianshiWechatBroadcastEnabled() {
  return canUseWechat();
}

export async function bootstrapTianshiWechatRelay() {
  return canUseWechat();
}

export async function publishAutonomousEventToWechat(event: AutonomousFeedEvent) {
  const { webhookUrl } = getWechatConfig();
  if (!webhookUrl || !shouldBroadcastEvent(event)) {
    return false;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      msgtype: "text",
      text: {
        content: formatWechatMessage(event),
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WeChat relay failed: ${text || response.statusText}`);
  }

  const payload = (await response.json().catch(() => null)) as
    | { errcode?: number; errmsg?: string }
    | null;

  if (payload && payload.errcode && payload.errcode !== 0) {
    throw new Error(`WeChat relay failed: ${payload.errmsg || payload.errcode}`);
  }

  return true;
}
