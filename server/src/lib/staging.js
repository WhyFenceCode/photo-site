import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { STAGING } from './config.js';

export const mediaPath = (key) => join(STAGING, 'media', key);
const dirOf = (slug) => join(STAGING, 'collections', slug);

export async function listCollections() {
  let entries;
  try { entries = await readdir(join(STAGING, 'collections'), { withFileTypes: true }); } catch { return []; }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    try { out.push(JSON.parse(await readFile(join(dirOf(e.name), 'collection.json'), 'utf8'))); } catch { /* skip */ }
  }
  return out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function saveCollection(c) {
  await mkdir(dirOf(c.slug), { recursive: true });
  await writeFile(join(dirOf(c.slug), 'collection.json'), JSON.stringify(c, null, 2) + '\n');
}

export const deletePhotoFiles = (slug, id) =>
  rm(join(STAGING, 'media', 'photos', slug, id), { recursive: true, force: true });
