import { useEffect, useState } from "react";
import { Address, encodeAbiParameters, Hex, keccak256 } from "viem";
import { usePublicClient } from "wagmi";
import { governorAbi } from "../bindings/generated";
import { SafeTx } from "../core/safe-tx";

export enum TimelockTxStatus {
  Queued,
  ReadyToExecute,
  NotFound,
}

export function useTransactionStatus(tx: SafeTx) {
  const [eta, setEta] = useState<number>();
  const [status, setStatus] = useState<TimelockTxStatus>();

  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchStatus = async () => {
      if (!tx || !publicClient) return;

      if (tx.calls.length < 2) {
        throw new Error("Batch does not have enough transactions");
      }

      if (tx.calls[0].functionName !== "startBatch") {
        throw new Error("First transaction is not a startBatch");
      }
      if (tx.calls[1].functionName !== "queueTransaction") {
        throw new Error("Second transaction is not a queueTransaction");
      }

      const eta = Number(tx.calls[0].functionArgs[0]);
      const txHash = keccak256(
        encodeAbiParameters(
          [
            { type: "address", name: "target" },
            { type: "uint", name: "value" },
            { type: "string", name: "signature" },
            { type: "bytes", name: "data" },
            { type: "uint", name: "eta" },
          ],
          [
            tx.calls[1].functionArgs[0] as Address,
            tx.calls[1].functionArgs[1] as bigint,
            tx.calls[1].functionArgs[2] as string,
            tx.calls[1].functionArgs[3] as Hex,
            tx.calls[1].functionArgs[4] as bigint,
          ]
        )
      );

      const timelock = await publicClient.readContract({
        address: tx.calls[0].to,
        abi: governorAbi,
        functionName: "timeLock",
      });

      const queued = await publicClient.readContract({
        address: timelock,
        abi: [
          {
            type: "function",
            inputs: [{ name: "", type: "bytes32" }],
            name: "queuedTransactions",
            outputs: [{ name: "", type: "bool" }],
            stateMutability: "view",
          },
        ],
        functionName: "queuedTransactions",
        args: [txHash],
      });

      setEta(eta);

      if (queued) {
        if (eta > Math.floor(Date.now() / 1000)) {
          return setStatus(TimelockTxStatus.Queued);
        } else {
          return setStatus(TimelockTxStatus.ReadyToExecute);
        }
      } else {
        setStatus(TimelockTxStatus.NotFound);
      }
    };

    // Only fetch once when component mounts and crossChainMultisig is available
    fetchStatus();
  }, [tx, publicClient]); // Only re-run if safeAddress or publicClient changes

  return { eta, status };
}
