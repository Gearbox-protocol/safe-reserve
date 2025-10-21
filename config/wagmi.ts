import { ArchiveTransport } from "@gearbox-protocol/sdk/permissionless";
import { getDefaultConfig } from "connectkit";
import { Chain, defineChain, Transport } from "viem";
import { createConfig, http } from "wagmi";
import {
  avalanche,
  base,
  berachain,
  bsc,
  etherlink,
  hemi,
  lisk,
  mainnet,
  plasma,
  worldchain,
} from "wagmi/chains";
// import { safe, walletConnect } from "wagmi/connectors";

const hemiWithMulticall3 = defineChain({
  ...hemi,
  contracts: {
    ...hemi.contracts,
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
});

const plasmaWithMulticall3 = defineChain({
  ...plasma,
  contracts: {
    ...plasma.contracts,
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
    },
  },
});

export const chains = [
  mainnet,
  base,
  avalanche,
  bsc,
  worldchain,
  etherlink,
  hemiWithMulticall3,
  lisk,
  berachain,
  plasmaWithMulticall3,
] as const;

export const ADDRESS_PROVIDER = process.env.NEXT_PUBLIC_ADDRESS_PROVIDER;

function drpcUrl(chainName: string) {
  const apiKey = process.env.NEXT_PUBLIC_DRPC_API_KEY;
  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_DRPC_API_KEY is not set");
  }
  return `https://lb.drpc.org/${chainName}/${apiKey}`;
}

const getHyperRpcUrl = (chainId: number) => {
  return `https://${chainId}.rpc.hypersync.xyz`;
};

export const getChainTransport = (chain: Chain): Transport => {
  if (chain.id === etherlink.id) {
    return new ArchiveTransport({
      primaryRpcUrl: "https://node.mainnet.etherlink.com",
      archiveRpcUrl: "https://explorer.etherlink.com/api/eth-rpc",
      blockThreshold: 999,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === bsc.id) {
    return new ArchiveTransport({
      primaryRpcUrl: drpcUrl("bsc"),
      archiveRpcUrl: "https://bsc.rpc.hypersync.xyz",
      blockThreshold: 50,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === hemi.id) {
    return new ArchiveTransport({
      primaryRpcUrl: drpcUrl("hemi"),
      archiveRpcUrl: "https://explorer.hemi.xyz/api/eth-rpc",
      blockThreshold: 50,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === mainnet.id) {
    return http(process.env.NEXT_PUBLIC_RPC_URL || drpcUrl("ethereum"), {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10000,
    });
  }

  if (chain.id === lisk.id) {
    return new ArchiveTransport({
      primaryRpcUrl: drpcUrl("lisk"),
      archiveRpcUrl: "https://lisk.rpc.hypersync.xyz",
      blockThreshold: 200,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === berachain.id) {
    return new ArchiveTransport({
      primaryRpcUrl: drpcUrl("berachain"), // "https://rpc.berachain-apis.com",
      archiveRpcUrl: getHyperRpcUrl(chain.id),
      blockThreshold: 999,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === plasma.id) {
    return new ArchiveTransport({
      primaryRpcUrl: drpcUrl("plasma"),
      archiveRpcUrl:
        "https://plasma.gateway.tenderly.co/75ewmNAMLVnWRFd6qJ54PG",
      blockThreshold: 999,
      enableLogging: true,
    }).getTransport();
  }

  // Try to use window.ethereum if available
  // if (typeof window !== "undefined" && window.ethereum) {
  //   return custom(window.ethereum);
  // }

  // Prefer chain-specific default RPC if available to avoid cross-network leakage
  return http(chain.rpcUrls.default.http[0], {
    retryCount: 3,
    retryDelay: 1000,
    timeout: 10000,
  });
};

export const config = createConfig(
  getDefaultConfig({
    chains,
    transports: {
      [mainnet.id]: getChainTransport(mainnet),
      [base.id]: getChainTransport(base),
      [avalanche.id]: getChainTransport(avalanche),
      // [monadTestnet.id]: getChainTransport(monadTestnet),
      [bsc.id]: getChainTransport(bsc),
      [worldchain.id]: getChainTransport(worldchain),
      [etherlink.id]: getChainTransport(etherlink),
      [hemi.id]: getChainTransport(hemi),
      [lisk.id]: getChainTransport(lisk),
      [berachain.id]: getChainTransport(berachain),
      [plasma.id]: getChainTransport(plasma),
    } as Record<number, Transport>,

    // connectors: [
    //   safe({
    //     allowedDomains: [/app.safe.global$/],
    //   }),
    //   walletConnect({
    //     projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    //     qrModalOptions: { themeVariables: { "--wcm-z-index": "210" } },
    //   }),
    //   injected(),
    // ],

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
