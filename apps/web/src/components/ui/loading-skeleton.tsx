const WIDTHS = [92, 88, 95, 85, 90, 97, 86, 93];

export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded bg-zinc-800 animate-pulse"
          style={{ width: `${WIDTHS[i % WIDTHS.length]}%` }}
        />
      ))}
    </div>
  );
}
