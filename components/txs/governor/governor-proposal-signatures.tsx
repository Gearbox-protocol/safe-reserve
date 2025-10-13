import { chains } from "@/config/wagmi";
import { useSafeParams } from "@/hooks";
import { TimelockTxStatus } from "@/utils/tx-status";
import {
  ConfirmationItem,
  VerticalTimeline,
} from "@gearbox-protocol/permissionless-ui";
import { Address } from "viem";

interface ProposalSignaturesProps {
  chainId: number;
  safeAddress: Address;
  signers: Address[];
  status: TimelockTxStatus;
}

export function GovernorProposalSignatures({
  chainId,
  safeAddress,
  signers,
  status,
}: ProposalSignaturesProps) {
  const chain = chains.find(({ id }) => id === chainId);
  const { threshold } = useSafeParams(chainId, safeAddress);

  return (
    <VerticalTimeline
      steps={[
        {
          type: "default",
          status: "success",
          title: "Created",
        },
        {
          type: "default",
          status:
            status !== TimelockTxStatus.NotFound || signers.length > 0
              ? "success"
              : "pending",
          title: `Confirmations (${
            [TimelockTxStatus.Queued, TimelockTxStatus.Executed].includes(
              status
            )
              ? threshold
              : signers.length
          } of ${threshold})`,
        },
        {
          type: "extention",
          status:
            [
              TimelockTxStatus.NotFound,
              TimelockTxStatus.Queued,
              TimelockTxStatus.Canceled,
            ].includes(status) && signers.length > 0
              ? "success"
              : "not-started",
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
          status:
            status !== TimelockTxStatus.NotFound
              ? "success"
              : signers.length > 0
                ? "pending"
                : "not-started",
          title: "Queued",
        },
        {
          type: "default",
          status: [TimelockTxStatus.Ready, TimelockTxStatus.Executed].includes(
            status
          )
            ? status === TimelockTxStatus.Executed || signers.length > 0
              ? "success"
              : "pending"
            : "not-started",
          title: `Confirmations (
                ${status === TimelockTxStatus.Ready ? signers.length : threshold} of ${threshold})`,
        },
        {
          type: "extention",
          status:
            [TimelockTxStatus.Ready, TimelockTxStatus.Executed].includes(
              status
            ) && signers.length > 0
              ? "success"
              : "not-started",
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
          status:
            [
              TimelockTxStatus.Stale,
              TimelockTxStatus.Canceled,
              TimelockTxStatus.Executed,
            ].includes(status) ||
            (status === TimelockTxStatus.Ready && signers.length > 0)
              ? status === TimelockTxStatus.Executed
                ? "success"
                : status === TimelockTxStatus.Stale ||
                    status === TimelockTxStatus.Canceled
                  ? "error"
                  : "pending"
              : "not-started",
          title:
            status === TimelockTxStatus.Stale
              ? "Skipped"
              : status === TimelockTxStatus.Canceled
                ? "Canceled"
                : "Executed",
        },
      ]}
    />
  );
}
