"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useHealth } from "@/hooks/use-health";
import { useTranslation, type TranslationKeys } from "@/i18n";

interface ClientConfig {
  id: string;
  nameKey: TranslationKeys;
  descKey: TranslationKeys;
  icon: string;
  transport: "stdio" | "http" | "sse";
  stepKeys: TranslationKeys[];
  configExample?: string;
}

const SUPPORTED_CLIENTS: ClientConfig[] = [
  {
    id: "openclaw",
    nameKey: "client.openclaw.name",
    descKey: "client.openclaw.description",
    icon: "extension",
    transport: "http",
    stepKeys: ["client.openclaw.step1", "client.openclaw.step2", "client.openclaw.step3", "client.openclaw.step4"],
  },
  {
    id: "claude-code",
    nameKey: "client.claudeCode.name",
    descKey: "client.claudeCode.description",
    icon: "smart_toy",
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
    icon: "code",
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
    icon: "terminal",
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
    icon: "build",
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
    icon: "arrow_forward",
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
    icon: "bolt",
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
    icon: "desktop_windows",
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
    icon: "rocket_launch",
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
  const advisorOnline = data?.status === "ok";
  const openClawConfigured = Boolean(data?.openclaw?.configured);
  const advisorUrl = getAdvisorUrl();

  const selectedClientConfig = SUPPORTED_CLIENTS.find((c) => c.id === selectedClient);
  const aiReady = advisorOnline && openClawConfigured;
  const statusLabel = aiReady
    ? t("advisor.aiConnected")
    : advisorOnline
      ? t("advisor.noAiClientConnected")
      : t("advisor.advisorNotRunning");
  const statusDescription = advisorOnline
    ? openClawConfigured
      ? t("advisor.openclawConfiguredDesc")
      : t("advisor.openclawDisconnectedDesc")
    : t("advisor.advisorNotRunningDesc");

  async function copyConfig() {
    if (!selectedClientConfig) return;
    const configText = selectedClientConfig.configExample || "";
    navigator.clipboard.writeText(configText);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  }

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
              advisorOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-zinc-200 bg-white/60 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400"
            }`}>
              <span className="material-icons-outlined" style={{ fontSize: "20px", lineHeight: 1 }}>
                hub
              </span>
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {t("advisor.clientIntegrations")}
                </h3>
                <span className={`inline-flex h-[26px] items-center rounded-md border px-2 text-[11px] font-semibold ${
                  aiReady
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-zinc-200 bg-white/60 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400"
                }`}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {statusDescription}
              </p>
              {data?.openclaw?.gatewayUrl && (
                <p className="mt-2 text-xs text-zinc-500">
                  {t("advisor.gatewayUrl")}: <span className="font-mono">{data.openclaw.gatewayUrl}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:min-w-72">
            <StatusTile
              active={advisorOnline}
              label={t("advisor.openclawStatus")}
              value={advisorOnline ? t("advisor.running") : t("advisor.stopped")}
            />
            <StatusTile
              active={openClawConfigured}
              label={t("advisor.openclawGateway")}
              value={openClawConfigured ? t("advisor.gatewayConfigured") : t("advisor.noAiClientConnected")}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUPPORTED_CLIENTS.map((client) => {
          const isSelected = selectedClient === client.id;
          const isOpenClaw = client.id === "openclaw";

          return (
            <button
              key={client.id}
              onClick={() => setSelectedClient(isSelected ? null : client.id)}
              className={`motion-card p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-zinc-300 bg-zinc-100/70 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/40"
                  : "border-zinc-200/80 bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                  isSelected
                    ? "border-zinc-400 bg-white text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400"
                }`}>
                  <span className="material-icons-outlined" style={{ fontSize: "18px", lineHeight: 1 }}>{client.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {t(client.nameKey)}
                    </h4>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {client.transport}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {t(client.descKey)}
                  </p>
                  {isOpenClaw && (
                    <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      openClawConfigured
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${openClawConfigured ? "bg-emerald-400" : "bg-zinc-500"}`} />
                      {openClawConfigured ? t("advisor.gatewayConfigured") : t("advisor.noAiClientConnected")}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
      {selectedClientConfig && (
        <motion.div
          className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-4 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/60 sm:p-5 space-y-4"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: 6, filter: "blur(5px)" }}
          transition={{ duration: 0.18 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="material-icons-outlined text-emerald-600 dark:text-emerald-300" style={{ fontSize: "18px" }}>{selectedClientConfig.icon}</span>
                {t(selectedClientConfig.nameKey)} {t("advisor.setupSteps")}
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
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200 flex items-center justify-center text-xs font-medium">
                  {idx + 1}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 pt-0.5">{t(stepKey)}</p>
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

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("advisor.advisorUrl")}:</span> {advisorUrl}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("advisor.availableTools")}:</span> {t("advisor.toolsList")}
            </p>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {!advisorOnline && (
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

function StatusTile({
  active,
  label,
  value,
}: {
  active: boolean;
  label: string;
  value: string;
}) {
  return (
    <div className={`rounded-xl border px-3 py-2 ${
      active
        ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10"
        : "border-zinc-200 bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/40"
    }`}>
      <p className={`text-[11px] font-medium ${
        active ? "text-emerald-700 dark:text-emerald-200" : "text-zinc-500"
      }`}>
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-semibold ${
        active ? "text-emerald-800 dark:text-emerald-100" : "text-zinc-900 dark:text-zinc-100"
      }`}>
        {value}
      </p>
    </div>
  );
}
