// A real 3D flight: the camera travels through the company's own photographs.
import {
  DoubleSide, Group, Mesh, PerspectiveCamera, PlaneGeometry, Scene, ShaderMaterial, TextureLoader,
  WebGLRenderer, LinearSRGBColorSpace, NoColorSpace,
} from 'three';
import { quality, reduced } from './tokens';

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform float uFade, uAspect, uImage, uRadius;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv - 0.5;
    float s = uAspect / uImage;
    if (s > 1.0) uv.y /= s; else uv.x *= s;
    vec3 c = texture2D(uTex, uv + 0.5).rgb;
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 q = abs(p) - vec2(uAspect, 1.0) * 0.5 + uRadius;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - uRadius;
    float a = smoothstep(0.004, -0.004, d) * uFade;
    if (a < 0.01) discard;
    gl_FragColor = vec4(c, a);
  }
`;

export function startFlight(section: HTMLElement) {
  const canvas = section.querySelector<HTMLCanvasElement>('canvas');
  if (!canvas) return;
  const srcs = JSON.parse(section.dataset.photos ?? '[]') as string[];
  const still = reduced();
  const phone = innerWidth < 768;
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return;
  }
  renderer.outputColorSpace = LinearSRGBColorSpace;
  renderer.setPixelRatio(quality());

  const scene = new Scene();
  const camera = new PerspectiveCamera(46, 1, 0.1, 60);
  const world = new Group();
  scene.add(world);

  const STEP = 2.3;
  const loader = new TextureLoader();
  const list = phone ? srcs.slice(0, 10) : srcs;
  // Photos spiral around the centre, always leaving the text clear.
  const items = list.map((src, i) => {
    const w = phone ? 1.5 : 2.5;
    const h = w * (i % 3 === 0 ? 1.22 : 0.72);
    const side = i % 2 ? 1 : -1;
    const wave = Math.sin(i * 2.399963);
    const u = {
      uTex: { value: null as unknown }, uFade: { value: 0 }, uAspect: { value: w / h }, uImage: { value: 1.5 }, uRadius: { value: 0.03 },
    };
    const mesh = new Mesh(new PlaneGeometry(w, h), new ShaderMaterial({
      uniforms: u, fragmentShader: fragment, transparent: true, side: DoubleSide, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    }));
    // Desktop: columns either side of the text. Phone: bands above and below it.
    if (phone) mesh.position.set(wave * 0.75, side * (2.7 + Math.abs(wave) * 0.5), -i * STEP);
    else mesh.position.set(side * (3.1 + Math.abs(wave) * 1.1), wave * 1.35, -i * STEP);
    mesh.rotation.y = phone ? wave * 0.1 : -side * 0.14;
    mesh.userData = { u, src, loaded: false, z: mesh.position.z };
    world.add(mesh);
    return mesh;
  });
  const load = (m: Mesh) => {
    if (m.userData.loaded) return;
    m.userData.loaded = true;
    loader.load(m.userData.src, (t) => {
      t.colorSpace = NoColorSpace;
      t.anisotropy = 4;
      m.userData.u.uTex.value = t;
      const img = t.image as HTMLImageElement;
      m.userData.u.uImage.value = img.width / img.height;
      m.userData.ok = true;
      paint();
    });
  };

  const END = list.length * STEP;
  let progress = 0, target = 0;
  const ptr = { x: 0, y: 0, ex: 0, ey: 0 };

  function paint() {
    const z = 5.4 - progress * (END + 4);
    camera.position.set(ptr.ex * 0.28, -ptr.ey * 0.18, z);
    camera.lookAt(ptr.ex * 0.06, -ptr.ey * 0.04, z - 6);
    for (const m of items) {
      const d = z - m.userData.z;
      if (d < 22) load(m);
      const appear = Math.max(0, Math.min(1, (8.6 - d) / 2.2));
      const leave = Math.max(0, Math.min(1, (d - 0.5) / 1.3));
      m.userData.u.uFade.value = m.userData.ok ? appear * leave : 0;
      m.visible = m.userData.u.uFade.value > 0.01;
    }
    renderer.render(scene, camera);
  }
  function resize() {
    const r = canvas!.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    paint();
  }
  const read = () => {
    const r = section.getBoundingClientRect();
    target = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
  };
  addEventListener('resize', resize, { passive: true });
  addEventListener('scroll', () => {
    read();
    if (still) { progress = target; paint(); }
  }, { passive: true });
  addEventListener('pointermove', (e) => {
    ptr.x = (e.clientX / innerWidth) * 2 - 1;
    ptr.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  read();
  progress = target;
  resize();

  if (still) return;
  let on = false;
  let last = performance.now();
  const tick = (now: number) => {
    if (!on) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    progress += (target - progress) * (1 - Math.exp(-dt * 7));
    ptr.ex += (ptr.x - ptr.ex) * (1 - Math.exp(-dt * 3));
    ptr.ey += (ptr.y - ptr.ey) * (1 - Math.exp(-dt * 3));
    paint();
    requestAnimationFrame(tick);
  };
  new IntersectionObserver((e) => {
    const next = e[0].isIntersecting;
    if (next && !on) { last = performance.now(); on = true; requestAnimationFrame(tick); } else on = next;
  }).observe(section);
}
