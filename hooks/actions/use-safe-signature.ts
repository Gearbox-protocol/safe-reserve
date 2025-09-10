import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { Address, Hex } from "viem";
import { toast } from "sonner";
import { defaultChainId } from "@/config/wagmi";

/**
 * Processes a raw signature to handle different v values according to Safe contract requirements
 * https://github.com/safe-global/safe-smart-account/blob/main/contracts/Safe.sol#L353
 */
export function processSignature(signature: string): string {
  if (signature.length < 2) return signature;

  const lastByte = signature.slice(-2).toLowerCase();
  let newLastByte = lastByte;
  
  // Convert v value: 0 -> 27 (0x1b), 1 -> 28 (0x1c)
  if (lastByte === "00" || lastByte === "1b") {
    newLastByte = "1f"; // 0 -> 31
  } else if (lastByte === "01" || lastByte === "1c") {
    newLastByte = "20"; // 1 -> 32
  }
  
  return signature.slice(0, -2) + newLastByte;
}

interface SafeSignatureCache {
  [txHash: string]: {
    [signerAddress: string]: {
      signature: string;
      processedSignature: string;
      timestamp: number;
    };
  };
}

const SAFE_SIGNATURE_CACHE_KEY = "safe-signature-cache";

/**
 * Hook for managing Safe transaction signature caching with TanStack Query
 * Caches signatures by tx hash and signer address to avoid repeated signing
 */
export function useSafeSignature(txHash: Hex) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  // Query to get cached signatures (in-memory only for current session)
  const { data: signatureCache = {} } = useQuery<SafeSignatureCache>({
    queryKey: [SAFE_SIGNATURE_CACHE_KEY],
    queryFn: () => ({}), // Start with empty cache
    staleTime: Infinity, // Signatures don't expire during session
    gcTime: 10 * 60 * 1000, // Keep in memory for 10 minutes only
  });

  // Get cached signature for current user and tx
  const cachedSignature = address ? signatureCache[txHash]?.[address] || null : null;
  const isAlreadySigned = cachedSignature !== null;

  // Mutation to sign and cache a signature
  const signMutation = useMutation({
    mutationFn: async () => {
      if (!walletClient || !address) {
        throw new Error("Wallet not connected");
      }

      // Return cached signature if available
      if (cachedSignature) {
        console.log("Using cached signature for tx:", txHash);
        return cachedSignature;
      }

      // await switchChainAsync({
      //   chainId: defaultChainId,
      // });

      console.log("Signing new message for tx:", txHash);
      const signature = await walletClient.signMessage({
        message: { raw: txHash },
      });

      const processedSignature = processSignature(signature);
      
      const signatureData = {
        signature,
        processedSignature,
        timestamp: Date.now(),
      };

      // Update cache
      const newCache = {
        ...signatureCache,
        [txHash]: {
          ...signatureCache[txHash],
          [address]: signatureData,
        },
      };

      // Update query cache (in-memory only)
      queryClient.setQueryData([SAFE_SIGNATURE_CACHE_KEY], newCache);

      return signatureData;
    },
    onError: (error) => {
      console.error("Signature failed:", error);
      toast.error("Failed to sign message");
    },
  });

  return {
    // The processed signature ready for use
    processedSignature: cachedSignature?.processedSignature || null,
    
    // Raw signature
    signature: cachedSignature?.signature || null,
    
    // Whether user has already signed this tx
    isAlreadySigned,
    
    // Function to sign (will use cache if available)
    signTransaction: signMutation.mutateAsync,
    
    // Loading state
    isSigningPending: signMutation.isPending,
  };
}
