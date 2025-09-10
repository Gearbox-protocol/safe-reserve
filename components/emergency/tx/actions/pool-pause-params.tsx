import { PoolPauseAction } from "@/core/emergency-actions/pool/pool-pause";

export function PoolPauseParams({ action }: { action: PoolPauseAction }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">pool</div>
        <div className="break-all font-mono">{action.params.pool}</div>
      </div>
    </div>
  );
}
