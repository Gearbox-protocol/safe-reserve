import { config } from "dotenv";
import { spawn } from "node:child_process";
import process from "node:process";
import { setTimeout as sleep } from "node:timers/promises";

config({ path: ".env.local" });

let anvilProc: ReturnType<typeof spawn> | null = null;

async function waitForHealthy(url: string, tries = 60): Promise<void> {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "web3_clientVersion",
          params: [],
        }),
      });
      if (res.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error("Anvil did not become healthy in time");
}

export default async function setup() {
  const rpc = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpc) {
    throw new Error("Set NEXT_PUBLIC_RPC_URL to a valid Ethereum RPC endpoint");
  }

  const anvilArgs = [
    "--port",
    String(8545),
    "--fork-url",
    rpc,
    "--silent",
    "--chain-id",
    String(1),
  ];

  anvilProc = spawn("anvil", anvilArgs, { stdio: "inherit" });

  const anvilRpc = process.env.ANVIL_RPC_URL || "http://127.0.0.1:8545";

  await waitForHealthy(anvilRpc);

  return async () => {
    if (anvilProc) {
      anvilProc.kill("SIGINT");
      anvilProc = null;
    }
  };
}

process.on("SIGINT", () => {
  if (anvilProc) anvilProc.kill("SIGINT");
  process.exit(130);
});
process.on("SIGTERM", () => {
  if (anvilProc) anvilProc.kill("SIGINT");
  process.exit(143);
});
process.on("exit", () => {
  if (anvilProc) anvilProc.kill("SIGINT");
});
process.on("uncaughtException", (err) => {
  if (anvilProc) anvilProc.kill("SIGINT");
  throw err;
});
