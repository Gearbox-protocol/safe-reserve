import { Call } from "@/core/safe-tx";
import { useDecodeInstanceCall } from "@/hooks";
import { Address } from "viem";
import { ProposalCall } from "../proposal-call";

interface ProposalCallProps {
  instanceManager: Address;
  index: number;
  call: Call;
}

export function InstanceProposalCall({
  instanceManager,
  index,
  call,
}: ProposalCallProps) {
  const parsedCall = useDecodeInstanceCall(instanceManager, call);

  return <ProposalCall parsedCall={parsedCall} call={call} index={index} />;
}
