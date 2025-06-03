import {
  Address,
  BlockTag,
  encodeEventTopics,
  Hash,
  parseEventLogs,
  PublicClient,
} from "viem";
import { timelockAbi } from "../bindings/generated";
import { HOUR_24 } from "./constant";

export enum TimelockTxStatus {
  NotFound,
  Queued,
  Ready,
  Canceled,
  Stale,
  Executed,
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

  const events = [
    "ExecuteTransaction",
    "CancelTransaction",
    "QueueTransaction",
  ].map(
    (eventName) =>
      encodeEventTopics({
        abi: timelockAbi,
        eventName: eventName as
          | "CancelTransaction"
          | "ExecuteTransaction"
          | "QueueTransaction",
        args: {},
      })[0]
  );

  const logs = await publicClient.getLogs({
    address: timelock,
    fromBlock: 0n,
    toBlock: "latest",
    topics: [events, [txHash]],
  } as {
    address: `0x${string}`;
    fromBlock: bigint;
    toBlock: BlockTag | bigint;
    topics: (string[] | string | null)[];
  });

  const parsedLogs = parseEventLogs({
    abi: timelockAbi,
    logs,
  }).filter(
    (log) =>
      (log.eventName === "ExecuteTransaction" ||
        log.eventName === "CancelTransaction" ||
        log.eventName === "QueueTransaction") &&
      (log.args?.txHash ?? "").toLowerCase() === txHash.toLowerCase()
  );

  let status = TimelockTxStatus.NotFound;
  let blockNumber = -1;

  for (const log of parsedLogs) {
    switch (log.eventName) {
      case "ExecuteTransaction": {
        blockNumber = Number(log.blockNumber);
        status = TimelockTxStatus.Executed;
        break;
      }
      case "CancelTransaction": {
        blockNumber = Number(log.blockNumber);
        status = TimelockTxStatus.Canceled;
        break;
      }
      case "QueueTransaction": {
        blockNumber = Number(log.blockNumber);
        if (status === TimelockTxStatus.NotFound) {
          status = TimelockTxStatus.Queued;
        }
        break;
      }
    }
  }

  if (status === TimelockTxStatus.Queued) {
    if (eta <= Math.floor(Date.now() / 1000)) {
      status = TimelockTxStatus.Ready;
    }
  }

  return {
    blockNumber,
    status,
  };
}
