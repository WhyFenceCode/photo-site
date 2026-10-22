import * as p from '@clack/prompts';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { listCollections, mediaPath } from '../lib/staging.js';
import { KEY, validateCollection } from '../lib/validate.js';
import { assertKey, bucket, deleteKey, getFile, putFile, whoami } from '../lib/wrangler.js';
import { ROOT_DIR, site } from '../lib/config.js';
import { ask, pool } from '../lib/util.js';

const TYPES = { avif: 'image/avif', webp: 'image/webp' };
const IMMUTABLE = 'public, max-age=31536000, immutable';
const keysOf = (collections) => collections.flatMap((c) => c.photos.flatMap((ph) => Object.values(ph.files ?? {}).flat().map((v) => v.path)));

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
    const prevFile = join(tmp, 'previous.json');
    let previous = [];
    if (await getFile('catalog.json', prevFile)) previous = keysOf(JSON.parse(await readFile(prevFile, 'utf8')).collections ?? []);
    const online = new Set(previous);
    const lost = keys.filter((k) => !online.has(k) && !existsSync(mediaPath(k)));
    if (lost.length) { sp.stop('Problem'); p.log.error(`These files exist neither locally nor online (add the photo again?):\n${lost.join('\n')}`); process.exit(1); }
    const todo = keys.filter((k) => !online.has(k));
    sp.stop(`${todo.length} new file(s) to upload, ${keys.length - todo.length} already online`);

    const orphans = prune ? previous.filter((k) => !keys.includes(k) && KEY.test(k)) : [];
    if (dryRun) { if (prune) p.log.info(`${orphans.length} unused file(s) would be deleted.`); p.outro('Dry run finished.'); return; }
    if (!yes && !(await ask(p.confirm({ message: `Upload ${todo.length} file(s) and publish the catalog to R2 bucket "${bucket()}"?` })))) { p.outro('Cancelled.'); return; }

    const up = p.spinner(); let done = 0; up.start(`Uploading 0/${todo.length}…`);
    await pool(todo, 3, async (key) => {
      await putFile(key, mediaPath(key), TYPES[key.split('.').pop()], IMMUTABLE);
      up.message(`Uploading ${++done}/${todo.length}…`);
    });
    // The catalog goes last: the live site never points at files that aren't there yet.
    const catalogFile = join(tmp, 'catalog.json');
    await writeFile(catalogFile, JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), collections }));
    await putFile('catalog.json', catalogFile, 'application/json; charset=utf-8', 'no-cache');
    up.stop('Uploaded.');

    if (orphans.length && (yes || (await ask(p.confirm({ message: `Delete ${orphans.length} unused file(s) from the bucket?` }))))) {
      await pool(orphans, 3, (k) => deleteKey(k));
      p.log.success(`Deleted ${orphans.length} unused file(s).`);
    }
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  const base = (site.media.baseUrl || '').replace(/\/+$/, '');
  p.log.info(base ? `Live catalog: ${base}/catalog.json` : 'Set media.baseUrl in application/site.config.mjs so the site can read this content.');
  if (!yes && base && (await ask(p.confirm({ message: 'Rebuild and deploy the website now?', initialValue: false })))) {
    spawnSync('pnpm', ['--filter', 'application', 'run', 'deploy:site'], { cwd: ROOT_DIR, stdio: 'inherit', shell: process.platform === 'win32' });
  }
  p.outro('Done. The site shows new content after its next build/deploy.');
}
