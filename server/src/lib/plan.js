// What a publish would do. `buildPlan` is pure; `localSizes` / `readOnlineKeys` do the I/O.
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { mediaPath } from './staging.js';
import { getFile } from './wrangler.js';
import { sumBytes } from './sizes.js';

export const keysOfPhoto = (photo) => Object.values(photo.files ?? {}).flat().map((v) => v.path);
export const keysOf = (collections) => collections.flatMap((c) => c.photos.flatMap(keysOfPhoto));

/** Sizes in bytes of the files that exist in local drafts, as a Map of key → bytes. */
export async function localSizes(keys) {
  const entries = await Promise.all(
    keys.filter((k) => existsSync(mediaPath(k))).map(async (k) => [k, (await stat(mediaPath(k))).size]),
  );
  return new Map(entries);
}

/** The files the last published catalog referenced (Wrangler can't list a bucket). Empty if nothing is published yet. */
export async function readOnlineKeys(tmpDir) {
  const file = join(tmpDir, 'previous.json');
  if (!(await getFile('catalog.json', file))) return [];
  return keysOf(JSON.parse(await readFile(file, 'utf8')).collections ?? []);
}

/**
 * @param collections  drafts to publish
 * @param online       keys the live catalog already references
 * @param sizeOf       Map of key → bytes for files present locally
 */
export function buildPlan({ collections, online, sizeOf }) {
  const onlineSet = new Set(online);
  const keys = [...new Set(keysOf(collections))];
  const todo = keys.filter((k) => !onlineSet.has(k));
  const lost = todo.filter((k) => !sizeOf.has(k)); // not online and not on this computer
  const perCollection = collections.map((c) => {
    const own = [...new Set(c.photos.flatMap(keysOfPhoto))];
    const pending = own.filter((k) => !onlineSet.has(k));
    return {
      slug: c.slug, title: c.title, photos: c.photos.length,
      files: own.length, bytes: sumBytes(own, sizeOf),
      pendingFiles: pending.length, pendingBytes: sumBytes(pending, sizeOf),
    };
  });
  return {
    keys, todo, lost,
    todoBytes: sumBytes(todo, sizeOf),
    totalBytes: sumBytes(keys, sizeOf),
    missingLocally: keys.filter((k) => !sizeOf.has(k)).length,
    orphans: [...onlineSet].filter((k) => !keys.includes(k)),
    perCollection,
  };
}
