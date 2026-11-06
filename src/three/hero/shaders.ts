// The custom light in the scene: the laser drawn onto real surfaces, the digital-twin
// outline, the point cloud, the light curtain, floating dust and the final lens.
import type { IUniform, Material, MeshStandardMaterial } from 'three';

export type ScanUniforms = {
  uScan: IUniform<number>; // where the laser is, in the parcel's own coordinates
  uOn: IUniform<number>;
  uMesh: IUniform<number>;
  uSize: IUniform<import('three').Vector3>;
  uColor: IUniform<import('three').Color>;
};

/** Teaches a parcel's material to catch the laser and to show its digital twin. */
export function scannable(material: MeshStandardMaterial, u: ScanUniforms, wear: boolean) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vParcel;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvParcel = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `#include <common>
        varying vec3 vParcel;
        uniform float uScan, uOn, uMesh;
        uniform vec3 uSize, uColor;
        float edgeDistance() {
          vec3 p = vec3(vParcel.x, vParcel.y - uSize.y * 0.5, vParcel.z);
          vec3 d = uSize * 0.5 - abs(p);
          // The middle of the three distances is the distance to the nearest edge.
          return max(min(d.x, d.y), min(max(d.x, d.y), d.z));
        }`)
      .replace('#include <color_fragment>', /* glsl */ `#include <color_fragment>
        ${wear ? /* glsl */ `
        float crush = 1.0 - smoothstep(0.0, 0.11, edgeDistance());
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.32 + 0.015, crush * 0.75);
        diffuseColor.rgb *= 0.55 + 0.45 * smoothstep(0.0, 0.5, vParcel.y);` : ''}`)
      .replace('#include <opaque_fragment>', /* glsl */ `
        float along = vParcel.x - uScan;
        float seen = step(0.0, along);
        float laser = exp(-along * along * 900.0) * uOn;
        float wake = exp(-max(along, 0.0) * 1.25) * seen * uOn;
        vec3 cell = vParcel * 2.0;
        vec3 line = abs(fract(cell - 0.5) - 0.5) / (fwidth(cell) + 1e-4);
        float grid = 1.0 - min(min(line.x, line.y), line.z);
        grid = clamp(grid, 0.0, 1.0);
        float outline = (1.0 - smoothstep(0.0, 0.035, edgeDistance())) * uMesh;
        outgoingLight += uColor * (laser * 9.0 + grid * seen * (wake * 1.1 + uMesh * 0.035) + wake * 0.06 + outline * 2.4);
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => `scannable-${wear}`;
  return material as Material;
}

/**
 * The capture wave: a sphere of machine vision expanding from the parcel through the whole
 * hall. Surfaces glow as it passes and briefly show the grid a machine would see.
 */
export function withWave(material: MeshStandardMaterial, u: Record<string, IUniform>, key: string) {
  const before = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWave;')
      .replace('#include <begin_vertex>', /* glsl */ `#include <begin_vertex>
        vec4 waveAt = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          waveAt = instanceMatrix * waveAt;
        #endif
        vWave = (modelMatrix * waveAt).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `#include <common>
        varying vec3 vWave;
        uniform vec3 uWaveColor, uWaveFrom;
        uniform float uWave, uWaveAlpha;`)
      .replace('#include <opaque_fragment>', /* glsl */ `
        float waveDist = length(vWave - uWaveFrom);
        float waveGap = (waveDist - uWave) * 0.42;
        float waveFront = exp(-waveGap * waveGap);
        float waveTrail = exp(-max(uWave - waveDist, 0.0) * 0.075) * step(waveDist, uWave);
        vec3 waveCell = vWave * 0.8;
        vec3 waveLine = abs(fract(waveCell - 0.5) - 0.5) / (fwidth(waveCell) + 1e-4);
        float waveGrid = 1.0 - clamp(min(min(waveLine.x, waveLine.y), waveLine.z), 0.0, 1.0);
        outgoingLight += uWaveColor * (waveFront * 0.8 + waveTrail * waveGrid * 0.55 + waveTrail * 0.02) * uWaveAlpha;
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => `wave-${key}`;
  return material;
}

export const pointVertex = /* glsl */ `
  attribute vec3 aNormal;
  attribute vec4 aRand;
  uniform vec3 uSize;
  uniform float uScan, uCloud, uTime, uScale, uDrift;
  varying float vLife;
  void main() {
    vec3 p = position * uSize + vec3(0.0, uSize.y * 0.5, 0.0);
    float along = p.x - uScan;
    float seen = step(0.0, along);
    float fresh = exp(-max(along, 0.0) * 1.1) * seen;
    // Points leap off the surface as the laser reads them, then settle onto it.
    float lift = 0.03 + fresh * (0.14 + aRand.x * 0.46) + uDrift * (0.3 + aRand.y * 1.6);
    p += aNormal * lift;
    p.y += uDrift * aRand.z * 1.2;
    p += 0.018 * sin(uTime * (0.7 + aRand.w) + aRand.xyz * 40.0);
    vLife = seen * uCloud * (0.3 + fresh * 0.9) * (0.45 + aRand.w * 0.55);
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = (0.6 + aRand.y * 0.9 + fresh * 1.1) * uScale / -view.z;
  }`;
export const pointFragment = /* glsl */ `
  uniform vec3 uColor, uHot;
  varying float vLife;
  void main() {
    if (vLife <= 0.002) discard;
    float r = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.12, r);
    gl_FragColor = vec4(mix(uColor, uHot, vLife * 0.6) * (0.55 + vLife * 1.6), disc * min(vLife, 1.0));
  }`;

export const curtainVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
export const curtainFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOn, uTime;
  varying vec2 vUv;
  float streak(float x) { return fract(sin(floor(x) * 91.17) * 473.3); }
  void main() {
    // vUv.y runs from the lens (1) down to the belt (0); light thins out as it spreads.
    float rays = 0.55 + 0.45 * mix(streak(vUv.x * 90.0), streak(vUv.x * 90.0 + 1.0), fract(vUv.x * 90.0));
    float shimmer = 0.85 + 0.15 * sin(uTime * 7.0 + vUv.x * 120.0);
    float falloff = pow(max(vUv.y, 0.0), 1.6) * 1.15 + 0.12;
    gl_FragColor = vec4(uColor * rays * shimmer * falloff * uOn * 0.5, 1.0);
  }`;

export const dustVertex = /* glsl */ `
  attribute vec4 aRand;
  uniform float uTime, uCurtain, uOn, uScale;
  varying float vGlow;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.13 + aRand.x * 6.28) * 0.8;
    p.y = 3.1 + mod(position.y + uTime * (0.05 + aRand.y * 0.09), 8.0);
    p.z += cos(uTime * 0.11 + aRand.z * 6.28) * 0.6;
    float gap = p.x - uCurtain;
    float near = exp(-gap * gap * 3.0);
    vGlow = (0.07 + aRand.w * 0.09) + near * uOn * 1.3;
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = (0.5 + aRand.w * 1.4) * uScale / -view.z;
  }`;
export const dustFragment = /* glsl */ `
  uniform vec3 uColor;
  varying float vGlow;
  void main() {
    float disc = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(uColor * vGlow * disc, disc * min(vGlow * 2.0, 1.0));
  }`;

/** The floor: polished concrete with real reflections and a faint blueprint grid. */
export function blueprintFloor(material: MeshStandardMaterial, u: Record<string, IUniform>) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;\nvarying vec4 vMirror;\nuniform mat4 uMirrorMatrix;')
      .replace('#include <begin_vertex>', /* glsl */ `#include <begin_vertex>
        vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
        vMirror = uMirrorMatrix * vec4(vWorld, 1.0);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `#include <common>
        varying vec3 vWorld;
        varying vec4 vMirror;
        uniform sampler2D uMirror;
        uniform vec3 uGrid;
        uniform float uReflect;
        float gridAt(vec2 p, float size) {
          vec2 c = p / size;
          vec2 l = abs(fract(c - 0.5) - 0.5) / (fwidth(c) + 1e-4);
          return 1.0 - clamp(min(l.x, l.y), 0.0, 1.0);
        }
        float mottle(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5);
          float b = fract(sin(dot(i + vec2(1, 0), vec2(127.1, 311.7))) * 43758.5);
          float c = fract(sin(dot(i + vec2(0, 1), vec2(127.1, 311.7))) * 43758.5);
          float d = fract(sin(dot(i + vec2(1, 1), vec2(127.1, 311.7))) * 43758.5);
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }`)
      .replace('#include <opaque_fragment>', /* glsl */ `
        float dist = length(vWorld.xz);
        float fade = exp(-dist * dist * 0.0009);
        float blueprint = gridAt(vWorld.xz, 2.0) * 0.012 + gridAt(vWorld.xz, 10.0) * 0.035;
        outgoingLight += uGrid * blueprint * fade;
        if (uReflect > 0.0) {
          vec2 uv = vMirror.xy / vMirror.w;
          // Scuffs in the polish break the mirror up, as on a real warehouse floor.
          float scuff = mottle(vWorld.xz * 0.9) * 0.6 + mottle(vWorld.xz * 3.1) * 0.4;
          float blur = 0.0016 + scuff * 0.0035;
          vec3 mirrored = vec3(0.0);
          for (int i = 0; i < 8; i++) {
            float a = float(i) * 0.7854;
            mirrored += texture2D(uMirror, uv + vec2(cos(a), sin(a) * 1.8) * blur).rgb;
          }
          mirrored = min(mirrored / 8.0, vec3(4.0));
          vec3 viewDir = normalize(cameraPosition - vWorld);
          float fresnel = 0.28 + 0.72 * pow(1.0 - clamp(viewDir.y, 0.0, 1.0), 3.0);
          outgoingLight += mirrored * fresnel * uReflect * (0.65 + scuff * 0.35);
        }
        #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'floor';
  return material;
}

export const beltLaser = (material: MeshStandardMaterial, u: Record<string, IUniform>) => {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWorld = (modelMatrix * vec4(position, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', /* glsl */ `#include <common>
        varying vec3 vWorld;
        uniform float uCurtain, uOn;
        uniform vec3 uColor, uContact[3];
        // How much a resting parcel darkens the belt around its footprint.
        float contactAt(vec3 c) {
          vec2 d = abs(vec2(vWorld.x - c.x, vWorld.z)) - c.yz;
          float outside = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
          return exp(-max(outside, 0.0) * 3.2) * 0.86;
        }`)
      .replace('#include <opaque_fragment>', /* glsl */ `
        float beam = vWorld.x - uCurtain;
        outgoingLight *= 1.0 - max(contactAt(uContact[0]), max(contactAt(uContact[1]), contactAt(uContact[2])));
        outgoingLight += uColor * (exp(-beam * beam * 600.0) * 8.0 + exp(-beam * beam * 2.2) * 0.1) * uOn;
        #include <opaque_fragment>`);
  };
  return material;
};

// GLSL note: never use pow() on a value that can be negative, even by rounding (antialiasing samples
// just outside a triangle, so a 0-to-1 value can dip below 0). Software renderers forgive it, but
// real GPUs can return NaN, and bloom then spreads one bad pixel until the whole picture is black.

/** Runs before bloom: replaces any impossible pixel, so no driver can ever black out the hero. */
export const safetyShader = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      if (any(isnan(c)) || any(isinf(c))) c = vec3(0.0);
      gl_FragColor = vec4(min(c, vec3(24.0)), 1.0);
    }`,
};

/** The final lens: slight fringing, a vignette, film grain, tone mapping and gamma. */
export const lensShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uExposure: { value: 1 } },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime, uExposure;
    varying vec2 vUv;
    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
    float noise(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);
      vec2 shift = c * r2 * 0.012;
      vec3 col = vec3(texture2D(tDiffuse, vUv + shift).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - shift).b);
      col *= 1.0 - smoothstep(0.12, 0.62, r2) * 0.5;
      col = aces(col * uExposure);
      col = pow(col, vec3(1.0 / 2.2));
      col += (noise(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.016; // grain, which also removes banding
      gl_FragColor = vec4(col, 1.0);
    }`,
};
