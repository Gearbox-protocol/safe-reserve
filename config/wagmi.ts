import { getDefaultConfig } from "connectkit";
import { createConfig, http, injected } from "wagmi";
import {
  avalanche,
  base,
  bsc,
  mainnet,
  monadTestnet,
  worldchain,
} from "wagmi/chains";
import { walletConnect } from "wagmi/connectors";

export type NetworkType = "Mainnet" | "Arbitrum" | "Optimism" | "Sonic";

const chains = [
  mainnet,
  base,
  avalanche,
  monadTestnet,
  bsc,
  worldchain,
] as const;

export const config = createConfig(
  getDefaultConfig({
    chains,
    transports: {
      [mainnet.id]: http(
        process.env.NEXT_PUBLIC_MAINNET_NODE_URI ??
          process.env.NEXT_PUBLIC_RPC_URL,
        { retryDelay: 1_000 }
      ),
      // [mainnet.id]: http(),
      [base.id]: http(),
      [avalanche.id]: http(),
      [monadTestnet.id]: http(),
      [bsc.id]: http(),
      [worldchain.id]: http(),
    },

    connectors: [
      injected(),
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
        qrModalOptions: { themeVariables: { "--wcm-z-index": "210" } },
      }),
    ],

    walletConnectProjectId:
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",

    // Required App Info
    appName: "Gearbox Safe Reserve",

    // Optional App Info
    appDescription: "Gearbox Safe Reserve",
    appUrl: "https://gearbox.fi", // your app's url
    appIcon: "https://static.gearbox.fi/logo/logo_symbol.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  })
);

export const defaultChainId = 1;
