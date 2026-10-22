import * as p from '@clack/prompts';
import { listCollections, saveCollection } from '../lib/staging.js';
import { DATE } from '../lib/validate.js';
import { applyEdit, changedFields, effectiveValues, photoLabel } from '../lib/photos.js';
import { ask, clean, required } from '../lib/util.js';

export default async function editPhoto() {
  p.intro('Edit a photograph’s details');
  const collections = (await listCollections()).filter((c) => c.photos.length);
  if (!collections.length) { p.log.error('No photos yet. Run: pnpm content add-photo'); return; }

  const slug = await ask(p.select({
    message: 'Which collection?',
    options: collections.map((c) => ({ value: c.slug, label: c.title, hint: `${c.photos.length} photo${c.photos.length === 1 ? '' : 's'}` })),
  }));
  const col = collections.find((c) => c.slug === slug);
  const defaults = col.defaults ?? {};
  const defaultText = Object.entries(defaults).map(([k, v]) => `${k}: ${v}`).join(', ');
  if (defaultText) p.log.info(`Collection defaults — ${defaultText}. Clearing one of those on a photo makes it use the default.`);

  let again = true;
  while (again) {
    const id = await ask(p.select({
      message: 'Which photo?',
      options: col.photos.map((ph, i) => ({ value: ph.id, label: photoLabel(ph, i) })),
    }));
    const index = col.photos.findIndex((ph) => ph.id === id);
    const before = col.photos[index];
    const current = effectiveValues(before, defaults);
    const field = async (message, key, extra = {}) => clean(await ask(p.text({ message, initialValue: current[key], ...extra })));

    const values = {
      alt: await field('Alt text — describe the photo for people who can’t see it', 'alt', { validate: required('Alt text') }),
      title: await field('Title (blank for none)', 'title'),
      caption: await field('Caption (blank for none)', 'caption'),
      film: await field('Film stock', 'film'),
      camera: await field('Camera', 'camera'),
      lens: await field('Lens', 'lens'),
      date: await field('Date taken (YYYY, YYYY-MM or YYYY-MM-DD; blank for none)', 'date', {
        validate: (v) => (!v || DATE.test(v) ? undefined : 'Use YYYY, YYYY-MM or YYYY-MM-DD'),
      }),
      location: await field('Location (blank for none)', 'location'),
    };

    const after = applyEdit(before, values, defaults);
    const changed = changedFields(before, after);
    if (changed.length) {
      col.photos[index] = after;
      await saveCollection(col);
      p.log.success(`Saved: ${changed.join(', ')}.`);
    } else {
      p.log.info('No changes.');
    }
    for (const k of ['film', 'camera', 'lens']) {
      if (!values[k] && defaults[k]) p.log.info(`${k} is blank here, so this photo uses the collection default (${defaults[k]}).`);
    }
    again = await ask(p.confirm({ message: 'Edit another photo in this collection?', initialValue: false }));
  }
  p.outro('Done. Publish with: pnpm content publish');
}
