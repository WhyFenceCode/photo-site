import * as p from '@clack/prompts';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { listCollections, mediaPath } from '../lib/staging.js';
import { KEY, validateCollection } from '../lib/validate.js';
import { assertKey, bucket, deleteKey, putFile, whoami } from '../lib/wrangler.js';
import { buildPlan, keysOf, localSizes, readOnlineKeys } from '../lib/plan.js';
import { formatBytes } from '../lib/sizes.js';
import { ROOT_DIR, site } from '../lib/config.js';
import { ask, pool } from '../lib/util.js';

const TYPES = { avif: 'image/avif', webp: 'image/webp' };
const IMMUTABLE = 'public, max-age=31536000, immutable';

export default async function publish(flags) {
  const dryRun = flags.has('--dry-run'), prune = flags.has('--prune'), yes = flags.has('--yes');
  p.intro(dryRun ? 'Publish (dry run — nothing will be uploaded)' : 'Publish');

  const collections = await listCollections();
  if (!collections.length) { p.log.error('Nothing to publish yet.'); return; }
  const errors = collections.flatMap((c) => validateCollection(c).map((e) => `${c.slug}: ${e}`));
  const featured = collections.filter((c) => c.featured).length;
  if (featured < 1 || featured > 3) errors.push(`Between 1 and 3 collections must be featured (currently ${featured}). Run: pnpm content feature`);
  if (errors.length) { p.log.error(errors.join('\n')); process.exit(1); }

  const keys = [...new Set(keysOf(collections))];
  keys.forEach(assertKey);
  bucket(); // fail early if media.bucket isn't set
  await whoami(); // fail early if not logged in

  const tmp = await mkdtemp(join(tmpdir(), 'gallery-publish-'));
  try {
    // Wrangler can't list a bucket, so "what is already online" = whatever the
    // last published catalog referenced. Files are content-hashed, so re-uploading is harmless.
    const sp = p.spinner(); sp.start('Reading the currently published catalog…');
    const online = await readOnlineKeys(tmp);
    const plan = buildPlan({ collections, online, sizeOf: await localSizes(keys) });
    if (plan.lost.length) { sp.stop('Problem'); p.log.error(`These files exist neither locally nor online (add the photo again?):\n${plan.lost.join('\n')}`); process.exit(1); }

    const catalogJson = JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), collections });
    const uploadBytes = plan.todoBytes + Buffer.byteLength(catalogJson);
    sp.stop(plan.todo.length
      ? `${plan.todo.length} new file(s) to upload (${formatBytes(uploadBytes)}), ${plan.keys.length - plan.todo.length} already online`
      : `No new image files, only the catalog to update (${formatBytes(uploadBytes)}). ${plan.keys.length} file(s) already online`);

    // Where the new bytes are coming from
    const pending = plan.perCollection.filter((c) => c.pendingFiles);
    if (pending.length) p.log.info(pending.map((c) => `${c.title}: ${c.pendingFiles} file(s), ${formatBytes(c.pendingBytes)}`).join('\n'));
    p.log.info(`Everything your drafts reference: ${plan.keys.length} files, ${formatBytes(plan.totalBytes)}${plan.missingLocally ? ` (${plan.missingLocally} not on this computer, not counted)` : ''}`);

    const orphans = prune ? plan.orphans.filter((k) => KEY.test(k)) : [];
    if (dryRun) { if (prune) p.log.info(`${orphans.length} unused file(s) would be deleted.`); p.outro('Dry run finished.'); return; }
    if (!yes && !(await ask(p.confirm({ message: `Upload ${plan.todo.length} file(s) (${formatBytes(uploadBytes)}) and publish the catalog to R2 bucket "${bucket()}"?` })))) { p.outro('Cancelled.'); return; }

    const up = p.spinner(); let done = 0; up.start(`Uploading 0/${plan.todo.length}…`);
    await pool(plan.todo, 3, async (key) => {
      await putFile(key, mediaPath(key), TYPES[key.split('.').pop()], IMMUTABLE);
      up.message(`Uploading ${++done}/${plan.todo.length}…`);
    });
    // The catalog goes last: the live site never points at files that aren't there yet.
    const catalogFile = join(tmp, 'catalog.json');
    await writeFile(catalogFile, catalogJson);
    await putFile('catalog.json', catalogFile, 'application/json; charset=utf-8', 'no-cache');
    up.stop(`Uploaded ${plan.todo.length} file(s) and the catalog (${formatBytes(uploadBytes)}).`);

    if (orphans.length && (yes || (await ask(p.confirm({ message: `Delete ${orphans.length} unused file(s) from the bucket?` }))))) {
      await pool(orphans, 3, (k) => deleteKey(k));
      p.log.success(`Deleted ${orphans.length} unused file(s).`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  const base = (site.media.baseUrl || '').replace(/\/+$/, '');
  p.log.info(base ? `Live catalog: ${base}/catalog.json` : 'Set media.baseUrl in application/site.config.mjs so the site can read this content.');
  p.log.info('To see how much is in the bucket in total, run: pnpm content size');
  if (!yes && base && (await ask(p.confirm({ message: 'Rebuild and deploy the website now?', initialValue: false })))) {
    spawnSync('pnpm', ['--filter', 'application', 'run', 'deploy:site'], { cwd: ROOT_DIR, stdio: 'inherit', shell: process.platform === 'win32' });
  }
  p.outro('Done. The site shows new content after its next build/deploy.');
}