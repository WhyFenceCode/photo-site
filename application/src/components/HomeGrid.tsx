import { useState, type CSSProperties } from 'react';
import Picture from './Picture';
import type { Photo } from '../lib/types';
import { pad } from '../lib/format';

export interface HomeItem {
  slug: string; title: string; description: string; frames: number; films: string;
  cover?: Photo; palette?: string[];
}
export interface MosaicTile { photo?: Photo; palette?: string[]; seed: number }

interface Props {
  items: HomeItem[];
  mosaic: MosaicTile[];
  collectionsCount: number;
  photoCount: number;
  name: string;
  role: string;
  email: string;
  labels: Record<string, string>;
}

// One layout per number of featured collections (1–3). Areas a/b/c are the
// featured collections, "logo" is the name block, "lib" the archive link.
const LAYOUTS: Record<number, { areas: string[][]; cols: number[]; rows: number[] }> = {
  0: { areas: [['logo', 'lib']], cols: [1, 1], rows: [1] },
  1: { areas: [['a', 'logo'], ['a', 'lib']], cols: [1000, 420], rows: [560, 440] },
  2: { areas: [['a', 'a', 'b'], ['lib', 'logo', 'b']], cols: [775, 390, 732], rows: [640, 360] },
  3: { areas: [['a', 'a', 'b'], ['c', 'logo', 'b'], ['c', 'lib', 'lib']], cols: [775, 390, 732], rows: [368, 252, 333] },
};
const BOOST = 1.35;
const AREA = ['a', 'b', 'c'];
const css = (o: Record<string, string>) => o as CSSProperties;

export default function HomeGrid({ items, mosaic, collectionsCount, photoCount, name, role, email, labels }: Props) {
  const [hot, setHot] = useState<string | null>(null);
  const L = LAYOUTS[Math.min(items.length, 3)];

  const track = (vals: number[], has: (i: number) => boolean) =>
    vals.map((v, i) => `${hot && has(i) ? v * BOOST : v}fr`).join(' ');
  const gridStyle = css({
    '--areas': L.areas.map((r) => `"${r.join(' ')}"`).join(' '),
    '--cols': track(L.cols, (i) => L.areas.some((r) => r[i] === hot)),
    '--rows': track(L.rows, (i) => L.areas[i].includes(hot ?? '')),
  });
  const hover = (a: string) => ({
    onMouseEnter: () => setHot(a), onMouseLeave: () => setHot(null),
    onFocus: () => setHot(a), onBlur: () => setHot(null),
  });

  return (
    <div className="home-grid" style={gridStyle}>
      {/* Centre of the page: the whole block links to the collections section */}
      <div className="logo" style={css({ '--area': 'logo' })}>
        <a className="name" href="/collections" aria-label={`${name} — ${labels.collections}`}>
          <span className="uline">{name}</span>
        </a>
        <span className="mono role">{role}</span>
        <nav className="small mono" aria-label="Site information">
          <a href="/legal">{labels.legal}</a>
          <a href={`mailto:${email}`}>{labels.contact}</a>
        </nav>
      </div>

      {items.map((c, k) => (
        <a
          key={c.slug}
          className="cell"
          href={`/collections/${c.slug}`}
          style={css({ '--area': AREA[k] })}
          aria-labelledby={`t-${c.slug}`}
          aria-describedby={`d-${c.slug}`}
          {...hover(AREA[k])}
        >
          <div className="ph" style={css({ viewTransitionName: `cover-${c.slug}` })}>
            <Picture photo={c.cover} palette={c.palette} alt="" sizes="(min-width:761px) 60vw, 100vw" className="fill" eager={k === 0} />
          </div>
          <span className="tag mono" aria-hidden="true">[{pad(k + 1)}]</span>
          <div className="info">
            <h3 id={`t-${c.slug}`}>{c.title}</h3>
            <p id={`d-${c.slug}`}>{c.description}</p>
            <span className="mono">{[c.films, `${c.frames} frames`].filter(Boolean).join(' — ')}</span>
          </div>
        </a>
      ))}

      <a className="cell archive" href="/collections" style={css({ '--area': 'lib' })} {...hover('lib')}>
        <div className="mosaic" aria-hidden="true">
          {mosaic.map((t, i) => (
            <i key={i}><Picture photo={t.photo} palette={t.palette} index={t.seed} alt="" sizes="120px" className="fill" /></i>
          ))}
        </div>
        <span className="mono">[{labels.archiveTag}]</span>
        <div>
          <h3>{labels.archiveTitle} <span className="arrow" aria-hidden="true">→</span></h3>
          <span className="mono">{collectionsCount} collections · {photoCount} photographs</span>
        </div>
      </a>
    </div>
  );
}
