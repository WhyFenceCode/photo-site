import type { Collection, Photo } from './types';

export const pad = (n: number) => String(n).padStart(2, '0');

export function filmsOf(c: Pick<Collection, 'photos'>): string {
  const films = [...new Set(c.photos.map((p) => p.film).filter(Boolean))] as string[];
  if (!films.length) return '';
  return films.length > 2 ? `${films.length} film stocks` : films.join(' / ');
}

export const details = (p: Photo): string[] =>
  [p.camera, p.lens, p.location, p.date].filter(Boolean) as string[];
