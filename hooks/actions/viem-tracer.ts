"use server";

import { Address, Hex, createPublicClient, http } from "viem";
import { traceCall } from "viem-tracer";
import { berachain } from "viem/chains";

export async function traceCallServer(to: Address, data: Hex) {
  const client = createPublicClient({
    chain: berachain,
    transport: http(),
  });
  console.log("client", client);
  console.log("to", to);
  console.log("data", data);
  try {
    const trace = await traceCall(client, { to, data });
    console.log("trace", trace);
    return trace;
  } catch (error) {
    console.error("error traceCallServer", error);
    return null;
  }
}
