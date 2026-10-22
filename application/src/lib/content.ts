import site from '../../site.config.mjs';
import { sampleCatalog } from './sample';
import type { Catalog, Collection, Photo } from './types';

const base = (site.media.baseUrl || '').replace(/\/+$/, '');
let cache: Promise<Catalog> | undefined;

async function load(): Promise<Catalog> {
  if (!base) return sampleCatalog();
  const res = await fetch(`${base}/catalog.json`);
  if (!res.ok) {
    throw new Error(`Could not load ${base}/catalog.json (HTTP ${res.status}). Have you published content? Run: pnpm content publish`);
  }
  const data = await res.json();
  if (!data || !Array.isArray(data.collections)) throw new Error('catalog.json is malformed');
  return data as Catalog;
}

// Per-photo metadata wins; collection defaults fill the gaps.
function normalise(c: Catalog): Catalog {
  const collections = [...c.collections]
    .sort((a, b) => a.order - b.order)
    .map((col) => ({ ...col, photos: col.photos.map((p) => ({ ...col.defaults, ...p }) as Photo) }));
  return { ...c, collections };
}

export const getCatalog = () => (cache ??= load().then(normalise));
export const getCollections = async () => (await getCatalog()).collections;

export async function getFeatured(): Promise<Collection[]> {
  const all = await getCollections();
  const max = Math.max(1, Math.min(3, site.home.maxFeatured));
  const featured = all.filter((c) => c.featured).slice(0, max);
  return featured.length ? featured : all.slice(0, 1);
}

export const coverOf = (c: Collection): Photo | undefined =>
  c.photos.find((p) => p.id === c.cover) ?? c.photos[0];
