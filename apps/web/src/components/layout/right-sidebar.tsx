"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { useTranslation } from "@/i18n";
import { TOKENS, CONTRACTS, erc20Abi } from "@/lib/contracts";
import { formatAddress } from "@/lib/format";
import { usePinnedTokens } from "@/hooks/use-pinned-tokens";
import { useTokenPrices, getPriceForToken } from "@/hooks/use-token-prices";
import { ConnectButton } from "@/components/ui/connect-button";

const contractEntries = [
  { label: "Pool Factory", address: CONTRACTS.poolFactory },
  { label: "Signal Registry", address: CONTRACTS.signalRegistry },
  { label: "Policy Manager", address: CONTRACTS.policyManager },
  { label: "AUREX Token", address: CONTRACTS.aurexToken },
] as const;

const tokenIcons: Record<string, string> = {
  WETH: "currency_exchange",
  USDC: "paid",
  WBTC: "currency_bitcoin",
  USDT: "attach_money",
  WOKB: "token",
  AUREX: "diamond",
};

function formatBalance(raw: bigint | undefined, decimals: number): string {
  if (raw === undefined || raw === BigInt(0)) return "0";
  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = raw / divisor;
  const remainder = raw % divisor;
  if (remainder === BigInt(0)) return whole.toString();
  const fracStr = remainder.toString().padStart(decimals, "0").slice(0, 4).replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

function WalletSection() {
  return (
    <div className="px-4 pt-6 pb-4 overflow-visible relative z-50">
      <ConnectButton />
    </div>
  );
}

function BalanceList() {
  const { address } = useAccount();
  const { t } = useTranslation();
  const { pinnedAddresses, customTokens } = usePinnedTokens();
  const { data: priceData } = useTokenPrices();

  const allTokens = [...TOKENS, ...customTokens.filter((ct) => !TOKENS.some((t) => t.address.toLowerCase() === ct.address.toLowerCase()))];

  const { data } = useReadContracts({
    contracts: allTokens.map((token) => ({
      address: token.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address!],
    })),
    query: { enabled: !!address, refetchInterval: 15000 },
  });

  if (!address) {
    return (
      <p className="text-xs text-zinc-500 px-4">{t("rightSidebar.connectHint")}</p>
    );
  }

  const tokensWithBalance = allTokens.map((token, i) => {
    const result = data?.[i];
    const balance = result?.status === "success" ? (result.result as bigint) : undefined;
    const isPinned = pinnedAddresses.includes(token.address);
    return { token, balance, isPinned };
  });

  const visible = tokensWithBalance.filter((item) => item.isPinned);

  visible.sort((a, b) => {
    return pinnedAddresses.indexOf(a.token.address) - pinnedAddresses.indexOf(b.token.address);
  });

  let totalUsd = 0;
  let hasPrices = false;
  for (const item of visible) {
    if (item.balance && item.balance > BigInt(0)) {
      const price = getPriceForToken(priceData?.prices, item.token.address);
      if (price !== null) {
        hasPrices = true;
        const divisor = BigInt(10) ** BigInt(item.token.decimals);
        const whole = Number(item.balance / divisor);
        const frac = Number(item.balance % divisor) / Number(divisor);
        totalUsd += (whole + frac) * price;
      }
    }
  }

  return (
    <div className="space-y-2 px-4">
      {hasPrices && (
        <div className="pb-2 mb-2 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">${totalUsd.toFixed(2)}</span>
          <span className="text-xs text-zinc-500 ml-1.5">USD</span>
        </div>
      )}
      {visible.map(({ token, balance }) => {
        const icon = tokenIcons[token.symbol] || "token";
        return (
          <div key={token.address} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-zinc-400" style={{ fontSize: "16px" }}>{icon}</span>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">{token.symbol}</span>
            </div>
            <span className="text-sm font-mono text-zinc-400">
              {formatBalance(balance, token.decimals)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ContractList() {
  const [copied, setCopied] = useState<string | null>(null);
  const { t } = useTranslation();

  function copy(address: string) {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-2 px-4">
      {contractEntries.map((entry) => (
        <button
          key={entry.address}
          onClick={() => copy(entry.address)}
          className="w-full flex items-center justify-between group text-left"
        >
          <span className="text-sm text-zinc-400">{entry.label}</span>
          <span className="text-sm font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
            {copied === entry.address ? t("rightSidebar.copied") : formatAddress(entry.address)}
          </span>
        </button>
      ))}
    </div>
  );
}

const SERVICES = [
  { label: "X Layer", url: "https://rpc.xlayer.tech" },
  { label: "Advisor Dashboard", url: `${process.env.NEXT_PUBLIC_ADVISOR_URL || "http://localhost:3100"}/health` },
  { label: "Advisor Service", url: `${process.env.NEXT_PUBLIC_ADVISOR_URL || "http://localhost:3100"}/health` },
] as const;

function ServiceStatus() {
  const { t } = useTranslation();
  const [statuses, setStatuses] = useState<Record<string, boolean | null>>({});

  useEffect(() => {
    async function check(label: string, url: string) {
      try {
        await fetch(url, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(5000) });
        setStatuses((prev) => ({ ...prev, [label]: true }));
      } catch {
        setStatuses((prev) => ({ ...prev, [label]: false }));
      }
    }
    SERVICES.forEach((s) => check(s.label, s.url));
    const interval = setInterval(() => SERVICES.forEach((s) => check(s.label, s.url)), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2 px-4">
      {SERVICES.map((s) => {
        const online = statuses[s.label];
        return (
          <div key={s.label} className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">{s.label}</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${online === true ? "text-emerald-400" : online === false ? "text-red-400" : "text-zinc-600"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${online === true ? "live-dot bg-emerald-400 text-emerald-400" : online === false ? "bg-red-400" : "bg-zinc-600"}`} />
              {online === null || online === undefined ? "..." : online ? t("rightSidebar.serviceOnline") : t("rightSidebar.serviceOffline")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function RightSidebar() {
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:flex w-72 h-screen sticky top-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex-col overflow-y-auto">
      <WalletSection />

      <div className="py-4">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 mb-3">
          {t("rightSidebar.balances")}
        </h3>
        <BalanceList />
      </div>

      <div className="py-4">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 mb-3">
          {t("rightSidebar.contracts")}
        </h3>
        <ContractList />
      </div>

      <div className="py-4">
        <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-4 mb-3">
          {t("rightSidebar.services")}
        </h3>
        <ServiceStatus />
      </div>

      <div className="mt-auto p-3">
        <p className="text-[11px] text-zinc-600">X Layer | Uniswap V4</p>
      </div>
    </aside>
  );
}
