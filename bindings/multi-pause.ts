import { MultiPauseAbi } from "@/abi";
import { BaseContract } from "@gearbox-protocol/permissionless";
import { RawTx } from "@gearbox-protocol/sdk";
import { type Address, type PublicClient } from "viem";

const abi = MultiPauseAbi;

export class MultiPuaseContract extends BaseContract<typeof abi> {
  constructor(address: Address, client: PublicClient) {
    super(abi, address, client, "Multipause");
  }

  pauseAllContracts(): RawTx {
    return this.createRawTx({
      functionName: "pauseAllContracts",
    });
  }

  pauseMarket(pool: Address): RawTx {
    return this.createRawTx({
      functionName: "pauseMarket",
      args: [pool],
    });
  }

  pauseCreditSuite(creditManager: Address): RawTx {
    return this.createRawTx({
      functionName: "pauseCreditSuite",
      args: [creditManager],
    });
  }
}
