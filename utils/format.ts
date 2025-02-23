export function formatTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function shortenHash(hash: string, chars: number = 4): string {
  if (!hash) return "";
  const start = hash.slice(0, chars + 2); // +2 for '0x' prefix
  const end = hash.slice(-chars);
  return `${start}...${end}`;
}

export function convertPercent(percent: number) {
  return Math.floor(percent * 100);
}
