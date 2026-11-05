// Reads design tokens for WebGL, so tokens.css also controls every effect.
import { Vector3 } from 'three';

export const num = (name: string) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));

/** Any CSS color from tokens.css, as sRGB values from 0 to 1. */
export function token(name: string) {
  const probe = document.createElement('i');
  probe.style.cssText = `color:var(${name});display:none`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return new Vector3(r / 255, g / 255, b / 255);
}

export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const quality = (limit = num('--webgl-quality') || 1.5) => Math.min(devicePixelRatio, limit);
