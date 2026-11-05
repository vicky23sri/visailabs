// Signature effect: a real photo, seen through the machine's eyes.
// A scan line and a mouse lens reveal a live edge-detection view of the image.
import {
  LinearSRGBColorSpace, LinearFilter, Mesh, NoBlending, NoColorSpace, OrthographicCamera, PlaneGeometry,
  Scene, ShaderMaterial, TextureLoader, Vector2, WebGLRenderer,
} from 'three';
import gsap from 'gsap';
import { num, quality, reduced, token } from './tokens';

const fragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uSize, uImage, uPointer;
  uniform vec3 uHot, uDark;
  uniform float uIntro, uScan, uHover, uLens, uEdge, uGrain, uTime, uZoom, uFocusY;
  varying vec2 vUv;

  float rand(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  // Same crop as CSS object-fit: cover, plus a zoom about the focus point.
  vec2 cover(vec2 uv) {
    float s = max(uSize.x / uImage.x, uSize.y / uImage.y);
    vec2 scaled = uSize / (uImage * s);
    vec2 focus = vec2(0.5, uFocusY);
    return (uv - 0.5) * scaled / uZoom + vec2(0.5, 0.5 + (focus.y - 0.5) * (1.0 - scaled.y));
  }
  float luma(vec2 uv) { return dot(texture2D(uTex, uv).rgb, vec3(0.299, 0.587, 0.114)); }

  vec3 machineView(vec2 uv, vec2 px) {
    vec2 d = 1.6 / uSize;
    float tl = luma(uv + d * vec2(-1.0, 1.0)), t = luma(uv + d * vec2(0.0, 1.0)), tr = luma(uv + d * vec2(1.0, 1.0));
    float l = luma(uv + d * vec2(-1.0, 0.0)), r = luma(uv + d * vec2(1.0, 0.0));
    float bl = luma(uv + d * vec2(-1.0, -1.0)), b = luma(uv + d * vec2(0.0, -1.0)), br = luma(uv + d * vec2(1.0, -1.0));
    float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
    float gy = -bl - 2.0 * b - br + tl + 2.0 * t + tr;
    float edge = smoothstep(0.22, 0.8, sqrt(gx * gx + gy * gy) * uEdge * 0.5);
    float depth = luma(uv);
    vec3 c = uDark + vec3(0.11, 0.12, 0.15) * depth;
    // A fine measuring grid, as if the scene were being sampled.
    vec2 g = abs(fract(px / 56.0) - 0.5);
    c += vec3(0.05) * smoothstep(0.484, 0.5, max(g.x, g.y));
    return mix(c, uHot, edge);
  }

  void main() {
    vec2 px = vUv * uSize;
    vec2 uv = cover(vUv);
    vec3 photo = texture2D(uTex, uv).rgb;
    // Gentle filmic grade so every photo feels like the same camera.
    photo = mix(vec3(dot(photo, vec3(0.3, 0.59, 0.11))), photo, 0.9);
    photo = smoothstep(vec3(-0.02), vec3(1.02), photo);
    photo += (rand(px + fract(uTime) * 91.0) - 0.5) * uGrain;

    float y = 1.0 - vUv.y; // 0 at the top of the image

    // Intro: the machine's view resolves into the real photo, top to bottom.
    float front = uIntro * 1.2;
    float machine = 1.0 - smoothstep(front - 0.1, front, y);
    machine = 1.0 - machine;

    // Periodic scan: a narrow band of machine view with a bright leading edge.
    float band = 0.0, lead = 0.0;
    if (uScan > -0.5 && uScan < 1.5) {
      band = smoothstep(uScan - 0.2, uScan - 0.01, y) * step(y, uScan);
      lead = smoothstep(0.004, 0.0, abs(y - uScan));
    }
    // Mouse lens.
    float dist = distance(px, uPointer);
    float lens = smoothstep(uLens, uLens * 0.985, dist) * uHover;
    float ring = smoothstep(4.0, 1.0, abs(dist - uLens)) * uHover;

    float mask = max(max(machine, band * 0.92), lens);
    vec3 color = photo;
    if (mask > 0.001) color = mix(photo, machineView(uv, px), mask);
    color = mix(color, uHot, max(lead, ring));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function startVision(wrap: HTMLElement) {
  const img = wrap.querySelector('img');
  if (!img) return;
  const still = reduced();
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  } catch {
    return; // No WebGL: the plain photo underneath stays visible.
  }
  renderer.outputColorSpace = LinearSRGBColorSpace;
  const pixel = quality();
  renderer.setPixelRatio(pixel);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  img.after(canvas);

  const uniforms = {
    uTex: { value: null as unknown },
    uSize: { value: new Vector2(1, 1) },
    uImage: { value: new Vector2(1, 1) },
    uPointer: { value: new Vector2(-9999, -9999) },
    uHot: { value: token('--color-orange') },
    uDark: { value: token('--color-vision-bg') },
    uIntro: { value: still ? 1 : 0 },
    uScan: { value: -1 },
    uHover: { value: 0 },
    uLens: { value: num('--vision-lens') * pixel },
    uEdge: { value: num('--vision-edge') },
    uGrain: { value: num('--vision-grain') },
    uTime: { value: 0 },
    uZoom: { value: 1 },
    uFocusY: { value: parseFloat(wrap.dataset.focusY ?? '0.5') },
  };
  const scene = new Scene();
  scene.add(new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms,
    fragmentShader: fragment,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    blending: NoBlending,
  })));
  const camera = new OrthographicCamera();
  const draw = () => renderer.render(scene, camera);

  const resize = () => {
    const r = wrap.getBoundingClientRect();
    if (!r.width) return;
    renderer.setSize(r.width, r.height, false);
    uniforms.uSize.value.set(r.width * pixel, r.height * pixel);
    draw();
  };

  const sweep = (num('--vision-sweep-seconds') || 8) * 1000;
  let visible = false;
  let raf = 0;
  const begin = performance.now();
  const tick = (now: number) => {
    if (!visible) { raf = 0; return; }
    uniforms.uTime.value = (now - begin) / 1000;
    // The line crosses in 1.8 seconds, then rests until the next pass.
    const phase = (now - begin) % sweep;
    uniforms.uScan.value = phase < 1800 ? (phase / 1800) * 1.25 : -1;
    draw();
    raf = requestAnimationFrame(tick);
  };

  const zoomFrom = parseFloat(wrap.dataset.zoom ?? '1');
  new TextureLoader().load(img.currentSrc || img.src, (tex) => {
    tex.colorSpace = NoColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = LinearFilter;
    uniforms.uTex.value = tex;
    const source = tex.image as HTMLImageElement;
    uniforms.uImage.value.set(source.width, source.height);
    resize();
    new ResizeObserver(resize).observe(wrap);
    wrap.dataset.ready = 'true';
    if (still) return;

    let played = false;
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
      if (visible && !played) {
        played = true;
        gsap.fromTo(uniforms.uIntro, { value: 0 }, { value: 1, duration: 2, ease: 'power2.inOut' });
        gsap.fromTo(uniforms.uZoom, { value: zoomFrom + 0.12 }, { value: zoomFrom, duration: 3.2, ease: 'expo.out' });
      }
    }, { threshold: 0.02 }).observe(wrap);

    // Scrolling past pushes gently into the picture.
    if (wrap.dataset.push) {
      const scrollPush = () => {
        const r = wrap.getBoundingClientRect();
        const t = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
        if (uniforms.uIntro.value >= 1) uniforms.uZoom.value = zoomFrom + t * 0.14;
      };
      addEventListener('scroll', scrollPush, { passive: true });
    }
  }, undefined, () => canvas.remove());

  if (!still && matchMedia('(hover: hover)').matches) {
    const target = wrap.closest<HTMLElement>('[data-vision-area]') ?? wrap;
    target.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      uniforms.uPointer.value.set((e.clientX - r.left) * pixel, (r.height - (e.clientY - r.top)) * pixel);
    });
    target.addEventListener('pointerenter', () => gsap.to(uniforms.uHover, { value: 1, duration: 0.4 }));
    target.addEventListener('pointerleave', () => gsap.to(uniforms.uHover, { value: 0, duration: 0.4 }));
  }
}
