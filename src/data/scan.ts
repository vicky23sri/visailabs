// What the hero's scan scene shows, in both the 3D scene and its SVG fallback.
// Sizes are in cm, weight in kg. All values are illustrative.
export const PARCELS = [
  { l: 42.5, w: 30.2, h: 18.0, kg: 3.4, order: 'ORD-48217' },
  { l: 35.0, w: 24.6, h: 24.0, kg: 2.6, order: 'ORD-48218' },
  { l: 50.0, w: 36.0, h: 14.5, kg: 4.8, order: 'ORD-48219' },
];
export const CAPTURE_CHIP = 'Captured in 0.8s';
export type Parcel = (typeof PARCELS)[number];
