import { PriceFeed } from "@gearbox-protocol/permissionless";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gearbox-protocol/permissionless-ui";
import Link from "next/link";
import { useState } from "react";
import { Address } from "viem";
import { MarketProps } from "./types";

interface PricefeedSelectorProps extends MarketProps {
  asset: Address;
  title: string;
  initialPriceFeed: Address;
  onClose: () => void;
  approvedPriceFeeds: PriceFeed[];
}

export const PricefeedSelector = ({
  chainId,
  marketConfigurator,
  market,
  asset,
  title,
  initialPriceFeed,
  onClose,
  approvedPriceFeeds,
}: PricefeedSelectorProps) => {
  const [selectedPriceFeed, setSelectedPriceFeed] =
    useState<Address>(initialPriceFeed);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#141414] p-8 rounded-lg w-full max-w-4xl min-h-[300px] flex flex-col justify-between">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Price Feed</Label>
            <Select
              value={selectedPriceFeed}
              onValueChange={(value) => {
                setSelectedPriceFeed(value as Address);
              }}
            >
              <SelectTrigger id="pricefeed">
                <SelectValue placeholder="Select a price feed" />
              </SelectTrigger>
              <SelectContent>
                {approvedPriceFeeds.map((pf) => (
                  <SelectItem key={pf.address} value={pf.address}>
                    {`${pf.name} [${pf.address}]`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="w-full mt-8">
          <div className="flex items-center w-full justify-end">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-transparent border border-gray-500 text-gray-300 hover:bg-gray-800 px-6 py-2"
              >
                Cancel
              </Button>
              {selectedPriceFeed ===
                "0x0000000000000000000000000000000000000000" ||
              selectedPriceFeed.toLowerCase() ===
                initialPriceFeed.toLowerCase() ? (
                <Button disabled variant="pink">
                  Set price feed
                </Button>
              ) : (
                <Link
                  key={`${chainId}-${marketConfigurator}-setPriceFeed`}
                  href={{
                    pathname: "/emergency/tx",
                    query: {
                      chainId: chainId,
                      mc: marketConfigurator,
                      action: "ORACLE::setPriceFeed",
                      params: JSON.stringify({
                        pool: market.pool.pool.address,
                        priceFeed: selectedPriceFeed,
                        token: asset,
                      }),
                    },
                  }}
                >
                  <Button variant={"pink"}>Set price feed</Button>
                </Link>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
