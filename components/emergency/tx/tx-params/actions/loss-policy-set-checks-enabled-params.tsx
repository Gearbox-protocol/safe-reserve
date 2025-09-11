import { SetChecksEnabledAction } from "@/core/emergency-actions";

export function SetChecksEnabledParamsView({
  action,
}: {
  action: SetChecksEnabledAction;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">pool</div>
        <div className="break-all font-mono">{action.params.pool}</div>
      </div>
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">enabled</div>
        <div className="break-all font-mono">
          {action.params.enabled ? "True" : "False"}
        </div>
      </div>
    </div>
  );
}
