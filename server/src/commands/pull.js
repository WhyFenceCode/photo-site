import * as p from '@clack/prompts';
import { listCollections, saveCollection } from '../lib/staging.js';
import { SLUG } from '../lib/validate.js';
import { site } from '../lib/config.js';
import { ask } from '../lib/util.js';

// Download published metadata into local staging (new computer, lost drafts…).
export default async function pull() {
  p.intro('Pull published metadata');
  const base = (site.media.baseUrl || '').replace(/\/+$/, '');
  if (!base) { p.log.error('Set media.baseUrl in application/site.config.mjs first.'); return; }
  const res = await fetch(`${base}/catalog.json`);
  if (!res.ok) { p.log.error(`Could not fetch ${base}/catalog.json (HTTP ${res.status})`); return; }
  const data = await res.json();
  const local = new Set((await listCollections()).map((c) => c.slug));
  let n = 0;
  for (const c of data.collections ?? []) {
    if (!SLUG.test(c.slug ?? '')) { p.log.warn(`Skipped a collection with an unsafe slug.`); continue; }
    if (local.has(c.slug) && !(await ask(p.confirm({ message: `"${c.slug}" exists locally. Overwrite it with the published version?`, initialValue: false })))) continue;
    await saveCollection(c); n++;
  }
  p.outro(`Pulled ${n} collection(s). Image files stay online; they're not downloaded.`);
}
