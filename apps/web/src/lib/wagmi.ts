import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
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

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "04b0796e5eb5a4ef1f6e3e4a7e0b80c7";

export const networks = [xlayer, xlayerTestnet] as const;

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [xlayer, xlayerTestnet],
});

export const config = wagmiAdapter.wagmiConfig;
