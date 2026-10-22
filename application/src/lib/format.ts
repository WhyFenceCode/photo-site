import type { Collection, Photo } from './types';

export const pad = (n: number) => String(n).padStart(2, '0');

/** "1 frame", "8 frames". Pass `many` for irregular plurals. */
export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function filmsOf(c: Pick<Collection, 'photos'>): string {
  const films = [...new Set(c.photos.map((p) => p.film).filter(Boolean))] as string[];
  if (!films.length) return '';
  return films.length > 2 ? `${films.length} film stocks` : films.join(' / ');
}

export const details = (p: Photo): string[] =>
  [p.camera, p.lens, p.location, p.date].filter(Boolean) as string[];