// Navbar: one dropdown that reshapes itself between menus on large screens,
// and a full-screen sheet on small ones.
const header = document.querySelector<HTMLElement>('[data-nav]');
const lenis = () => (window as unknown as { __lenis?: { stop(): void; start(): void } }).__lenis;

if (header) {
  let lastCloseY = scrollY;
  const onScroll = () => {
    if (Math.abs(scrollY - lastCloseY) > 40) closeDrop();
  };
  addEventListener('scroll', onScroll, { passive: true });

  // ---- Large screens ------------------------------------------------------
  const wrap = header.querySelector<HTMLElement>('[data-nav-wrap]')!;
  const links = header.querySelector<HTMLElement>('[data-nav-links]')!;
  const pill = header.querySelector<HTMLElement>('[data-nav-pill]')!;
  const drop = header.querySelector<HTMLElement>('[data-nav-drop]')!;
  const triggers = [...header.querySelectorAll<HTMLButtonElement>('[data-nav-toggle]')];
  const panels = [...header.querySelectorAll<HTMLElement>('[data-nav-panel]')];
  const hoverable = matchMedia('(hover: hover)').matches;
  let open: HTMLButtonElement | null = null;
  let openedAt = 0;
  let leaving = 0;

  panels.forEach((p) => { p.inert = true; });
  const panelOf = (b: HTMLButtonElement) => document.getElementById(b.getAttribute('aria-controls') ?? '')!;

  function movePill(el: HTMLElement | null) {
    if (!el) { pill.style.opacity = '0'; return; }
    const from = links.getBoundingClientRect();
    const to = el.getBoundingClientRect();
    pill.style.width = `${to.width}px`;
    pill.style.transform = `translateX(${to.left - from.left}px)`;
    pill.style.opacity = '1';
  }

  function placeDrop(panel: HTMLElement, instant: boolean) {
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const box = wrap.getBoundingClientRect();
    const t = open!.getBoundingClientRect();
    const x = Math.max(0, Math.min(box.width - w, t.left + t.width / 2 - box.left - w / 2));
    if (instant) drop.style.transition = 'none';
    drop.style.width = `${w}px`;
    drop.style.height = `${h}px`;
    drop.style.setProperty('--x', `${x}px`);
    if (instant) {
      void drop.offsetWidth; // Apply the size before turning movement back on.
      drop.style.transition = '';
    }
  }

  function setOpen(btn: HTMLButtonElement | null) {
    const wasOpen = !!open;
    if (btn !== open) openedAt = performance.now();
    open = btn;
    lastCloseY = scrollY;
    const at = btn ? triggers.indexOf(btn) : -1;
    triggers.forEach((b) => b.setAttribute('aria-expanded', String(b === btn)));
    panels.forEach((p, i) => {
      p.dataset.pos = i === at ? 'active' : i < at ? 'before' : 'after';
      p.inert = i !== at;
    });
    drop.dataset.open = String(!!btn);
    if (btn) placeDrop(panelOf(btn), !wasOpen);
    movePill(btn);
  }
  function closeDrop() {
    if (open) setOpen(null);
  }

  triggers.forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      // A click right after hovering open should not snap the menu shut.
      if (open === b && e.detail > 0 && performance.now() - openedAt < 500) return;
      setOpen(open === b ? null : b);
    });
    if (hoverable) {
      b.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        clearTimeout(leaving);
        setOpen(b);
      });
    }
    b.addEventListener('focus', () => movePill(b));
    b.addEventListener('blur', () => { if (!open) movePill(null); });
  });
  wrap.addEventListener('pointerenter', () => clearTimeout(leaving));
  wrap.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    leaving = window.setTimeout(closeDrop, 180);
  });
  document.addEventListener('click', (e) => {
    if (open && !wrap.contains(e.target as Node)) closeDrop();
  });

  // Panels sit after the bar in the page, so Tab is steered into the open menu.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) {
      const b = open;
      closeDrop();
      b.focus();
    }
  });
  header.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !open) return;
    const items = [...panelOf(open).querySelectorAll<HTMLElement>('a')];
    if (!items.length) return;
    const here = document.activeElement as HTMLElement;
    if (here === open && !e.shiftKey) {
      e.preventDefault();
      items[0].focus();
    } else if (here === items[0] && e.shiftKey) {
      e.preventDefault();
      open.focus();
    } else if (here === items.at(-1) && !e.shiftKey) {
      const next = triggers[triggers.indexOf(open) + 1];
      e.preventDefault();
      if (next) next.focus();
      else header.querySelector<HTMLElement>('.nav-quiet')?.focus();
      if (!next) closeDrop();
    }
  });

  // ---- Small screens: the full-screen sheet --------------------------------
  const burger = header.querySelector<HTMLButtonElement>('[data-burger]')!;
  const sheet = document.querySelector<HTMLElement>('[data-sheet]')!;
  const accordions = [...sheet.querySelectorAll<HTMLButtonElement>('[data-acc]')];
  sheet.inert = true;

  function setSheet(on: boolean) {
    sheet.dataset.open = String(on);
    sheet.inert = !on;
    header!.dataset.menu = String(on);
    burger.setAttribute('aria-expanded', String(on));
    document.documentElement.style.overflow = on ? 'hidden' : '';
    if (on) lenis()?.stop();
    else lenis()?.start();
  }
  burger.addEventListener('click', () => setSheet(sheet.dataset.open !== 'true'));
  sheet.addEventListener('click', (e) => {
    if ((e.target as Element).closest('a')) setSheet(false);
  });
  // Coming back with the browser's Back button must not find the menu still open.
  addEventListener('pageshow', () => { if (sheet.dataset.open === 'true') setSheet(false); });

  accordions.forEach((a) => {
    a.addEventListener('click', () => {
      const opening = a.getAttribute('aria-expanded') !== 'true';
      accordions.forEach((other) => {
        const on = other === a && opening;
        other.setAttribute('aria-expanded', String(on));
        const body = document.getElementById(other.getAttribute('aria-controls') ?? '')!;
        body.inert = !on;
      });
    });
  });

  document.addEventListener('keydown', (e) => {
    if (sheet.dataset.open !== 'true') return;
    if (e.key === 'Escape') {
      setSheet(false);
      burger.focus();
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep keyboard focus inside the open menu.
    const items = [burger, ...sheet.querySelectorAll<HTMLElement>('a, button')].filter((el) => !el.closest('[inert]'));
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  addEventListener('resize', () => {
    closeDrop();
    if (innerWidth >= 1024 && sheet.dataset.open === 'true') setSheet(false);
  }, { passive: true });

  onScroll();
}
