export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;
// The only object keys the publisher will ever write.
export const KEY = /^(catalog\.json|photos\/[a-z0-9]+(?:-[a-z0-9]+)*\/[a-f0-9]{10}\/\d{2,4}\.(avif|webp))$/;

export const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export function validateCollection(c) {
  const e = [];
  if (!SLUG.test(c.slug || '')) e.push('invalid slug');
  if (!c.title?.trim()) e.push('missing title');
  if (!/^\d{4}$/.test(c.year || '')) e.push('year must be four digits');
  if (!c.description?.trim()) e.push('missing description');
  if (c.cover && !c.photos.some((p) => p.id === c.cover)) e.push('cover photo not found');
  c.photos.forEach((p, i) => {
    const n = `photo ${i + 1}`;
    if (!/^[a-f0-9]{10}$/.test(p.id || '')) e.push(`${n}: invalid id`);
    if (!p.alt?.trim()) e.push(`${n}: alt text is required (accessibility)`);
    if (!(p.width > 0 && p.height > 0)) e.push(`${n}: missing dimensions`);
    if (p.date && !DATE.test(p.date)) e.push(`${n}: date must be YYYY, YYYY-MM or YYYY-MM-DD`);
    if (!p.files?.webp?.length || !p.files?.avif?.length) e.push(`${n}: missing image files`);
  });
  return e;
}
