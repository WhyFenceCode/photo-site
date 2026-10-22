import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import Picture from './Picture';
import type { Collection } from '../lib/types';
import { details, pad } from '../lib/format';

interface Props {
  collection: Collection;
  number: number;
  closeHref: string;
  labels: Record<string, string>;
}

export default function CollectionViewer({ collection: c, number, closeHref, labels }: Props) {
  const N = c.photos.length;
  const [i, setI] = useState(0);
  const closeRef = useRef<HTMLAnchorElement>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const step = (d: number) => setI((v) => (v + d + N) % N);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !N) return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Escape') closeRef.current?.click();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [N]);

  // Keep the active thumbnail centred in its strip (without scrolling the page).
  useEffect(() => {
    const box = thumbsRef.current;
    const t = box?.children[i] as HTMLElement | undefined;
    if (!box || !t) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.scrollTo({
      top: t.offsetTop - box.clientHeight / 2 + t.clientHeight / 2,
      left: t.offsetLeft - box.clientWidth / 2 + t.clientWidth / 2,
      behavior: calm ? 'auto' : 'smooth',
    });
  }, [i]);

  if (!N) {
    return <div className="viewer"><p className="side">No photographs have been added to this collection yet.</p></div>;
  }

  const p = c.photos[i];
  const meta = details(p);
  const onDown = (e: PointerEvent) => { swipe.current = { x: e.clientX, y: e.clientY }; };
  const onUp = (e: PointerEvent) => {
    const s = swipe.current; swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  };

  return (
    <div className="viewer" role="region" aria-roledescription="carousel" aria-label={`${c.title} photographs`}>
      <div className="stage">
        <header className="vtitle mono">
          <span aria-hidden="true">[{pad(number)}]</span>
          <h1>{c.title}</h1>
          {p.film && <p>[{p.film}]</p>}
        </header>

        <div
          className="hero"
          style={{ viewTransitionName: `cover-${c.slug}` } as CSSProperties}
          onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => (swipe.current = null)}
        >
          <div className="hero-in" key={p.id} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${N}`}>
            <Picture photo={p} palette={c.palette} index={i} sizes="(min-width:761px) 60vw, 100vw" eager fit="contain" className="hero-img" />
          </div>
        </div>

        {(p.title || p.caption) && <p className="caption">{[p.title, p.caption].filter(Boolean).join(' — ')}</p>}

        <div className="pn mono" role="group" aria-label="Photo navigation">
          <button type="button" onClick={() => step(-1)}><span aria-hidden="true">←&nbsp;</span>{labels.previous}</button>
          <button type="button" onClick={() => step(1)}>{labels.next}<span aria-hidden="true">&nbsp;→</span></button>
        </div>
        {meta.length > 0 && <p className="meta mono">{meta.join(' · ')}</p>}
      </div>

      <div className="thumbs" ref={thumbsRef} role="group" aria-label="Choose a photograph">
        {c.photos.map((t, k) => (
          <button
            key={t.id} type="button" className="th" onClick={() => setI(k)}
            aria-current={k === i ? 'true' : undefined}
            aria-label={`Show photograph ${k + 1} of ${N}${t.alt ? `: ${t.alt}` : ''}`}
          >
            <Picture photo={t} palette={c.palette} index={k} alt="" sizes="64px" className="fill" />
          </button>
        ))}
      </div>

      <p className="side mono">{c.description} {c.year}.</p>

      <div className="foot">
        <a ref={closeRef} className="back mono" href={closeHref}><span aria-hidden="true">←&nbsp;</span>{labels.close}</a>
        <p className="count mono" aria-hidden="true">{pad(i + 1)} / {pad(N)}</p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">Photograph {i + 1} of {N}. {p.alt}</p>
    </div>
  );
}
