// Footer: a moving elevation map of contour lines, like a depth sensor's view.
import {
  LinearSRGBColorSpace, Mesh, NoBlending, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, Vector2, WebGLRenderer,
} from 'three';
import { quality, reduced, token } from './tokens';

const fragment = /* glsl */ `
  uniform vec2 uSize, uPointer;
  uniform vec3 uBack, uHot;
  uniform float uTime;
  varying vec2 vUv;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash(i), f), dot(hash(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
               mix(dot(hash(i + vec2(0, 1)), f - vec2(0, 1)), dot(hash(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
  }
  void main() {
    vec2 p = vUv * vec2(uSize.x / uSize.y, 1.0) * 1.7;
    float t = uTime * 0.035;
    float h = noise(p + vec2(t, -t * 0.6)) + 0.5 * noise(p * 2.1 - t) ;
    vec2 m = uPointer * vec2(uSize.x / uSize.y, 1.0) * 1.7;
    h += 0.34 * exp(-dot(p - m, p - m) * 2.4);
    h += (1.0 - vUv.y) * 0.75;
    float bands = h * 15.0;
    float w = fwidth(bands);
    float line = 1.0 - smoothstep(0.0, w * 1.5, abs(fract(bands) - 0.5));
    float heat = smoothstep(0.1, 1.15, h);
    vec3 c = mix(uBack, uHot, heat * heat * 0.92);
    c = mix(c, mix(uHot, vec3(1.0), heat * 0.8), line * (0.2 + heat * 0.5));
    gl_FragColor = vec4(c, 1.0);
  }
`;

export function startContour(canvas: HTMLCanvasElement) {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false });
  } catch {
    return;
  }
  renderer.outputColorSpace = LinearSRGBColorSpace;
  const pixel = quality(1.25);
  renderer.setPixelRatio(pixel);
  const u = {
    uSize: { value: new Vector2(1, 1) }, uPointer: { value: new Vector2(-9, -9) }, uTime: { value: 40 },
    uBack: { value: token('--color-ink') }, uHot: { value: token('--color-orange') },
  };
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms: u, fragmentShader: fragment, blending: NoBlending,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  })));
  const camera = new OrthographicCamera();
  const draw = () => renderer.render(scene, camera);
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    u.uSize.value.set(r.width, r.height);
    draw();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  canvas.style.opacity = '1';
  if (reduced()) return;
  const smooth = new Vector2(-9, -9), goal = new Vector2(-9, -9);
  canvas.parentElement?.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    goal.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    if (smooth.x < -1) smooth.copy(goal);
  });
  let on = false;
  const tick = (now: number) => {
    if (!on) return;
    u.uTime.value = 40 + now / 1000;
    smooth.lerp(goal, 0.05);
    u.uPointer.value.copy(smooth);
    draw();
    requestAnimationFrame(tick);
  };
  new IntersectionObserver((e) => {
    const next = e[0].isIntersecting;
    if (next && !on) { on = true; requestAnimationFrame(tick); } else on = next;
  }).observe(canvas);
}
