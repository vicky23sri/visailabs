// Full-screen photo viewer for the Life at VisAI albums.
import gsap from 'gsap';

export function startViewer() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-viewer]');
  if (!dialog) return;
  const q = <T extends Element>(s: string) => dialog.querySelector<T>(s)!;
  const img = q<HTMLImageElement>('[data-viewer-img]');
  const stage = q<HTMLElement>('[data-viewer-stage]');
  const thumbs = q<HTMLElement>('[data-viewer-thumbs]');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lenis = () => (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;

  let photos: string[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;

  const preload = (i: number) => { new Image().src = photos[(i + photos.length) % photos.length]; };

  function show(i: number, dir = 0) {
    index = (i + photos.length) % photos.length;
    const next = photos[index];
    q('[data-viewer-count]').textContent = `${index + 1} / ${photos.length}`;
    [...thumbs.children].forEach((t, n) => {
      t.setAttribute('aria-current', String(n === index));
      if (n === index) t.scrollIntoView({ inline: 'center', block: 'nearest', behavior: still ? 'auto' : 'smooth' });
    });
    const place = () => {
      img.src = next;
      if (still || !dir) { gsap.set(img, { x: 0, opacity: 1 }); return; }
      gsap.fromTo(img, { x: dir * 70, opacity: 0 }, { x: 0, opacity: 1, duration: 0.65, ease: 'expo.out' });
    };
    if (still || !dir) place();
    else gsap.to(img, { x: -dir * 70, opacity: 0, duration: 0.18, ease: 'power2.in', overwrite: true, onComplete: place });
    preload(index + 1);
    preload(index - 1);
  }

  function open(album: HTMLElement, at: number, from: HTMLElement) {
    photos = JSON.parse(album.dataset.images ?? '[]');
    opener = from;
    q('[data-viewer-title]').textContent = album.dataset.album ?? '';
    thumbs.replaceChildren(...photos.map((src, n) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'viewer-thumb';
      b.setAttribute('aria-label', `${n + 1}`);
      const t = document.createElement('img');
      t.src = src.replace('/media/', '/media/thumb/');
      t.alt = '';
      t.loading = 'lazy';
      b.append(t);
      b.addEventListener('click', () => show(n, n >= index ? 1 : -1));
      return b;
    }));
    dialog!.showModal();
    lenis()?.stop();
    show(at);
  }

  document.querySelectorAll<HTMLElement>('[data-album]').forEach((album) => {
    album.querySelectorAll<HTMLElement>('[data-open]').forEach((b) => {
      b.addEventListener('click', () => open(album, Number(b.dataset.open), b));
    });
  });

  q('[data-viewer-close]').addEventListener('click', () => dialog.close());
  q('[data-viewer-prev]').addEventListener('click', () => show(index - 1, -1));
  q('[data-viewer-next]').addEventListener('click', () => show(index + 1, 1));
  dialog.addEventListener('close', () => {
    lenis()?.start();
    img.removeAttribute('src');
    opener?.focus();
  });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1, -1);
    if (e.key === 'ArrowRight') show(index + 1, 1);
  });

  // Swipe on touch screens.
  let startX = 0;
  stage.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    const moved = e.clientX - startX;
    if (Math.abs(moved) > 50 && e.pointerType !== 'mouse') show(index + (moved < 0 ? 1 : -1), moved < 0 ? 1 : -1);
  });
}
