export default function DashboardLoading() {
  return (
    <div className="px-4 py-8 sm:px-8 max-w-[960px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-2.5 w-32 bg-fg-muted rounded-sm mb-2 opacity-30" />
        <div className="h-6 w-64 bg-fg-muted rounded-sm opacity-30" />
      </div>
      {/* Agent card skeleton */}
      <div className="bg-bg-surface border border-border rounded-sm p-5 mb-5">
        <div className="h-6 w-40 bg-fg-muted rounded-sm mb-4 opacity-30" />
        <div className="h-3 w-full bg-fg-muted rounded-sm opacity-20" />
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-bg-surface border border-border rounded-sm p-4">
            <div className="h-2 w-16 bg-fg-muted rounded-sm mb-3 opacity-30" />
            <div className="h-5 w-20 bg-fg-muted rounded-sm opacity-30" />
          </div>
        ))}
      </div>
    </div>
  );
}
