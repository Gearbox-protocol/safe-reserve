import { ForbidAdapterAction } from "@/core/emergency-actions";

export function ForbidAdapterParamsView({
  action,
}: {
  action: ForbidAdapterAction;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">creditManager</div>
        <div className="break-all font-mono">{action.params.creditManager}</div>
      </div>
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">adapter</div>
        <div className="break-all font-mono">{action.params.adapter}</div>
      </div>
    </div>
  );
}
