import { Address, encodeFunctionData, Hex, multicall3Abi } from "viem";

export function getMulticall3Params(multicall3Address: Address, calls: {
  to: Address;
  callData: Hex;
}[]) {
    const multicallCalls = calls.map((tx) => ({
        target: tx.to as `0x${string}`,
        allowFailure: false,
        callData: tx.callData,
      }));

//   const encodedCallsData = encodeFunctionData({
//     abi: multicall3Abi,
//     functionName: "aggregate3",
//     args: [multicallCalls],
//   });

  return {
    address: multicall3Address,
    abi: multicall3Abi,
    functionName: "aggregate3",
    args: [multicallCalls],
  } as const;
}