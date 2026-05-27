"use client";

import { useState } from "react";
import { useHealth } from "@/hooks/use-health";
import { useTranslation } from "@/i18n";

interface ClientConfig {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  transport: "stdio" | "http" | "sse";
  stepKeys: string[];
  configExample?: string;
}

const SUPPORTED_CLIENTS: ClientConfig[] = [
  {
    id: "openclaw",
    nameKey: "client.openclaw.name",
    descKey: "client.openclaw.description",
    icon: "\u{1F985}",
    transport: "http",
    stepKeys: ["client.openclaw.step1", "client.openclaw.step2", "client.openclaw.step3", "client.openclaw.step4"],
  },
  {
    id: "claude-code",
    nameKey: "client.claudeCode.name",
    descKey: "client.claudeCode.description",
    icon: "\u{1F916}",
    transport: "stdio",
    stepKeys: ["client.claudeCode.step1", "client.claudeCode.step2", "client.claudeCode.step3"],
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
    nameKey: "client.cursor.name",
    descKey: "client.cursor.description",
    icon: "⚡",
    transport: "stdio",
    stepKeys: ["client.cursor.step1", "client.cursor.step2", "client.cursor.step3"],
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
    nameKey: "client.windsurf.name",
    descKey: "client.windsurf.description",
    icon: "\u{1F30A}",
    transport: "stdio",
    stepKeys: ["client.windsurf.step1", "client.windsurf.step2", "client.windsurf.step3"],
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
    nameKey: "client.cline.name",
    descKey: "client.cline.description",
    icon: "\u{1F527}",
    transport: "stdio",
    stepKeys: ["client.cline.step1", "client.cline.step2", "client.cline.step3"],
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
    nameKey: "client.continue.name",
    descKey: "client.continue.description",
    icon: "➡️",
    transport: "stdio",
    stepKeys: ["client.continue.step1", "client.continue.step2", "client.continue.step3"],
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
    nameKey: "client.zed.name",
    descKey: "client.zed.description",
    icon: "⚡",
    transport: "stdio",
    stepKeys: ["client.zed.step1", "client.zed.step2", "client.zed.step3"],
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
    nameKey: "client.claudeDesktop.name",
    descKey: "client.claudeDesktop.description",
    icon: "\u{1F5A5}️",
    transport: "stdio",
    stepKeys: ["client.claudeDesktop.step1", "client.claudeDesktop.step2", "client.claudeDesktop.step3"],
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
    nameKey: "client.hermes.name",
    descKey: "client.hermes.description",
    icon: "\u{1F680}",
    transport: "sse",
    stepKeys: ["client.hermes.step1", "client.hermes.step2", "client.hermes.step3"],
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
  const { t } = useTranslation();
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const connected = data?.status === "ok";
  const advisorUrl = getAdvisorUrl();

  const selectedClientConfig = SUPPORTED_CLIENTS.find((c) => c.id === selectedClient);

  async function copyConfig() {
    if (!selectedClientConfig) return;
    const configText = selectedClientConfig.configExample || "";
    navigator.clipboard.writeText(configText);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {t("advisor.clientIntegrations")}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {t("advisor.clientIntegrationsDesc")}
          </p>
        </div>
        {connected && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">{t("advisor.advisorRunning")}</span>
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
                    {t(client.nameKey as any)}
                  </h4>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    {client.transport}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {t(client.descKey as any)}
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
                {t(selectedClientConfig.nameKey as any)} {t("advisor.setupSteps")}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {t("advisor.followSteps")}
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
            {selectedClientConfig.stepKeys.map((stepKey, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-medium">
                  {idx + 1}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 pt-0.5">{t(stepKey as any)}</p>
              </div>
            ))}
          </div>

          {selectedClientConfig.configExample && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                  {t("advisor.configuration")}
                </p>
                <button
                  onClick={copyConfig}
                  className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors"
                >
                  {copiedConfig ? t("advisor.configCopied") : t("advisor.copyConfig")}
                </button>
              </div>
              <pre className="p-3 rounded bg-zinc-900 text-xs font-mono text-emerald-300 overflow-x-auto">
                {selectedClientConfig.configExample}
              </pre>
            </div>
          )}

          <div className="pt-3 border-t border-emerald-500/20">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-emerald-400">{t("advisor.advisorUrl")}:</span> {advisorUrl}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <span className="font-medium text-emerald-400">{t("advisor.availableTools")}:</span> {t("advisor.toolsList")}
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
              <p className="text-sm font-medium text-amber-400">{t("advisor.advisorNotRunning")}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {t("advisor.advisorNotRunningDesc")} <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono">{t("advisor.startCommand")}</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
