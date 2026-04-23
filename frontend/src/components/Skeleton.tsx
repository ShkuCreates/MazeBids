export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/5 ${className || ''}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}
