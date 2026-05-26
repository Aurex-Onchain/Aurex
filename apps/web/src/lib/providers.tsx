"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi";
import { useState } from "react";
import { I18nProvider } from "@/i18n";
import { ThemeProvider } from "@/components/theme/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <I18nProvider>
        <WagmiProvider config={config} reconnectOnMount={false}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </WagmiProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
