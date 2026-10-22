import test from 'node:test';
import assert from 'node:assert/strict';
import { assertKey, deleteArgs, getArgs, putArgs } from '../src/lib/wrangler.js';

const KEY = 'photos/tides/a1b2c3d4e5/960.webp';

test('assertKey refuses anything outside the allow-list', () => {
  assert.doesNotThrow(() => assertKey('catalog.json'));
  assert.doesNotThrow(() => assertKey(KEY));
  for (const bad of ['../x', 'other.json', 'photos/tides/a1b2c3d4e5/960.png', 'photos//a1b2c3d4e5/960.webp', '--remote']) {
    assert.throws(() => assertKey(bad), /unexpected key/, bad);
  }
});

test('every Wrangler command targets the REMOTE bucket (v4 defaults to a local simulator)', () => {
  for (const args of [putArgs('b', KEY, '/tmp/f', 'image/webp', 'x'), getArgs('b', KEY, '/tmp/f'), deleteArgs('b', KEY)]) {
    assert.ok(args.includes('--remote'), args.join(' '));
    assert.ok(args.includes(`b/${KEY}`));
  }
});

test('upload args carry content type and cache headers', () => {
  const a = putArgs('b', KEY, '/tmp/f', 'image/webp', 'public, max-age=31536000, immutable');
  assert.equal(a[a.indexOf('--content-type') + 1], 'image/webp');
  assert.equal(a[a.indexOf('--cache-control') + 1], 'public, max-age=31536000, immutable');
});

test('args builders reject unexpected keys', () => {
  assert.throws(() => putArgs('b', 'evil.sh', '/f', 't', 'c'));
  assert.throws(() => deleteArgs('b', '../catalog.json'));
});
