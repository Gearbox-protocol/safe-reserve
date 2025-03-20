import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { localhost, mainnet } from "wagmi/chains";

export const config = createConfig(
  getDefaultConfig({
    chains: process.env.NODE_ENV === "development" ? [localhost] : [mainnet],
    transports: {
      [mainnet.id]: http(),
      [localhost.id]: http(),
    },

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

export const defaultChainId = process.env.NODE_ENV === "development" ? 1337 : 1;
