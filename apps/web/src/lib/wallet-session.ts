"use client";

type WalletProvider = {
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type WalletConnector = {
  getProvider?: () => Promise<unknown>;
};

export async function getConnectorProvider(connector: WalletConnector | undefined): Promise<WalletProvider | null> {
  if (!connector?.getProvider) return null;
  const provider = await connector.getProvider();
  if (provider && typeof provider === "object" && "request" in provider) {
    return provider as WalletProvider;
  }
  return null;
}

export async function requestAccountSelection(connector: WalletConnector | undefined): Promise<void> {
  const provider = await getConnectorProvider(connector);
  if (!provider?.request) return;

  try {
    await provider.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch (err) {
    if (isUserRejectedRequest(err)) throw err;
    // Wallet support varies. wagmi's connect call will still request accounts.
  }
}

export async function revokeAccountPermission(connector: WalletConnector | undefined): Promise<void> {
  const provider = await getConnectorProvider(connector);
  if (!provider?.request) return;

  try {
    await provider.request({
      method: "wallet_revokePermissions",
      params: [{ eth_accounts: {} }],
    });
  } catch {
    // Some wallets do not expose wallet_revokePermissions; disconnect still clears app state.
  }
}

function isUserRejectedRequest(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === 4001;
}
