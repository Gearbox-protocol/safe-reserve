import {
  CopyButton,
  ExternalButton,
  Skeleton,
} from "@gearbox-protocol/permissionless-ui";
import { GearboxSDK } from "@gearbox-protocol/sdk";
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
    <div className="grid grid-cols-[160px_auto] gap-2 items-center">
      <div className="text-muted-foreground">{title}:</div>

      <div className="flex items-center gap-2 text-sm font-mono">
        <div className="break-all">{address}</div>
        <CopyButton text={address} />
        {sdk.chain?.blockExplorers?.default.url && (
          <ExternalButton
            url={`${sdk.chain.blockExplorers?.default.url}/address/${address}`}
          />
        )}

        {description &&
          (isLoading ? (
            <Skeleton className="h-5 w-1/3" />
          ) : (
            <div className="break-all text-muted-foreground">{`[${description}]`}</div>
          ))}
      </div>
    </div>
  );
}
