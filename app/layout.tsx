"use client";

// import { Header } from "@/components/header";
import { config } from "@/config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { Toaster } from "sonner";
import { WagmiProvider } from "wagmi";
import "./globals.css";
import dynamic from "next/dynamic";

const queryClient = new QueryClient();

const Header = dynamic(() => import("@/components/header"), {
  ssr: false,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <html lang="en" className="dark h-full">
            <body className="h-full overflow-hidden bg-background font-sans antialiased">
              <Toaster position="top-center" />
              <Header />
              <div className="flex h-[calc(100vh-64px)] flex-col items-center">
                {/* Main Content */}
                <main className="flex-1 w-full max-w-[1800px] px-4">
                  {children}
                </main>
              </div>
            </body>
          </html>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
