import { SetPriceFeedAction } from "@/core/emergency-actions/oracle/oracle-set-price-feed";

export function SetPriceFeedParamsView({
  action,
}: {
  action: SetPriceFeedAction;
}) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">pool</div>
        <div className="break-all font-mono">{action.params.pool}</div>
      </div>
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">token</div>
        <div className="break-all font-mono">{action.params.token}</div>
      </div>
      <div className="grid grid-cols-[140px_auto] gap-2 text-gray-300">
        <div className="text-gray-400">priceFeed</div>
        <div className="break-all font-mono">{action.params.priceFeed}</div>
      </div>
    </div>
  );
}
