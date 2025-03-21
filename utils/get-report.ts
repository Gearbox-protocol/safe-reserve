import { Address } from "viem";
import { NetworkType } from "../config/wagmi";

export function getReportRef({
  network,
  governor,
  fromBlock,
  toBlock,
}: {
  network: NetworkType;
  governor: Address;
  fromBlock: number;
  toBlock: number;
}) {
  return `https://anvil.gearbox.foundation/governor/${network.toLowerCase()}${governor}/report?fromBlock=${fromBlock}&toBlock=${toBlock}`;
}
