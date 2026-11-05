import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import './nav';

gsap.registerPlugin(ScrollTrigger, SplitText);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const slow = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--duration-slow')) / 1000 || 1.1;

// WebGL loads separately, so words and photos always appear first.
const webgl = () => {
  import('./hero').then((m) => m.startHeroes()).catch(() => document.documentElement.classList.remove('anim'));
  if (document.querySelector('[data-album]')) import('./viewer').then((m) => m.startViewer());
  const vision = document.querySelectorAll<HTMLElement>('[data-vision]');
  if (vision.length) import('../three/vision').then((m) => vision.forEach((v) => m.startVision(v)));
  const flight = document.querySelector<HTMLElement>('[data-flight]');
  if (flight) import('../three/flight').then((m) => m.startFlight(flight));
  const scan = document.querySelector<HTMLCanvasElement>('[data-scan]');
  if (scan) import('../three/scan').then((m) => m.startScan(scan));
  const contour = document.querySelector<HTMLCanvasElement>('[data-contour]');
  if (contour) new IntersectionObserver((e, io) => {
    if (!e[0].isIntersecting) return;
    io.disconnect();
    import('../three/contour').then((m) => m.startContour(contour));
  }, { rootMargin: '400px' }).observe(contour);
};

if (!reduced) {
  const lenis = new Lenis({ lerp: 0.1 });
  (window as unknown as { __lenis: Lenis }).__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Headlines rise line by line from behind a mask.
  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>('[data-lines]').forEach((el) => {
      gsap.set(el, { visibility: 'visible' });
      SplitText.create(el, {
        type: 'lines', mask: 'lines', autoSplit: true, linesClass: 'line',
        onSplit: (self) => gsap.from(self.lines, {
          yPercent: 112, duration: slow * 1.15, ease: 'expo.out', stagger: 0.09,
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }),
      });
    });
    ScrollTrigger.refresh();
  });

  // Statements darken word by word while their section holds on screen.
  document.querySelectorAll<HTMLElement>('[data-scrub]').forEach((el) => {
    const words = (el.textContent ?? '').trim().split(/\s+/);
    el.setAttribute('aria-label', words.join(' '));
    el.innerHTML = words.map((w) => `<span aria-hidden="true" class="sw">${w}</span>`).join(' ');
    const holder = el.closest<HTMLElement>('[data-scrub-area]');
    gsap.fromTo(el.querySelectorAll('.sw'), { opacity: 0.14 }, {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: holder
        ? { trigger: holder, start: 'top 15%', end: '60% bottom', scrub: true }
        : { trigger: el, start: 'top 82%', end: 'bottom 55%', scrub: true },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: slow, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top bottom', once: true },
    });
  });

  // Photos open upward and settle as they arrive.
  document.querySelectorAll<HTMLElement>('[data-rise]').forEach((el) => {
    gsap.to(el, {
      clipPath: `inset(0% 0 0 0 round ${getComputedStyle(document.documentElement).getPropertyValue('--radius-lg')})`, duration: slow * 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
    const img = el.querySelector('img');
    if (img) gsap.from(img, { scale: 1.16, duration: slow * 1.7, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // The landing page video opens out to full width as it arrives.
  const radius = getComputedStyle(document.documentElement).getPropertyValue('--radius-lg').trim();
  document.querySelectorAll<HTMLElement>('[data-grow]').forEach((el) => {
    gsap.fromTo(el, { clipPath: `inset(0 6% round ${radius})` }, {
      clipPath: `inset(0 0% round ${radius})`, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 30%', scrub: true },
    });
  });

  // Team photos drift at different speeds.
  document.querySelectorAll<HTMLElement>('[data-lag]').forEach((el) => {
    gsap.fromTo(el, { y: () => innerHeight * parseFloat(el.dataset.lag ?? '0.1') }, {
      y: 0, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'center center', scrub: true },
    });
  });

  // What Sets Us Apart: the page holds while the cards travel sideways.
  const track = document.querySelector<HTMLElement>('[data-track]');
  if (track) {
    gsap.matchMedia().add('(min-width: 64rem)', () => {
      const pinned = track.parentElement!;
      const distance = () => Math.max(0, track.scrollWidth - innerWidth);
      gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: {
          trigger: pinned, pin: true, start: 'top top', end: () => `+=${distance()}`, scrub: true,
          anticipatePin: 1, invalidateOnRefresh: true,
        },
      });
    });
  }
}

// Homepage solutions: whichever step is mid-screen shows its visual.
const steps = [...document.querySelectorAll<HTMLElement>('.sol-step')];
const stack = [...document.querySelectorAll<HTMLElement>('.sol-media')];
if (steps.length) {
  let current = -1;
  const update = () => {
    const middle = innerHeight * 0.62;
    let i = 0;
    steps.forEach((s, n) => { if (s.getBoundingClientRect().top < middle) i = n; });
    if (i === current) return;
    current = i;
    steps.forEach((s, n) => { s.dataset.active = String(n === i); });
    stack.forEach((s, n) => { s.dataset.active = String(n <= i); });
  };
  update();
  addEventListener('scroll', update, { passive: true });
}

// YouTube loads only when someone presses play.
document.querySelectorAll<HTMLButtonElement>('[data-video]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${btn.dataset.video}?autoplay=1&rel=0`;
    f.title = btn.getAttribute('aria-label') ?? '';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    f.className = 'absolute inset-0 size-full';
    btn.closest('[data-video-wrap]')?.setAttribute('data-playing', 'true');
    btn.replaceWith(f);
  });
});

webgl();
addEventListener('load', () => ScrollTrigger.refresh());
