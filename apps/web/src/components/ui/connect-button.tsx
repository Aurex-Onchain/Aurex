"use client";

import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { formatAddress } from "@/lib/format";
import { addressToColors } from "@/lib/avatar";

function WalletAvatar({ address }: { address: string }) {
  const [c1, c2] = addressToColors(address);
  return (
    <div
      className="w-7 h-7 rounded flex-shrink-0"
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, borderRadius: "4px" }}
    />
  );
}

export function ConnectButton() {
  const { open } = useAppKit();
  const { address, isConnected, connector } = useAccount();

  if (isConnected && address) {
    return (
      <div className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800">
        <WalletAvatar address={address} />
        <button
          onClick={() => open()}
          className="flex-1 text-left min-w-0 hover:opacity-80 transition-opacity"
        >
          <span className="block text-xs text-zinc-500">{connector?.name ?? "Connected"}</span>
          <span className="block text-sm font-mono text-zinc-700 dark:text-zinc-300 truncate">{formatAddress(address)}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => open()}
      className="w-full px-3 py-2 rounded-md text-sm bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
