import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../site.config.mjs', () => {
  const site = { media: { baseUrl: '' }, home: { maxFeatured: 3 } };
  return { default: site, site };
});

import CollectionViewer from '../../src/components/CollectionViewer';
import { sampleCatalog } from '../../src/lib/sample';

const labels = { previous: 'Previous', next: 'Next', close: 'Close' };
const collection = sampleCatalog().collections[0];
const setup = (c = collection) => render(<CollectionViewer collection={c} number={1} closeHref="/collections" labels={labels} />);
const status = () => screen.getByRole('status').textContent ?? '';

describe('CollectionViewer', () => {
  it('shows the collection title and announces the first photo', () => {
    setup();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(collection.title);
    expect(status()).toContain('Photograph 1 of 8');
  });

  it('moves with the Next and Previous buttons, wrapping around', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(status()).toContain('Photograph 2 of 8');
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(status()).toContain('Photograph 8 of 8');
  });

  it('moves with the arrow keys', () => {
    setup();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(status()).toContain('Photograph 3 of 8');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(status()).toContain('Photograph 2 of 8');
  });

  it('jumps to a photo from its thumbnail and marks it current', () => {
    setup();
    const thumb = screen.getByRole('button', { name: /Show photograph 3 of 8/ });
    fireEvent.click(thumb);
    expect(status()).toContain('Photograph 3 of 8');
    expect(thumb.getAttribute('aria-current')).toBe('true');
  });

  it('follows the Close link on Escape', () => {
    setup();
    const close = screen.getByRole('link', { name: /Close/ });
    const clicked = vi.fn((e: Event) => e.preventDefault());
    close.addEventListener('click', clicked);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('shows per-photo film rather than one film for the whole collection', () => {
    const mixed = {
      ...collection,
      photos: [
        { ...collection.photos[0], film: 'Kodak Gold 200' },
        { ...collection.photos[1], film: 'Portra 400' },
      ],
    };
    setup(mixed);
    expect(screen.getByText('[Kodak Gold 200]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('[Portra 400]')).toBeTruthy();
  });

  it('hides the stepping controls when there is only one photograph', () => {
    setup({ ...collection, photos: [collection.photos[0]] });
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Previous' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Choose a photograph' })).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByText(/01 \/ 01/)).toBeNull();
    const region = screen.getByRole('region', { name: `${collection.title} photograph` });
    expect(region.getAttribute('aria-roledescription')).toBeNull(); // not a carousel
    fireEvent.keyDown(window, { key: 'ArrowRight' }); // does nothing, and doesn't throw
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(collection.title);
  });

  it('still closes on Escape with a single photograph', () => {
    setup({ ...collection, photos: [collection.photos[0]] });
    const close = screen.getByRole('link', { name: /Close/ });
    const clicked = vi.fn((e: Event) => e.preventDefault());
    close.addEventListener('click', clicked);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(clicked).toHaveBeenCalledOnce();
  });

  it('handles a collection with no photos', () => {
    setup({ ...collection, photos: [] });
    expect(screen.getByText(/No photographs have been added/)).toBeTruthy();
  });
});