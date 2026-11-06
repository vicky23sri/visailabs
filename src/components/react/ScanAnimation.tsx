// The fallback for the 3D scene (see Scan3D.tsx), for reduced motion, weak devices and
// browsers without WebGL. A parcel rides the conveyor, a laser sweeps it, a
// point cloud and mesh build over it, detection brackets lock on and its
// measurements count up. Beside it, vAudit verifies the order on video.
//
// Without JavaScript, on low-power devices and with reduced motion, this exact
// markup is the still image: the first parcel fully measured. No image file needed.
//
// One clock draws everything: render() works out each part's state from the time
// alone, so the loop is seamless by construction and only one loop ever runs.
import { cubicBezier } from 'framer-motion';
import { useEffect, useRef, type CSSProperties } from 'react';
import { CAPTURE_CHIP, PARCELS } from '../../data/scan';

/* ---- CHANGE ME ---------------------------------------------------------- */
// Seconds from the moment a parcel starts moving onto the scanner.
const T = {
  cycle: 8.4, // one parcel, start to next parcel's start
  move: 1.2, // belt travel
  scan: 1.25, scanFor: 1.1, // laser sweep; the point cloud builds with it
  mesh: 2.0, meshFor: 1.0, // wireframe draws
  lock: 2.7, lockFor: 0.7, // brackets lock on and pulse
  dims: 3.2, dimsFor: 0.9, dimsGap: 0.12, // dimension lines and count-up labels
  chip: 4.4, // "Captured" chip
  verified: 4.75, // vAudit badge
  fade: 7.5, fadeFor: 0.6, // overlays clear before the belt moves again
};
/* ------------------------------------------------------------------------- */

const VIEW_W = 640;
const VIEW_H = 560;
const CX = 342; // where the scan position sits in the scene
const CY = 268;
const CM = 3.4; // scene units per centimetre
const BELT = 112; // half the belt's width
const TRAVEL = 340; // how far a parcel moves between stops (a whole number of STRIPE)
const STRIPE = 68; // spacing of the belt's marks
const HEAD_Z = 214; // height of the scanner head
const BINS = 10;

const COS = 0.866;
const SIN = 0.5;
const n = (v: number) => Math.round(v * 100) / 100;
const iso = (x: number, y: number, z = 0): [number, number] => [n(CX + (x - y) * COS), n(CY + (x + y) * SIN - z)];
const pt = (x: number, y: number, z = 0) => iso(x, y, z).join(' ');
const poly = (...p: [number, number, number][]) => 'M' + p.map((q) => pt(...q)).join('L') + 'Z';
const line = (...p: [number, number, number][]) => 'M' + p.map((q) => pt(...q)).join('L');
const pct = (x: number, y: number): CSSProperties => ({ left: `${n((x / VIEW_W) * 100)}%`, top: `${n((y / VIEW_H) * 100)}%` });

// Same numbers on server and browser, so the page hydrates without a mismatch.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(p: (typeof PARCELS)[number], index: number) {
  const L = p.l * CM, W = p.w * CM, H = p.h * CM;
  const x0 = -L / 2, x1 = L / 2, y0 = -W / 2, y1 = W / 2;

  // Point cloud, sorted into slices along the belt so the laser can reveal it.
  const rand = seeded(index * 97 + 11);
  const bins: string[] = Array(BINS).fill('');
  const add = (x: number, y: number, z: number) => {
    const b = Math.min(BINS - 1, Math.floor(((x - x0) / L) * BINS));
    const [sx, sy] = iso(x, y, z);
    bins[b] += `M${sx} ${sy}h0`;
  };
  for (let i = 0; i < 90; i++) add(x0 + rand() * L, y0 + rand() * W, H);
  for (let i = 0; i < 55; i++) add(x0 + rand() * L, y1, rand() * H);
  for (let i = 0; i < 40; i++) add(x1, y0 + rand() * W, rand() * H);

  // Wireframe over the three visible faces.
  let wire = '';
  for (let i = 1; i < 6; i++) {
    const x = x0 + (L * i) / 6;
    wire += line([x, y0, H], [x, y1, H], [x, y1, 0]);
  }
  for (let i = 1; i < 4; i++) {
    const y = y0 + (W * i) / 4;
    wire += line([x0, y, H], [x1, y, H], [x1, y, 0]);
  }
  for (let i = 1; i < 3; i++) {
    const z = (H * i) / 3;
    wire += line([x0, y1, z], [x1, y1, z], [x1, y0, z]);
  }
  const edges = poly([x0, y0, H], [x1, y0, H], [x1, y1, H], [x0, y1, H]) + line([x0, y1, H], [x0, y1, 0], [x1, y1, 0], [x1, y0, 0], [x1, y0, H]) + line([x1, y1, H], [x1, y1, 0]);

  // Detection brackets around the parcel as seen on screen.
  const corners = [[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0], [x0, y0, H], [x1, y0, H], [x1, y1, H], [x0, y1, H]].map(([a, b, c]) => iso(a, b, c));
  const pad = 14, arm = 20;
  const left = Math.min(...corners.map((c) => c[0])) - pad, right = Math.max(...corners.map((c) => c[0])) + pad;
  const top = Math.min(...corners.map((c) => c[1])) - pad, bottom = Math.max(...corners.map((c) => c[1])) + pad;
  const brackets = [
    `M${left} ${top + arm}V${top}H${left + arm}`,
    `M${right - arm} ${top}H${right}V${top + arm}`,
    `M${right} ${bottom - arm}V${bottom}H${right - arm}`,
    `M${left + arm} ${bottom}H${left}V${bottom - arm}`,
  ].join('');

  // Dimension lines sit just off the parcel, with end ticks.
  const off = 20, tick = 6;
  const dimL = line([x0, y1 + off, 0], [x1, y1 + off, 0]) + line([x0, y1 + off - tick, 0], [x0, y1 + off + tick, 0]) + line([x1, y1 + off - tick, 0], [x1, y1 + off + tick, 0]);
  const dimW = line([x1 + off, y1, 0], [x1 + off, y0, 0]) + line([x1 + off - tick, y1, 0], [x1 + off + tick, y1, 0]) + line([x1 + off - tick, y0, 0], [x1 + off + tick, y0, 0]);
  const [hx, hy0] = iso(x1 + 14, y0 - 14, 0);
  const dimH = `M${hx} ${hy0}V${hy0 - H}M${hx - tick} ${hy0}h${tick * 2}M${hx - tick} ${hy0 - H}h${tick * 2}`;
  const [kx, ky] = iso(x0 + L * 0.2, y0 + W * 0.3, H);
  const kgTop = ky - 34 - (index === 1 ? 0 : 6);
  const leader = `M${kx} ${ky}V${kgTop}`;

  const [lx, ly] = iso(0, y1 + off + 20, 0);
  const [wx, wy] = iso(x1 + off + 20, 0, 0);
  return {
    L, W, H, x0, x1, y0, y1, bins, wire, edges, brackets, dimL, dimW, dimH, leader,
    box: { x: (left + right) / 2, y: (top + bottom) / 2 },
    faces: {
      top: poly([x0, y0, H], [x1, y0, H], [x1, y1, H], [x0, y1, H]),
      left: poly([x0, y1, H], [x1, y1, H], [x1, y1, 0], [x0, y1, 0]),
      right: poly([x1, y0, H], [x1, y1, H], [x1, y1, 0], [x1, y0, 0]),
      tape: poly([x0, -7, H], [x1, -7, H], [x1, 7, H], [x0, 7, H]),
      tapeEnd: poly([x1, -7, H], [x1, 7, H], [x1, 7, H * 0.55], [x1, -7, H * 0.55]),
      sticker: poly([x0 + L * 0.62, y0 + W * 0.08, H], [x0 + L * 0.9, y0 + W * 0.08, H], [x0 + L * 0.9, y0 + W * 0.34, H], [x0 + L * 0.62, y0 + W * 0.34, H]),
    },
    labels: {
      l: pct(lx, ly),
      w: pct(wx, wy),
      h: pct(hx + 12, hy0 - H / 2),
      kg: pct(kx, kgTop),
    },
  };
}
const SHAPES = PARCELS.map(build);

// The belt, drawn once. Stripes run past both ends so they can move a full period.
const beltTop = poly([-900, BELT, 0], [900, BELT, 0], [900, -BELT, 0], [-900, -BELT, 0]);
const beltSide = poly([-900, BELT, 0], [900, BELT, 0], [900, BELT, -16], [-900, BELT, -16]);
const beltStripes = Array.from({ length: 28 }, (_, i) => {
  const x = -952 + i * STRIPE;
  return line([x, BELT - 6, 0], [x, -BELT + 6, 0]);
}).join('');
const railNear = line([-900, BELT, 0], [900, BELT, 0]);
const railFar = line([-900, -BELT, 0], [900, -BELT, 0]);
const POST = BELT + 18;
const head = iso(0, 0, HEAD_Z);
const gantryBack = line([0, -POST, -14], [0, -POST, HEAD_Z + 10]);
const gantryFront = line([0, POST, -14], [0, POST, HEAD_Z + 10]) + line([0, POST, HEAD_Z + 10], [0, -POST, HEAD_Z + 10]);

const easeOut = cubicBezier(0.22, 1, 0.36, 1); // the site's motion curve
const belt = cubicBezier(0.65, 0, 0.35, 1); // a conveyor starts and stops evenly
const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function ScanAnimation({ mode }: { mode: 'pending' | 'play' | 'still' }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const section = el.closest<HTMLElement>('section');
    if (mode === 'pending') return;
    if (mode === 'still') {
      el.dataset.state = 'static';
      section?.setAttribute('data-paused', 'true');
      return;
    }

    const q = <E extends Element>(parent: Element, name: string) => parent.querySelector<E>(`[data-part="${name}"]`)!;
    const parts = SHAPES.map((shape, i) => {
      const g = el.querySelector<SVGGElement>(`[data-parcel="${i}"]`)!;
      const labels = el.querySelector<HTMLElement>(`[data-labels="${i}"]`)!;
      return {
        shape, g, labels,
        bins: [...g.querySelectorAll<SVGPathElement>('[data-bin]')],
        wire: q<SVGPathElement>(g, 'wire'),
        edges: q<SVGPathElement>(g, 'edges'),
        brackets: q<SVGPathElement>(g, 'brackets'),
        laser: q<SVGPathElement>(g, 'laser'),
        laserGlow: q<SVGPathElement>(g, 'laser-glow'),
        fan: q<SVGPathElement>(g, 'fan'),
        dims: ['l', 'w', 'h', 'kg'].map((key) => ({
          path: q<SVGPathElement>(g, `dim-${key}`),
          label: q<HTMLElement>(labels, `label-${key}`),
          num: q<HTMLElement>(labels, `num-${key}`),
          value: key === 'kg' ? PARCELS[i].kg : PARCELS[i][key as 'l' | 'w' | 'h'],
        })),
      };
    });
    const stripes = q<SVGPathElement>(el, 'stripes');
    const chip = q<HTMLElement>(el, 'chip');
    const check = q<SVGPathElement>(el, 'check');
    const badge = q<HTMLElement>(el, 'verified');
    const order = q<HTMLElement>(el, 'order');
    const item = q<SVGGElement>(el, 'item');

    // Writes to the page only when a value really changes.
    const seen = new Map<object, Record<string, string>>();
    const put = (node: Element, key: string, value: string) => {
      let was = seen.get(node);
      if (!was) seen.set(node, (was = {}));
      if (was[key] === value) return;
      was[key] = value;
      if (key === 'text') node.textContent = value;
      else if (key === 'd' || key === 'transform') node.setAttribute(key, value);
      else (node as HTMLElement).style.setProperty(key, value);
    };
    const fade = (node: Element, v: number) => put(node, 'opacity', v.toFixed(3));
    const draw = (node: Element, v: number) => put(node, 'stroke-dashoffset', (1 - v).toFixed(3));

    const total = T.cycle * PARCELS.length;

    function render(time: number) {
      const t = time % total;
      const beat = t % T.cycle;
      put(stripes, 'transform', `translate(${n(belt(clamp(beat / T.move)) * TRAVEL * COS % (STRIPE * COS))} ${n(belt(clamp(beat / T.move)) * TRAVEL * SIN % (STRIPE * SIN))})`);

      parts.forEach((p, i) => {
        const local = (t - i * T.cycle + total) % total;
        const gone = local >= T.cycle + T.move;
        put(p.g, 'display', gone ? 'none' : 'inline');
        put(p.labels, 'display', gone || local >= T.cycle ? 'none' : 'block');
        if (gone) return;

        const inP = belt(clamp(local / T.move));
        const outP = belt(clamp((local - T.cycle) / T.move));
        const d = TRAVEL * (inP + outP - 1);
        put(p.g, 'transform', `translate(${n(d * COS)} ${n(d * SIN)})`);
        fade(p.g, clamp(inP * 3) * (1 - clamp((outP - 0.55) * 3)));

        const clear = 1 - clamp((local - T.fade) / T.fadeFor); // everything below fades together

        // Laser and point cloud
        const sweep = (local - T.scan) / T.scanFor;
        const s = p.shape.x0 + p.shape.L * clamp(sweep);
        const on = sweep > -0.1 && sweep < 1.15 ? Math.min(clamp((sweep + 0.1) * 8), clamp((1.15 - sweep) * 8)) : 0;
        fade(p.laser, on);
        fade(p.laserGlow, on * 0.28);
        fade(p.fan, on * 0.16);
        if (on > 0) {
          const { y0, y1, H } = p.shape;
          const trace = line([s, BELT, 0], [s, y1, 0], [s, y1, H], [s, y0, H]);
          put(p.laser, 'd', trace);
          put(p.laserGlow, 'd', trace);
          put(p.fan, 'd', `M${head.join(' ')}L${pt(s, BELT, 0)}L${pt(s, y1, H)}L${pt(s, y0, H)}Z`);
        }
        const dim = 1 - 0.45 * clamp((local - T.mesh) / T.meshFor);
        p.bins.forEach((bin, b) => fade(bin, clamp(sweep * BINS - b) * dim * clear));

        // Mesh
        const mesh = easeOut(clamp((local - T.mesh) / T.meshFor));
        draw(p.wire, mesh);
        fade(p.wire, 0.5 * clear);
        fade(p.edges, mesh * clear);

        // Brackets arrive large and settle, with one small pulse.
        const lock = easeOut(clamp((local - T.lock) / T.lockFor));
        const pulse = Math.sin(clamp((local - T.lock - T.lockFor) / 0.5) * Math.PI) * 0.025;
        const scale = 1 + (1 - lock) * 0.22 + pulse;
        const { x: bx, y: by } = p.shape.box;
        put(p.brackets, 'transform', `translate(${n(bx)} ${n(by)}) scale(${scale.toFixed(4)}) translate(${n(-bx)} ${n(-by)})`);
        fade(p.brackets, clamp((local - T.lock) / 0.25) * clear);

        // Dimension lines draw, labels count up.
        p.dims.forEach((dimension, k) => {
          const at = T.dims + k * T.dimsGap;
          const v = easeOut(clamp((local - at) / T.dimsFor));
          draw(dimension.path, v);
          fade(dimension.path, clear);
          fade(dimension.label, clamp((local - at) / 0.3) * clear);
          put(dimension.label, 'translate', `0 ${n((1 - v) * 6)}px`);
          put(dimension.num, 'text', (dimension.value * v).toFixed(1));
        });
      });

      // Shared by every parcel: the capture chip and the vAudit frame.
      const clear = 1 - clamp((beat - T.fade) / T.fadeFor);
      const chipIn = easeOut(clamp((beat - T.chip) / 0.6));
      fade(chip, clamp((beat - T.chip) / 0.3) * clear);
      put(chip, 'translate', `0 ${n((1 - chipIn) * 8)}px`);
      draw(check, easeOut(clamp((beat - T.chip - 0.15) / 0.5)));

      const badgeIn = easeOut(clamp((beat - T.verified) / 0.6));
      fade(badge, clamp((beat - T.verified) / 0.25) * clear);
      put(badge, 'scale', (0.86 + badgeIn * 0.14).toFixed(3));
      put(order, 'text', PARCELS[Math.floor(t / T.cycle) % PARCELS.length].order);
      const drop = easeOut(clamp((beat - 3.3) / 1.1));
      put(item, 'transform', `translate(0 ${n(drop * 34 - 34)})`);
      fade(item, Math.min(clamp((beat - 3.3) / 0.3), 1 - clamp((beat - 4.2) / 0.3)));
    }

    // The clock only advances while the hero is on screen.
    let running = false, frame = 0, last = 0, clock = 0;
    const tick = (now: number) => {
      // A frame's timestamp can be slightly older than the moment the clock started,
      // so time is never allowed to run backwards. Long gaps count as one short step.
      clock += Math.max(0, Math.min((now - last) / 1000, 0.1));
      last = now;
      render(clock);
      frame = requestAnimationFrame(tick);
    };
    const setRunning = (on: boolean) => {
      if (on === running) return;
      running = on;
      section?.setAttribute('data-paused', String(!on));
      cancelAnimationFrame(frame);
      if (on) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    render(0);
    el.dataset.state = 'live';
    const io = new IntersectionObserver((e) => setRunning(e[0].isIntersecting));
    io.observe(section ?? el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [mode]);

  const first = PARCELS[0];
  return (
    <div
      ref={root}
      className="scan"
      role="img"
      aria-label={`A parcel on a conveyor is scanned and measured: length ${first.l} centimetres, width ${first.w}, height ${first.h}, weight ${first.kg} kilograms. In a second panel, a packing station video verifies order ${first.order}.`}
    >
      <svg className="scan-svg" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
        <defs>
          <linearGradient id="vh-fan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-scan)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--color-scan)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <path d={beltSide} fill="var(--color-belt-side)" />
        <path d={beltTop} fill="var(--color-belt)" />
        <path data-part="stripes" d={beltStripes} className="scan-stripes" />
        <path d={railNear} className="scan-rail" />
        <path d={railFar} className="scan-rail" />
        <path d={gantryBack} className="scan-gantry" />

        {SHAPES.map((s, i) => (
          <g key={i} data-parcel={i} className={i ? 'scan-later' : undefined}>
            <path d={s.faces.left} fill="var(--color-box-left)" />
            <path d={s.faces.right} fill="var(--color-box-right)" />
            <path d={s.faces.top} fill="var(--color-box-top)" />
            <path d={s.faces.tape} fill="var(--color-box-tape)" opacity="0.75" />
            <path d={s.faces.tapeEnd} fill="var(--color-box-tape)" opacity="0.45" />
            <path d={s.faces.sticker} fill="var(--color-white)" opacity="0.8" />

            <path data-part="wire" d={s.wire} pathLength={1} className="scan-wire" />
            <path data-part="edges" d={s.edges} className="scan-edges" />
            {s.bins.map((d, b) => <path key={b} data-bin={b} d={d} className="scan-points" opacity="0.55" />)}

            <path data-part="fan" fill="url(#vh-fan)" style={{ opacity: 0 }} />
            <path data-part="laser-glow" className="scan-laser-glow" style={{ opacity: 0 }} />
            <path data-part="laser" className="scan-laser" style={{ opacity: 0 }} />

            <path data-part="brackets" d={s.brackets} className="scan-brackets" />
            <path data-part="dim-l" d={s.dimL} pathLength={1} className="scan-dim" />
            <path data-part="dim-w" d={s.dimW} pathLength={1} className="scan-dim" />
            <path data-part="dim-h" d={s.dimH} pathLength={1} className="scan-dim" />
            <path data-part="dim-kg" d={s.leader} pathLength={1} className="scan-dim" />
          </g>
        ))}

        <path d={gantryFront} className="scan-gantry" />
        <rect x={head[0] - 15} y={head[1] - 2} width="30" height="16" rx="3" className="scan-head" />
        <circle cx={head[0]} cy={head[1] + 14} r="3.5" fill="var(--color-scan)" />
      </svg>

      {SHAPES.map((s, i) => (
        <div key={i} data-labels={i} className={i ? 'scan-labels scan-later' : 'scan-labels'}>
          <Measure part="l" style={s.labels.l} k="L" value={PARCELS[i].l} unit="cm" />
          <Measure part="w" style={s.labels.w} k="W" value={PARCELS[i].w} unit="cm" />
          <Measure part="h" style={s.labels.h} k="H" value={PARCELS[i].h} unit="cm" side />
          <Measure part="kg" style={s.labels.kg} k="Weight" value={PARCELS[i].kg} unit="kg" />
        </div>
      ))}

      <div data-part="chip" className="scan-chip">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" fill="var(--color-ok)" opacity="0.18" />
          <path data-part="check" d="m4.5 8.2 2.4 2.4 4.6-5" pathLength={1} className="scan-check" />
        </svg>
        {CAPTURE_CHIP}
      </div>

      {/* vAudit: a packing station on video */}
      <div className="scan-audit">
        <svg viewBox="0 0 160 96" className="scan-audit-art" aria-hidden="true">
          <path d="M0 74h160" className="scan-audit-line" />
          <path d="M12 74 24 96M148 74l-12 22" className="scan-audit-line" />
          <path d="M58 48h44v26H58z" fill="var(--color-box-left)" />
          <path d="m58 48-11-8h33l-3 8zM102 48l11-8H80l3 8z" fill="var(--color-box-top)" />
          <g data-part="item">
            <rect x="72" y="26" width="16" height="16" rx="2" className="scan-audit-item" />
          </g>
          <path d="M116 54h22v20h-22z" className="scan-audit-line" />
          <path d="M122 60h10M122 65h10" className="scan-audit-line" />
        </svg>
        <span className="scan-rec"><i />REC</span>
        <span data-part="order" className="scan-order">{first.order}</span>
        <span data-part="verified" className="scan-verified">
          <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.5 6.3 2.4 2.4 4.6-5" /></svg>
          Verified
        </span>
      </div>
    </div>
  );
}

function Measure({ part, style, k, value, unit, side }: { part: string; style: CSSProperties; k: string; value: number; unit: string; side?: boolean }) {
  return (
    <span data-part={`label-${part}`} className={side ? 'scan-label scan-label-side' : 'scan-label'} style={style}>
      <b>{k}</b> <span data-part={`num-${part}`}>{value.toFixed(1)}</span> {unit}
    </span>
  );
}
