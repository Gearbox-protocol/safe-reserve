import { EmergencyTx } from "@/core/emergency-actions";
import { AdminInfo } from "@/hooks";
import { GearboxSDK } from "@gearbox-protocol/sdk";

export interface EmergencyTxProps {
  chainId: number;
  sdk: GearboxSDK;
  emergencyTx: EmergencyTx;
  adminInfo: AdminInfo;
}
