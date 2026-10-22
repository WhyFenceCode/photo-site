import * as p from '@clack/prompts';
import { listCollections, saveCollection } from '../lib/staging.js';
import { ask } from '../lib/util.js';

export default async function feature() {
  p.intro('Choose featured collections');
  const cs = await listCollections();
  if (!cs.length) { p.log.error('No collections yet.'); return; }
  const chosen = await ask(p.multiselect({
    message: 'Pick 1–3 collections for the home page (space to toggle, enter to confirm)',
    options: cs.map((c) => ({ value: c.slug, label: c.title })),
    initialValues: cs.filter((c) => c.featured).map((c) => c.slug),
    required: true,
  }));
  if (chosen.length > 3) { p.log.error('Please choose 3 or fewer.'); return; }
  for (const c of cs) { c.featured = chosen.includes(c.slug); await saveCollection(c); }
  p.outro('Saved. Featured collections appear on the home page in collection order.');
}
