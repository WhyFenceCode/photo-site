import * as p from '@clack/prompts';
import { bucket, bucketInfo, whoami } from '../lib/wrangler.js';
import { site, STAGING } from '../lib/config.js';

export default async function check() {
  p.intro('Checking your setup');
  p.log.info(`Local drafts folder: ${STAGING}`);
  try { p.note(await whoami(), 'Cloudflare login'); } catch (e) { p.log.error(e.message); }
  try { await bucketInfo(); p.log.success(`R2 bucket "${bucket()}" is reachable.`); }
  catch (e) { p.log.error(e.message); }
  const base = (site.media.baseUrl || '').replace(/\/+$/, '');
  if (!base) p.log.warn('media.baseUrl is empty in application/site.config.mjs (the site shows placeholder content).');
  else {
    try { const r = await fetch(`${base}/catalog.json`); p.log.info(`${base}/catalog.json → HTTP ${r.status}${r.status === 404 ? ' (normal before your first publish)' : ''}`); }
    catch (e) { p.log.error(`Could not reach ${base}: ${e.message}`); }
  }
  p.outro('Check finished.');
}
