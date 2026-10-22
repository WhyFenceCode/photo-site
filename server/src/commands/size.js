import * as p from '@clack/prompts';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listCollections } from '../lib/staging.js';
import { bucket, bucketInfo, whoami } from '../lib/wrangler.js';
import { buildPlan, keysOf, localSizes, readOnlineKeys } from '../lib/plan.js';
import { formatBytes, parseBucketInfo } from '../lib/sizes.js';

const table = (rows) => {
  const widths = rows[0].map((_, c) => Math.max(...rows.map((r) => String(r[c]).length)));
  return rows.map((r) => r.map((cell, c) => (c === 0 ? String(cell).padEnd(widths[c]) : String(cell).padStart(widths[c]))).join('   ')).join('\n');
};

export default async function size() {
  p.intro('Sizes');
  const collections = await listCollections();
  if (!collections.length) { p.log.info('No collections yet. Run: pnpm content new-collection'); return; }

  // Cloudflare is optional here: without a login you still get the local numbers.
  let online = null; // null = couldn't read the published catalog
  let info = null;
  let cloudProblem = null;
  const tmp = await mkdtemp(join(tmpdir(), 'gallery-size-'));
  try {
    try { bucket(); await whoami(); } catch (e) { cloudProblem = e.message; }
    if (!cloudProblem) {
      try { online = await readOnlineKeys(tmp); } catch (e) { cloudProblem = e.message; }
      try { info = await bucketInfo(); } catch (e) { cloudProblem ??= e.message; }
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  const keys = [...new Set(keysOf(collections))];
  const plan = buildPlan({ collections, online: online ?? [], sizeOf: await localSizes(keys) });

  const head = ['Collection', 'Photos', 'Size', ...(online ? ['Not yet published'] : [])];
  const rows = plan.perCollection.map((c) => [c.title, c.photos, formatBytes(c.bytes), ...(online ? [c.pendingFiles ? formatBytes(c.pendingBytes) : '—'] : [])]);
  p.note(table([head, ...rows]), 'Your photos (the AVIF + WebP files made for the web)');

  p.log.info(`All files in your drafts: ${plan.keys.length} files, ${formatBytes(plan.totalBytes)}`);
  if (plan.missingLocally) p.log.warn(`${plan.missingLocally} file(s) aren't on this computer, so they aren't counted. They are probably already online.`);
  if (online) {
    if (plan.lost.length) p.log.warn(`${plan.lost.length} file(s) are neither online nor on this computer. Add those photos again before publishing.`);
    p.log.info(plan.todo.length
      ? `The next publish would upload ${plan.todo.length} file(s), ${formatBytes(plan.todoBytes)}.`
      : 'Nothing new to upload. The next publish would only update the catalog.');
  }

  if (info) {
    const parsed = parseBucketInfo(info);
    p.note(
      parsed.recognised ? [`Objects:    ${parsed.objects ?? '—'}`, `Total size: ${parsed.size ?? '—'}`].join('\n') : info,
      `In the R2 bucket "${bucket()}" (as reported by Cloudflare)`,
    );
    p.log.info('If the bucket is much bigger than your drafts, files from removed photos may be left over. Remove them with: pnpm content publish --prune');
  }
  if (cloudProblem) p.log.warn(`Couldn't read Cloudflare (${cloudProblem.split('\n')[0]}). Showing what's on this computer only.`);
  p.outro('Done.');
}
