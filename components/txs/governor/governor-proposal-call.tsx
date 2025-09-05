import { Call } from "@/core/safe-tx";
import { useDecodeGovernorCall } from "@/hooks";
import { Address } from "viem";
import { ProposalCall } from "../proposal-call";

interface ProposalCallProps {
  governor: Address;
  index: number;
  call: Call;
}

export function GovernorProposalCall({
  governor,
  index,
  call,
}: ProposalCallProps) {
  const parsedCall = useDecodeGovernorCall(governor, call);

  return <ProposalCall parsedCall={parsedCall} call={call} index={index} />;
}
