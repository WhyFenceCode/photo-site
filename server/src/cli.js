#!/usr/bin/env node
import './lib/config.js';

const HELP = `
Content tool — build web-ready photos + metadata and publish them to Cloudflare R2.

  pnpm content new-collection     Create a collection (guided questions)
  pnpm content add-photo          Add one photo or a folder (per-photo film, camera, alt text…)
  pnpm content list               Show collections and what's featured
  pnpm content feature            Choose which 1–3 collections appear on the home page
  pnpm content edit-photo         Change a photo's alt text, title, film, camera, lens, date, location…
  pnpm content reorder            Change the order of the photos in a collection
  pnpm content cover              Choose a collection's cover photo
  pnpm content remove-photo       Remove a photo from a collection
  pnpm content size               Show how big your photos are and how much is in the bucket
  pnpm content publish            Upload new files, then the catalog   [--dry-run] [--prune] [--yes]
                                  (shows how much will be uploaded)
  pnpm content pull               Download published metadata into local drafts
  pnpm content login              Log in to Cloudflare through Wrangler (once)
  pnpm content check              Test your login, bucket and settings
`;

const commands = {
  'new-collection': () => import('./commands/new-collection.js'),
  'add-photo': () => import('./commands/add-photo.js'),
  list: () => import('./commands/list.js'),
  feature: () => import('./commands/feature.js'),
  'edit-photo': () => import('./commands/edit-photo.js'),
  reorder: () => import('./commands/reorder.js'),
  cover: () => import('./commands/cover.js'),
  'remove-photo': () => import('./commands/remove-photo.js'),
  size: () => import('./commands/size.js'),
  publish: () => import('./commands/publish.js'),
  pull: () => import('./commands/pull.js'),
  login: () => import('./commands/login.js'),
  check: () => import('./commands/check.js'),
};

const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || !commands[cmd]) { console.log(HELP); process.exit(cmd ? 1 : 0); }
try {
  await (await commands[cmd]()).default(new Set(rest.filter((a) => a.startsWith('--'))));
} catch (e) {
  console.error(`\nError: ${e.message}`);
  process.exit(1);
}