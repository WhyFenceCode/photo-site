import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../site.config.mjs', () => {
  const site = { media: { baseUrl: '' }, home: { maxFeatured: 3 } };
  return { default: site, site };
});

import HomeGrid, { type HomeItem } from '../../src/components/HomeGrid';

const labels = { collections: 'Collections', legal: 'Legal', contact: 'Contact', archiveTag: 'Archive', archiveTitle: 'All collections' };
const items = (n: number): HomeItem[] =>
  Array.from({ length: n }, (_, i) => ({
    slug: `c${i}`, title: `Collection ${i}`, description: 'About it', frames: 8, films: 'Portra 400',
    palette: ['#111', '#222', '#333', '#444'], cover: { id: `p${i}`, alt: 'x', width: 4, height: 5 },
  }));
const setup = (n: number) =>
  render(
    <HomeGrid items={items(n)} mosaic={[]} collectionsCount={n} photoCount={n * 8}
      name="Elena Marsh" role="Photographer" email="a@b.c" labels={labels} />,
  );

describe('HomeGrid', () => {
  it.each([1, 2, 3])('renders %i featured collection(s) plus the archive link', (n) => {
    setup(n);
    expect(screen.getAllByRole('link', { name: /^Collection \d$/ })).toHaveLength(n);
    expect(screen.getByRole('link', { name: /All collections/ }).getAttribute('href')).toBe('/collections');
  });

  it('links the photographer name in the centre to the collections section', () => {
    setup(3);
    expect(screen.getByRole('link', { name: 'Elena Marsh — Collections' }).getAttribute('href')).toBe('/collections');
  });

  it('links each featured collection to its page', () => {
    setup(2);
    expect(screen.getByRole('link', { name: 'Collection 1' }).getAttribute('href')).toBe('/collections/c1');
  });

  it('uses the pinwheel layout for three collections and grows the hovered one', () => {
    const { container } = setup(3);
    const grid = container.querySelector('.home-grid') as HTMLElement;
    expect(grid.style.getPropertyValue('--areas')).toBe('"a a b" "c logo b" "c lib lib"');
    expect(grid.style.getPropertyValue('--cols')).toBe('775fr 390fr 732fr');
    fireEvent.mouseEnter(screen.getByRole('link', { name: 'Collection 0' }));
    expect(grid.style.getPropertyValue('--cols')).toMatch(/^1046(\.\d+)?fr 526(\.\d+)?fr 732fr$/);
    fireEvent.mouseLeave(screen.getByRole('link', { name: 'Collection 0' }));
    expect(grid.style.getPropertyValue('--cols')).toBe('775fr 390fr 732fr');
  });

  it('uses singular wording for one frame, one collection and one photograph', () => {
    const one: HomeItem[] = [{ ...items(1)[0], frames: 1 }];
    render(
      <HomeGrid items={one} mosaic={[]} collectionsCount={1} photoCount={1}
        name="Elena Marsh" role="Photographer" email="a@b.c" labels={labels} />,
    );
    expect(screen.getByText('Portra 400 — 1 frame')).toBeTruthy();
    expect(screen.getByText('1 collection · 1 photograph')).toBeTruthy();
  });

  it('keeps decorative cover images out of the accessibility tree', () => {
    const { container } = setup(1);
    expect(container.querySelector('.cell [role="img"]')).toBeNull();
    expect(container.querySelector('.cell [aria-hidden="true"]')).not.toBeNull();
  });
});