import * as p from '@clack/prompts';
import { listCollections, saveCollection } from '../lib/staging.js';
import { SLUG, slugify } from '../lib/validate.js';
import { ask, clean, required } from '../lib/util.js';

export default async function newCollection() {
  p.intro('New collection');
  const existing = await listCollections();

  const title = clean(await ask(p.text({ message: 'Collection title', placeholder: 'Tides', validate: required('Title') })));
  const slug = await ask(p.text({
    message: 'URL slug (the page will be /collections/<slug>)',
    initialValue: slugify(title),
    validate: (v) => !SLUG.test(v ?? '') ? 'Use lowercase letters, numbers and single hyphens' : existing.some((c) => c.slug === v) ? 'That slug already exists' : undefined,
  }));
  const year = await ask(p.text({ message: 'Year', initialValue: String(new Date().getFullYear()), validate: (v) => (/^\d{4}$/.test(v ?? '') ? undefined : 'Use a four-digit year') }));
  const description = clean(await ask(p.text({ message: 'Short description (shown on hover and read by screen readers)', validate: required('Description') })));

  p.note('Individual photos can override these — useful when one collection mixes film stocks.\nLeave blank to skip.', 'Collection defaults');
  const defaults = {};
  for (const [key, label] of [['film', 'Default film stock'], ['camera', 'Default camera'], ['lens', 'Default lens']]) {
    const v = clean(await ask(p.text({ message: label, defaultValue: '', placeholder: '(optional)' })));
    if (v) defaults[key] = v;
  }

  const featuredCount = existing.filter((c) => c.featured).length;
  let featured = false;
  if (featuredCount >= 3) p.log.info('3 collections are already featured on the home page. Use "feature" to swap one.');
  else featured = await ask(p.confirm({ message: `Feature on the home page? (${featuredCount}/3 used)`, initialValue: featuredCount < 1 }));

  await saveCollection({
    slug, title, year, description, featured,
    order: Math.max(0, ...existing.map((c) => c.order ?? 0)) + 1,
    ...(Object.keys(defaults).length ? { defaults } : {}),
    photos: [],
  });
  p.outro('Created. Next: pnpm content add-photo');
}
