"use client";

import { useCallback, useSyncExternalStore } from "react";
import { TOKENS, type TokenInfo } from "@/lib/contracts";

const STORAGE_KEY = "aurex-pinned-tokens";
const CUSTOM_TOKENS_KEY = "aurex-custom-tokens";
const EVENT_KEY = "aurex-pinned-tokens-change";

const DEFAULT_PINNED = TOKENS.filter((t) => t.symbol === "AUREX" || t.symbol === "USDC").map((t) => t.address);
const EMPTY_CUSTOM_TOKENS: TokenInfo[] = [];

let cachedSnapshot: `0x${string}`[] = DEFAULT_PINNED;
let cachedRaw: string | null = null;

function readFromStorage(): `0x${string}`[] {
  if (typeof window === "undefined") return DEFAULT_PINNED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = DEFAULT_PINNED;
    } else {
      const parsed = JSON.parse(raw);
      cachedSnapshot = Array.isArray(parsed) ? parsed : DEFAULT_PINNED;
    }
    return cachedSnapshot;
  } catch {
    cachedSnapshot = DEFAULT_PINNED;
    return cachedSnapshot;
  }
}

function writeToStorage(addresses: `0x${string}`[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  window.dispatchEvent(new Event(EVENT_KEY));
}

let cachedCustomTokens: TokenInfo[] = [];
let cachedCustomRaw: string | null = null;

function readCustomTokens(): TokenInfo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TOKENS_KEY);
    if (raw === cachedCustomRaw) return cachedCustomTokens;
    cachedCustomRaw = raw;
    if (!raw) {
      cachedCustomTokens = [];
    } else {
      const parsed = JSON.parse(raw);
      cachedCustomTokens = Array.isArray(parsed) ? parsed : [];
    }
    return cachedCustomTokens;
  } catch {
    cachedCustomTokens = [];
    return cachedCustomTokens;
  }
}

function writeCustomTokens(tokens: TokenInfo[]) {
  localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokens));
  window.dispatchEvent(new Event(EVENT_KEY));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT_KEY, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_KEY, callback);
    window.removeEventListener("storage", callback);
  };
}

export function usePinnedTokens() {
  const pinnedAddresses = useSyncExternalStore(subscribe, readFromStorage, () => DEFAULT_PINNED);
  const customTokens = useSyncExternalStore(subscribe, readCustomTokens, () => EMPTY_CUSTOM_TOKENS);

  const setPinnedAddresses = useCallback((addresses: `0x${string}`[]) => {
    writeToStorage(addresses);
  }, []);

  const togglePin = useCallback((address: `0x${string}`) => {
    const current = readFromStorage();
    const next = current.includes(address)
      ? current.filter((a) => a !== address)
      : [...current, address];
    writeToStorage(next);
  }, []);

  const addCustomToken = useCallback((token: TokenInfo) => {
    const current = readCustomTokens();
    if (current.some((t) => t.address.toLowerCase() === token.address.toLowerCase())) return;
    writeCustomTokens([...current, token]);
    const pinned = readFromStorage();
    if (!pinned.includes(token.address)) {
      writeToStorage([...pinned, token.address]);
    }
  }, []);

  const removeCustomToken = useCallback((address: `0x${string}`) => {
    const current = readCustomTokens();
    writeCustomTokens(current.filter((t) => t.address.toLowerCase() !== address.toLowerCase()));
    const pinned = readFromStorage();
    writeToStorage(pinned.filter((a) => a.toLowerCase() !== address.toLowerCase()));
  }, []);

  return { pinnedAddresses, setPinnedAddresses, togglePin, customTokens, addCustomToken, removeCustomToken };
}
