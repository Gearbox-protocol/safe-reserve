"use client";

import HeaderLayout from "@/components/header";
import { config } from "@/config/wagmi";
import { Footer } from "@gearbox-protocol/permissionless-ui";
import SafeProvider from "@safe-global/safe-apps-react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConnectKitProvider } from "connectkit";
import { Toaster } from "sonner";
import { WagmiProvider } from "wagmi";

import "@gearbox-protocol/permissionless-ui/globals.css";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          <SafeProvider>
            <html lang="en" className="dark h-full">
              <body className="h-full bg-background font-sans antialiased">
                <Toaster position="top-center" />
                <HeaderLayout />
                <div className="flex min-h-[calc(100vh-64px)] flex-col">
                  {/* Main Content */}
                  <main className="flex-1 w-full max-w-[1800px] mx-auto px-4">
                    {children}
                  </main>
                </div>
                <Footer
                  appName="Safe"
                  legalReferences={{
                    termsOfService: "/legal/terms-of-service",
                    privacyNotice: "/legal/privacy-notice",
                    riskDisclosure: "/legal/risk-disclosure",
                  }}
                />
              </body>
            </html>
          </SafeProvider>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
