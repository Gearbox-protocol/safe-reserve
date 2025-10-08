"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@gearbox-protocol/permissionless-ui";
import { Info, Play, Wallet } from "lucide-react";

export function TransactionInfoDialog({
  isConfirmButton,
  canSend,
}: {
  isConfirmButton: boolean;
  canSend?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2 text-gray-400 hover:text-white transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Info className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isConfirmButton ? "Confirm Transaction" : "Execute Transaction"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isConfirmButton ? (
            <>
              <p className="text-sm text-gray-300 mb-4">
                The Confirm button approves the transaction hash on-chain:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 mt-0.5">
                    <Wallet className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">
                      On-Chain Approval
                    </h4>
                    <p className="text-sm text-gray-400">
                      Approve the transaction hash on-chain to add your
                      signature
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400">
                  <strong>Note:</strong> This adds your approval to the Safe.
                  Once enough signers have confirmed, the transaction can be
                  executed.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-300 mb-4">
                {canSend
                  ? "The Execute button directly sends the transaction:"
                  : "The Execute button triggers a 2-step process:"}
              </p>

              <div className="space-y-3">
                {!canSend && (
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 mt-0.5">
                      <Wallet className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">
                        1. Off-Chain Signature
                      </h4>
                      <p className="text-sm text-gray-400">
                        Sign the transaction hash off-chain in your wallet
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 mt-0.5">
                    <Play className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">
                      {canSend
                        ? "Multicall3 Execution"
                        : "2. Multicall3 Execution"}
                    </h4>
                    <p className="text-sm text-gray-400">
                      Send a single Multicall3 transaction that pulls price
                      updates and executes the Safe batch
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400">
                  <strong>Note:</strong>{" "}
                  {canSend
                    ? "Enough signatures have been collected. This directly executes with the most current price data."
                    : "This ensures your transaction executes with the most current price data, preventing potential issues with outdated feeds."}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
