import { Address, getContract, Hash, PublicClient } from "viem";
import { timelockAbi } from "../bindings/generated";
import { HOUR_24 } from "./constant";

export enum TimelockTxStatus {
  Queued,
  Ready,
  Executed,
  Canceled,
  NotFound,
  Stale,
}

export async function getTxStatus(args: {
  publicClient: PublicClient;
  timelock: Address;
  txHash: Hash;
  eta: number;
}): Promise<TimelockTxStatus> {
  const { publicClient, timelock, txHash, eta } = args;

  if (eta > Math.floor(Date.now() / 1000) + 14 * HOUR_24) {
    return TimelockTxStatus.Stale;
  }

  const timelockContract = getContract({
    address: timelock,
    abi: timelockAbi,
    client: {
      public: publicClient,
    },
  });

  const range: { fromBlock: bigint; toBlock: "latest" } = {
    fromBlock: 0n,
    toBlock: "latest",
  };

  const isExecuted =
    (await timelockContract.getEvents.ExecuteTransaction({ txHash }, range))
      .length > 0;

  if (isExecuted) {
    return TimelockTxStatus.Executed;
  }

  const isCanceled =
    (await timelockContract.getEvents.CancelTransaction({ txHash }, range))
      .length > 0;

  if (isCanceled) {
    return TimelockTxStatus.Canceled;
  }

  const isQueued =
    (await timelockContract.getEvents.QueueTransaction({ txHash }, range))
      .length > 0;

  if (isQueued) {
    if (eta > Math.floor(Date.now() / 1000)) {
      return TimelockTxStatus.Queued;
    } else {
      return TimelockTxStatus.Ready;
    }
  }

  return TimelockTxStatus.NotFound;
}
