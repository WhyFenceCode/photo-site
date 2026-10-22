import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, parseBucketInfo, sumBytes } from '../src/lib/sizes.js';
import { buildPlan } from '../src/lib/plan.js';

test('formatBytes uses decimal units and trims zeros', () => {
  const cases = [
    [0, '0 B'], [999, '999 B'], [1000, '1 kB'], [1500, '1.5 kB'], [12_345, '12.3 kB'],
    [999_999, '1 MB'], [1_234_567, '1.23 MB'], [123_456_789, '123 MB'], [5e9, '5 GB'], [2.5e12, '2.5 TB'],
  ];
  for (const [n, text] of cases) assert.equal(formatBytes(n), text, String(n));
  assert.equal(formatBytes(-1), '—');
  assert.equal(formatBytes(NaN), '—');
});

test('sumBytes ignores keys with no known size', () => {
  assert.equal(sumBytes(['a', 'b', 'c'], new Map([['a', 10], ['b', 5]])), 15);
});

test('parseBucketInfo reads Wrangler-style "label: value" lines', () => {
  const text = [
    'name:                   photos-media',
    'created:                2026-10-01T12:00:00.000Z',
    'location:               ENAM',
    'default_storage_class:  Standard',
    'object_count:           1,234',
    'bucket_size:            3.4 MB',
  ].join('\n');
  assert.deepEqual(parseBucketInfo(text), { objects: '1,234', size: '3.4 MB', recognised: true });
});

test('parseBucketInfo formats a raw byte count and reports unrecognised output', () => {
  assert.equal(parseBucketInfo('object_count: 3\nbucket_size: 3400000').size, '3.4 MB');
  const none = parseBucketInfo('something else entirely');
  assert.equal(none.recognised, false);
  assert.equal(none.objects, null);
});

const photo = (id, slug) => ({
  id, alt: 'x',
  files: { webp: [{ w: 480, path: `photos/${slug}/${id}/480.webp` }], avif: [{ w: 480, path: `photos/${slug}/${id}/480.avif` }] },
});
const collections = [
  { slug: 'a', title: 'A', photos: [photo('aaaaaaaaaa', 'a'), photo('bbbbbbbbbb', 'a')] },
  { slug: 'b', title: 'B', photos: [photo('cccccccccc', 'b')] },
];
const allKeys = collections.flatMap((c) => c.photos.flatMap((p) => Object.values(p.files).flat().map((f) => f.path)));

test('buildPlan only uploads files that are not already online and totals their size', () => {
  const sizeOf = new Map(allKeys.map((k) => [k, 100]));
  const online = ['photos/a/aaaaaaaaaa/480.webp', 'photos/a/aaaaaaaaaa/480.avif', 'photos/old/zzzzzzzzzz/480.webp'];
  const plan = buildPlan({ collections, online, sizeOf });
  assert.equal(plan.keys.length, 6);
  assert.equal(plan.todo.length, 4);
  assert.equal(plan.todoBytes, 400);
  assert.equal(plan.totalBytes, 600);
  assert.deepEqual(plan.orphans, ['photos/old/zzzzzzzzzz/480.webp']);
  assert.deepEqual(plan.lost, []);
  const a = plan.perCollection.find((c) => c.slug === 'a');
  assert.deepEqual([a.files, a.bytes, a.pendingFiles, a.pendingBytes], [4, 400, 2, 200]);
});

test('buildPlan flags files that are neither online nor on this computer', () => {
  const sizeOf = new Map(allKeys.slice(1).map((k) => [k, 10]));
  const plan = buildPlan({ collections, online: [], sizeOf });
  assert.deepEqual(plan.lost, [allKeys[0]]);
  assert.equal(plan.missingLocally, 1);
});

test('buildPlan does not require local copies of files that are already online', () => {
  const plan = buildPlan({ collections, online: allKeys, sizeOf: new Map() });
  assert.equal(plan.todo.length, 0);
  assert.deepEqual(plan.lost, []);
  assert.equal(plan.missingLocally, 6);
});
