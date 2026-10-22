import { describe, expect, it } from 'vitest';
import { details, filmsOf, pad } from '../../src/lib/format';
import type { Photo } from '../../src/lib/types';

const photo = (o: Partial<Photo>): Photo => ({ id: 'x', alt: 'a', width: 1, height: 1, ...o });

describe('format helpers', () => {
  it('pads numbers', () => expect(pad(3)).toBe('03'));

  it('summarises film stocks', () => {
    expect(filmsOf({ photos: [photo({ film: 'Portra 400' }), photo({ film: 'Portra 400' })] })).toBe('Portra 400');
    expect(filmsOf({ photos: [photo({ film: 'Portra 400' }), photo({ film: 'Ektar 100' })] })).toBe('Portra 400 / Ektar 100');
    expect(filmsOf({ photos: [photo({ film: 'A' }), photo({ film: 'B' }), photo({ film: 'C' })] })).toBe('3 film stocks');
    expect(filmsOf({ photos: [photo({})] })).toBe('');
  });

  it('lists only the details that are present', () => {
    expect(details(photo({ camera: 'Pentax K1000', date: '2025-06' }))).toEqual(['Pentax K1000', '2025-06']);
    expect(details(photo({}))).toEqual([]);
  });
});
