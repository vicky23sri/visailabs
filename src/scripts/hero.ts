// The hero film. Only transforms and opacity animate, so the browser's graphics
// chip does the work; each photo is decoded before it appears, so nothing stutters.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const css = getComputedStyle(document.documentElement);
const seconds = (name: string, fallback: number) => parseFloat(css.getPropertyValue(name)) || fallback;

export function startHeroes() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-hero]').forEach((hero) => {
    const film = hero.querySelector<HTMLElement>('[data-film]');
    if (!film) return;
    const shots = [...film.querySelectorAll<HTMLImageElement>('.film-shot')];
    const bars = [...hero.querySelectorAll<HTMLElement>('[data-film-bars] i')];
    const hold = seconds('--film-hold-seconds', 6.5);
    const fade = seconds('--film-fade-seconds', 2);
    const push = seconds('--film-push', 0.09);

    const load = (img: HTMLImageElement) => {
      if (img.dataset.src) {
        img.srcset = img.dataset.srcset ?? '';
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
      return img.decode().catch(() => undefined);
    };

    let live: gsap.core.Tween[] = [];
    const track = (t: gsap.core.Tween) => {
      live = live.filter((x) => x.isActive() || x.paused());
      live.push(t);
      return t;
    };
    // Slow camera move: odd shots drift one way, even shots the other.
    const move = (img: HTMLImageElement, i: number) => {
      const dir = i % 2 ? 1 : -1;
      track(gsap.fromTo(img, { scale: 1.04, xPercent: dir * 1.2 }, {
        scale: 1.04 + push, xPercent: -dir * 1.2, duration: hold + fade * 2, ease: 'none', force3D: true,
      }));
    };
    const showBar = (i: number) => {
      bars.forEach((b, n) => gsap.set(b, { scaleX: n < i ? 1 : 0 }));
      if (bars[i]) track(gsap.fromTo(bars[i], { scaleX: 0 }, { scaleX: 1, duration: hold + fade, ease: 'none' }));
    };

    let index = 0;
    let order = 1;
    // The first photo stays hidden until it is decoded and its camera move is set.
    move(shots[0], 0);
    showBar(0);
    load(shots[0]).then(() => gsap.to(shots[0], { opacity: 1, duration: 1.4, ease: 'power1.out' }));

    let visible = true;
    const next = async () => {
      if (!visible) {
        gsap.delayedCall(1, next);
        return;
      }
      const from = shots[index];
      const at = (index + 1) % shots.length;
      const to = shots[at];
      await load(to);
      to.style.zIndex = String(++order);
      move(to, at);
      showBar(at);
      gsap.fromTo(to, { opacity: 0 }, {
        opacity: 1, duration: fade, ease: 'sine.inOut',
        onComplete: () => { gsap.set(from, { opacity: 0 }); },
      });
      index = at;
      load(shots[(at + 1) % shots.length]);
      gsap.delayedCall(hold + fade, next);
    };
    if (shots.length > 1) {
      addEventListener('load', () => load(shots[1]), { once: true });
      gsap.delayedCall(hold, next);
      const sync = () => {
        const run = visible && !document.hidden;
        live.forEach((t) => (run ? t.resume() : t.pause()));
      };
      new IntersectionObserver((e) => { visible = e[0].isIntersecting; sync(); }).observe(hero);
      document.addEventListener('visibilitychange', sync);
    }

    // Scrolling away: the picture falls behind while the words rise and fade.
    const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(film, { yPercent: 14, ease: 'none', force3D: true, scrollTrigger: scrub });
    const copy = hero.querySelector('[data-hero-copy]');
    if (copy) gsap.to(copy, { y: () => -innerHeight * 0.14, opacity: 0, ease: 'none', scrollTrigger: { ...scrub, end: '75% top' } });
  });
}
