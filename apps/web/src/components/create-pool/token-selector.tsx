"use client";

import { TOKENS } from "@/lib/contracts";
import { useTranslation } from "@/i18n";

interface Props {
  label: string;
  value: string;
  onChange: (address: string) => void;
  exclude?: string;
}

export function TokenSelector({ label, value, onChange, exclude }: Props) {
  const { t } = useTranslation();
  const available = exclude
    ? TOKENS.filter((tk) => tk.address.toLowerCase() !== exclude.toLowerCase())
    : TOKENS;

  const selected = TOKENS.find((tk) => tk.address === value);

  return (
    <div>
      <label className="block text-xs text-zinc-500 uppercase mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 focus:outline-none focus:border-indigo-600 transition-colors"
      >
        <option value="">{t("createPool.selectToken")}</option>
        {available.map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol} ({token.address.slice(0, 6)}...{token.address.slice(-4)})
          </option>
        ))}
      </select>
      {selected && (
        <p className="text-xs text-zinc-600 mt-1 font-mono truncate">{selected.address}</p>
      )}
    </div>
  );
}
