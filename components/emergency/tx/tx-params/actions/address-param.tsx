import { Button } from "@/components/ui/button";
import { GearboxSDK } from "@gearbox-protocol/sdk";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Address } from "viem";

export function AddressParamsView({
  sdk,
  address,
  title,
  description,
  isLoading,
}: {
  sdk: GearboxSDK;
  address: Address;
  title: string;
  description?: string;
  isLoading?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_auto] gap-2 font-mono">
      <div className="text-gray-400 font-semibold">{title}:</div>

      <div className="flex gap-2 text-gray-100">
        <div className="break-all">{address}</div>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-white p-0 h-auto"
          onClick={() => {
            navigator.clipboard.writeText(address);
            toast.success("Address copied to clipboard");
          }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>

        {sdk.provider.chain?.blockExplorers?.default.url && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-white p-0 h-auto"
            onClick={() =>
              window.open(
                `${sdk.provider.chain.blockExplorers?.default.url}/address/${address}`,
                "_blank"
              )
            }
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}

        {description &&
          (isLoading ? (
            <div className="h-5 w-1/3 bg-muted rounded animate-pulse" />
          ) : (
            <div className="break-all font-mono">{`[${description}]`}</div>
          ))}
      </div>
    </div>
  );
}
