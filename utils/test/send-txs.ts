import { SafeTx } from "@gearbox-protocol/permissionless";
import { RawTx } from "@gearbox-protocol/sdk";
import {
  Address,
  createWalletClient,
  http,
  parseEther,
  PublicClient,
  testActions,
  WalletClient,
} from "viem";

export async function sendTxs({
  walletClient,
  publicClient,
  account,
  txs,
}: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  account?: Address;
  txs: RawTx[] | SafeTx[];
}) {
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i];
    console.log(`\nTransaction ${i + 1}/${txs.length}`);
    console.log("----------------------------------------");

    console.log("----------------------------------------");

    // Log transaction details
    console.log(`To: ${tx.to}`);
    if (tx.contractMethod) {
      console.log(`Method: ${tx.contractMethod.name}`);
      if (tx.contractInputsValues) {
        console.log("Input Values:");
        Object.entries(tx.contractInputsValues).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    }

    console.log(`Value: ${tx.value || 0} wei`);

    try {
      console.log("\nSending transaction...");
      const hash = await walletClient.sendTransaction({
        account: account ?? null,
        to: tx.to as Address,
        value: BigInt(tx.value || 0),
        data: "callData" in tx ? tx.callData : tx.data,
        gas: BigInt(29_000_000),
        chain: walletClient.chain!,
      });
      console.log(`Transaction hash: ${hash}`);

      console.log("Waiting for confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`Confirmed in block ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed}`);
      console.log(
        `Status: ${receipt.status === "success" ? "Success" : "Failed"}`
      );
    } catch (error) {
      console.error("Error executing transaction:", error);
    }
  }
}

export async function impersonateAndSendTxs({
  rpc,
  publicClient,
  account,
  txs,
}: {
  rpc: string;
  publicClient: PublicClient;
  account: Address;
  txs: RawTx[] | SafeTx[];
}) {
  const client = publicClient.extend(testActions({ mode: "anvil" }));

  await client.setCode({
    address: account,
    bytecode: "0x",
  });

  await client.setBalance({
    address: account,
    value: parseEther("10"),
  });

  await client.impersonateAccount({
    address: account,
  });

  const chain = await client.getChainId();

  const walletClient = createWalletClient({
    account: account,
    chain: {
      id: chain,
      name: "Anvil",
      nativeCurrency: {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
      },
      rpcUrls: { default: { http: [rpc] } },
    },
    transport: http(rpc),
  });

  await sendTxs({
    walletClient,
    publicClient,
    account,
    txs,
  });
}
