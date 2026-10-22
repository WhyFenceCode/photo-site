import * as p from '@clack/prompts';
import { deletePhotoFiles, listCollections, saveCollection } from '../lib/staging.js';
import { ask } from '../lib/util.js';

export default async function removePhoto() {
  p.intro('Remove a photograph');
  const cs = (await listCollections()).filter((c) => c.photos.length);
  if (!cs.length) { p.log.error('No photos to remove.'); return; }
  const slug = await ask(p.select({ message: 'Collection', options: cs.map((c) => ({ value: c.slug, label: c.title })) }));
  const c = cs.find((x) => x.slug === slug);
  const id = await ask(p.select({ message: 'Photo to remove', options: c.photos.map((ph, i) => ({ value: ph.id, label: `${i + 1}. ${ph.title || ph.alt.slice(0, 60)}` })) }));
  if (!(await ask(p.confirm({ message: 'Remove it from this collection?' })))) return;
  c.photos = c.photos.filter((ph) => ph.id !== id);
  if (c.cover === id) c.cover = c.photos[0]?.id;
  await saveCollection(c);
  await deletePhotoFiles(slug, id);
  p.outro('Removed locally. To also delete the files online: pnpm content publish --prune');
}
