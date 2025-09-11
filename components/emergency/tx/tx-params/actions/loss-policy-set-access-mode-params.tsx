import { AccessMode, SetAccessModeAction } from "@/core/emergency-actions";

export function SetAccessModeParamsView({
  action,
}: {
  action: SetAccessModeAction;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">pool</div>
        <div className="break-all font-mono">{action.params.pool}</div>
      </div>
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">mode</div>
        <div className="break-all font-mono">
          {AccessMode[action.params.mode]}
        </div>
      </div>
    </div>
  );
}
