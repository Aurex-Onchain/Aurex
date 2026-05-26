"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * OKX DEX Aggregator API integration.
 * Fetches best-route swap quotes from the OKX DEX aggregator.
 * Public API — no API key required for quotes.
 *
 * Docs: https://www.okx.com/web3/build/docs/waas/dex-swap-introduction
 */

const OKX_DEX_BASE_URL = "https://www.okx.com/api/v5/dex/aggregator";

export interface OkxDexQuoteParams {
  /** Chain ID (196 for X Layer mainnet) */
  chainId: number;
  /** Source token contract address. Use 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for native token (OKB). */
  fromTokenAddress: string;
  /** Destination token contract address */
  toTokenAddress: string;
  /** Amount in smallest unit (wei for 18 decimals) */
  amount: string;
  /** Slippage in basis points (e.g. 50 = 0.5%) */
  slippageBps?: number;
}

export interface OkxDexRoute {
  /** Router address */
  router: string;
  /** Percentage of the route */
  percentage: string;
  /** Sub-routes with DEX info */
  subRoutes: Array<{
    dexName: string;
    fromToken: string;
    toToken: string;
    percentage: string;
  }>;
}

export interface OkxDexQuoteResult {
  /** Estimated output amount in smallest unit */
  toTokenAmount: string;
  /** Estimated gas in native token units */
  estimatedGas: string;
  /** Price impact as a decimal string (e.g. "0.001" = 0.1%) */
  priceImpact: string;
  /** Routing path info */
  routes: OkxDexRoute[];
  /** From token decimals */
  fromTokenDecimals: number;
  /** To token decimals */
  toTokenDecimals: number;
  /** Raw API response data */
  raw: Record<string, unknown>;
}

interface OkxApiResponse {
  code: string;
  msg: string;
  data: Array<Record<string, unknown>>;
}

async function fetchOkxDexQuote(params: OkxDexQuoteParams): Promise<OkxDexQuoteResult> {
  const { chainId, fromTokenAddress, toTokenAddress, amount, slippageBps = 50 } = params;

  // OKX DEX API uses slippage as a decimal string (e.g. "0.005" for 0.5%)
  const slippage = (slippageBps / 10000).toString();

  const searchParams = new URLSearchParams({
    chainId: chainId.toString(),
    fromTokenAddress,
    toTokenAddress,
    amount,
    slippage,
  });

  const url = `${OKX_DEX_BASE_URL}/quote?${searchParams.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`OKX DEX API error: ${response.status} ${response.statusText}`);
  }

  const json: OkxApiResponse = await response.json();

  if (json.code !== "0") {
    throw new Error(`OKX DEX quote failed: ${json.msg || "Unknown error"}`);
  }

  const data = json.data?.[0];
  if (!data) {
    throw new Error("No quote data returned from OKX DEX");
  }

  // Parse routes from the response
  const routerResult = data.routerResult as Record<string, unknown> | undefined;
  const routes: OkxDexRoute[] = [];

  if (routerResult?.routes) {
    const rawRoutes = routerResult.routes as Array<Record<string, unknown>>;
    for (const route of rawRoutes) {
      routes.push({
        router: (route.router as string) ?? "",
        percentage: (route.percentage as string) ?? "100",
        subRoutes: Array.isArray(route.subRoutes)
          ? (route.subRoutes as Array<Record<string, unknown>>).map((sr) => ({
              dexName: (sr.dexName as string) ?? "",
              fromToken: (sr.fromToken as string) ?? "",
              toToken: (sr.toToken as string) ?? "",
              percentage: (sr.percentage as string) ?? "100",
            }))
          : [],
      });
    }
  }

  return {
    toTokenAmount: (data.toTokenAmount as string) ?? "0",
    estimatedGas: (data.estimatedGas as string) ?? "0",
    priceImpact: (routerResult?.priceImpact as string) ?? "0",
    routes,
    fromTokenDecimals: Number(data.fromTokenDecimals ?? 18),
    toTokenDecimals: Number(data.toTokenDecimals ?? 18),
    raw: data,
  };
}

/**
 * React hook for fetching OKX DEX aggregator swap quotes.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useOkxDexQuote({
 *   chainId: 196,
 *   fromTokenAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
 *   toTokenAddress: "0x...",
 *   amount: "1000000000000000000", // 1 OKB in wei
 *   slippageBps: 50, // 0.5%
 * });
 * ```
 */
export function useOkxDexQuote(params: OkxDexQuoteParams | null) {
  return useQuery({
    queryKey: ["okx-dex-quote", params],
    queryFn: () => fetchOkxDexQuote(params!),
    enabled:
      !!params &&
      !!params.fromTokenAddress &&
      !!params.toTokenAddress &&
      !!params.amount &&
      params.amount !== "0",
    staleTime: 10_000, // Quotes are valid for ~10 seconds
    refetchInterval: 15_000, // Refresh quote every 15 seconds
    retry: 1,
  });
}
