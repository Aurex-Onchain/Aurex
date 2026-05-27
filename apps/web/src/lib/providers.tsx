"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type Config } from "wagmi";
import { wagmiAdapter, projectId, networks, xlayer } from "@/lib/wagmi";
import { createAppKit } from "@reown/appkit/react";
import { useState } from "react";
import { I18nProvider } from "@/i18n";
import { ThemeProvider } from "@/components/theme/theme-provider";

createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...networks],
  defaultNetwork: xlayer,
  metadata: {
    name: "Aurex",
    description: "AI-native onchain trading OS on Uniswap V4 Hooks",
    url: "https://aurex.trade",
    icons: [],
  },
  features: {
    analytics: false,
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <I18nProvider>
        <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
