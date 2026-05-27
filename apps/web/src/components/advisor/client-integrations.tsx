"use client";

import { useState } from "react";
import { useHealth } from "@/hooks/use-health";

interface ClientConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  transport: "stdio" | "http" | "sse";
  setupSteps: string[];
  configExample?: string;
}

const SUPPORTED_CLIENTS: ClientConfig[] = [
  {
    id: "openclaw",
    name: "OpenClaw",
    description: "AI agent platform with plugin system",
    icon: "🦅",
    transport: "http",
    setupSteps: [
      "Install OpenClaw: npm install -g openclaw",
      "Build plugin: cd apps/openclaw-plugin && npm run plugin:build",
      "Install plugin: openclaw plugins install ./dist",
      "Configure gateway in apps/advisor/.env",
    ],
  },
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Anthropic's official CLI for Claude",
    icon: "🤖",
    transport: "stdio",
    setupSteps: [
      "Add to Claude Code MCP settings",
      "The Advisor will run as an MCP server",
      "Use advisor.* tools in your conversations",
    ],
    configExample: `{
  "mcpServers": {
    "aurex-advisor": {
      "command": "npx",
      "args": ["-y", "@aurex/advisor"],
      "env": {
        "AUREX_RPC_URL": "https://rpc.xlayer.tech",
        "AUREX_CHAIN_ID": "196"
      }
    }
  }
}`,
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "AI-first code editor",
    icon: "⚡",
    transport: "stdio",
    setupSteps: [
      "Open Cursor settings",
      "Add MCP server configuration",
      "Restart Cursor to load the server",
    ],
    configExample: `{
  "mcpServers": {
    "aurex-advisor": {
      "command": "npx",
      "args": ["-y", "@aurex/advisor"],
      "env": {
        "AUREX_RPC_URL": "https://rpc.xlayer.tech"
      }
    }
  }
}`,
  },
  {
    id: "windsurf",
    name: "Windsurf",
    description: "Codeium's AI IDE",
    icon: "🌊",
    transport: "stdio",
    setupSteps: [
      "Open Windsurf MCP settings",
      "Add Aurex Advisor server",
      "Reload window to activate",
    ],
    configExample: `{
  "mcpServers": {
    "aurex-advisor": {
      "command": "npx",
      "args": ["-y", "@aurex/advisor"]
    }
  }
}`,
  },
  {
    id: "cline",
    name: "Cline",
    description: "VSCode AI assistant extension",
    icon: "🔧",
    transport: "stdio",
    setupSteps: [
      "Install Cline extension in VSCode",
      "Open Cline MCP settings",
      "Add Aurex Advisor configuration",
    ],
    configExample: `{
  "mcpServers": {
    "aurex-advisor": {
      "command": "npx",
      "args": ["-y", "@aurex/advisor"]
    }
  }
}`,
  },
  {
    id: "continue",
    name: "Continue.dev",
    description: "Open-source AI code assistant",
    icon: "➡️",
    transport: "stdio",
    setupSteps: [
      "Install Continue extension",
      "Open Continue config.json",
      "Add MCP server entry",
    ],
    configExample: `{
  "mcpServers": {
    "aurex-advisor": {
      "command": "npx",
      "args": ["-y", "@aurex/advisor"]
    }
  }
}`,
  },
  {
    id: "zed",
    name: "Zed",
    description: "High-performance code editor",
    icon: "⚡",
    transport: "stdio",
    setupSteps: [
      "Open Zed settings",
      "Navigate to MCP servers section",
      "Add Aurex Advisor configuration",
    ],
    configExample: `{
  "mcpServers": {
    "aurex-advisor": {
      "command": "npx",
      "args": ["-y", "@aurex/advisor"]
    }
  }
}`,
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    description: "Claude desktop application",
    icon: "🖥️",
    transport: "stdio",
    setupSteps: [
      "Open Claude Desktop settings",
      "Add MCP server in configuration",
      "Restart Claude Desktop",
    ],
    configExample: `{
  "mcpServers": {
    "aurex-advisor": {
      "command": "npx",
      "args": ["-y", "@aurex/advisor"]
    }
  }
}`,
  },
  {
    id: "hermes",
    name: "Hermes AI",
    description: "AI assistant with SSE support",
    icon: "🚀",
    transport: "sse",
    setupSteps: [
      "Configure Hermes to connect via SSE",
      "Point to Advisor SSE endpoint",
      "Enable auto-reconnect",
    ],
  },
];

function getAdvisorUrl(): string {
  if (typeof window === "undefined") return "http://localhost:3100";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3100";
  return `http://${host}:3100`;
}

export function ClientIntegrations() {
  const { data } = useHealth();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const connected = data?.status === "ok";
  const advisorUrl = getAdvisorUrl();

  const selectedClientConfig = SUPPORTED_CLIENTS.find((c) => c.id === selectedClient);

  async function fetchConfig(clientId: string) {
    try {
      const res = await fetch(`${advisorUrl}/api/plugin?client=${clientId}`);
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }

  async function copyConfig() {
    if (!selectedClientConfig) return;

    const config = await fetchConfig(selectedClientConfig.id);
    const configText = config ? JSON.stringify(config, null, 2) : selectedClientConfig.configExample || "";

    navigator.clipboard.writeText(configText);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Supported AI Clients
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Connect Aurex Advisor to your favorite AI assistant
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Advisor Running</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUPPORTED_CLIENTS.map((client) => (
          <button
            key={client.id}
            onClick={() => setSelectedClient(client.id === selectedClient ? null : client.id)}
            className={`p-4 rounded-lg border text-left transition-all ${
              selectedClient === client.id
                ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/10"
                : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{client.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {client.name}
                  </h4>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    {client.transport}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {client.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedClientConfig && (
        <div className="p-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="text-xl">{selectedClientConfig.icon}</span>
                {selectedClientConfig.name} Setup
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Follow these steps to integrate with Aurex Advisor
              </p>
            </div>
            <button
              onClick={() => setSelectedClient(null)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <span className="material-icons-outlined" style={{ fontSize: "18px" }}>close</span>
            </button>
          </div>

          <div className="space-y-3">
            {selectedClientConfig.setupSteps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-medium">
                  {idx + 1}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          {selectedClientConfig.configExample && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  Configuration
                </p>
                <button
                  onClick={copyConfig}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                >
                  {copiedConfig ? "✓ Copied" : "Copy Config"}
                </button>
              </div>
              <pre className="p-3 rounded bg-zinc-900 text-xs font-mono text-emerald-300 overflow-x-auto">
                {selectedClientConfig.configExample}
              </pre>
            </div>
          )}

          <div className="pt-3 border-t border-emerald-500/20">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-emerald-400">Advisor URL:</span> {advisorUrl}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <span className="font-medium text-emerald-400">Available Tools:</span> advisor.market_status, advisor.get_strategy, advisor.publish_signal, advisor.risk_check, advisor.behavior_alert, advisor.publisher_stats, advisor.configure, advisor.execute, advisor.confirm_execution
            </p>
          </div>
        </div>
      )}

      {!connected && (
        <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <span className="material-icons-outlined text-amber-400" style={{ fontSize: "20px" }}>
              warning
            </span>
            <div>
              <p className="text-sm font-medium text-amber-400">Advisor Not Running</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Start the Advisor first: <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono">cd apps/advisor && pnpm dev</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
