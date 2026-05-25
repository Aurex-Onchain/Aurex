export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  transport: "stdio" | "http" | "sse";
  endpoint?: string;
  tools: string[];
}

export interface PluginAdapter {
  getManifest(): PluginManifest;
  getConnectionConfig(advisorUrl: string): Record<string, unknown>;
}

export function createOpenClawPlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor — on-chain signal marketplace intelligence for AI trading",
        transport: "http",
        tools: [
          "advisor.market_status",
          "advisor.get_strategy",
          "advisor.publish_signal",
          "advisor.risk_check",
          "advisor.behavior_alert",
          "advisor.publisher_stats",
          "advisor.configure",
          "advisor.execute",
          "advisor.confirm_execution",
        ],
      };
    },
    getConnectionConfig(advisorUrl) {
      return {
        type: "openclaw",
        name: "aurex-advisor",
        url: `${advisorUrl}/mcp`,
        transport: "streamable-http",
        description: "Aurex on-chain signal marketplace advisor",
      };
    },
  };
}

export function createCursorPlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Cursor IDE",
        transport: "stdio",
        tools: [
          "advisor.market_status",
          "advisor.get_strategy",
          "advisor.publish_signal",
          "advisor.risk_check",
          "advisor.behavior_alert",
          "advisor.publisher_stats",
          "advisor.configure",
          "advisor.execute",
          "advisor.confirm_execution",
        ],
      };
    },
    getConnectionConfig(_advisorUrl) {
      return {
        type: "cursor",
        mcpServers: {
          "aurex-advisor": {
            command: "npx",
            args: ["@aurex/advisor", "--mcp"],
            env: {
              AUREX_RPC_URL: "https://rpc.xlayer.tech",
            },
          },
        },
      };
    },
  };
}

export function createHermesPlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Hermes AI",
        transport: "sse",
        tools: [
          "advisor.market_status",
          "advisor.get_strategy",
          "advisor.publish_signal",
          "advisor.risk_check",
          "advisor.behavior_alert",
          "advisor.publisher_stats",
          "advisor.configure",
          "advisor.execute",
          "advisor.confirm_execution",
        ],
      };
    },
    getConnectionConfig(advisorUrl) {
      return {
        type: "hermes",
        name: "aurex-advisor",
        url: `${advisorUrl}/mcp/sse`,
        transport: "sse",
        reconnect: true,
        headers: {
          "X-Aurex-Version": "0.1.0",
        },
      };
    },
  };
}

export function getPluginAdapter(clientType: "openclaw" | "cursor" | "hermes"): PluginAdapter {
  switch (clientType) {
    case "openclaw": return createOpenClawPlugin();
    case "cursor": return createCursorPlugin();
    case "hermes": return createHermesPlugin();
  }
}

export function generatePluginConfig(clientType: "openclaw" | "cursor" | "hermes", advisorUrl: string): Record<string, unknown> {
  const adapter = getPluginAdapter(clientType);
  return {
    manifest: adapter.getManifest(),
    connection: adapter.getConnectionConfig(advisorUrl),
  };
}
