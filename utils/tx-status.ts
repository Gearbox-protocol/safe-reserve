import { safeAbi } from "@/abi";
import {
  BaseContract,
  getBlockNumberByTimestamp,
  TimeLockContract,
} from "@gearbox-protocol/permissionless";
import { Address, Hash, Hex, PublicClient } from "viem";
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
  createdAtBlock?: number;
}): Promise<{ status: TimelockTxStatus; blockNumber: number }> {
  const { publicClient, timelock, txHash, eta, createdAtBlock = 0 } = args;

  const lastBlockTimestamp = await publicClient
    .getBlock()
    .then((block) => Number(block.timestamp));

  if (eta > lastBlockTimestamp + 14 * HOUR_24) {
    return {
      blockNumber: -1,
      status: TimelockTxStatus.Stale,
    };
  }

  const timeLockContract = new TimeLockContract(timelock, publicClient);

  const [etaBlock, staleBlock] = await Promise.all([
    getBlockNumberByTimestamp(publicClient, eta),
    getBlockNumberByTimestamp(publicClient, eta + 14 * HOUR_24),
  ]);

  // const events = [
  //   "ExecuteTransaction",
  //   "CancelTransaction",
  //   "QueueTransaction",
  // ].map(
  //   (eventName) =>
  //     encodeEventTopics({
  //       abi: timelockAbi,
  //       eventName: eventName as
  //         | "CancelTransaction"
  //         | "ExecuteTransaction"
  //         | "QueueTransaction",
  //       args: {},
  //     })[0]
  // );

  // const logs = await publicClient.getLogs({
  //   address: timelock,
  //   fromBlock: BigInt(createdAtBlock),
  //   toBlock: BigInt(toBlock),
  //   topics: [events, [txHash]],
  // } as {
  //   address: `0x${string}`;
  //   fromBlock: bigint;
  //   toBlock: BlockTag | bigint;
  //   topics: (string[] | string | null)[];
  // });

  // const parsedLogs = parseEventLogs({
  //   abi: timelockAbi,
  //   logs,
  // }).filter(
  //   (log) =>
  //     (log.eventName === "ExecuteTransaction" ||
  //       log.eventName === "CancelTransaction" ||
  //       log.eventName === "QueueTransaction") &&
  //     (log.args?.txHash ?? "").toLowerCase() === txHash.toLowerCase()
  // );

  const parsedLogs = (
    await Promise.all([
      timeLockContract.getEvents(
        "ExecuteTransaction",
        BigInt(createdAtBlock),
        BigInt(staleBlock),
        { txHash }
      ),
      timeLockContract.getEvents(
        "CancelTransaction",
        BigInt(createdAtBlock),
        BigInt(staleBlock),
        { txHash }
      ),
      timeLockContract.getEvents(
        "QueueTransaction",
        BigInt(createdAtBlock),
        BigInt(etaBlock),
        { txHash }
      ),
    ])
  ).flat();

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
    if (eta <= lastBlockTimestamp) {
      status = TimelockTxStatus.Ready;
    }
  }

  return {
    blockNumber,
    status,
  };
}

export async function executedSafeTxs(args: {
  publicClient: PublicClient;
  safe: Address;
  createdAtBlock?: number;
}): Promise<Hex[]> {
  const { publicClient, safe, createdAtBlock = 0 } = args;

  const safeContract = new BaseContract(safeAbi, safe, publicClient, "Safe");
  const block = await publicClient.getBlock();

  const parsedLogs = await safeContract.getEvents(
    "ExecutionSuccess",
    // @note if createdAt was not specified 1000000 blocks probably would be enough
    BigInt(createdAtBlock ?? block.number - 1000000n),
    block.number
  );

  return parsedLogs.map((log) => log.args.txHash!);
}
