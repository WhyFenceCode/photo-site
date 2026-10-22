import * as p from '@clack/prompts';
import { listCollections, saveCollection } from '../lib/staging.js';
import { ask } from '../lib/util.js';

export default async function cover() {
  p.intro('Set a collection cover');
  const cs = (await listCollections()).filter((c) => c.photos.length);
  if (!cs.length) { p.log.error('No collections with photos yet.'); return; }
  const slug = await ask(p.select({ message: 'Collection', options: cs.map((c) => ({ value: c.slug, label: c.title })) }));
  const c = cs.find((x) => x.slug === slug);
  c.cover = await ask(p.select({
    message: 'Cover photo',
    options: c.photos.map((ph, i) => ({ value: ph.id, label: `${i + 1}. ${ph.title || ph.alt.slice(0, 60)}` })),
    initialValue: c.cover,
  }));
  await saveCollection(c);
  p.outro('Cover updated.');
}
