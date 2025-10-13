import { chains } from "@/config/wagmi";
import { useSafeParams } from "@/hooks";
import {
  ConfirmationItem,
  VerticalTimeline,
} from "@gearbox-protocol/permissionless-ui";
import { Address } from "viem";

interface ProposalSignaturesProps {
  chainId: number;
  safeAddress: Address;
  signers: Address[];
  nonce?: number;
  isExecuted: boolean;
}

export function InstanceProposalSignatures({
  chainId,
  safeAddress,
  signers,
  nonce,
  isExecuted,
}: ProposalSignaturesProps) {
  const chain = chains.find(({ id }) => id === chainId);
  const { threshold } = useSafeParams(chainId, safeAddress);

  return (
    <VerticalTimeline
      steps={[
        {
          type: "default",
          status: "success",
          title: `Created${nonce ? ` (nonce: ${nonce})` : ""}`,
        },
        {
          type: "default",
          status: isExecuted || signers.length > 0 ? "success" : "pending",
          title: `Confirmations (${signers.length} of ${threshold})`,
        },
        {
          type: "extention",
          status: signers.length > 0 ? "success" : "not-started",
          children: signers.map((confirmation, index) => (
            <ConfirmationItem
              key={index}
              confirmation={confirmation}
              explorerUrl={
                chain?.blockExplorers.default.url
                  ? `${chain.blockExplorers.default.url}/address/${confirmation}`
                  : undefined
              }
            />
          )),
        },
        {
          type: "default",
          status: isExecuted
            ? "success"
            : signers.length > 0
              ? "pending"
              : "not-started",
          title: "Executed",
        },
      ]}
    />
  );
}
