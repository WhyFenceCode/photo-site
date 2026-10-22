import * as p from '@clack/prompts';
import { homedir } from 'node:os';

export async function ask(prompt) {
  const v = await prompt;
  if (p.isCancel(v)) { p.cancel('Cancelled — nothing was changed.'); process.exit(0); }
  return v;
}

export async function pool(items, size, fn) {
  const out = []; let next = 0;
  const worker = async () => { while (next < items.length) { const k = next++; out[k] = await fn(items[k], k); } };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

// Accepts drag-and-dropped paths: quotes, "\ " escapes and ~.
export const cleanPath = (s) =>
  s.trim().replace(/^(['"])(.*)\1$/, '$2').replace(/\\ /g, ' ').replace(/^~(?=\/|$)/, homedir());

export const required = (label) => (v) => (v && v.trim() ? undefined : `${label} is required`);
export const clean = (v) => (typeof v === 'string' ? v.trim() : '');
