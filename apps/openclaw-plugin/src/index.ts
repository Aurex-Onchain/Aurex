import { Type } from "typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { AdvisorClient } from "./advisor-client.js";

const DEFAULT_ADVISOR_URL = "http://localhost:3100";

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    details: data,
  };
}

export default definePluginEntry({
  id: "aurex",
  name: "Aurex Advisor",
  description:
    "On-chain signal marketplace intelligence. Provides market analysis, trading signals, and strategy recommendations via Aurex Advisor.",

  register(api) {
    const config = (api.pluginConfig ?? {}) as { advisorUrl?: string };
    const advisorUrl = config.advisorUrl || DEFAULT_ADVISOR_URL;

    function client() {
      return new AdvisorClient(advisorUrl);
    }

    api.registerTool({
      name: "aurex.get_strategy",
      label: "Aurex: Get Strategy",
      description:
        "Get comprehensive trading strategy context from Aurex Advisor including market data, signals, behavior analysis, and recommended actions.",
      parameters: Type.Object({
        address: Type.Optional(Type.String({ description: "Wallet address for user-specific context" })),
      }),
      async execute(_toolCallId, params) {
        const { address } = params as { address?: string };
        const data = await client().getStrategy(address);
        return jsonResult(data);
      },
    });

    api.registerTool({
      name: "aurex.market_status",
      label: "Aurex: Market Status",
      description:
        "Get current market status for all watched pools including latest signals, risk scores, and pool policies.",
      parameters: Type.Object({}),
      async execute() {
        const data = await client().getMarket();
        return jsonResult(data);
      },
    });

    api.registerTool({
      name: "aurex.send_message",
      label: "Aurex: Send Message",
      description:
        "Send a message to the Aurex Web UI feed. Use this to deliver trading recommendations, signal alerts, or strategy updates to the user. When the message contains percentage-based metrics (risk, alpha, liquidity, etc.), always include them in the metrics array so they render as progress bars.",
      parameters: Type.Object({
        content: Type.String({ description: "Message content to display in the feed" }),
        type: Type.Optional(Type.String({ description: "recommendation | signal_alert | strategy" })),
        pool_id: Type.Optional(Type.String({ description: "Pool ID for actionable recommendations" })),
        direction: Type.Optional(Type.String({ description: "buy or sell" })),
        amount: Type.Optional(Type.String({ description: "Trade amount in raw units" })),
        token_in: Type.Optional(Type.String({ description: "Input token address" })),
        token_out: Type.Optional(Type.String({ description: "Output token address" })),
        metrics: Type.Optional(Type.Array(
          Type.Object({
            label: Type.String({ description: "Metric name (e.g. Risk, Alpha, Liquidity)" }),
            value: Type.Number({ description: "Current value" }),
            min: Type.Number({ description: "Minimum of the range (usually 0)" }),
            max: Type.Number({ description: "Maximum of the range (usually 100)" }),
          }),
          { description: "Metrics to display as progress bars. Include whenever you have 0-100 score data." },
        )),
      }),
      async execute(_toolCallId, params) {
        const { content, type, pool_id, direction, amount, token_in, token_out, metrics } = params as {
          content: string; type?: string; pool_id?: string; direction?: string;
          amount?: string; token_in?: string; token_out?: string;
          metrics?: { label: string; value: number; min: number; max: number }[];
        };
        const metadata: Record<string, unknown> = {};
        if (pool_id) Object.assign(metadata, { pool_id, direction, amount, token_in, token_out });
        if (metrics && metrics.length > 0) metadata.metrics = metrics;
        const res = await fetch(`${advisorUrl}/api/messages/inbound`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: type || "recommendation",
            role: "assistant",
            content,
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
          }),
        });
        if (!res.ok) throw new Error(`Advisor ${res.status}`);
        const data = await res.json();
        return jsonResult(data);
      },
    });

    api.registerTool({
      name: "aurex.execute_trade",
      label: "Aurex: Execute Trade",
      description:
        "Execute a swap through Aurex Advisor. Set confirm=true to execute immediately, or false to stage for user confirmation in the Web UI.",
      parameters: Type.Object({
        pool_id: Type.String({ description: "Pool ID (bytes32 hex)" }),
        direction: Type.String({ description: "buy or sell" }),
        amount: Type.String({ description: "Amount in raw token units" }),
        token_in: Type.String({ description: "Input token address" }),
        token_out: Type.String({ description: "Output token address" }),
        confirm: Type.Boolean({ description: "true = execute now, false = stage for user confirmation" }),
      }),
      async execute(_toolCallId, params) {
        const p = params as { pool_id: string; direction: string; amount: string; token_in: string; token_out: string; confirm: boolean };
        const data = await client().executeTrade({
          pool_id: p.pool_id,
          action_type: "swap",
          direction: p.direction,
          amount: p.amount,
          token_in: p.token_in,
          token_out: p.token_out,
          confirm: p.confirm,
        });
        return jsonResult(data);
      },
    });

    api.registerTool({
      name: "aurex.get_prices",
      label: "Aurex: Get Token Prices",
      description:
        "Get current prices, 1h/24h price changes, and volatility for tracked tokens. Use this to assess market conditions and identify trading opportunities.",
      parameters: Type.Object({
        tokens: Type.Optional(Type.Array(Type.String(), { description: "Token addresses to query. Omit to get all tracked tokens." })),
      }),
      async execute(_toolCallId, params) {
        const { tokens } = params as { tokens?: string[] };
        const data = await client().getPrices(tokens);
        return jsonResult(data);
      },
    });

    api.registerHook("heartbeat_prompt_contribution", (async () => {
      const c = client();
      const healthy = await c.health();
      if (!healthy) return;

      try {
        const [strategy, behavior, prices] = await Promise.all([
          c.getStrategy(),
          c.getBehavior(),
          c.getPrices(),
        ]);

        const context = [
          "## Aurex Market Intelligence",
          "",
          "Below is the current state of the Aurex signal marketplace and token prices. Analyze this data and if there are notable changes, risks, or opportunities, notify the user through the aurex.send_message tool.",
          "",
          "### Strategy Context",
          "```json",
          JSON.stringify(strategy, null, 2),
          "```",
          "",
          "### Token Prices & Volatility",
          "```json",
          JSON.stringify(prices, null, 2),
          "```",
          "",
          "### Behavior Monitor",
          "```json",
          JSON.stringify(behavior, null, 2),
          "```",
          "",
          "## Decision Rules",
          "- If a token's 1h price change exceeds ±5% or volatility > 3%, alert the user with a recommendation.",
          "- If a token is dropping sharply (>8% in 1h), recommend converting to stablecoins.",
          "- If alpha score is high (>60) and risk is low (<30), recommend entering a position.",
          "- If a signal is about to expire and conditions are still favorable, remind the user to act.",
          "- For trade recommendations, always include metadata (pool_id, direction, amount, token_in, token_out) so the user can execute directly from the feed.",
          "- IMPORTANT: When your message references any 0-100 score data (risk, alpha, liquidity, fee, volatility, confidence, etc.), you MUST include them in the `metrics` array parameter. Each metric needs: label (display name), value (current number), min (range floor, usually 0), max (range ceiling, usually 100). This renders visual progress bars in the UI.",
          "- Use aurex.get_prices for detailed price queries if you need more data before making a recommendation.",
        ].join("\n");

        return { appendContext: context };
      } catch {
        return;
      }
    }) as () => Promise<void>, { name: "aurex-heartbeat" });
  },
});
