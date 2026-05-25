export function SignalBadge({ score, label }: { score: number; label?: string }) {
  const color =
    score <= 30
      ? "bg-green-900/50 text-green-400 border-green-800"
      : score <= 60
        ? "bg-yellow-900/50 text-yellow-400 border-yellow-800"
        : "bg-red-900/50 text-red-400 border-red-800";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border whitespace-nowrap max-w-full overflow-hidden text-ellipsis ${color}`}
    >
      {label && <span className="mr-1 truncate">{label}</span>}
      {score}
    </span>
  );
}
