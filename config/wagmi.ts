import { getDefaultConfig } from "connectkit";
import { defineChain } from "viem";
import { createConfig, http, injected } from "wagmi";
import { walletConnect } from "wagmi/connectors";

export type NetworkType = "Mainnet" | "Arbitrum" | "Optimism" | "Sonic";

export const getRpc = (chain: NetworkType) => {
  let rpc;
  switch (chain) {
    case "Mainnet":
      rpc =
        process.env.NEXT_PUBLIC_MAINNET_NODE_URI ??
        process.env.NEXT_PUBLIC_RPC_URL;
      break;
    default:
      rpc = process.env.NEXT_PUBLIC_RPC_URL;
      break;
  }

  if (!rpc) {
    throw new Error("Missing rpc");
  }

  return rpc;
};

const mainnet = defineChain({
  id: 1,
  name: "Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [getRpc("Mainnet")],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://etherscan.io",
      apiUrl: "https://api.etherscan.io/api",
    },
  },
});

const chains = [mainnet] as const;

export const config = createConfig(
  getDefaultConfig({
    chains,
    transports: Object.fromEntries(
      chains.map((ch) => [ch.id, http(getRpc(ch.name), { retryDelay: 1_000 })])
    ),

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
