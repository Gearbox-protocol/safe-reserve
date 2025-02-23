import pino, { Logger } from "pino";
import { Address, createPublicClient, http, PublicClient } from "viem";

export class ClientConfig {
  static #instance: ClientConfig;
  public readonly rpcUrl: string;
  public readonly addressProvider: Address;
  public readonly client: PublicClient;
  public readonly logger: Logger;

  protected constructor(rpcUrlChain?: string) {
    // Load RPC URL from env
    const rpcUrl =
      rpcUrlChain || process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      throw new Error("RPC_URL not found in environment variables");
    }

    this.rpcUrl = rpcUrl;

    const addressProvider = process.env.NEXT_PUBLIC_ADDRESS_PROVIDER;
    if (!addressProvider) {
      throw new Error("ADDRESS_PROVIDER not found in environment variables");
    }
    this.addressProvider = addressProvider as Address;

    this.client = createPublicClient({
      batch: {
        multicall: true,
      },
      transport: http(rpcUrl, {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 10000,
      }),
    });

    // Load deployment config
    // const deployConfig = JSON.parse(
    //   readFileSync(join(__dirname, "../deployment.json"), "utf-8")
    // ) as DeploymentConfig;

    // this.addressProvider = deployConfig.addressProvider as Address;

    this.logger = pino({
      name: "client",
    });
  }

  public static getInstance(): ClientConfig {
    if (!ClientConfig.#instance) {
      ClientConfig.#instance = new ClientConfig();
    }
    return ClientConfig.#instance;
  }
}
