import test from 'node:test';
import assert from 'node:assert/strict';
import { DATE, KEY, SLUG, slugify, validateCollection } from '../src/lib/validate.js';

const photo = (o = {}) => ({
  id: 'a1b2c3d4e5', alt: 'A red car', width: 4000, height: 3000,
  files: { avif: [{ w: 480, path: 'photos/x/a1b2c3d4e5/480.avif' }], webp: [{ w: 480, path: 'photos/x/a1b2c3d4e5/480.webp' }] },
  ...o,
});
const collection = (o = {}) => ({ slug: 'x', title: 'X', year: '2025', description: 'd', photos: [photo()], ...o });

test('slugify makes URL-safe slugs', () => {
  assert.equal(slugify('Boardwalk Hours!'), 'boardwalk-hours');
  assert.equal(slugify('  Café  Dusk '), 'cafe-dusk');
  assert.ok(SLUG.test(slugify('Porsche Collection 2025')));
});

test('SLUG rejects traversal and odd characters', () => {
  for (const bad of ['../x', 'a/b', 'A', 'a--b', '-a', 'a b', '']) assert.equal(SLUG.test(bad), false, bad);
});

test('DATE accepts YYYY, YYYY-MM, YYYY-MM-DD only', () => {
  for (const ok of ['2025', '2025-06', '2025-06-14']) assert.ok(DATE.test(ok));
  for (const bad of ['25', '2025-6', 'June 2025']) assert.equal(DATE.test(bad), false);
});

test('KEY allow-list covers exactly the files the publisher writes', () => {
  for (const ok of ['catalog.json', 'photos/tides/a1b2c3d4e5/480.avif', 'photos/tides/a1b2c3d4e5/2400.webp']) assert.ok(KEY.test(ok), ok);
  for (const bad of ['../catalog.json', 'index.html', 'photos/tides/zzz/480.avif', 'photos/tides/a1b2c3d4e5/480.jpg', 'photos/../x/a1b2c3d4e5/480.avif']) assert.equal(KEY.test(bad), false, bad);
});

test('a complete collection is valid', () => assert.deepEqual(validateCollection(collection()), []));

test('alt text is required for every photo', () => {
  const errors = validateCollection(collection({ photos: [photo({ alt: '  ' })] }));
  assert.ok(errors.some((e) => e.includes('alt text')));
});

test('reports missing files, bad dates and unknown covers', () => {
  const errors = validateCollection(collection({ cover: 'nope', photos: [photo({ files: {}, date: 'soon' })] }));
  assert.ok(errors.some((e) => e.includes('missing image files')));
  assert.ok(errors.some((e) => e.includes('date')));
  assert.ok(errors.some((e) => e.includes('cover')));
});
