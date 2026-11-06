// The stage for the 3D scene: its canvas, plus the real page text placed over it.
// The 3D code loads only here, so the page's words never wait for it.
import { useEffect, useRef, type RefObject } from 'react';
import { CAPTURE_CHIP, PARCELS } from '../../data/scan';

const UNITS = [
  { k: 'L', unit: 'cm' },
  { k: 'W', unit: 'cm' },
  { k: 'H', unit: 'cm' },
  { k: 'Weight', unit: 'kg' },
];

interface Props {
  slot: RefObject<HTMLDivElement | null>;
  hero: RefObject<HTMLElement | null>;
  onReady: () => void;
  onFail: () => void;
}

export default function Scan3D({ slot, hero, onReady, onFail }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hud = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    const root = hud.current!;
    const q = <E extends Element>(name: string) => root.querySelector<E>(`[data-part="${name}"]`)!;
    // Waits for a quiet moment, so the headline and the rest of the page come first.
    const idle = new Promise<void>((done) => {
      if ('requestIdleCallback' in window) requestIdleCallback(() => done(), { timeout: 1200 });
      else setTimeout(done, 300);
    });
    idle
      .then(() => import('../../three/hero/scene'))
      .then(({ startHeroScene }) => startHeroScene({
        canvas: canvas.current!,
        hero: hero.current!,
        slot: slot.current!,
        feed: q<HTMLElement>('feed'),
        labels: UNITS.map((_, i) => ({ root: q<HTMLElement>(`label-${i}`), num: q<HTMLElement>(`num-${i}`), value: 0 })),
        chip: q<HTMLElement>('chip'),
        check: q<SVGPathElement>('check'),
        verified: q<HTMLElement>('verified'),
        order: q<HTMLElement>('order'),
        onReady,
        onLost: onFail,
      }))
      .then((scene) => {
        if (cancelled) scene.stop();
        else stop = scene.stop;
      })
      .catch((error) => {
        console.warn('3D hero scene could not start; showing the fallback.', error);
        if (!cancelled) onFail();
      });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [hero, slot, onReady, onFail]);

  return (
    <>
      <canvas ref={canvas} className="vhero-canvas" aria-hidden="true" />
      <div className="vhero-scrim" aria-hidden="true" />
      <div ref={hud} className="scan3d-hud" aria-hidden="true">
        {UNITS.map((u, i) => (
          <span key={u.k} data-part={`label-${i}`} className="scan3d-label">
            <span className="scan-label"><b>{u.k}</b> <span data-part={`num-${i}`}>0.0</span> {u.unit}</span>
          </span>
        ))}
        <div data-part="chip" className="scan-chip scan3d-chip">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="var(--color-ok)" opacity="0.18" />
            <path data-part="check" d="m4.5 8.2 2.4 2.4 4.6-5" pathLength={1} className="scan-check" />
          </svg>
          {CAPTURE_CHIP}
        </div>
        <div data-part="feed" className="scan-audit scan3d-feed">
          <span className="scan-rec"><i />REC</span>
          <span data-part="order" className="scan-order">{PARCELS[0].order}</span>
          <span data-part="verified" className="scan-verified">
            <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.5 6.3 2.4 2.4 4.6-5" /></svg>
            Verified
          </span>
        </div>
      </div>
    </>
  );
}
