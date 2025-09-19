import { Address } from "viem";

export interface TransactionCardProps {
  cid: string;
  chainId: number;
  safeAddress: Address;
  threshold: number;
  index: number;
}
