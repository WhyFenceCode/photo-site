import * as p from '@clack/prompts';
import { existsSync } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { listCollections, saveCollection } from '../lib/staging.js';
import { processImage } from '../lib/images.js';
import { DATE } from '../lib/validate.js';
import { ask, clean, cleanPath, required } from '../lib/util.js';

const EXT = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.webp', '.avif']);

async function resolveFiles(input) {
  const path = cleanPath(input);
  if ((await stat(path)).isFile()) return [path];
  return (await readdir(path)).filter((f) => EXT.has(extname(f).toLowerCase())).sort().map((f) => join(path, f));
}

export default async function addPhoto() {
  p.intro('Add photographs');
  const collections = await listCollections();
  if (!collections.length) { p.log.error('No collections yet. Run: pnpm content new-collection'); return; }

  const slug = await ask(p.select({
    message: 'Which collection?',
    options: collections.map((c) => ({ value: c.slug, label: c.title, hint: `${c.photos.length} photos` })),
  }));
  const col = collections.find((c) => c.slug === slug);

  const input = await ask(p.text({
    message: 'Path to a photo, or a folder of photos (you can drag it into the terminal)',
    validate: (v) => (v && existsSync(cleanPath(v)) ? undefined : 'Path not found'),
  }));
  const files = await resolveFiles(input);
  if (!files.length) { p.log.error('No supported images found (jpg, png, tiff, webp, avif).'); return; }

  const last = { film: col.defaults?.film ?? '', camera: col.defaults?.camera ?? '', lens: col.defaults?.lens ?? '', location: '' };
  // Only store a value on the photo if it differs from the collection default.
  const own = (k, v) => (v && v !== col.defaults?.[k] ? { [k]: v } : {});
  let added = 0;

  for (const [n, file] of files.entries()) {
    p.log.step(`Photo ${n + 1} of ${files.length}: ${basename(file)}`);
    const alt = clean(await ask(p.text({ message: 'Alt text — describe the photo for people who can’t see it', validate: required('Alt text') })));
    const title = clean(await ask(p.text({ message: 'Title', defaultValue: '', placeholder: '(optional)' })));
    const caption = clean(await ask(p.text({ message: 'Caption', defaultValue: '', placeholder: '(optional)' })));
    const film = clean(await ask(p.text({ message: 'Film stock', initialValue: last.film, placeholder: 'e.g. Kodak Portra 400' })));
    const camera = clean(await ask(p.text({ message: 'Camera', initialValue: last.camera })));
    const lens = clean(await ask(p.text({ message: 'Lens', initialValue: last.lens })));
    const date = clean(await ask(p.text({ message: 'Date taken (YYYY, YYYY-MM or YYYY-MM-DD)', defaultValue: '', placeholder: '(optional)', validate: (v) => (!v || DATE.test(v) ? undefined : 'Use YYYY, YYYY-MM or YYYY-MM-DD') })));
    const location = clean(await ask(p.text({ message: 'Location', initialValue: last.location })));
    Object.assign(last, { film, camera, lens, location });

    const s = p.spinner(); s.start('Creating web-ready sizes (AVIF + WebP)…');
    let img;
    try { img = await processImage(file, slug); } catch (e) { s.stop('Failed'); p.log.error(e.message); continue; }
    s.stop(`${img.width}×${img.height}px → ${img.files.webp.length} sizes × 2 formats`);

    if (col.photos.some((x) => x.id === img.id)) { p.log.warn('This image is already in the collection — skipped.'); continue; }
    col.photos.push({
      id: img.id, alt, width: img.width, height: img.height, color: img.color,
      ...(title && { title }), ...(caption && { caption }),
      ...own('film', film), ...own('camera', camera), ...own('lens', lens),
      ...(date && { date }), ...(location && { location }),
      files: img.files,
    });
    col.cover ??= img.id;
    await saveCollection(col); // save after every photo so progress is never lost
    added++;
  }
  p.outro(`Added ${added} photo${added === 1 ? '' : 's'}. Publish with: pnpm content publish`);
}
