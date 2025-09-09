import { safeAbi, simulateTxAccessorAbi } from "@/bindings/generated";
import { SignedTx } from "@/core/safe-tx";
import { useMutation } from "@tanstack/react-query";
import { Address, decodeAbiParameters, encodeFunctionData, Hex } from "viem";
import { usePublicClient } from "wagmi";
// import { traceCallServer } from "./viem-tracer";
import { traceCall } from "@/utils/debug-trace";
import { formatFullTrace } from "@/utils/fromat-trace";



const SIMULATE_TX_ACCESSOR = "0x3d4BA2E0884aa488718476ca2FB8Efc291A46199";

/**
 * ABI definition for the return values of the `SimulateTxAccessor.simulate` function.
 * This is used to decode the nested return data.
 */
const simulateResultAbi = [
  { name: "estimate", type: "uint256" },
  { name: "success", type: "bool" },
  { name: "returnData", type: "bytes" },
] as const;

/**
 * Represents the successfully decoded simulation result.
 */
export interface DecodedSafeSimulation {
  /**
   * Indicates if the top-level delegatecall to the accessor contract was successful.
   * This should almost always be true if you get a structured response.
   */
  delegateCallSuccess: boolean;
  /**
   * The results of the inner transaction simulation.
   */
  simulation: {
    /**
     * The gas consumed by the simulated transaction.
     */
    estimate: bigint;
    /**
     * The success status of the simulated transaction. `true` if it succeeded, `false` if it reverted.
     */
    success: boolean;
    /**
     * The data returned by the simulated transaction. If `success` is `false`, this will contain the revert reason.
     */
    returnData: Hex;
  };
}

/**
 * Decodes the revert data returned by a `Safe.simulateAndRevert` call
 * that wraps a `SimulateTxAccessor.simulate` call.
 *
 * The raw revert data from `simulateAndRevert` is a custom structure:
 * - Bytes 0-31: A boolean indicating the success of the `delegatecall` to the accessor.
 * - Bytes 32-63: The length of the data returned by the accessor.
 * - Bytes 64-end: The actual data returned by the accessor.
 *
 * This function parses this outer structure and then decodes the inner data,
 * which is the ABI-encoded return value of `SimulateTxAccessor.simulate`.
 *
 * @param revertData The raw hex string (`0x...`) from the revert.
 * @returns A structured object with the decoded simulation results.
 * @throws If the data is not long enough to be a valid simulation response.
 */
export function decodeSafeSimulation(revertData: Hex): DecodedSafeSimulation {
  if (revertData.length < 130) {
    // Must be at least 64 bytes for the wrapper + 2 bytes for '0x'.
    // A minimal successful response is 64 bytes of wrapper + 96 bytes of inner data = 160 bytes.
    // Let's use a safe lower bound.
    throw new Error("Invalid revert data length.");
  }

  // 1. Decode the outer `simulateAndRevert` structure manually.
  const delegateCallSuccess = BigInt("0x" + revertData.slice(2, 66)) === 1n;
  const innerDataSize = BigInt("0x" + revertData.slice(66, 130));
  const innerData = "0x" + revertData.slice(130) as `0x${string}`;

  console.log("delegateCallSuccess", delegateCallSuccess);
  console.log("innerDataSize", innerDataSize);
  console.log("innerData", innerData);

  // 2. Decode the inner `SimulateTxAccessor.simulate` return data.
  const [estimate, success, returnData] = decodeAbiParameters(
    simulateResultAbi,
    innerData
  );
  

  console.log("estimate", estimate);
  console.log("success", success);
  console.log("returnData", returnData);

  return {
    delegateCallSuccess,
    simulation: {
      estimate,
      success,
      returnData,
    },
  };
}

export function useSimulateTx(
  safeAddress: Address,
  instanceManager: Address,
  tx: SignedTx
) {
  const publicClient = usePublicClient();

  const mutation = useMutation({
    mutationKey: ["simulate-tx", safeAddress, instanceManager, tx.hash],
    mutationFn: async () => {
      if (!publicClient || !safeAddress || !tx) {
        throw new Error("Missing required parameters for simulation");
      }

      const callData = encodeFunctionData({
        abi: simulateTxAccessorAbi,
        functionName: "simulate",
        args: [tx.to, tx.value, tx.data, tx.operation],
      });

      // simulateAndRevert always reverts, so we use call instead of simulateContract
      const simulateAndRevertData = encodeFunctionData({
        abi: safeAbi,
        functionName: "simulateAndRevert",
        args: [SIMULATE_TX_ACCESSOR, callData],
      });

      try {
        // try {
        //   const trace = await traceCall(publicClient, {
        //     to: safeAddress,
        //     data: simulateAndRevertData,
        //   });
        //   console.log("trace", await formatFullTrace(trace, { gas: true }));
        // } catch (error) {
        //   console.error("failed to trace", error);
        // }

        const result = await publicClient.transport.request({
          method: "eth_call",
          params: [{
            to: safeAddress,
            data: simulateAndRevertData,
            gas: 20_000_000n,
          }],
        });

        // If we get here, something went wrong as simulateAndRevert should always revert
        console.warn("simulateAndRevert did not revert as expected");
        return { success: true, result };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        if (err?.data) {
          const errorData = err.data as Hex;
          const decoded = decodeSafeSimulation(errorData);
          
          // If the simulation itself failed (delegateCall failed), throw an error
          if (!decoded.delegateCallSuccess) {
            throw new Error("Simulation delegate call failed");
          }
          
          // Return the simulation result - success indicates if the transaction would succeed
          return { 
            success: decoded.simulation.success, 
            result: decoded.simulation.returnData,
            gasEstimate: decoded.simulation.estimate
          };
        } else {
          throw err;
        }
      }
    },
    retry: 1,
  });

  return {
    data: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error as Error | null,
    simulate: mutation.mutate,
    reset: mutation.reset,
  };
}