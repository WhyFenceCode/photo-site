import * as p from '@clack/prompts';
import { listCollections, saveCollection } from '../lib/staging.js';
import { movePhoto, parsePosition, photoLabel } from '../lib/photos.js';
import { ask } from '../lib/util.js';

const listing = (col) => col.photos.map((ph, i) => photoLabel(ph, i)).join('\n');

export default async function reorder() {
  p.intro('Reorder photographs');
  const collections = (await listCollections()).filter((c) => c.photos.length > 1);
  if (!collections.length) { p.log.error('You need a collection with at least two photos to reorder.'); return; }

  const slug = await ask(p.select({
    message: 'Which collection?',
    options: collections.map((c) => ({ value: c.slug, label: c.title, hint: `${c.photos.length} photos` })),
  }));
  const col = collections.find((c) => c.slug === slug);
  const count = col.photos.length;

  let moved = 0;
  let again = true;
  while (again) {
    p.note(listing(col), `${col.title} — current order`);
    const id = await ask(p.select({
      message: 'Which photo do you want to move?',
      options: col.photos.map((ph, i) => ({ value: ph.id, label: photoLabel(ph, i) })),
    }));
    const from = col.photos.findIndex((ph) => ph.id === id);
    const answer = await ask(p.text({
      message: `Move it to which position? (1–${count}, or "first" / "last")`,
      validate: (v) => (parsePosition(v, count) === null ? `Enter a number from 1 to ${count}, or first / last` : undefined),
    }));
    const to = parsePosition(answer, count);

    if (to === from) {
      p.log.info('That photo is already in that position.');
    } else {
      col.photos = movePhoto(col.photos, from, to);
      await saveCollection(col); // saved after every move
      moved++;
      p.log.success(`Moved to position ${to + 1}.`);
    }
    again = await ask(p.confirm({ message: 'Move another photo?', initialValue: true }));
  }

  if (moved) p.note(listing(col), `${col.title} — new order`);
  p.outro(moved ? 'Order saved. Publish with: pnpm content publish' : 'Nothing changed.');
}
