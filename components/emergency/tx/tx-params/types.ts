import { EmergencyTx } from "@/core/emergency-actions";
import { EmergencyAdminInfo } from "@/hooks";
import { GearboxSDK } from "@gearbox-protocol/sdk";

export interface EmergencyTxProps {
  chainId: number;
  sdk: GearboxSDK;
  emergencyTx: EmergencyTx;
  emergencyAdminInfo: EmergencyAdminInfo;
}
