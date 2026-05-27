"use client";

import { useState } from "react";
import { useHealth } from "@/hooks/use-health";
import { useTranslation } from "@/i18n";

function getAdvisorUrl(): string {
  if (typeof window === "undefined") return "http://localhost:3100";
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:3100";
  return `http://${host}:3100`;
}

function getConnectPrompt(url: string, t: (key: any, params?: Record<string, string | number>) => string): string {
  return t("advisor.connectPrompt", { url });
}

export function OpenClawGuide() {
  const { data } = useHealth();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const connected = data?.status === "ok";
  const advisorUrl = getAdvisorUrl();
  const connectPrompt = getConnectPrompt(advisorUrl, t);

  function copyCommand() {
    navigator.clipboard.writeText(connectPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-4 p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="material-icons-outlined text-emerald-400" style={{ fontSize: "18px" }}>integration_instructions</span>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t("advisor.guideTitle")}
          </span>
        </div>
        <span className="material-icons-outlined text-zinc-400" style={{ fontSize: "18px" }}>
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-6 text-sm text-zinc-600 dark:text-zinc-400">
          <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-sm font-medium text-emerald-400 mb-2">{t("advisor.quickConnectTitle")}</p>
            <p className="text-xs text-zinc-500 mb-3">{t("advisor.quickConnectDesc")}</p>

            <div className="space-y-2">
              <div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 px-3 py-2 rounded bg-zinc-900 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                    {connectPrompt}
                  </code>
                  <button
                    onClick={copyCommand}
                    className="px-2 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors flex-shrink-0"
                  >
                    {copied ? "✓" : t("advisor.copy")}
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                <span className="text-zinc-400 font-medium">{t("advisor.advisorUrl")}:</span> {advisorUrl}
              </p>
            </div>

            <p className="mt-3 text-xs text-zinc-500">{t("advisor.quickConnectNote")}</p>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <p className="text-xs font-medium text-zinc-500 uppercase mb-3">{t("advisor.manualSetup")}</p>

            <div className="space-y-4">
              <Step number={1} title={t("advisor.guideStep1Title")} done={connected}>
                <code className="block mt-1 px-3 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                  {t("advisor.startCommand")}
                </code>
                <p className="mt-1 text-xs text-zinc-500">{t("advisor.guideStep1Hint")}</p>
              </Step>

              <Step number={2} title={t("advisor.guideStep2Title")}>
                <code className="block mt-1 px-3 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                  {t("advisor.installOpenclaw")}
                </code>
              </Step>

              <Step number={3} title={t("advisor.guideStep3Title")}>
                <code className="block mt-1 px-3 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre">
{t("advisor.buildPlugin")}
                </code>
              </Step>

              <Step number={4} title={t("advisor.guideStep4Title")}>
                <p className="mt-1 text-xs">{t("advisor.guideStep4Desc")}</p>
                <code className="block mt-1 px-3 py-2 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre">
{t("advisor.envConfig")}
                </code>
              </Step>

              <Step number={5} title={t("advisor.guideStep5Title")}>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">aurex.get_strategy</span>
                    <span className="text-zinc-500">&mdash; {t("advisor.toolStrategy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">aurex.market_status</span>
                    <span className="text-zinc-500">&mdash; {t("advisor.toolMarket")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">aurex.send_message</span>
                    <span className="text-zinc-500">&mdash; {t("advisor.toolMessage")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">aurex.execute_trade</span>
                    <span className="text-zinc-500">&mdash; {t("advisor.toolTrade")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">aurex.get_prices</span>
                    <span className="text-zinc-500">&mdash; {t("advisor.toolPrices")}</span>
                  </div>
                </div>
              </Step>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ number, title, done, children }: { number: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${done ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500"}`}>
        {done ? "✓" : number}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
        {children}
      </div>
    </div>
  );
}
