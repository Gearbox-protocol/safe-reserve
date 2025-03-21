import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Address } from "viem";
import { NetworkType } from "../config/wagmi";

export function useGenerateReport(
  network: NetworkType,
  governor: Address,
  block: number
) {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      try {
        const report = await fetch(
          "https://anvil.gearbox.foundation/api/safe-report",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              network,
              governor: {
                address: governor,
                fromBlock: block.toString(),
                toBlock: block.toString(),
              },
            }),
          }
        ).then((res) => res.json());

        if (report.reportUrl) {
          return report.reportUrl;
        }

        throw new Error(report.error ?? "something went wrong");
      } catch (error) {
        console.error(error);
        toast.error("Tx report generation failed" + error);
        throw error;
      }
    },
  });

  return {
    generate: mutateAsync,
    isPending,
    error: null,
  };
}
