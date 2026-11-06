// When everything happens in the 3D scan scene, in seconds from the start of a beat.
// One beat is one parcel. Change the numbers here to retime the whole scene.
export const T = {
  beat: 9.6,
  arrive: 1.3, // belt runs fast until the parcel nears the laser
  crawl: 2.9, // then slowly, through the laser curtain
  stop: 3.5, // comes to rest
  laserOn: 1.05, laserOff: 3.1,
  mesh: 2.5, meshFor: 1.0, // digital-twin outline draws in
  lock: 3.35, lockFor: 0.7, // detection brackets lock on
  dims: 3.8, dimsFor: 0.9, dimsGap: 0.12, // dimension lines and count-up labels
  chip: 5.0,
  waveFor: 2.6, waveReach: 110, // the wave of machine vision through the hall, in seconds and scene units
  verified: 5.3,
  drop: 3.6, dropFor: 1.0, // the item dropping into the box on the vAudit feed
  clear: 8.3, clearFor: 0.6, // everything clears before the belt moves again
};

export const CURTAIN = -3.5; // where the laser hangs, along the belt
export const SPACING = 30; // distance between parcels on the belt

const CRAWL_SPEED = 3.5;
const CRAWL_START = -6.3;
const CRAWL_END = -0.7;

const hermite = (t: number, x0: number, x1: number, v0: number, v1: number, d: number) => {
  const u = t / d, u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * x0 + (u3 - 2 * u2 + u) * d * v0 + (-2 * u3 + 3 * u2) * x1 + (u3 - u2) * d * v1;
};

/** Where the belt has carried a parcel at this moment of a beat; rests at 0. */
export function beltAt(t: number) {
  if (t <= 0) return -SPACING;
  if (t < T.arrive) return hermite(t, -SPACING, CRAWL_START, 0, CRAWL_SPEED, T.arrive);
  if (t < T.crawl) return CRAWL_START + (t - T.arrive) * ((CRAWL_END - CRAWL_START) / (T.crawl - T.arrive));
  if (t < T.stop) return hermite(t - T.crawl, CRAWL_END, 0, CRAWL_SPEED, 0, T.stop - T.crawl);
  return 0;
}

export const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const easeOut = (v: number) => 1 - (1 - clamp(v)) ** 4; // close to --ease-hero
export const easeInOut = (v: number) => { const x = clamp(v); return x * x * (3 - 2 * x); };
/** 0 to 1 over a window of the beat. */
export const span = (t: number, at: number, length: number) => clamp((t - at) / length);
