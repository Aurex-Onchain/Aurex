const BASE_URL = process.env.NEXT_PUBLIC_ADVISOR_URL || "http://localhost:3100";

import {
  getMockMarket,
  getMockPublisher,
  getMockBehavior,
  getMockHealth,
  getMockConfig,
  getMockStrategy,
  getMockMessages,
  getMockPrices,
} from "./mock-data";

/**
 * In demo mode (Vercel deployment), the Advisor backend is unreachable.
 * Routes return mocked data so the UI shows a "live-looking" state.
 *
 * Detection: hostname includes "vercel.app" OR NEXT_PUBLIC_DEMO_MODE=true
 */
function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  return window.location.hostname.includes("vercel.app");
}

function getMockForPath(path: string): unknown | null {
  if (path.startsWith("/api/market")) return getMockMarket();
  if (path.startsWith("/api/publisher")) return getMockPublisher();
  if (path.startsWith("/api/behavior")) return getMockBehavior();
  if (path.startsWith("/health")) return getMockHealth();
  if (path.startsWith("/api/config")) return getMockConfig();
  if (path.startsWith("/api/strategy")) return getMockStrategy();
  if (path.startsWith("/api/messages")) return getMockMessages();
  if (path.startsWith("/api/prices")) return getMockPrices();
  if (path.startsWith("/api/execute/pending")) return { pending: [] };
  if (path.startsWith("/api/aggregation")) return getMockStrategy().onchainData;
  return null;
}

export async function fetchApi<T>(path: string): Promise<T> {
  if (isDemoMode()) {
    const mock = getMockForPath(path);
    if (mock !== null) return mock as T;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json();
  } catch (err) {
    if (typeof window !== "undefined") {
      const mock = getMockForPath(path);
      if (mock !== null) return mock as T;
    }
    throw err;
  }
}

export async function postApi<T>(path: string, body: unknown): Promise<T> {
  if (isDemoMode()) {
    return {
      success: true,
      demoMode: true,
      message: "Action acknowledged in demo mode. Self-host the Advisor to execute on-chain.",
    } as T;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json();
  } catch (err) {
    if (typeof window !== "undefined") {
      return {
        success: false,
        demoMode: false,
        message: "Backend unreachable. Run a local Advisor instance.",
      } as T;
    }
    throw err;
  }
}
