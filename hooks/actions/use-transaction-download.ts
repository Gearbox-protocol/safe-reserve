import {
  convertRawTxToSafeMultisigTx,
  getSafeBatch,
} from "@gearbox-protocol/sdk/permissionless";
import { json_stringify, RawTx } from "@gearbox-protocol/sdk";
import { toast } from "sonner";
import { Address } from "viem";

export function useTransactionDownload() {
  const downloadTransaction = async ({
    chainId,
    safeAddress,
    txs,
    name,
  }: {
    chainId: number;
    safeAddress: Address;
    txs: RawTx[];
    name: string;
  }) => {
    const safeTxs = txs.map((tx) => convertRawTxToSafeMultisigTx(tx));
    const batch = getSafeBatch({
      chainId,
      safeAddress,
      name,
      txs: safeTxs,
    });

    try {
      const blob = new Blob([json_stringify(batch)], {
        type: "application/json",
      });
      const fileName = `${name}-tx.json`;

      // Try to use the modern showSaveFilePicker API first
      if ("showSaveFilePicker" in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: "JSON files",
                accept: {
                  "application/json": [".json"],
                },
              },
            ],
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          // User cancelled or API not available, fall back to link method
          downloadWithLink(blob, fileName);
        }
      } else {
        // Fallback for browsers without File System Access API
        downloadWithLink(blob, fileName);
      }

      function downloadWithLink(blob: Blob, fileName: string) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;

        // Create and trigger download safely
        document.body.appendChild(link);
        requestAnimationFrame(() => {
          link.click();
          requestAnimationFrame(() => {
            if (link.parentNode) {
              link.parentNode.removeChild(link);
            }
            URL.revokeObjectURL(url);
          });
        });
      }

      toast.success("Transaction downloaded successfully");
      return true;
    } catch (error) {
      toast.error("Failed to create transaction");
      console.error("Error:", error);
      return false;
    }
  };

  return { downloadTransaction };
}
