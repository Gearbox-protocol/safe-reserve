import { Call } from "@/core/safe-tx";
import { GovernorContract } from "@gearbox-protocol/permissionless";
import { Address, PublicClient } from "viem";
import { usePublicClient } from "wagmi";

export function useDecodeGovernorCall(governor: Address, call: Call) {
  const publicClient = usePublicClient();
  const governorContract = new GovernorContract(
    governor,
    publicClient as PublicClient
  );

  if (call.to.toLowerCase() !== governor.toLowerCase()) {
    return {
      chainId: 0,
      target: call.to,
      label: "Unknown contract",
      functionName: `Unknown function: ${call.data}`,
      args: {},
    };
  }
  return governorContract.parseFunctionData(call.data);
}
