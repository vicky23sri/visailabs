// A LiDAR-style 3D scan of a pallet, being dimensioned.
import {
  BoxGeometry, BufferAttribute, BufferGeometry, Color, Group, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial,
  LinearSRGBColorSpace, PerspectiveCamera, PlaneGeometry, Points, Scene, ShaderMaterial, WebGLRenderer, DoubleSide,
} from 'three';
import { num, quality, reduced, token } from './tokens';

type P = number[];
const R = Math.random;

/** Points on a box surface; `shade` fakes light per face, and edges read crisply. */
function box(out: P, cx: number, cy: number, cz: number, w: number, h: number, d: number, count: number) {
  const xy = w * h, xz = w * d, yz = h * d, total = xy + xz + yz;
  for (let i = 0; i < count; i++) {
    const r = R() * total;
    const s = R() < 0.5 ? -0.5 : 0.5;
    let x = R() - 0.5, y = R() - 0.5, z = R() - 0.5, shade: number;
    if (r < xy) { z = s; shade = s > 0 ? 0.92 : 0.42; }
    else if (r < xy + xz) { y = s; shade = s > 0 ? 1 : 0.3; }
    else { x = s; shade = s > 0 ? 0.72 : 0.4; }
    if (R() < 0.24) {
      const f = R() < 0.5;
      if (r < xy) { if (f) x = Math.sign(x) * 0.5; else y = Math.sign(y) * 0.5; }
      else if (r < xy + xz) { if (f) x = Math.sign(x) * 0.5; else z = Math.sign(z) * 0.5; }
      else { if (f) y = Math.sign(y) * 0.5; else z = Math.sign(z) * 0.5; }
      shade = Math.min(1.4, shade + 0.6);
    }
    out.push(cx + x * w, cy + y * h, cz + z * d, shade);
  }
}

type Box = [number, number, number, number, number, number];
const boxes: Box[] = [];
function palletCloud(total: number) {
  const out: P = [];
  boxes.length = 0;
  for (let layer = 0; layer < 3; layer++) {
    for (const x of [-0.82, 0, 0.82]) for (const z of [-0.61, 0.61]) {
      if (layer === 2 && (x > 0.5 || (x === 0 && z > 0))) continue;
      boxes.push([x, -0.42 + layer * 0.72, z, 0.78, 0.69, 1.17]);
    }
  }
  for (const z of [-1.1, -0.55, 0, 0.55, 1.1]) boxes.push([0, -0.86, z, 2.55, 0.05, 0.36]);
  for (const x of [-1.15, 0, 1.15]) boxes.push([x, -0.98, 0, 0.28, 0.2, 2.55]);
  const per = Math.floor((total * 0.92) / boxes.length);
  boxes.forEach((b) => box(out, b[0], b[1], b[2], b[3], b[4], b[5], per));
  // The floor, sampled faintly.
  while (out.length / 4 < total) {
    const a = R() * Math.PI * 2, r = Math.sqrt(R()) * 4.2;
    out.push(Math.cos(a) * r, -1.09, Math.sin(a) * r, 0.1);
  }
  return new Float32Array(out);
}

const vertex = /* glsl */ `
  attribute float aShade;
  uniform float uScan, uSize, uTime;
  varying float vShade, vHot, vDepth;
  void main() {
    vec3 p = position;
    vHot = smoothstep(0.07, 0.0, abs(p.y - uScan));
    vShade = aShade;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vDepth = smoothstep(11.0, 5.0, -mv.z);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 + vHot) * (7.0 / -mv.z);
  }
`;
const fragment = /* glsl */ `
  uniform vec3 uBase, uHot, uBack;
  varying float vShade, vHot, vDepth;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    vec3 c = mix(uBack, uBase, clamp(vShade * mix(0.42, 1.0, vDepth), 0.0, 1.0));
    gl_FragColor = vec4(mix(c, uHot, vHot), 1.0);
  }
`;

export function startScan(canvas: HTMLCanvasElement) {
  const still = reduced();
  const phone = innerWidth < 768;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return;
  }
  renderer.outputColorSpace = LinearSRGBColorSpace;
  canvas.style.backgroundColor = 'var(--color-vision-bg)'; // Covers the fallback photo.
  const pixel = quality();
  renderer.setPixelRatio(pixel);
  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 60);
  const rig = new Group();
  scene.add(rig);

  const count = num(phone ? '--scan-points-phone' : '--scan-points') | 0;
  const data = palletCloud(count);
  const pos = new Float32Array(count * 3), shade = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set(data.subarray(i * 4, i * 4 + 3), i * 3);
    shade[i] = data[i * 4 + 3];
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('aShade', new BufferAttribute(shade, 1));
  const toColor = (v: { x: number; y: number; z: number }) => new Color().setRGB(v.x, v.y, v.z);
  const hot = token('--color-orange');
  const u = {
    uScan: { value: 0 }, uSize: { value: 1.7 * pixel }, uTime: { value: 0 },
    uBase: { value: token('--color-point') }, uHot: { value: hot }, uBack: { value: token('--color-vision-bg') },
  };
  rig.add(new Points(geo, new ShaderMaterial({ uniforms: u, vertexShader: vertex, fragmentShader: fragment })));

  // Dark solids inside the cloud hide the far side, so the scan reads as real objects.
  const solid = new MeshBasicMaterial({ color: toColor(token('--color-vision-bg')), polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
  for (const [x, y, z, w, h, d] of boxes) {
    const m = new Mesh(new BoxGeometry(w * 0.985, h * 0.985, d * 0.985), solid);
    m.position.set(x, y, z);
    rig.add(m);
  }

  // Bounding box: the dimensions being measured.
  const bb = { x: 1.3, y: [-1.08, 1.13], z: 1.28 };
  const pts: number[] = [];
  const k = 0.32;
  for (const x of [-bb.x, bb.x]) for (const y of bb.y) for (const z of [-bb.z, bb.z]) {
    const sy = y > 0 ? -1 : 1;
    pts.push(x, y, z, x - Math.sign(x) * k, y, z, x, y, z, x, y + sy * k, z, x, y, z, x, y, z - Math.sign(z) * k);
  }
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute('position', new BufferAttribute(new Float32Array(pts), 3));
  rig.add(new LineSegments(lineGeo, new LineBasicMaterial({ color: toColor(hot) })));

  const plane = new Mesh(new PlaneGeometry(bb.x * 2, bb.z * 2), new MeshBasicMaterial({ color: toColor(hot), transparent: true, opacity: 0.07, side: DoubleSide, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  rig.add(plane);

  const ptr = { x: 0, y: 0, ex: 0, ey: 0 };
  function paint(t: number) {
    ptr.ex += (ptr.x - ptr.ex) * 0.04;
    ptr.ey += (ptr.y - ptr.ey) * 0.04;
    rig.rotation.y = -0.65 + t * 0.14 + ptr.ex * 0.35;
    rig.rotation.x = 0.28 + ptr.ey * 0.1;
    const s = (Math.sin(t * 0.85) + 1) / 2;
    u.uScan.value = bb.y[0] + (bb.y[1] - bb.y[0]) * s;
    plane.position.y = u.uScan.value;
    renderer.render(scene, camera);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.position.set(0, 0.05, r.width / r.height < 0.9 ? 11.5 : 8.6);
    camera.updateProjectionMatrix();
    paint(2);
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', (e) => {
    ptr.x = (e.clientX / innerWidth) * 2 - 1;
    ptr.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  resize();
  if (still) return;
  let on = false;
  const begin = performance.now();
  const tick = (now: number) => {
    if (!on) return;
    paint((now - begin) / 1000 + 2);
    requestAnimationFrame(tick);
  };
  new IntersectionObserver((e) => {
    const next = e[0].isIntersecting;
    if (next && !on) { on = true; requestAnimationFrame(tick); } else on = next;
  }).observe(canvas);
}
