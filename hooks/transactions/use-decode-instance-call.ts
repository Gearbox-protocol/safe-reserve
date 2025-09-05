import { Call } from "@/core/safe-tx";
import { InstanceManagerContract } from "@gearbox-protocol/permissionless";
import { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

export function useDecodeInstanceCall(inatsnceManager: Address, call: Call) {
  const publicClient = usePublicClient();
  const instanceManagerContract = new InstanceManagerContract(
    inatsnceManager,
    publicClient as PublicClient
  );

  if (call.to.toLowerCase() !== inatsnceManager.toLowerCase()) {
    return {
      chainId: 0,
      target: call.to,
      label: "Unknown contract",
      functionName: `Unknown function: ${call.data}`,
      args: {},
    };
  }
  return instanceManagerContract.parseFunctionData(call.data);
}

export function useDecodeInstanceCalls(
  inatsnceManager: Address,
  calls: Call[]
) {
  const publicClient = usePublicClient();
  const instanceManagerContract = new InstanceManagerContract(
    inatsnceManager,
    publicClient as PublicClient
  );

  return calls.map((call) => {
    if (call.to.toLowerCase() !== inatsnceManager.toLowerCase()) {
      return {
        chainId: 0,
        target: call.to,
        label: "Unknown contract",
        functionName: `Unknown function: ${call.data}`,
        args: {},
      };
    }
    return instanceManagerContract.parseFunctionData(call.data);
  });
}
