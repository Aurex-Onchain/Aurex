export function addressToColors(address: string): [string, string] {
  const hex = address.slice(2, 14);
  const h1 = parseInt(hex.slice(0, 4), 16) % 360;
  const h2 = parseInt(hex.slice(4, 8), 16) % 360;
  const s1 = 50 + (parseInt(hex.slice(8, 10), 16) % 30);
  const s2 = 50 + (parseInt(hex.slice(10, 12), 16) % 30);
  return [`hsl(${h1}, ${s1}%, 55%)`, `hsl(${h2}, ${s2}%, 45%)`];
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
}
