// Pure helpers for editing and reordering photos (no I/O, easy to test).

/** Fields a person can edit on a photo. `alt` is required; the rest are optional. */
export const EDITABLE = ['alt', 'title', 'caption', 'film', 'camera', 'lens', 'date', 'location'];

// These three can be set once on the collection and inherited by its photos.
const INHERITED = ['film', 'camera', 'lens'];

/** The values a photo effectively has: its own, or the collection default. Used to prefill prompts. */
export function effectiveValues(photo, defaults = {}) {
  const out = {};
  for (const k of EDITABLE) out[k] = photo[k] ?? (INHERITED.includes(k) ? defaults?.[k] : undefined) ?? '';
  return out;
}

/**
 * Returns a copy of `photo` with `values` applied.
 * - Empty optional fields are removed.
 * - film/camera/lens equal to the collection default are removed too, so the
 *   photo keeps inheriting if the default changes later.
 * - Generated fields (id, width, height, color, files) are never touched.
 */
export function applyEdit(photo, values, defaults = {}) {
  const next = { ...photo };
  for (const k of EDITABLE) {
    const v = typeof values[k] === 'string' ? values[k].trim() : '';
    if (k === 'alt') next.alt = v; // required: the caller validates it
    else if (INHERITED.includes(k)) {
      if (v && v !== defaults?.[k]) next[k] = v;
      else delete next[k];
    } else if (v) next[k] = v;
    else delete next[k];
  }
  return next;
}

/** Names of the fields whose stored value differs between two versions of a photo. */
export const changedFields = (before, after) => EDITABLE.filter((k) => (before[k] ?? '') !== (after[k] ?? ''));

/** Returns a new array with the item at index `from` moved to index `to` (both 0-based). */
export function movePhoto(photos, from, to) {
  const ok = (i) => Number.isInteger(i) && i >= 0 && i < photos.length;
  if (!ok(from) || !ok(to)) throw new RangeError(`Cannot move photo ${from} to ${to} in a list of ${photos.length}`);
  const next = [...photos];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Turns what someone typed ("3", "first", "last") into a 0-based index, or null if invalid.
 * Positions are 1-based for humans.
 */
export function parsePosition(input, count) {
  const s = String(input ?? '').trim().toLowerCase();
  if (s === 'first') return count > 0 ? 0 : null;
  if (s === 'last') return count > 0 ? count - 1 : null;
  if (!/^\d+$/.test(s)) return null;
  const n = Number(s);
  return n >= 1 && n <= count ? n - 1 : null;
}

/** Short label for a photo in a list: "3. Title or alt text…" */
export const photoLabel = (photo, index, max = 60) => {
  const text = (photo.title || photo.alt || photo.id || '').trim();
  return `${index + 1}. ${text.length > max ? `${text.slice(0, max - 1)}…` : text}`;
};
