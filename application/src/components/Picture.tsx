import type { CSSProperties } from 'react';
import type { Photo } from '../lib/types';
import { mediaUrl, srcset } from '../lib/media';
import { gradient } from '../lib/placeholder';

interface Props {
  photo?: Photo;
  palette?: string[];
  index?: number;
  /** Pass "" for decorative images (e.g. a cover inside a labelled link). */
  alt?: string;
  sizes: string;
  eager?: boolean;
  className?: string;
  fit?: 'cover' | 'contain';
}

export default function Picture({ photo, palette, index = 0, alt, sizes, eager, className, fit = 'cover' }: Props) {
  const text = alt ?? photo?.alt ?? '';
  const avif = photo?.files?.avif;
  const webp = photo?.files?.webp;

  if (!photo || !webp?.length) {
    // Placeholder (sample mode or empty collection)
    const decorative = text === '';
    const style: CSSProperties = {
      background: palette ? gradient(palette, index) : photo?.color ?? 'var(--line)',
      ...(fit === 'contain' && photo ? { aspectRatio: `${photo.width}/${photo.height}`, height: '100%', maxWidth: '100%' } : {}),
    };
    return (
      <div
        className={className}
        style={style}
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : text}
        aria-hidden={decorative || undefined}
      />
    );
  }

  const fallback = webp[Math.min(1, webp.length - 1)];
  return (
    <picture>
      {!!avif?.length && <source type="image/avif" srcSet={srcset(avif)} sizes={sizes} />}
      <source type="image/webp" srcSet={srcset(webp)} sizes={sizes} />
      <img
        src={mediaUrl(fallback.path)}
        width={photo.width}
        height={photo.height}
        alt={text}
        sizes={sizes}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={className}
        style={{ backgroundColor: photo.color }}
      />
    </picture>
  );
}
