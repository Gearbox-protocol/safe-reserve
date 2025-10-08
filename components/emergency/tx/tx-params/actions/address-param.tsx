import {
  CopyButton,
  ExternalButton,
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
    <div className="grid grid-cols-[140px_auto] gap-2 font-mono">
      <div className="text-gray-400 font-semibold">{title}:</div>

      <div className="flex gap-2 text-gray-100">
        <div className="break-all">{address}</div>
        <CopyButton text={address} size="3.5" />
        {sdk.provider.chain?.blockExplorers?.default.url && (
          <ExternalButton
            url={`${sdk.provider.chain.blockExplorers?.default.url}/address/${address}`}
            size="3.5"
          />
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
