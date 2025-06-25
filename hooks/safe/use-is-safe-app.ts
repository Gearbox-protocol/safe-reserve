import { Address } from "viem";
import { useAccount } from "wagmi";

export function useIsSafeApp(safeAddress: Address) {
  const { address } = useAccount();

  return safeAddress?.toLowerCase() === address?.toLowerCase();
}
