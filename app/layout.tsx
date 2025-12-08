import HeaderLayout from "@/components/header";
import { GearboxFooter, Layout } from "@gearbox-protocol/permissionless-ui";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "./providers";

import "@gearbox-protocol/permissionless-ui/globals.css";
import "./globals.css";

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "Gearbox Safe",
    template: "%s | Gearbox Safe",
  },
  description: "Manage Gearbox Safe transactions and emergency actions",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`h-full bg-background font-sans antialiased ${geistMono.variable}`}
      >
        <Providers>
          <Layout
            header={<HeaderLayout />}
            footer={
              <GearboxFooter
                appName="Safe"
                legalReferences={{
                  termsOfService: "/legal/terms-of-service",
                  privacyNotice: "/legal/privacy-notice",
                  riskDisclosure: "/legal/risk-disclosure",
                }}
              />
            }
          >
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
}
