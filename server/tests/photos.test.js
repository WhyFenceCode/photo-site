import test from 'node:test';
import assert from 'node:assert/strict';
import { applyEdit, changedFields, effectiveValues, movePhoto, parsePosition, photoLabel } from '../src/lib/photos.js';

const photo = (o = {}) => ({
  id: 'a1b2c3d4e5', alt: 'A red car', width: 4000, height: 3000, color: '#b5532f',
  files: { webp: [{ w: 480, path: 'photos/x/a1b2c3d4e5/480.webp' }] }, ...o,
});
const defaults = { film: 'Portra 400', camera: 'Pentax K1000' };

test('effectiveValues falls back to collection defaults for film, camera and lens only', () => {
  const v = effectiveValues(photo({ lens: '50mm' }), defaults);
  assert.equal(v.film, 'Portra 400');
  assert.equal(v.camera, 'Pentax K1000');
  assert.equal(v.lens, '50mm');
  assert.equal(v.title, '');
});

test('applyEdit sets, changes and clears optional fields', () => {
  const edited = applyEdit(photo({ caption: 'old' }), { alt: 'New alt', title: 'Hello', caption: '', location: ' Kingston ' }, defaults);
  assert.equal(edited.alt, 'New alt');
  assert.equal(edited.title, 'Hello');
  assert.equal('caption' in edited, false);
  assert.equal(edited.location, 'Kingston');
});

test('a film that equals the collection default is stored as inheritance, not a copy', () => {
  const own = applyEdit(photo({ film: 'Ektar 100' }), { alt: 'x', film: 'Portra 400' }, defaults);
  assert.equal('film' in own, false);
  const override = applyEdit(photo(), { alt: 'x', film: 'Ektar 100' }, defaults);
  assert.equal(override.film, 'Ektar 100');
});

test('prefilling then saving unchanged values changes nothing', () => {
  const original = photo({ film: 'Ektar 100', title: 'T' });
  const saved = applyEdit(original, effectiveValues(original, defaults), defaults);
  assert.deepEqual(changedFields(original, saved), []);
  assert.deepEqual(saved, original);
});

test('generated fields are never touched by an edit', () => {
  const original = photo();
  const saved = applyEdit(original, { alt: 'x', id: 'hacked', width: '1', files: 'nope' }, defaults);
  for (const k of ['id', 'width', 'height', 'color', 'files']) assert.deepEqual(saved[k], original[k], k);
});

test('changedFields reports only what differs', () => {
  assert.deepEqual(changedFields(photo(), applyEdit(photo(), { alt: 'A red car', date: '2025-06' }, {})), ['date']);
});

test('movePhoto moves forward, backward and to the ends without mutating the input', () => {
  const list = ['a', 'b', 'c', 'd'];
  assert.deepEqual(movePhoto(list, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(movePhoto(list, 3, 0), ['d', 'a', 'b', 'c']);
  assert.deepEqual(movePhoto(list, 1, 1), list);
  assert.deepEqual(list, ['a', 'b', 'c', 'd']);
});

test('movePhoto rejects out-of-range positions', () => {
  assert.throws(() => movePhoto(['a', 'b'], 0, 2), RangeError);
  assert.throws(() => movePhoto(['a', 'b'], -1, 0), RangeError);
  assert.throws(() => movePhoto(['a', 'b'], 0, 0.5), RangeError);
});

test('parsePosition accepts numbers, first and last (1-based in, 0-based out)', () => {
  assert.equal(parsePosition('1', 5), 0);
  assert.equal(parsePosition(' 5 ', 5), 4);
  assert.equal(parsePosition('First', 5), 0);
  assert.equal(parsePosition('LAST', 5), 4);
  for (const bad of ['0', '6', '-1', '2.5', 'two', '', undefined]) assert.equal(parsePosition(bad, 5), null, String(bad));
  assert.equal(parsePosition('first', 0), null);
});

test('photoLabel numbers the photo and shortens long text', () => {
  assert.equal(photoLabel(photo({ title: 'Dusk' }), 2), '3. Dusk');
  assert.equal(photoLabel(photo(), 0), '1. A red car');
  assert.ok(photoLabel(photo({ alt: 'x'.repeat(200) }), 0).endsWith('…'));
});
