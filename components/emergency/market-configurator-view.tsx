"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { chains } from "@/config/wagmi";
import { useGetMarketConfiguratorInfo } from "@/hooks";
import { shortenHash } from "@/utils/format";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";
import { PageLayout } from "../ui/page";

export function MarketConfiguratorView({
  chainId,
  address,
  onClickBack,
}: {
  chainId: number;
  address: Address;
  onClickBack: () => void;
}) {
  const {
    data: mcInfo,
    isLoading: isLoadingInfo,
    error,
  } = useGetMarketConfiguratorInfo({
    chainId,
    address,
  });
  const chain = chains.find(({ id }) => id === chainId);

  return (
    <PageLayout
      title={"Emergency admin"}
      backButton={{
        href: "/emergency",
        text: "Back to market configurators",
        onClick: onClickBack,
      }}
    >
      <div className="space-y-6 overflow-y-auto">
        {isLoadingInfo ? (
          <div className="divide-y divide-gray-800 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="h-6 w-1/3 bg-gray-800 rounded mb-4" />
                <div className="h-4 w-1/2 bg-gray-800 rounded mb-2" />
                <div className="h-4 w-1/4 bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        ) : !!error ? (
          <div className="p-4">
            <text className="font-semibold text-white">
              Invalid market cofigurator: {error.message}
            </text>
          </div>
        ) : (
          <Card className="p-4">
            <div>
              <CardTitle className="truncate text-base font-medium">
                {mcInfo?.curatorName || ""}
              </CardTitle>
              <div className="flex items-center gap-2 text-gray-100">
                <div className="text-sm text-muted-foreground break-all">
                  {chain?.name ?? chainId} • {shortenHash(address)}
                </div>

                <button
                  className="text-gray-400 hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(address);
                    toast.success("Address copied to clipboard");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}
