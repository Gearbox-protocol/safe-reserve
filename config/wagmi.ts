import {
  ArchiveTransport,
  chunkedLogsTransport,
} from "@gearbox-protocol/sdk/permissionless";
import { getDefaultConfig } from "connectkit";
import { Chain, defineChain, Transport } from "viem";
import { createConfig, http } from "wagmi";
import {
  arbitrum,
  avalanche,
  base,
  berachain,
  bsc,
  etherlink,
  hemi,
  lisk,
  mainnet,
  optimism,
  plasma,
  monad as viemMonad,
  worldchain,
} from "wagmi/chains";
// import { safe, walletConnect } from "wagmi/connectors";

const monad = defineChain({
  ...viemMonad,
  rpcUrls: {
    default: {
      http: [
        "https://permissionless-staging.gearbox.foundation/api/proxy/rpc/143",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Monadscan",
      url: "https://monadscan.com/",
    },
  },
  contracts: {
    ...viemMonad.contracts,
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 9248132,
    },
  },
});

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

const somnia = defineChain({
  id: 5031,
  name: "Somnia",
  blockTime: 200,
  nativeCurrency: {
    name: "Somnia",
    symbol: "STT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://api.infra.mainnet.somnia.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Somnia Explorer",
      url: "https://explorer.somnia.network",
    },
  },
  contracts: {
    multicall3: {
      address: "0x5e44F178E8cF9B2F5409B6f18ce936aB817C5a11",
      blockCreated: 38516341,
    },
  },
  testnet: false,
});

export const chains = [
  mainnet,
  optimism,
  arbitrum,
  base,
  avalanche,
  bsc,
  worldchain,
  etherlink,
  hemiWithMulticall3,
  lisk,
  berachain,
  plasmaWithMulticall3,
  monad,
  somnia,
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
  if (chain.id === mainnet.id) {
    return http(process.env.NEXT_PUBLIC_RPC_URL || drpcUrl("ethereum"), {
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10000,
    });
  }

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

  if (chain.id === optimism.id) {
    return new ArchiveTransport({
      primaryRpcUrl: drpcUrl("optimism"),
      archiveRpcUrl: "https://explorer.optimism.io/api/eth-rpc",
      blockThreshold: 999,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === arbitrum.id) {
    return new ArchiveTransport({
      primaryRpcUrl: drpcUrl("arbitrum"),
      archiveRpcUrl: "https://arbitrum.blockscout.com/api/eth-rpc",
      blockThreshold: 999,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === monad.id) {
    const primaryTransport = chunkedLogsTransport({
      transport: http(monad.rpcUrls.default.http[0], {
        batch: true,
      }),
      chunkSize: 100,
      enableLogging: true,
    });

    return new ArchiveTransport({
      primaryTransport,
      archiveRpcUrl:
        "https://permissionless-staging.gearbox.foundation/api/thirdweb/rpc/143",
      blockThreshold: 199,
      enableLogging: true,
    }).getTransport();
  }

  if (chain.id === somnia.id) {
    return new ArchiveTransport({
      primaryRpcUrl: chain.rpcUrls.default.http[0],
      archiveRpcUrl:
        "https://permissionless-staging.gearbox.foundation/api/thirdweb/rpc/5031",
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
      [optimism.id]: getChainTransport(optimism),
      [arbitrum.id]: getChainTransport(arbitrum),
      [monad.id]: getChainTransport(monad),
      [somnia.id]: getChainTransport(somnia),
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
    appName: "Gearbox Safe",

    // Optional App Info
    appDescription: "Gearbox Safe",
    appUrl: "https://gearbox.fi", // your app's url
    appIcon: "https://static.gearbox.fi/logo/logo_symbol.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
  })
);

export const defaultChainId = 1;

export const SDK_GAS_LIMIT_BY_CHAIN: Record<number, bigint> = {
  [monad.id]: 100_000_000n,
}; // SDK set by default gas limit to 550_000_000n
