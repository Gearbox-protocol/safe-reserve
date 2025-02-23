import { safeAbi } from "@/bindings/generated";
import { useEffect, useState } from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
export function useSafeParams(safeAddress: Address) {
  const [threshold, setThreshold] = useState<number>();
  const [signers, setSigners] = useState<Address[]>();
  const [nonce, setNonce] = useState<bigint>();
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchThreshold = async () => {
      if (!safeAddress || !publicClient) return;

      const [safeThreshold, safeSigners, safeNonce] = await Promise.all([
        publicClient.readContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "getThreshold",
        }),
        publicClient.readContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "getOwners",
        }),
        publicClient.readContract({
          address: safeAddress,
          abi: safeAbi,
          functionName: "nonce",
        }),
      ]);
      setThreshold(Number(safeThreshold));
      setSigners([...safeSigners]);
      setNonce(safeNonce);
    };

    // Only fetch once when component mounts and crossChainMultisig is available
    fetchThreshold();
  }, [safeAddress, publicClient]); // Only re-run if safeAddress or publicClient changes

  return { threshold, signers, nonce };
}
