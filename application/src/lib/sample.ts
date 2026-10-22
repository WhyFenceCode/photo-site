import type { Catalog } from './types';

// Placeholder content used while site.config.mjs → media.baseUrl is empty.
const PAL = [
  ['#b5532f', '#d98a5c', '#3d2a22', '#e8c9a0'],
  ['#6f8a9a', '#c9d3d6', '#2f3b44', '#a9b7a1'],
  ['#c9a86a', '#e8dcc0', '#6b5a3c', '#8d9a7c'],
  ['#8a6f7c', '#d8c3c6', '#3a2f3a', '#c49a82'],
  ['#5f7a62', '#b9c4a8', '#2a362d', '#d6c79d'],
];
const RAW = [
  { slug: 'porsche', title: 'Porsche Collection', year: '2025', film: 'Kodak Gold 200', f: true, d: 'Sun-baked metal and long shadows. A study of weathered American machinery along the coast road.' },
  { slug: 'tides', title: 'Tides', year: '2025', film: 'Portra 400', f: true, d: 'Quiet water, early light, and the slow geometry of the shoreline.' },
  { slug: 'boardwalk', title: 'Boardwalk Hours', year: '2024', film: 'Ektar 100', f: true, d: 'Fleeting figures, faded paint and the last warm hour of the afternoon.' },
  { slug: 'hush', title: 'Hush', year: '2024', film: 'Portra 160', f: false, d: 'Interiors, window light and the stillness between moments.' },
  { slug: 'fields', title: 'Dry Fields', year: '2023', film: 'Ektar 100', f: false, d: 'Inland roads and open land, shot over three summers.' },
];

export function sampleCatalog(): Catalog {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    collections: RAW.map((r, k) => ({
      slug: r.slug, title: r.title, year: r.year, description: r.d, featured: r.f, order: k + 1,
      palette: PAL[k],
      defaults: { film: r.film, camera: 'Pentax K1000' },
      photos: Array.from({ length: 8 }, (_, i) => ({
        id: `${r.slug}-${i + 1}`,
        alt: `Placeholder frame ${i + 1} of ${r.title}`,
        width: 4, height: 5,
        date: `${r.year}-0${(i % 9) + 1}`,
        // One collection mixing two stocks, to show per-photo film metadata.
        ...(r.slug === 'porsche' && i >= 4 ? { film: 'Portra 400' } : {}),
      })),
    })),
  };
}
