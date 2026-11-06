// The site navbar, on every page. Transparent over a dark hero, frosted glass
// once scrolled (and always frosted on pages without a dark hero: see nav-hero.css).
// Wording and links: src/data/site.ts. Colors and sizes: src/styles/tokens.css.
import { LazyMotion, MotionConfig, domAnimation, m, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type FocusEvent, type PointerEvent } from 'react';
import { empLogin, navbar, site, ui } from '../../data/site';
import { newTab } from '../../lib/links';
import { ArrowIcon, NavIcon } from './icons';
import Magnetic from './Magnetic';
import MegaMenu from './MegaMenu';

const EASE = [0.22, 1, 0.36, 1] as const; // same curve as --ease-hero
const SCROLLED_AFTER = 24; // pixels of scroll before the bar turns to glass
const CLOSE_DELAY = 180; // grace period for the pointer leaving the mega-menu, in ms
const STAGGER = 0.08; // seconds between each link in the phone menu

const sheet: Variants = {
  closed: { x: '100%', transition: { duration: 0.5, ease: EASE } },
  open: { x: 0, transition: { duration: 0.8, ease: EASE } },
};
const sheetRow: Variants = {
  closed: { opacity: 0, x: 24, transition: { duration: 0.2 } },
  open: (i: number) => ({ opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE, delay: 0.12 + i * STAGGER } }),
};

const lenis = () => (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;

interface Props { path: string; logo: { src: string; w: number; h: number } }

export default function Navbar({ path, logo }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [mark, setMark] = useState({ x: 0, w: 0, on: false });

  const header = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const leaving = useRef(0);
  const openedAt = useRef(0);
  const openedScroll = useRef(0);

  // ---- The indicator: rests on the current page, slides to whatever is hovered.
  const moveMark = useCallback((el: Element | null) => {
    const target = el ?? list.current?.querySelector('[aria-current="page"]');
    if (!target || !list.current) {
      setMark((old) => ({ ...old, on: false }));
      return;
    }
    const from = list.current.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    setMark({ x: to.left - from.left, w: to.width, on: true });
  }, []);
  const hoverMark = (e: PointerEvent | FocusEvent) => moveMark(e.currentTarget);
  const restMark = () => moveMark(megaOpen ? trigger.current : null);

  useEffect(() => {
    moveMark(megaOpen ? trigger.current : null);
    document.fonts?.ready.then(() => moveMark(megaOpen ? trigger.current : null));
  }, [moveMark, megaOpen]);

  // ---- Mega-menu
  const openMega = () => {
    window.clearTimeout(leaving.current);
    if (!megaOpen) {
      openedAt.current = performance.now();
      openedScroll.current = scrollY;
    }
    setMegaOpen(true);
  };
  const closeMega = useCallback(() => setMegaOpen(false), []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(scrollY > SCROLLED_AFTER);
      if (Math.abs(scrollY - openedScroll.current) > 40) setMegaOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMegaOpen((was) => {
        if (was) trigger.current?.focus();
        return false;
      });
    };
    const onClick = (e: MouseEvent) => {
      if (!header.current?.contains(e.target as Node)) setMegaOpen(false);
    };
    const onResize = () => {
      setMegaOpen(false);
      moveMark(null);
      if (innerWidth >= 1024) setMenuOpen(false);
    };
    // Coming back with the browser's Back button must not find a menu still open.
    const onShow = () => {
      setMegaOpen(false);
      setMenuOpen(false);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    addEventListener('pageshow', onShow);
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onResize);
      removeEventListener('pageshow', onShow);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [moveMark]);

  // ---- Phone menu: locks the page and keeps keyboard focus inside.
  useEffect(() => {
    if (!menuOpen) return;
    document.documentElement.style.overflow = 'hidden';
    lenis()?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        burger.current?.focus();
        return;
      }
      if (e.key !== 'Tab' || !menu.current) return;
      const items = [burger.current!, ...menu.current.querySelectorAll<HTMLElement>('a, button')].filter((el) => !el.closest('[inert]'));
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
      lenis()?.start();
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <header
          ref={header}
          className="vnav"
          data-scrolled={scrolled}
          data-menu={menuOpen}
          onPointerEnter={() => window.clearTimeout(leaving.current)}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') leaving.current = window.setTimeout(closeMega, CLOSE_DELAY);
          }}
        >
          <div className="vnav-glass" aria-hidden="true" />
          <div className="vnav-bar shell">
            <a href="/" aria-label={`${site.name} home`} className="vnav-logo" onClick={closeMenu}>
              <img src={logo.src} width={logo.w} height={logo.h} alt="" />
            </a>

            <nav aria-label="Primary" className="vnav-center">
              <ul ref={list} className="vnav-links" onPointerLeave={restMark}>
                <li
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) closeMega();
                  }}
                >
                  <button
                    ref={trigger}
                    type="button"
                    className="vnav-link"
                    aria-expanded={megaOpen}
                    aria-controls="mega-menu"
                    onPointerEnter={(e) => {
                      if (e.pointerType !== 'mouse') return;
                      hoverMark(e);
                      openMega();
                    }}
                    onFocus={hoverMark}
                    onBlur={restMark}
                    onClick={(e) => {
                      // A click right after hovering open should not snap the menu shut.
                      if (megaOpen && e.detail > 0 && performance.now() - openedAt.current < 500) return;
                      if (megaOpen) closeMega();
                      else openMega();
                    }}
                  >
                    {navbar.products.label}
                    <svg className="vnav-caret" viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m1 1 4 4 4-4" /></svg>
                  </button>
                  {/* Directly after its button, so Tab walks straight into the open menu. */}
                  <MegaMenu id="mega-menu" open={megaOpen} onNavigate={closeMega} />
                </li>
                {navbar.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="vnav-link"
                      aria-current={l.href === path ? 'page' : undefined}
                      onPointerEnter={(e) => {
                        hoverMark(e);
                        leaving.current = window.setTimeout(closeMega, CLOSE_DELAY);
                      }}
                      onFocus={(e) => {
                        hoverMark(e);
                        closeMega();
                      }}
                      onBlur={restMark}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <span
                aria-hidden="true"
                className="vnav-mark"
                style={{ transform: `translateX(${mark.x}px)`, width: mark.w, opacity: mark.on ? 1 : 0 }}
              />
            </nav>

            <div className="vnav-actions">
              <a href={empLogin.href} className="vnav-quiet" onFocus={closeMega}>{empLogin.label}</a>
              <Magnetic href={navbar.cta.href} className="vnav-cta">{navbar.cta.label}</Magnetic>
            </div>

            <button
              ref={burger}
              type="button"
              className="vnav-burger"
              aria-expanded={menuOpen}
              aria-controls="vnav-sheet"
              aria-label={menuOpen ? ui.close : ui.menu}
              onClick={() => setMenuOpen((on) => !on)}
            >
              <span /><span /><span />
            </button>
          </div>

          {/* Phone and tablet menu */}
          <m.div
            ref={menu}
            id="vnav-sheet"
            className="vnav-sheet"
            data-open={menuOpen}
            inert={!menuOpen}
            variants={sheet}
            initial="closed"
            animate={menuOpen ? 'open' : 'closed'}
          >
            <ul className="sheet-links">
              <m.li variants={sheetRow} custom={0}>
                <button type="button" className="sheet-link" aria-expanded={productsOpen} aria-controls="sheet-products" onClick={() => setProductsOpen((on) => !on)}>
                  {navbar.products.label}
                  <span className="sheet-plus" aria-hidden="true" />
                </button>
                <div id="sheet-products" className="sheet-fold" data-open={productsOpen} inert={!productsOpen}>
                  <div className="sheet-fold-inner">
                    {navbar.products.groups.map((g) => (
                      <div key={g.name} className="sheet-group">
                        <a href={g.href} {...newTab(g.href)} className="mega-name" onClick={closeMenu}>{g.name}</a>
                        <ul>
                          {g.items.map((item) => (
                            <li key={item.href}>
                              <a href={item.href} {...newTab(item.href)} className="sheet-item" onClick={closeMenu}>
                                <span className="mega-icon"><NavIcon name={item.icon} /></span>
                                {item.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </m.li>
              {navbar.links.map((l, i) => (
                <m.li key={l.href} variants={sheetRow} custom={i + 1}>
                  <a href={l.href} className="sheet-link" aria-current={l.href === path ? 'page' : undefined} onClick={closeMenu}>{l.label}</a>
                </m.li>
              ))}
            </ul>
            <m.div className="sheet-foot" variants={sheetRow} custom={navbar.links.length + 1}>
              <a href={navbar.cta.href} className="vnav-cta sheet-cta" onClick={closeMenu}>{navbar.cta.label}<ArrowIcon /></a>
              <a href={empLogin.href} className="vnav-quiet">{empLogin.label}</a>
            </m.div>
          </m.div>
        </header>
      </MotionConfig>
    </LazyMotion>
  );
}
