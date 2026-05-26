import { http, createConfig } from "wagmi";
import { injected } from "wagmi/connectors";
import { defineChain } from "viem";

export const xlayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/xlayer" },
  },
});

export const xlayerTestnet = defineChain({
  id: 195,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/xlayer-test" },
  },
  testnet: true,
});

/**
 * OKX Wallet connector using wagmi's injected() with explicit target.
 * OKX Wallet also supports EIP-6963, so it will be auto-discovered by wagmi's
 * multiInjectedProviderDiscovery (enabled by default). This explicit connector
 * ensures OKX Wallet appears with proper branding even if EIP-6963 isn't available.
 */
const okxWalletConnector = injected({
  target() {
    if (typeof window === "undefined") return undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const provider = (window as any).okxwallet as
      | { request: (...args: unknown[]) => Promise<unknown> }
      | undefined;
    if (!provider) return undefined;
    return {
      id: "okxWallet",
      name: "OKX Wallet",
      provider: provider as never,
    };
  },
});

export const config = createConfig({
  chains: [xlayer, xlayerTestnet],
  connectors: [okxWalletConnector],
  multiInjectedProviderDiscovery: true,
  transports: {
    [xlayer.id]: http(),
    [xlayerTestnet.id]: http(),
  },
});
