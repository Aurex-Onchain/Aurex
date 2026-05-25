export function StatCard({
  title,
  value,
  subtitle,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{title}</p>
      {loading ? (
        <div className="h-8 mt-1 w-16 rounded bg-zinc-800 animate-pulse" />
      ) : (
        <p className="text-2xl font-bold mt-1">{value}</p>
      )}
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  );
}
