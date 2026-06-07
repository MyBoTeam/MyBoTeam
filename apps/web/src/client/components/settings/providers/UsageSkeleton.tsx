export function UsageSkeleton() {
  return (
    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-24 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
      <div className="h-3 w-32 rounded-full bg-muted animate-pulse" />
    </div>
  );
}
