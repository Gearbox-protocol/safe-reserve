import { Call } from "@/core/safe-tx";
import { GovernorContract } from "@gearbox-protocol/permissionless";
import { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

export function useDecodeGovernorCall(
  chainId: number,
  governor: Address,
  call: Call
) {
  const publicClient = usePublicClient({ chainId });
  const governorContract = new GovernorContract(
    governor,
    publicClient as PublicClient
  );

  if (call.to.toLowerCase() !== governor.toLowerCase()) {
    return {
      chainId,
      target: call.to,
      label: "Unknown contract",
      functionName: `Unknown function: ${call.data}`,
      args: {},
    };
  }
  return governorContract.parseFunctionData(call.data);
}

export function useDecodeGovernorCalls(
  chainId: number,
  governor: Address,
  calls: Call[]
) {
  const publicClient = usePublicClient({ chainId });
  const governorContract = new GovernorContract(
    governor,
    publicClient as PublicClient
  );

  return calls.map((call) => {
    if (call.to.toLowerCase() !== governor.toLowerCase()) {
      return {
        chainId,
        target: call.to,
        label: "Unknown contract",
        functionName: `Unknown function: ${call.data}`,
        args: {},
      };
    }
    return governorContract.parseFunctionData(call.data);
  });
}
