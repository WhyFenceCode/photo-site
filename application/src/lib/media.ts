import site from '../../site.config.mjs';
import type { Variant } from './types';

const base = (site.media.baseUrl || '').replace(/\/+$/, '');
export const mediaUrl = (path: string) => `${base}/${path}`;
export const srcset = (v?: Variant[]) =>
  v?.length ? v.map((x) => `${mediaUrl(x.path)} ${x.w}w`).join(', ') : undefined;
