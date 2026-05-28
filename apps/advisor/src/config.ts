import type { AdvisorConfig } from "./types.js";

export const defaultConfig: AdvisorConfig = {
  chain: {
    rpcUrl: "https://rpc.xlayer.tech",
    chainId: 196,
  },
  contracts: {
    signalRegistry: "0xE00f6dF218E2a3FcF9CF61421fF22ec0175E7D45",
    policyManager: "0xEe55CF595586527d5ADE7065CD2766899b123E5F",
    alphaHook: "0xF8F9eaBAbef3eA3A4741D7F5cDc81e9BCA9500c4",
    poolFactory: "0xD44cE6C6f3Eb5dd093Cc99BeE7C2142368848A40",
    poolManager: "0x360e68faccca8ca495c1b759fd9eee466db9fb32",
    aurexToken: "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82",
  },
  server: {
    host: "127.0.0.1",
    port: 3100,
  },
  publisher: {
    enabled: true,
    intervalMs: 5 * 60 * 1000,
    scoreChangeThreshold: 10,
    signalDurationMs: 60 * 60 * 1000,
  },
  behavior: {
    enabled: true,
    frequencyMultiplier: 3.0,
    maxSingleTradePercent: 40,
    maxConcentrationPercent: 70,
    maxDailyLossPercent: 15,
    lookbackDays: 30,
  },
  hotTokens: [
    "0x5A77f1443D16ee5761d310e38b62f77f726bC71c", // WETH
    "0x74b7F16337b8972027F6196A17a631aC6dE26d22", // USDC
    "0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1", // WBTC
    "0x1E4a5963aBFD975d8c9021ce480b42188849D41d", // USDT
    "0x8819A7972e17C61A4eeFe0F06e4bbef521228c82", // AUREX
    "0x0000000000000000000000000000000000000001", // PEPE (high volatility)
    "0x0000000000000000000000000000000000000002", // DOGE (high volatility)
    "0x0000000000000000000000000000000000000003", // SOL
    "0x0000000000000000000000000000000000000004", // BONK (high volatility)
  ],
};
