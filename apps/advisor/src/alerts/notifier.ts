import type { MessageStore } from "../messages/store.js";
import { createLogger } from "../logger.js";

const logger = createLogger();

export interface NotifierConfig {
  openclawGatewayUrl: string;
  openclawGatewayToken: string;
  openclawAgentId: string;
  enabled: boolean;
}

export interface AlertContext {
  type: "score_change" | "whale_movement" | "behavior_escalation" | "signal_expired";
  summary: string;
  data: Record<string, unknown>;
}

export interface Notifier {
  notify(alert: AlertContext): Promise<void>;
}

export function createNotifier(config: NotifierConfig, messageStore: MessageStore): Notifier {
  async function triggerOpenClawTurn(alert: AlertContext): Promise<void> {
    if (!config.enabled || !config.openclawGatewayToken) return;

    const message = `[AUREX ALERT] ${alert.type}: ${alert.summary}\n\nData: ${JSON.stringify(alert.data, null, 2)}\n\nAnalyze this alert and call the aurex.send_message tool to notify the user with your assessment and recommended action.`;

    try {
      const res = await fetch(`${config.openclawGatewayUrl}/hooks/agent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.openclawGatewayToken}`,
        },
        body: JSON.stringify({
          message,
          agentId: config.openclawAgentId,
          wakeMode: "now",
          deliver: false,
        }),
      });
      if (!res.ok) {
        logger.warn(`OpenClaw Gateway returned ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      logger.warn({ err }, "Failed to trigger OpenClaw agent turn");
    }
  }

  return {
    async notify(alert) {
      messageStore.save({
        type: "signal_alert",
        role: "assistant",
        content: alert.summary,
        metadata: { alertType: alert.type, ...alert.data },
      });

      await triggerOpenClawTurn(alert);
    },
  };
}

export function getNotifierConfig(): NotifierConfig {
  return {
    openclawGatewayUrl: process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789",
    openclawGatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN || "",
    openclawAgentId: process.env.OPENCLAW_AGENT_ID || "main",
    enabled: !!process.env.OPENCLAW_GATEWAY_TOKEN,
  };
}
