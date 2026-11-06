// "Who we are" scroll motion. The section holds still while scroll plays one timeline.
// Change the frame shapes here; everything else follows them. Values are insets of the frame,
// in percent: top, right, bottom, left. They animate through clipping and transforms only,
// because moving anything by layout would count against the page's layout-shift score.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const SHAPES = [
  [12, 0, 12, 0], // wide, for the team
  [0, 9, 0, 9], // nearly square, for the camera
  [5, 0, 5, 0], // widest view, for the warehouse
];
const EASE = 'power3.inOut';

export function startWho(root: HTMLElement) {
  const q = <E extends Element = HTMLElement>(s: string) => gsap.utils.toArray<E>(root.querySelectorAll(s));
  const frame = root.querySelector<HTMLElement>('[data-who-frame]')!;
  const scan = root.querySelector<HTMLElement>('[data-who-scan]')!;
  const now = root.querySelector<HTMLElement>('[data-who-now]')!;
  const texts = q('[data-who-text]');
  const chains = q('[data-who-chain]');
  const photos = q('[data-who-photo]');
  const captions = q('[data-who-caption]');
  const ticks = q('[data-who-tick]');
  const rows = (i: number) => q(`[data-who-row="${i}"]`);

  const shape = (i: number) => {
    const [t, r, b, l] = SHAPES[i];
    return { '--t': t, '--r': r, '--b': b, '--l': l };
  };
  gsap.set(frame, shape(0));
  // Each dimension line and caption belongs to one shape and is hidden while the frame changes.
  [chains, captions].forEach((set) => set.forEach((el, i) => gsap.set(el, shape(i))));
  gsap.set(texts.slice(1), { autoAlpha: 0, y: 28 });
  gsap.set(chains, { '--draw': '100%' });
  gsap.set(chains.slice(1), { autoAlpha: 0 });
  gsap.set(captions.slice(1), { autoAlpha: 0 });
  gsap.set(photos.slice(1), { clipPath: 'inset(0 100% 0 0)' });
  gsap.set(scan, { '--at': 0, autoAlpha: 0 });
  gsap.set(q('[data-who-row]'), { autoAlpha: 0, x: -10 });
  gsap.set(ticks, { '--fill': 0 });
  gsap.set(texts[0], { autoAlpha: 0, y: 28 });
  gsap.set(captions[0], { autoAlpha: 0 });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: root,
      start: 'top 55%',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate(self) {
        const at = self.progress * tl.duration();
        const chapter = at < CHANGE[0] ? 0 : at < CHANGE[1] ? 1 : 2;
        const label = `0${chapter + 1}`;
        if (now.textContent !== label) now.textContent = label;
      },
    },
  });
  const CHANGE = [4.6, 9.2]; // middle of each photo change, in timeline units

  /** A chapter arriving: its words, dimension line, spec rows and caption. */
  const arrive = (i: number, at: number) => {
    tl.to(texts[i], { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out' }, at);
    tl.to(chains[i], { autoAlpha: 1, duration: 0.15 }, at);
    tl.to(chains[i], { '--draw': '0%', duration: 1, ease: 'power2.inOut' }, at);
    tl.to(captions[i], { autoAlpha: 1, duration: 0.5 }, at + 0.3);
    rows(i).forEach((row, n) => {
      tl.to(row, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' }, at + 0.35 + n * 0.25);
      tl.to(row.querySelector('path'), { strokeDashoffset: 0, duration: 0.4 }, at + 0.55 + n * 0.25);
    });
    tl.to(ticks[i], { '--fill': 1, duration: 1.2 }, at);
  };
  /** The laser wipes across to the next photo while the frame changes shape. */
  const change = (i: number, at: number) => {
    tl.to(texts[i], { autoAlpha: 0, y: -28, duration: 0.5, ease: 'power2.in' }, at);
    tl.to(chains[i], { autoAlpha: 0, duration: 0.3 }, at);
    tl.to(captions[i], { autoAlpha: 0, duration: 0.3 }, at);
    tl.to(frame, { ...shape(i + 1), duration: 1.3, ease: EASE }, at);
    tl.set(scan, { '--at': 0 }, at + 0.1);
    tl.to(scan, { autoAlpha: 1, duration: 0.1 }, at + 0.1);
    tl.to(scan, { '--at': 100, duration: 1.2, ease: EASE }, at + 0.1);
    tl.to(photos[i + 1], { clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: EASE }, at + 0.1);
    tl.to(scan, { autoAlpha: 0, duration: 0.1 }, at + 1.2);
  };

  arrive(0, 0);
  change(0, 4);
  arrive(1, CHANGE[0] + 0.5);
  change(1, 8.6);
  arrive(2, CHANGE[1] + 0.5);
  tl.to({}, { duration: 2 }, 11); // holds on the finished sheet before the page moves on
  ScrollTrigger.refresh();
}
