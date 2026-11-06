// The homepage hero. Wording: src/data/site.ts. Colors, sizes and timing: tokens.css.
// The copy reveal is CSS (nav-hero.css) so it starts with the first paint rather than
// waiting for JavaScript. The 3D scene loads afterwards if the device can carry it;
// otherwise the SVG scene plays or holds still.
import { LazyMotion, MotionConfig, domAnimation, m, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { homeHero as copy } from '../../data/site';
import { newTab } from '../../lib/links';
import { ArrowIcon } from './icons';
import Scan3D from './Scan3D';
import ScanAnimation from './ScanAnimation';

const TILT = 3; // degrees the scene tilts toward the pointer
const SHIFT = 8; // pixels the scene moves; the grid moves the other way
const SPRING = { stiffness: 60, damping: 18, mass: 0.6 };

const LOAD_LIMIT = 2500; // ms before the SVG scene plays in the meantime; the 3D scene takes over when it is ready

/** Whether this device should try the 3D scene, the animated fallback or a still image. */
function chooseScene(): 'try-3d' | 'play' | 'still' {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'still';
  if ((navigator.hardwareConcurrency || 8) <= 2 || (nav.deviceMemory ?? 8) <= 2 || nav.connection?.saveData) return 'still';
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return 'play';
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return (navigator.hardwareConcurrency || 8) <= 4 && (nav.deviceMemory ?? 8) <= 4 ? 'play' : 'try-3d';
}

const stagger = (i: number) => ({ '--i': i } as CSSProperties);

export default function Hero({ next }: { next: string }) {
  const hero = useRef<HTMLElement>(null);
  const slot = useRef<HTMLDivElement>(null);
  // 'pending' until the browser has been checked. 'loading', then 'waiting' if that takes a
  // while (the SVG plays meanwhile), then 'live' for the 3D scene. 'play' and 'still' are SVG only.
  const [scene, setScene] = useState<'pending' | 'loading' | 'waiting' | 'live' | 'play' | 'still'>('pending');
  const onReady = useCallback(() => setScene('live'), []);
  const onFail = useCallback(() => setScene('play'), []);

  useEffect(() => {
    const choice = chooseScene();
    setScene(choice === 'try-3d' ? 'loading' : choice);
  }, []);
  useEffect(() => {
    if (scene !== 'loading') return;
    const limit = window.setTimeout(() => setScene((now) => (now === 'loading' ? 'waiting' : now)), LOAD_LIMIT);
    return () => window.clearTimeout(limit);
  }, [scene]);
  const px = useMotionValue(0); // pointer position, -0.5 to 0.5 across the hero
  const py = useMotionValue(0);
  const sx = useSpring(px, SPRING);
  const sy = useSpring(py, SPRING);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-TILT, TILT]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [TILT, -TILT]);
  const x = useTransform(sx, [-0.5, 0.5], [-SHIFT, SHIFT]);
  const y = useTransform(sy, [-0.5, 0.5], [-SHIFT, SHIFT]);
  const gridX = useTransform(sx, [-0.5, 0.5], [SHIFT, -SHIFT]);
  const gridY = useTransform(sy, [-0.5, 0.5], [SHIFT, -SHIFT]);

  useEffect(() => {
    const el = hero.current;
    if (!el || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: PointerEvent) => {
      const box = el.getBoundingClientRect();
      px.set((e.clientX - box.left) / box.width - 0.5);
      py.set((e.clientY - box.top) / box.height - 0.5);
    };
    const leave = () => {
      px.set(0);
      py.set(0);
    };
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [px, py]);

  // Scrolls with the site's smooth scroller when it is running.
  const scrollOn = (e: MouseEvent<HTMLAnchorElement>) => {
    const scroller = (window as unknown as { __lenis?: { scrollTo(t: string): void } }).__lenis;
    if (!scroller) return;
    e.preventDefault();
    scroller.scrollTo(next);
  };

  const words = copy.after.split(' ');
  const wordCount = words.length + 2;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <section ref={hero} data-home-hero data-scene={scene} className="vhero">
          {(scene === 'loading' || scene === 'waiting' || scene === 'live') && <Scan3D slot={slot} hero={hero} onReady={onReady} onFail={onFail} />}
          <m.div className="vhero-backdrop" style={{ x: gridX, y: gridY }} aria-hidden="true">
            <div className="vhero-grid" />
          </m.div>
          <div className="vhero-glow" aria-hidden="true" />

          <div className="vhero-main shell">
            <div className="vhero-copy">
              <h1 className="vhero-title">
                <span className="vhero-mask"><span className="vhero-word" style={stagger(0)}>{copy.before}</span></span>{' '}
                <span className="vhero-mask vhero-nowrap"><span className="vhero-word vhero-shimmer" style={stagger(1)}>{copy.highlight}</span></span>{' '}
                {words.map((word, i) => (
                  <span key={i}><span className="vhero-mask"><span className="vhero-word" style={stagger(i + 2)}>{word}</span></span>{' '}</span>
                ))}
              </h1>

              <div className="vhero-after" style={{ '--after': wordCount } as CSSProperties}>
                <p className="vhero-sub v-up" style={stagger(0)}>{copy.sub}</p>
                <div className="vhero-actions v-up" style={stagger(1)}>
                  <a href={copy.primary.href} {...newTab(copy.primary.href)} className="v-btn v-btn-primary">{copy.primary.label}<ArrowIcon /></a>
                  <a href={copy.secondary.href} {...newTab(copy.secondary.href)} className="v-btn v-btn-outline">{copy.secondary.label}<ArrowIcon /></a>
                </div>
                <ul className="vhero-trust">
                  {copy.trust.map((t, i) => <li key={t} className="v-up" style={stagger(i + 2)}>{t}</li>)}
                </ul>
              </div>
            </div>

            {/* The 3D scene frames itself on this slot; the camera does the parallax there. */}
            <m.div
              ref={slot}
              className="vhero-scene"
              style={scene === 'loading' || scene === 'waiting' || scene === 'live' ? undefined : { rotateX, rotateY, x, y, transformPerspective: 1400 }}
            >
              <ScanAnimation mode={scene === 'play' || scene === 'still' ? scene : scene === 'waiting' ? 'play' : 'pending'} />
            </m.div>
          </div>

          <a href={next} className="vhero-cue" onClick={scrollOn}>
            <span className="vhero-cue-line" aria-hidden="true"><i /></span>
            {copy.cue}
          </a>
        </section>
      </MotionConfig>
    </LazyMotion>
  );
}
