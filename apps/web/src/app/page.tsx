export default function DashboardPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Signals" value="0" />
        <StatCard title="Hook Pools" value="0" />
        <StatCard title="Risk Level" value="Low" />
        <StatCard title="Strategies" value="0" />
      </div>
      <div className="mt-8 p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
        <h3 className="text-lg font-semibold mb-2">Welcome to Aurex</h3>
        <p className="text-zinc-400 text-sm">
          AI-native onchain trading operating system powered by Uniswap V4 Hooks on X Layer.
          Connect your wallet to get started.
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
