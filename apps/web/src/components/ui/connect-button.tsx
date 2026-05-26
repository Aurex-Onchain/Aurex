"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { formatAddress } from "@/lib/format";
import { addressToColors } from "@/lib/avatar";
import { requestAccountSelection, revokeAccountPermission } from "@/lib/wallet-session";
import { useState } from "react";

function WalletAvatar({ address }: { address: string }) {
  const [c1, c2] = addressToColors(address);
  return (
    <div
      className="w-7 h-7 rounded flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, borderRadius: "4px" }}
    />
  );
}

/** Check if the active connector is OKX Wallet */
function isOkxConnector(connectorName: string | undefined): boolean {
  if (!connectorName) return false;
  const name = connectorName.toLowerCase();
  return name.includes("okx") || name.includes("okxwallet");
}

/** OKX logo as inline SVG for branding */
function OkxLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="8" fill="#000" />
      <path
        d="M23.6 11H16.4C16.18 11 16 11.18 16 11.4V16.6C16 16.82 16.18 17 16.4 17H23.6C23.82 17 24 16.82 24 16.6V11.4C24 11.18 23.82 11 23.6 11Z"
        fill="#fff"
      />
      <path
        d="M15.6 17H8.4C8.18 17 8 17.18 8 17.4V22.6C8 22.82 8.18 23 8.4 23H15.6C15.82 23 16 22.82 16 22.6V17.4C16 17.18 15.82 17 15.6 17Z"
        fill="#fff"
      />
      <path
        d="M31.6 17H24.4C24.18 17 24 17.18 24 17.4V22.6C24 22.82 24.18 23 24.4 23H31.6C31.82 23 32 22.82 32 22.6V17.4C32 17.18 31.82 17 31.6 17Z"
        fill="#fff"
      />
      <path
        d="M23.6 23H16.4C16.18 23 16 23.18 16 23.4V28.6C16 28.82 16.18 29 16.4 29H23.6C23.82 29 24 28.82 24 28.6V23.4C24 23.18 23.82 23 23.6 23Z"
        fill="#fff"
      />
    </svg>
  );
}

export function ConnectButton() {
  const { address, isConnected, connector } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const [showWalletList, setShowWalletList] = useState(false);
  const [isChangingWallet, setIsChangingWallet] = useState(false);

  const uniqueConnectors = connectors.filter(
    (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
  );

  async function handleDisconnect() {
    setIsChangingWallet(true);
    await revokeAccountPermission(connector);
    try {
      await disconnectAsync();
      setShowWalletList(true);
    } finally {
      setIsChangingWallet(false);
    }
  }

  async function handleConnect(nextConnector: (typeof uniqueConnectors)[number]) {
    setIsChangingWallet(true);
    try {
      await requestAccountSelection(nextConnector);
      await connectAsync({ connector: nextConnector });
      setShowWalletList(false);
    } finally {
      setIsChangingWallet(false);
    }
  }

  if (isConnected && address) {
    const isOkx = isOkxConnector(connector?.name);
    return (
      <div className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800">
        {isOkx ? (
          <OkxLogo className="w-7 h-7 flex-shrink-0" />
        ) : (
          <WalletAvatar address={address} />
        )}
        <button
          onClick={() => { void handleDisconnect(); }}
          className="flex-1 text-left min-w-0 hover:opacity-80 transition-opacity"
          disabled={isChangingWallet}
        >
          <span className="block text-xs text-zinc-500">
            {isChangingWallet ? "Disconnecting..." : isOkx ? "OKX Wallet" : connector?.name ?? "Connected"}
          </span>
          <span className="block text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate">{formatAddress(address)}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <button
        onClick={() => setShowWalletList(!showWalletList)}
        className="w-full px-3 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
        disabled={isChangingWallet}
      >
        {isChangingWallet ? "Opening..." : "Connect Wallet"}
      </button>

      {showWalletList && uniqueConnectors.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl z-50">
          <p className="text-xs text-zinc-500 px-2 pb-2">Select wallet</p>
          {uniqueConnectors.map((c) => {
            const isOkx = isOkxConnector(c.name);
            return (
              <button
                key={c.id}
                onClick={() => { void handleConnect(c); }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                disabled={isChangingWallet}
              >
                {isOkx ? (
                  <OkxLogo className="w-5 h-5" />
                ) : (
                  <span className="w-5 h-5 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs">
                    {c.name.charAt(0)}
                  </span>
                )}
                <span>{c.name}</span>
                {isOkx && (
                  <span className="ml-auto text-xs text-emerald-400">Recommended</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
