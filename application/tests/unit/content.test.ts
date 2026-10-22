import { describe, expect, it, vi } from 'vitest';

// Keep tests hermetic: always use the built-in sample content, whatever
// media.baseUrl is set to in the real config.
vi.mock('../../site.config.mjs', () => {
  const site = { media: { baseUrl: '' }, home: { maxFeatured: 3 } };
  return { default: site, site };
});

import { coverOf, getCollections, getFeatured } from '../../src/lib/content';

describe('content loading', () => {
  it('returns collections sorted by order', async () => {
    const all = await getCollections();
    expect(all.map((c) => c.order)).toEqual([...all.map((c) => c.order)].sort((a, b) => a - b));
    expect(all.length).toBeGreaterThan(0);
  });

  it('lets per-photo metadata override collection defaults', async () => {
    const porsche = (await getCollections()).find((c) => c.slug === 'porsche')!;
    expect(porsche.photos[0].film).toBe('Kodak Gold 200'); // inherited default
    expect(porsche.photos[5].film).toBe('Portra 400'); // per-photo override
    expect(porsche.photos[5].camera).toBe('Pentax K1000'); // default still fills gaps
  });

  it('returns between 1 and 3 featured collections', async () => {
    const featured = await getFeatured();
    expect(featured.length).toBeGreaterThanOrEqual(1);
    expect(featured.length).toBeLessThanOrEqual(3);
    expect(featured.every((c) => c.featured)).toBe(true);
  });

  it('uses the first photo as cover when none is set', async () => {
    const c = (await getCollections())[0];
    expect(coverOf({ ...c, cover: undefined })?.id).toBe(c.photos[0].id);
  });
});
