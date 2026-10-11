// Reads content/<slug>/collection.yaml, optimizes images, writes src/data/index.json
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import YAML from 'yaml';

const SRC = process.env.CONTENT_DIR || 'content';
const OUT = 'public/photos';
const exists = (p) => fs.access(p).then(() => true, () => false);
const fail = (m) => { console.error('\n✖ ' + m + '\n'); process.exit(1); };

const dirs = (await fs.readdir(SRC, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith('.'));
const collections = [];

for (const d of dirs) {
  const slug = d.name;
  const ymlPath = path.join(SRC, slug, 'collection.yaml');
  if (!(await exists(ymlPath))) continue;
  const y = YAML.parse(await fs.readFile(ymlPath, 'utf8'));
  for (const k of ['title', 'description', 'images'])
    if (!y[k]) fail(`${slug}: missing "${k}"`);
  await fs.mkdir(path.join(OUT, slug), { recursive: true });

  const images = [];
  for (const im of y.images) {
    const src = path.join(SRC, slug, im.file);
    if (!(await exists(src))) fail(`${slug}: image not found: ${im.file}`);
    const base = path.parse(im.file).name;
    const full = path.join(OUT, slug, base + '-full.webp');
    const thumb = path.join(OUT, slug, base + '-thumb.webp');
    if (!(await exists(full))) { // skip already-processed images
      await sharp(src).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(full);
      await sharp(full).resize({ width: 700 }).webp({ quality: 78 }).toFile(thumb);
    }
    const { width, height } = await sharp(full).metadata();
    // brightness of the top-left corner (where the [01] tags sit) -> light/dark tone
    const px = await sharp(full)
      .extract({ left: 0, top: 0, width: Math.round(width * 0.3), height: Math.round(height * 0.2) })
      .resize(1, 1).raw().toBuffer();
    const lum = +((0.2126 * px[0] + 0.7152 * px[1] + 0.0722 * px[2]) / 255).toFixed(3);
    images.push({
      full: `/photos/${slug}/${base}-full.webp`, thumb: `/photos/${slug}/${base}-thumb.webp`,
      w: width, h: height, lum, alt: im.alt || y.title, caption: im.caption || '',
    });
  }
  collections.push({
    slug, title: y.title, film: y.film || '', year: y.year || '', description: y.description,
    featured: !!y.featured, order: y.order ?? 99, cover: images[y.cover ?? 0], images,
  });
}

const featured = collections.filter((c) => c.featured);
if (featured.length !== 3) fail(`Exactly 3 collections must be featured (found ${featured.length}).`);
collections.sort((a, b) => String(b.year).localeCompare(String(a.year)) || a.order - b.order);

await fs.writeFile('src/data/index.json', JSON.stringify({ collections }, null, 2));
console.log(`✔ indexed ${collections.length} collections, ${collections.reduce((n, c) => n + c.images.length, 0)} images`);
