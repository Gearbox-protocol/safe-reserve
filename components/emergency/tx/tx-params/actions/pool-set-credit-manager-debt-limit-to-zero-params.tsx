import { SetCreditManagerDebtLimitToZeroAction } from "@/core/emergency-actions";

export function SetCreditManagerDebtLimitToZeroParamsView({
  action,
}: {
  action: SetCreditManagerDebtLimitToZeroAction;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">pool</div>
        <div className="break-all font-mono">{action.params.pool}</div>
      </div>
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">creditManager</div>
        <div className="break-all font-mono">{action.params.creditManager}</div>
      </div>
    </div>
  );
}
