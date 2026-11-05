// Hero behaviour: the moving photo wall and the scroll exit.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const css = getComputedStyle(document.documentElement);

export function startHeroes() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-hero]').forEach((hero) => {
    const seconds = parseFloat(css.getPropertyValue('--wall-seconds')) || 70;
    hero.querySelectorAll<HTMLElement>('[data-wall] > div').forEach((col) => {
      const down = col.parentElement!.dataset.wall === 'down';
      gsap.fromTo(col, { yPercent: down ? -50 : 0 }, { yPercent: down ? 0 : -50, duration: seconds, ease: 'none', repeat: -1 });
    });

    // Scrolling away: the words rise slightly faster than the photo card.
    const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    const copy = hero.querySelector('[data-hero-copy]');
    const card = hero.querySelector('[data-hero-card]');
    if (copy) gsap.to(copy, { y: () => -innerHeight * 0.12, ease: 'none', scrollTrigger: scrub });
    if (card) gsap.to(card, { y: () => -innerHeight * 0.05, ease: 'none', scrollTrigger: scrub });
  });
}
