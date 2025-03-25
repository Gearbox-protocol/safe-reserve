import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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

export function formatTimeRemaining(eta?: number): string {
  if (!eta) return "0 minutes";

  const now = Math.floor(Date.now() / 1000);
  const remaining = eta - now;

  if (remaining <= 0) return "0 minutes";

  return dayjs.unix(eta).fromNow();
}
