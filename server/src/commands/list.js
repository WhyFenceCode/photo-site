import * as p from '@clack/prompts';
import { listCollections } from '../lib/staging.js';

export default async function list() {
  const cs = await listCollections();
  if (!cs.length) { p.log.info('No collections yet. Run: pnpm content new-collection'); return; }
  for (const c of cs) {
    const films = [...new Set(c.photos.map((x) => x.film ?? c.defaults?.film).filter(Boolean))].join(', ') || '—';
    console.log(`${c.featured ? '★' : ' '} ${String(c.order).padStart(2)}  ${c.title}  (${c.slug}, ${c.year})  ${c.photos.length} photos  film: ${films}`);
  }
  console.log('\n★ = featured on the home page');
}
