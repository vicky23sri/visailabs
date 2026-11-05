// Hero background: a calm 3D surface of fine points, like a depth sensor's scan
// of the world. An orange scan line travels across it, and it lifts near the mouse.
import {
  BufferAttribute, BufferGeometry, LinearSRGBColorSpace, PerspectiveCamera, Plane, Points, Raycaster,
  Scene, ShaderMaterial, Vector2, Vector3, WebGLRenderer,
} from 'three';
import { num, quality, reduced, token } from './tokens';

const vertex = /* glsl */ `
  uniform float uTime, uSize, uScan, uLift;
  uniform vec2 uPointer;
  varying float vHot, vFade, vLeft;

  float surface(vec2 p) {
    return 0.34 * sin(p.x * 0.5 + uTime * 0.2)
      + 0.26 * sin(p.y * 0.62 - uTime * 0.16 + p.x * 0.22)
      + 0.11 * sin((p.x + p.y) * 1.25 + uTime * 0.26)
      + 0.05 * sin(p.x * 2.5 - p.y * 1.8 + uTime * 0.34);
  }
  void main() {
    vec3 p = position;
    vec2 d = p.xz - uPointer;
    p.y = surface(p.xz) + uLift * 0.75 * exp(-dot(d, d) * 0.22);
    vHot = smoothstep(0.26, 0.0, abs(p.z - uScan));
    vFade = smoothstep(-21.0, -7.0, p.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // Keeps the surface quieter behind the headline on the left.
    vLeft = smoothstep(-0.85, 0.25, gl_Position.x / gl_Position.w);
    gl_PointSize = uSize * (1.0 + vHot * 0.7) * (7.0 / -mv.z);
  }
`;
const fragment = /* glsl */ `
  uniform vec3 uInk, uHot;
  varying float vHot, vFade, vLeft;
  void main() {
    if (length(gl_PointCoord - 0.5) > 0.5) discard;
    float ink = mix(0.1, 0.42, vLeft) * vFade;
    gl_FragColor = vec4(mix(uInk, uHot, vHot), max(ink, vHot * vFade));
  }
`;

export function startWave(canvas: HTMLCanvasElement) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch {
    return; // Without WebGL the hero simply keeps its clean background.
  }
  renderer.outputColorSpace = LinearSRGBColorSpace;
  const pixel = quality();
  renderer.setPixelRatio(pixel);

  const phone = innerWidth < 768;
  const total = num(phone ? '--wave-points-phone' : '--wave-points') || 40000;
  const X = 17, ZNEAR = 6, ZFAR = -22;
  const cols = Math.round(Math.sqrt((total * (2 * X)) / (ZNEAR - ZFAR)));
  const rows = Math.round(total / cols);
  const pos = new Float32Array(cols * rows * 3);
  for (let r = 0, i = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++, i += 3) {
      pos[i] = -X + (2 * X * c) / (cols - 1);
      pos[i + 2] = ZFAR + ((ZNEAR - ZFAR) * r) / (rows - 1);
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  const u = {
    uTime: { value: 8 }, uSize: { value: (num('--wave-point-size') || 1.6) * pixel }, uScan: { value: 0 }, uLift: { value: 0 },
    uPointer: { value: new Vector2(0, 0) }, uInk: { value: token('--color-wave') }, uHot: { value: token('--color-orange') },
  };
  const points = new Points(geo, new ShaderMaterial({ uniforms: u, vertexShader: vertex, fragmentShader: fragment, transparent: true, depthWrite: false }));
  points.frustumCulled = false;
  const scene = new Scene();
  scene.add(points);
  const camera = new PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(0, 2.5, 7.4);
  camera.lookAt(0, -0.35, -4);

  const draw = () => renderer.render(scene, camera);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    draw();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  canvas.style.opacity = '1';
  if (reduced()) return;

  const ray = new Raycaster();
  const floor = new Plane(new Vector3(0, 1, 0), 0);
  const hit = new Vector3();
  const goal = new Vector2(0, 0);
  let liftGoal = 0;
  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.clientY > r.bottom || e.clientY < r.top) { liftGoal = 0; return; }
    ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
    if (ray.ray.intersectPlane(floor, hit)) {
      goal.set(hit.x, hit.z);
      liftGoal = 1;
    }
  }, { passive: true });

  const seconds = num('--wave-scan-seconds') || 9;
  let on = false;
  const begin = performance.now();
  const tick = (now: number) => {
    if (!on) return;
    const t = (now - begin) / 1000;
    u.uTime.value = 8 + t;
    u.uScan.value = ZFAR + 6 + (((t / seconds) % 1) * (ZNEAR - ZFAR));
    u.uPointer.value.lerp(goal, 0.05);
    u.uLift.value += (liftGoal - u.uLift.value) * 0.04;
    draw();
    requestAnimationFrame(tick);
  };
  new IntersectionObserver((e) => {
    const next = e[0].isIntersecting;
    if (next && !on) { on = true; requestAnimationFrame(tick); } else on = next;
  }).observe(canvas);
}
