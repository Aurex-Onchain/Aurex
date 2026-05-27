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

export function createClaudeCodePlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Claude Code",
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
        type: "claude-code",
        mcpServers: {
          "aurex-advisor": {
            command: "npx",
            args: ["-y", "@aurex/advisor"],
            env: {
              AUREX_RPC_URL: "https://rpc.xlayer.tech",
              AUREX_CHAIN_ID: "196",
            },
          },
        },
      };
    },
  };
}

export function createWindsurfPlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Windsurf IDE",
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
        type: "windsurf",
        mcpServers: {
          "aurex-advisor": {
            command: "npx",
            args: ["-y", "@aurex/advisor"],
            env: {
              AUREX_RPC_URL: "https://rpc.xlayer.tech",
              AUREX_CHAIN_ID: "196",
            },
          },
        },
      };
    },
  };
}

export function createClinePlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Cline (VSCode Extension)",
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
        type: "cline",
        mcpServers: {
          "aurex-advisor": {
            command: "npx",
            args: ["-y", "@aurex/advisor"],
            env: {
              AUREX_RPC_URL: "https://rpc.xlayer.tech",
              AUREX_CHAIN_ID: "196",
            },
          },
        },
      };
    },
  };
}

export function createContinuePlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Continue.dev",
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
        type: "continue",
        mcpServers: {
          "aurex-advisor": {
            command: "npx",
            args: ["-y", "@aurex/advisor"],
            env: {
              AUREX_RPC_URL: "https://rpc.xlayer.tech",
              AUREX_CHAIN_ID: "196",
            },
          },
        },
      };
    },
  };
}

export function createZedPlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Zed Editor",
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
        type: "zed",
        mcpServers: {
          "aurex-advisor": {
            command: "npx",
            args: ["-y", "@aurex/advisor"],
            env: {
              AUREX_RPC_URL: "https://rpc.xlayer.tech",
              AUREX_CHAIN_ID: "196",
            },
          },
        },
      };
    },
  };
}

export function createClaudeDesktopPlugin(): PluginAdapter {
  return {
    getManifest() {
      return {
        name: "aurex-advisor",
        version: "0.1.0",
        description: "Aurex Advisor MCP Server for Claude Desktop App",
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
        type: "claude-desktop",
        mcpServers: {
          "aurex-advisor": {
            command: "npx",
            args: ["-y", "@aurex/advisor"],
            env: {
              AUREX_RPC_URL: "https://rpc.xlayer.tech",
              AUREX_CHAIN_ID: "196",
            },
          },
        },
      };
    },
  };
}

export type SupportedClient =
  | "openclaw"
  | "cursor"
  | "hermes"
  | "claude-code"
  | "windsurf"
  | "cline"
  | "continue"
  | "zed"
  | "claude-desktop";

export function getPluginAdapter(clientType: SupportedClient): PluginAdapter {
  switch (clientType) {
    case "openclaw": return createOpenClawPlugin();
    case "cursor": return createCursorPlugin();
    case "hermes": return createHermesPlugin();
    case "claude-code": return createClaudeCodePlugin();
    case "windsurf": return createWindsurfPlugin();
    case "cline": return createClinePlugin();
    case "continue": return createContinuePlugin();
    case "zed": return createZedPlugin();
    case "claude-desktop": return createClaudeDesktopPlugin();
  }
}

export function generatePluginConfig(clientType: SupportedClient, advisorUrl: string): Record<string, unknown> {
  const adapter = getPluginAdapter(clientType);
  return {
    manifest: adapter.getManifest(),
    connection: adapter.getConnectionConfig(advisorUrl),
  };
}
