export default function SignalsPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">AI Signals</h2>
      <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
        <p className="text-zinc-500 text-sm">
          No AI signals generated yet. Signals will appear here once the signal worker is active.
        </p>
      </div>
    </div>
  );
}
