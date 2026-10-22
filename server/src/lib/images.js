import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { mediaPath } from './staging.js';

const WIDTHS = [480, 960, 1600, 2400];
const FORMATS = { avif: (s) => s.avif({ quality: 55, effort: 4 }), webp: (s) => s.webp({ quality: 80 }) };

/**
 * Creates responsive AVIF + WebP sizes in the staging folder.
 * sharp strips EXIF/GPS metadata by default, so location data never goes online.
 * The id is a hash of the original, so file paths are immutable and cache-safe.
 */
export async function processImage(file, slug) {
  const input = await readFile(file);
  const id = createHash('sha256').update(input).digest('hex').slice(0, 10);

  const meta = await sharp(input).metadata();
  const swap = (meta.orientation ?? 1) >= 5;
  const width = swap ? meta.height : meta.width;
  const height = swap ? meta.width : meta.height;
  if (!width || !height) throw new Error('Could not read image dimensions');

  const sizes = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS.at(-1))])].sort((a, b) => a - b);
  const { dominant } = await sharp(input).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');

  const files = { avif: [], webp: [] };
  for (const fmt of Object.keys(FORMATS)) {
    for (const w of sizes) {
      const buf = await FORMATS[fmt](sharp(input).rotate().resize({ width: w, withoutEnlargement: true })).toBuffer();
      const path = `photos/${slug}/${id}/${w}.${fmt}`;
      await mkdir(dirname(mediaPath(path)), { recursive: true });
      await writeFile(mediaPath(path), buf);
      files[fmt].push({ w, path });
    }
  }
  return { id, width, height, color, files };
}
