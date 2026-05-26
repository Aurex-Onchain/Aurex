import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { RightSidebar } from "@/components/layout/right-sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aurex - AI Trading OS",
  description: "AI-native onchain trading operating system powered by Uniswap V4 Hooks on X Layer",
};

// Inline script to prevent FOUC — runs before React hydrates
const themeScript = `(function(){try{var t=localStorage.getItem("aurex-theme");if(!t||!["light","dark","system"].includes(t))t="dark";var r=t;if(t==="system")r=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";document.documentElement.classList.add(r)}catch(e){document.documentElement.classList.add("dark")}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-y-auto h-screen pb-16 md:pb-0">{children}</main>
          <RightSidebar />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
