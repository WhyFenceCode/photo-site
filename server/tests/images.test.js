import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

// Use a throw-away staging folder; must be set before the module is imported.
const dir = await mkdtemp(join(tmpdir(), 'gallery-test-'));
process.env.STAGING_DIR = dir;
const { processImage } = await import('../src/lib/images.js');
after(() => rm(dir, { recursive: true, force: true }));

test('creates responsive AVIF + WebP sizes without upscaling', async () => {
  const src = join(dir, 'in.jpg');
  await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#b5532f' } }).jpeg().toFile(src);
  const r = await processImage(src, 'test');
  assert.equal(r.id.length, 10);
  assert.deepEqual([r.width, r.height], [1200, 800]);
  assert.deepEqual(r.files.webp.map((f) => f.w), [480, 960, 1200]);
  assert.deepEqual(r.files.avif.map((f) => f.w), [480, 960, 1200]);
  assert.match(r.color, /^#[0-9a-f]{6}$/);
  for (const f of [...r.files.avif, ...r.files.webp]) await access(join(dir, 'media', f.path));
});

test('strips EXIF metadata (e.g. GPS) from outputs', async () => {
  const src = join(dir, 'exif.jpg');
  await sharp({ create: { width: 800, height: 600, channels: 3, background: '#335577' } })
    .jpeg().withExif({ IFD0: { Copyright: 'secret' } }).toFile(src);
  const r = await processImage(src, 'test');
  const meta = await sharp(join(dir, 'media', r.files.webp[0].path)).metadata();
  assert.equal(meta.exif, undefined);
});

test('respects EXIF orientation when reporting dimensions', async () => {
  const src = join(dir, 'rot.jpg');
  await sharp({ create: { width: 600, height: 900, channels: 3, background: '#778899' } })
    .jpeg().withMetadata({ orientation: 6 }).toFile(src);
  const r = await processImage(src, 'test');
  assert.deepEqual([r.width, r.height], [900, 600]);
});
