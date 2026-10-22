// Pure helpers for reporting sizes (no I/O).

const UNITS = ['B', 'kB', 'MB', 'GB', 'TB'];

/** Human-readable size using decimal units (1 MB = 1,000,000 bytes), the same convention Wrangler uses. */
export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1000) return `${Math.round(n)} B`;
  let i = Math.min(UNITS.length - 1, Math.floor(Math.log10(n) / 3));
  const round = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  let text = round(n / 1000 ** i);
  if (Number(text) >= 1000 && i < UNITS.length - 1) text = round(n / 1000 ** ++i); // 999,999 B → 1 MB, not 1000 kB
  if (text.includes('.')) text = text.replace(/\.?0+$/, ''); // 12.0 → 12, 1.50 → 1.5
  return `${text} ${UNITS[i]}`;
}

export const sumBytes = (keys, sizeOf) => keys.reduce((total, k) => total + (sizeOf.get(k) ?? 0), 0);

/**
 * Reads the object count and size out of `wrangler r2 bucket info` output.
 * Wrangler prints "label: value" lines; I couldn't confirm the exact labels, so this is
 * tolerant, and callers fall back to showing the raw text when nothing is recognised.
 */
export function parseBucketInfo(text) {
  const grab = (re) => text.match(re)?.[1]?.trim() ?? null;
  const objects = grab(/object[_ ]?count\s*[:=]\s*([^\n]+)/i);
  let size = grab(/(?:bucket|payload|total)[_ ]?size\s*[:=]\s*([^\n]+)/i);
  if (size && /^[\d,]+$/.test(size)) size = formatBytes(Number(size.replace(/,/g, '')));
  return { objects, size, recognised: Boolean(objects || size) };
}
