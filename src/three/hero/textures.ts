// Every surface in the scene is painted in code, so the 3D scene needs no asset downloads.
import { CanvasTexture, Color, LinearSRGBColorSpace, RepeatWrapping, SRGBColorSpace } from 'three';

const canvas = (w: number, h = w) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

function finish(c: HTMLCanvasElement, srgb: boolean, repeat = true) {
  const t = new CanvasTexture(c);
  t.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Turns a height field into a normal map. */
function normalMap(height: Float32Array, size: number, strength: number) {
  const c = canvas(size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const at = (x: number, y: number) => height[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x - 1, y) - at(x + 1, y)) * strength;
      const dy = (at(x, y - 1) - at(x, y + 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      img.data[i] = (dx / len) * 127 + 128;
      img.data[i + 1] = (dy / len) * 127 + 128;
      img.data[i + 2] = (1 / len) * 127 + 128;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return finish(c, false);
}

/** Kraft board: long fibres, soft blotches and the faint ribs of the corrugation beneath. */
export function cardboard(base: Color) {
  const size = 512;
  const rand = seeded(7);
  const c = canvas(size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);

  // Blotches, from a small random grid scaled up smoothly.
  const blot = new Float32Array(32 * 32).map(() => rand());
  const smooth = (x: number, y: number) => {
    const fx = (x / size) * 32, fy = (y / size) * 32;
    const x0 = Math.floor(fx) % 32, y0 = Math.floor(fy) % 32, x1 = (x0 + 1) % 32, y1 = (y0 + 1) % 32;
    const tx = fx % 1, ty = fy % 1, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    const top = blot[y0 * 32 + x0] * (1 - sx) + blot[y0 * 32 + x1] * sx;
    const bot = blot[y1 * 32 + x0] * (1 - sx) + blot[y1 * 32 + x1] * sx;
    return top * (1 - sy) + bot * sy;
  };
  const srgb = base.clone().convertLinearToSRGB();
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const rib = Math.sin((y / size) * Math.PI * 2 * 26) * 0.5 + 0.5;
      const grain = rand();
      const shade = 0.9 + (smooth(x, y) - 0.5) * 0.06 + (grain - 0.5) * 0.06 + rib * 0.006;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, srgb.r * 255 * shade);
      img.data[i + 1] = Math.min(255, srgb.g * 255 * shade);
      img.data[i + 2] = Math.min(255, srgb.b * 255 * shade);
      img.data[i + 3] = 255;
      height[y * size + x] = rib * 0.16 + grain * 0.3;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Fibres
  ctx.lineWidth = 1;
  const dark = `#${base.clone().multiplyScalar(0.25).getHexString()}`;
  const light = `#${base.clone().lerp(new Color(1, 1, 1), 0.6).getHexString()}`;
  for (let i = 0; i < 2400; i++) {
    const x = rand() * size, y = rand() * size, len = 6 + rand() * 26, a = (rand() - 0.5) * 0.7;
    ctx.globalAlpha = 0.05 + rand() * 0.1;
    ctx.strokeStyle = rand() > 0.5 ? dark : light;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return { map: finish(c, true), normal: normalMap(height, size, 1.1) };
}

/** Conveyor rubber: a fine diamond tread with a seam every tile, so its travel is visible. */
export function rubber(base: Color) {
  const size = 512;
  const c = canvas(size);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const height = new Float32Array(size * size);
  const rand = seeded(21);
  const srgb = base.clone().convertLinearToSRGB();
  const cell = size / 16;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = ((x / cell) % 1) - 0.5, v = ((y / cell) % 1) - 0.5;
      const stud = Math.abs(u) + Math.abs(v) < 0.26 ? 1 : 0;
      const seam = x < 7 ? 1 : 0;
      const shade = 1 + stud * 0.3 + (rand() - 0.5) * 0.08 - seam * 0.5;
      const i = (y * size + x) * 4;
      img.data[i] = Math.min(255, srgb.r * 255 * shade);
      img.data[i + 1] = Math.min(255, srgb.g * 255 * shade);
      img.data[i + 2] = Math.min(255, srgb.b * 255 * shade);
      img.data[i + 3] = 255;
      height[y * size + x] = stud - seam;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { map: finish(c, true), normal: normalMap(height, size, 1.4) };
}

/** A shipping label with a real-looking barcode and the parcel's order number. */
export function shippingLabel(order: string, ink: string, paper: string, mono: string, seed: number) {
  const c = canvas(512, 340);
  const ctx = c.getContext('2d')!;
  const rand = seeded(seed);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, 512, 340);
  ctx.fillStyle = ink;
  ctx.font = `700 40px ${mono}`;
  ctx.fillText(order, 28, 62);
  ctx.font = `500 20px ${mono}`;
  ctx.fillText('VISAI LABS / DOCK 04', 28, 96);
  ctx.fillRect(28, 112, 456, 3);
  let x = 28;
  while (x < 484) {
    const w = 2 + Math.floor(rand() * 7);
    if (rand() > 0.42) ctx.fillRect(x, 130, w, 150);
    x += w + 1;
  }
  ctx.font = `500 22px ${mono}`;
  ctx.fillText(`4 8 2 1 7   ${String(seed).padStart(3, '0')} 7 7 0 2`, 28, 316);
  return finish(c, true, false);
}

/** The arrows and glass mark printed on a parcel's side. */
export function sidePrint(ink: string) {
  const c = canvas(512, 256);
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 256);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 9;
  ctx.lineCap = 'butt';
  for (const x of [70, 150]) {
    ctx.beginPath();
    ctx.moveTo(x, 200);
    ctx.lineTo(x, 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 26, 88);
    ctx.lineTo(x, 44);
    ctx.lineTo(x + 26, 88);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(40, 212, 140, 9);
  // wine glass
  ctx.beginPath();
  ctx.moveTo(270, 50);
  ctx.lineTo(346, 50);
  ctx.quadraticCurveTo(346, 130, 308, 136);
  ctx.quadraticCurveTo(270, 130, 270, 50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(308, 136);
  ctx.lineTo(308, 205);
  ctx.moveTo(276, 208);
  ctx.lineTo(340, 208);
  ctx.stroke();
  return finish(c, true, false);
}

/** A soft round glow, for haze behind the machine. */
export function glow(color: Color) {
  const c = canvas(256);
  const ctx = c.getContext('2d')!;
  const css = `#${color.getHexString()}`;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, css);
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return finish(c, true, false);
}
