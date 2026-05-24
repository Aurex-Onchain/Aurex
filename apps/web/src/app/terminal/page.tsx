export default function TerminalPage() {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Trading Terminal</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">Token Analysis</h3>
          <p className="text-zinc-500 text-sm">Select a token to analyze risk and generate strategies.</p>
        </div>
        <div className="p-6 rounded-lg border border-zinc-800 bg-zinc-900/50">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase mb-4">Swap</h3>
          <p className="text-zinc-500 text-sm">Connect wallet to prepare a swap through Aurex Hook.</p>
        </div>
      </div>
    </div>
  );
}
