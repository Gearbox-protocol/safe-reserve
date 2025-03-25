import { Address, Hex } from "viem";
import { TimelockTxStatus } from "../utils/tx-status";

export enum Operation {
  Call = 0,
  DelegateCall = 1,
}

export interface SafeTx {
  to: Address;
  value: bigint;
  data: Hex;
  operation: Operation;
  safeTxGas: bigint;
  baseGas: bigint;
  gasPrice: bigint;
  gasToken: Address;
  refundReceiver: Address;
  nonce: bigint;
  hash: Hex;
  signedBy: Address[];
  calls: Call[];
}

export interface ParsedSafeTx extends SafeTx {
  queueBlock: number;
  status: TimelockTxStatus;
  fetchStatus: () => Promise<unknown>;
  eta?: number;
}

export interface Call {
  to: Address;
  value: bigint;
  data: Hex;
  functionName: string;
  functionArgs: unknown[];

  parsedFunctionName?: string;
  parsedFunctionArgs: string[];
}
