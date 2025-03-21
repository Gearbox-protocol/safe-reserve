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
}): Promise<{ status: TimelockTxStatus; blockNumber: number }> {
  const { publicClient, timelock, txHash, eta } = args;

  if (eta > Math.floor(Date.now() / 1000) + 14 * HOUR_24) {
    return {
      blockNumber: -1,
      status: TimelockTxStatus.Stale,
    };
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
    return {
      blockNumber: -1,
      status: TimelockTxStatus.Executed,
    };
  }

  const isCanceled =
    (await timelockContract.getEvents.CancelTransaction({ txHash }, range))
      .length > 0;

  if (isCanceled) {
    return {
      blockNumber: -1,
      status: TimelockTxStatus.Canceled,
    };
  }

  const queueEvent = await timelockContract.getEvents.QueueTransaction(
    { txHash },
    range
  );
  const isQueued = queueEvent.length > 0;

  if (isQueued) {
    if (eta > Math.floor(Date.now() / 1000)) {
      return {
        blockNumber: Number(queueEvent[0].blockNumber),
        status: TimelockTxStatus.Queued,
      };
    } else {
      return {
        blockNumber: Number(queueEvent[0].blockNumber),
        status: TimelockTxStatus.Ready,
      };
    }
  }

  return {
    blockNumber: -1,
    status: TimelockTxStatus.NotFound,
  };
}
