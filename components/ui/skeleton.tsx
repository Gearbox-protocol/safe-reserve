import { Skeleton } from "@gearbox-protocol/permissionless-ui";

function SkeletonStack() {
  return (
    <div className="animate-pulse">
      <Skeleton className="h-6 w-1/3 mb-4" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}
function SkeletonStacks() {
  return (
    <div className="divide-y divide-muted space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4">
          <SkeletonStack />
        </div>
      ))}
    </div>
  );
}

export { SkeletonStack, SkeletonStacks };
