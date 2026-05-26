export function formatAddress(address: string): string {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatScore(score: string | number): number {
  return Number(score);
}

export function formatStake(weiStr: string): string {
  const wei = BigInt(weiStr);
  const decimals = BigInt("1000000000000000000");
  const fracUnit = BigInt("10000000000000000");
  const whole = wei / decimals;
  const frac = (wei % decimals) / fracUnit;
  if (frac === BigInt(0)) return `${whole}`;
  return `${whole}.${frac.toString().padStart(2, "0")}`;
}

export function formatTimestamp(ts: number | string): string {
  const ms = typeof ts === "string" ? Number(ts) * 1000 : ts;
  return new Date(ms).toLocaleString();
}

export function formatFee(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function isExpired(expiresAt: string): boolean {
  return Number(expiresAt) * 1000 < Date.now();
}

// --- OKX Explorer URL utilities for X Layer ---

const OKX_EXPLORER_BASE: Record<number, string> = {
  196: "https://www.okx.com/web3/explorer/xlayer",
  195: "https://www.okx.com/web3/explorer/xlayer-test",
};

/**
 * Generate an OKX Explorer URL for a transaction hash on X Layer.
 */
export function getOkxExplorerTxUrl(txHash: string, chainId: number = 196): string {
  const base = OKX_EXPLORER_BASE[chainId] ?? OKX_EXPLORER_BASE[196];
  return `${base}/tx/${txHash}`;
}

/**
 * Generate an OKX Explorer URL for an address on X Layer.
 */
export function getOkxExplorerAddressUrl(address: string, chainId: number = 196): string {
  const base = OKX_EXPLORER_BASE[chainId] ?? OKX_EXPLORER_BASE[196];
  return `${base}/address/${address}`;
}

/**
 * Generate an OKX Explorer URL for a block on X Layer.
 */
export function getOkxExplorerBlockUrl(blockNumber: number | string, chainId: number = 196): string {
  const base = OKX_EXPLORER_BASE[chainId] ?? OKX_EXPLORER_BASE[196];
  return `${base}/block/${blockNumber}`;
}

/**
 * Generate an OKX Explorer URL for a token contract on X Layer.
 */
export function getOkxExplorerTokenUrl(tokenAddress: string, chainId: number = 196): string {
  const base = OKX_EXPLORER_BASE[chainId] ?? OKX_EXPLORER_BASE[196];
  return `${base}/token/${tokenAddress}`;
}

export function timeUntilExpiry(expiresAt: string): string {
  const diff = Number(expiresAt) * 1000 - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}
