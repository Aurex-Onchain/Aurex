import type { MessageStore } from "./store.js";
import type { ChainReader } from "../chain/index.js";
import type { AdvisorConfig } from "../types.js";

interface AutoStrategyDeps {
  messageStore: MessageStore;
  reader: ChainReader;
  config: AdvisorConfig;
  poolIds: `0x${string}`[];
  hotTokens: `0x${string}`[];
  walletAddress?: `0x${string}`;
}

export async function generateInitialStrategy(deps: AutoStrategyDeps): Promise<void> {
  const { messageStore, reader, config, poolIds, hotTokens, walletAddress } = deps;

  const existing = messageStore.list({ limit: 1 });
  if (existing.length > 0) return;

  const lines: string[] = [];
  lines.push("Portfolio & Market Overview");
  lines.push("");

  if (walletAddress) {
    const aurexBalance = await reader.getTokenBalance(config.contracts.aurexToken, walletAddress).catch(() => 0n);
    lines.push(`Wallet: ${walletAddress}`);
    lines.push(`AUREX Balance: ${formatBalance(aurexBalance)}`);

    if (hotTokens.length > 0) {
      lines.push("");
      lines.push("Hot Token Holdings:");
      for (const token of hotTokens) {
        const bal = await reader.getTokenBalance(token, walletAddress).catch(() => 0n);
        lines.push(`  ${token.slice(0, 10)}...${token.slice(-4)}: ${formatBalance(bal)}`);
      }
    }
  }

  if (poolIds.length > 0) {
    lines.push("");
    lines.push("Watched Pools:");
    for (const poolId of poolIds) {
      const signal = await reader.getLatestSignal(poolId).catch(() => null);
      const price = await reader.getSlot0Price(poolId).catch(() => 0n);
      const shortId = `${poolId.slice(0, 10)}...${poolId.slice(-4)}`;
      if (signal) {
        lines.push(`  ${shortId} — Risk: ${signal.riskScore}, Alpha: ${signal.alphaScore}, Fee: ${signal.recommendedFee} bps`);
      } else {
        lines.push(`  ${shortId} — No active signal (price: ${price > 0n ? "available" : "unavailable"})`);
      }
    }
  }

  lines.push("");
  lines.push("Initial Assessment: Monitoring started. Signals will be published when score changes exceed the configured threshold. Configure hot tokens in Settings to track additional assets.");

  messageStore.save({
    type: "strategy",
    role: "assistant",
    content: lines.join("\n"),
    metadata: walletAddress ? { publisher: walletAddress } : null,
  });
}

function formatBalance(wei: bigint): string {
  if (wei === 0n) return "0";
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n) / 10n ** 14n;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(4, "0")}`;
}
