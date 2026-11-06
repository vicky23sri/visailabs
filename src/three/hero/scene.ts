// The hero's 3D scene: a parcel rides a conveyor through a laser curtain, its point
// cloud and digital twin build on its real surface, and its size is read off in 3D.
// Timing is in timeline.ts, parcel sizes in data/scan.ts, colors in tokens.css.
import {
  ACESFilmicToneMapping, AdditiveBlending, AmbientLight, BoxGeometry, BufferAttribute, BufferGeometry, Color, CylinderGeometry,
  DirectionalLight, DoubleSide, FogExp2, Group, HalfFloatType, HemisphereLight, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, PCFShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, PointLight, Points, Quaternion, Scene,
  ShaderMaterial, SpotLight, SRGBColorSpace, Sprite, SpriteMaterial, type Texture, TorusGeometry, Vector2, Vector3, WebGLRenderer, WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PARCELS, type Parcel } from '../../data/scan';
import { token } from '../tokens';
import { CURTAIN, SPACING, T, beltAt, clamp, easeInOut, easeOut, span } from './timeline';
import {
  beltLaser, blueprintFloor, withWave, curtainFragment, curtainVertex, dustFragment, dustVertex, lensShader, safetyShader, pointFragment, pointVertex, scannable,
  type ScanUniforms,
} from './shaders';
import { cardboard, glow, rubber, shippingLabel, sidePrint } from './textures';

/* ---- CHANGE ME ---------------------------------------------------------- */
const CAMERA = {
  fov: 30, // wide enough to see the hall, long enough to stay cinematic
  from: new Vector3(0.7, 0.235, 1), // direction the camera looks from: low, for a sense of scale
  target: new Vector3(-0.4, 4.3, 0), // what it looks at
  radius: 5.2, // how much of the scene must fit the scene's slot on the page
  pushIn: 0.09, // how far it moves in during a scan
  drift: 0.05, // slow orbit, in radians
  mouse: 0.06, // how far it follows the pointer, in radians
};
const LOOK = {
  exposure: 1.08, bloom: 0.36, bloomRadius: 0.6, bloomThreshold: 1.1, envLight: 0.3, keyLight: 1000,
  hall: 0.36, // how much light reaches the racking and far conveyors
  reflection: 0.9, // polish of the floor
  fog: 0.0082,
};
// Tried in order: the scene steps down by itself if a device cannot hold the frame rate.
const QUALITY = [
  { dpr: 2, samples: 4, bloom: true, shadows: true, mirror: 0.5 },
  { dpr: 1.5, samples: 4, bloom: true, shadows: true, mirror: 0.5 },
  { dpr: 1.25, samples: 2, bloom: true, shadows: true, mirror: 0.33 },
  { dpr: 1, samples: 0, bloom: true, shadows: false, mirror: 0.33 },
  { dpr: 1, samples: 0, bloom: true, shadows: false, mirror: 0 },
  { dpr: 0.8, samples: 0, bloom: false, shadows: false, mirror: 0 },
];
const MAX_PIXELS = 3.2e6; // most pixels drawn per frame; very sharp screens render a little softer instead of stuttering
const AIM_MS = 22; // average frame time a device must beat, or quality steps down
/* ------------------------------------------------------------------------- */

const CM = 0.1; // scene units per centimetre
const BELT_Y = 3; // top of the belt
const BELT_HALF = 3;
const LENGTH = 150;
const BRACKET_ARM = 0.42;

interface Options {
  canvas: HTMLCanvasElement;
  hero: HTMLElement;
  slot: HTMLElement; // where on the page the parcel should sit
  feed: HTMLElement; // where the vAudit camera feed is drawn
  labels: { root: HTMLElement; num: HTMLElement; value: number }[]; // L, W, H, weight
  chip: HTMLElement;
  check: SVGPathElement;
  verified: HTMLElement;
  order: HTMLElement;
  onReady: () => void;
  onLost: () => void;
}

const color = (name: string) => {
  const v = token(name);
  return new Color().setRGB(v.x, v.y, v.z, SRGBColorSpace);
};
const css = (name: string) => `#${color(name).getHexString()}`;

// Hands the browser a turn between heavy steps, so scrolling stays smooth during setup.
const breathe = () => new Promise<void>((done) => setTimeout(done));

export async function startHeroScene(o: Options) {
  const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
  await document.fonts.load(`700 40px ${mono}`).catch(() => undefined);

  const C = {
    night: color('--color-night'), scan: color('--color-scan'), soft: color('--color-scan-soft'), measure: color('--color-measure'),
    ok: color('--color-ok'), box: color('--color-box-top'), tape: color('--color-box-tape'), metal: color('--color-metal'),
    rubber: color('--color-rubber'), floor: color('--color-floor'), led: color('--color-led'),
  };

  const phone = Math.min(innerWidth, innerHeight) < 600;
  let level = phone ? 1 : 0;

  const renderer = new WebGLRenderer({ canvas: o.canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setClearColor(C.night, 1);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  scene.background = C.night.clone();
  scene.fog = new FogExp2(C.night.getHex(), LOOK.fog);

  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04);
  scene.environment = env.texture;
  scene.environmentIntensity = LOOK.envLight;
  pmrem.dispose();

  const camera = new PerspectiveCamera(CAMERA.fov, 1, 1, 320);

  await breathe();

  /* ---- Light ------------------------------------------------------------ */
  const key = new SpotLight(color('--color-label'), LOOK.keyLight, 0, 0.5, 0.95, 2);
  key.position.set(-7, 22, 10);
  key.target.position.set(0, 3, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(phone ? 1024 : 2048, phone ? 1024 : 2048);
  key.shadow.camera.near = 8;
  key.shadow.camera.far = 60;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);

  const rim = new DirectionalLight(C.scan, 0.55);
  rim.position.set(-6, 12, -10);
  const warm = new DirectionalLight(C.measure, 0.18);
  warm.position.set(14, 4, -3);
  scene.add(rim, warm, new AmbientLight(C.led, 0.03), new HemisphereLight(C.led, C.night, LOOK.hall));

  const laserLight = new PointLight(C.scan, 0, 16, 1.6);
  laserLight.position.set(CURTAIN + 0.3, 5.4, 1.2);
  scene.add(laserLight);

  const pulseLight = new PointLight(C.ok, 0, 14, 1.8);
  pulseLight.position.set(0, 5, 3.5);
  scene.add(pulseLight);

  const haze = new Sprite(new SpriteMaterial({ map: glow(C.scan), transparent: true, opacity: 0.07, blending: AdditiveBlending, depthWrite: false, fog: false }));
  haze.position.set(-10, 8, -24);
  haze.scale.setScalar(70);
  scene.add(haze);

  await breathe();
  const board = cardboard(C.box);
  await breathe();

  /* ---- Floor ------------------------------------------------------------ */
  const waveU = { uWaveColor: { value: C.scan }, uWaveFrom: { value: new Vector3(0, BELT_Y + 1, 0) }, uWave: { value: 0 }, uWaveAlpha: { value: 0 } };
  const mirrorMatrix = new Matrix4();
  const floorU = { uGrid: { value: C.scan }, uMirror: { value: null as Texture | null }, uMirrorMatrix: { value: mirrorMatrix }, uReflect: { value: 0 } };
  const floor = new Mesh(
    new PlaneGeometry(600, 600),
    withWave(blueprintFloor(new MeshStandardMaterial({ color: C.floor, roughness: 0.52, metalness: 0.1 }), floorU), waveU, 'floor'),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  /* ---- Conveyor --------------------------------------------------------- */
  const metal = withWave(new MeshStandardMaterial({ color: C.metal.clone().multiplyScalar(0.62), roughness: 0.44, metalness: 0.9 }), waveU, 'metal');
  const darkMetal = withWave(new MeshStandardMaterial({ color: C.metal.clone().multiplyScalar(0.12), roughness: 0.5, metalness: 0.85 }), waveU, 'dark-metal');
  await breathe();
  const belted = rubber(C.rubber);
  belted.map.repeat.set(LENGTH / 6, 1);
  belted.normal.repeat.copy(belted.map.repeat);
  const contact = PARCELS.map(() => new Vector3());
  const beltU = { uCurtain: { value: CURTAIN }, uOn: { value: 0 }, uColor: { value: C.scan }, uContact: { value: contact } };
  const belt = new Mesh(
    new PlaneGeometry(LENGTH, BELT_HALF * 2),
    beltLaser(new MeshStandardMaterial({ map: belted.map, normalMap: belted.normal, roughness: 0.62, metalness: 0.05 }), beltU),
  );
  belt.rotation.x = -Math.PI / 2;
  belt.position.y = BELT_Y;
  belt.receiveShadow = true;
  scene.add(belt);

  const led = new MeshBasicMaterial({ color: C.scan.clone().multiplyScalar(0.55), fog: true });
  for (const side of [-1, 1]) {
    const rail = new Mesh(new RoundedBoxGeometry(LENGTH, 1.15, 0.42, 2, 0.05), metal);
    rail.position.set(0, BELT_Y - 0.42, side * (BELT_HALF + 0.21));
    rail.castShadow = rail.receiveShadow = true;
    const slot = new Mesh(new BoxGeometry(LENGTH, 0.16, 0.02), darkMetal);
    slot.position.set(0, BELT_Y - 0.62, side * (BELT_HALF + 0.43));
    const strip = new Mesh(new BoxGeometry(LENGTH, 0.035, 0.02), led);
    strip.position.set(0, BELT_Y - 0.14, side * (BELT_HALF + 0.43));
    scene.add(rail, slot, strip);
  }

  const m = new Matrix4();
  const unit = new Vector3(1, 1, 1);
  const spin = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
  const turn = new Quaternion();
  const zAxis = new Vector3(0, 0, 1);
  const place = new Vector3();

  // Roller ends along the rails: they turn with the belt.
  const ROLLERS = 96;
  const rollerGeo = new CylinderGeometry(0.15, 0.15, 0.06, 6);
  const rollers = new InstancedMesh(rollerGeo, darkMetal, ROLLERS * 2);
  const rollerAt = (i: number) => (i % ROLLERS) * 1.5 - 72;
  for (let i = 0; i < ROLLERS * 2; i++) {
    const side = i < ROLLERS ? 1 : -1;
    rollers.setMatrixAt(i, m.compose(new Vector3(rollerAt(i), BELT_Y - 0.62, side * (BELT_HALF + 0.46)), spin, unit));
  }
  scene.add(rollers);
  let rollerAngle = NaN;
  const turnRollers = (angle: number) => {
    if (angle === rollerAngle) return;
    rollerAngle = angle;
    turn.setFromAxisAngle(zAxis, -angle).multiply(spin);
    for (let i = 0; i < ROLLERS * 2; i++) {
      place.set(rollerAt(i), BELT_Y - 0.62, (i < ROLLERS ? 1 : -1) * (BELT_HALF + 0.46));
      rollers.setMatrixAt(i, m.compose(place, turn, unit));
    }
    rollers.instanceMatrix.needsUpdate = true;
  };

  // Legs and cross-braces, drawn as one object each.
  const legXs = Array.from({ length: 13 }, (_, i) => -66 + i * 11 + 2.4);
  const legs = new InstancedMesh(new BoxGeometry(0.36, BELT_Y - 1, 0.36), metal, legXs.length * 2);
  const braces = new InstancedMesh(new BoxGeometry(0.22, 0.22, BELT_HALF * 2 + 0.6), darkMetal, legXs.length);
  legXs.forEach((x, i) => {
    for (const [n, side] of [[0, -1], [1, 1]]) {
      legs.setMatrixAt(i * 2 + n, m.compose(new Vector3(x, (BELT_Y - 1) / 2, side * (BELT_HALF + 0.21)), new Quaternion(), unit));
    }
    braces.setMatrixAt(i, m.compose(new Vector3(x, 0.8, 0), new Quaternion(), unit));
  });
  legs.castShadow = braces.castShadow = true;
  scene.add(legs, braces);

  /* ---- The hall: racking, more conveyors, robots and lights ------------- */
  const rackMat = withWave(new MeshStandardMaterial({ color: C.metal.clone().multiplyScalar(0.3), roughness: 0.6, metalness: 0.4 }), waveU, 'rack');
  const stockMat = withWave(new MeshStandardMaterial({ map: board.map, color: C.box.clone().multiplyScalar(0.72), roughness: 0.92 }), waveU, 'stock');
  type Row = [number, number, number, number, number, number];
  const racking: Row[] = [];
  const stock: Row[] = [];
  const bay = 9;
  for (const row of [-34, -50]) {
    for (let x = -126; x <= 126; x += bay) {
      racking.push([x, 13, row, 0.45, 26, 3.6]);
      for (const y of [1.2, 7, 13, 19, 25]) {
        racking.push([x + bay / 2, y, row, bay, 0.32, 3.4]);
        if (y === 25) continue;
        let at = x + 0.9;
        while (at < x + bay - 1.2) {
          const w = 1.5 + Math.random() * 1.6, h = 1.6 + Math.random() * 2.6;
          if (Math.random() > 0.14) stock.push([at + w / 2, y + 0.16 + h / 2, row + (Math.random() - 0.5) * 0.7, w, h, 2.5]);
          at += w + 0.22;
        }
      }
    }
  }
  const fill = (rows: Row[], material: MeshStandardMaterial) => {
    const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), material, rows.length);
    rows.forEach(([x, y, z, w, h, d], i) => mesh.setMatrixAt(i, m.compose(new Vector3(x, y, z), new Quaternion(), new Vector3(w, h, d))));
    scene.add(mesh);
  };
  fill(racking, rackMat);
  fill(stock, stockMat);

  // Long light lines across the roof: they also streak across the polished floor.
  const ceiling = new MeshBasicMaterial({ color: C.led.clone().multiplyScalar(2.4), fog: true });
  const ceilingBars = new InstancedMesh(new BoxGeometry(22, 0.1, 0.5), ceiling, 72);
  {
    let n = 0;
    for (const z of [8, -6, -20, -42, -60, -76]) for (let i = 0; i < 12; i++) {
      ceilingBars.setMatrixAt(n++, m.compose(new Vector3(-170 + i * 30, 30, z), new Quaternion(), unit));
    }
  }
  scene.add(ceilingBars);

  // Two more conveyors, carrying parcels the other way in the distance.
  const LINES = [{ z: -18, speed: -2.6, gap: 13 }, { z: -27, speed: 2.1, gap: 15 }];
  const lineBelt = withWave(new MeshStandardMaterial({ color: C.rubber, roughness: 0.65 }), waveU, 'line-belt');
  const lineLed = new MeshBasicMaterial({ color: C.scan.clone().multiplyScalar(0.7), fog: true });
  const carried: { x: number; y: number; z: number; w: number; h: number; d: number; speed: number; turn: number }[] = [];
  for (const line of LINES) {
    const top = new Mesh(new BoxGeometry(LENGTH * 2, 0.16, 6), lineBelt);
    top.position.set(0, BELT_Y - 0.08, line.z);
    scene.add(top);
    for (const side of [-1, 1]) {
      const rail = new Mesh(new BoxGeometry(LENGTH * 2, 0.9, 0.34), metal);
      rail.position.set(0, BELT_Y - 0.4, line.z + side * 3.17);
      const strip = new Mesh(new BoxGeometry(LENGTH * 2, 0.05, 0.02), lineLed);
      strip.position.set(0, BELT_Y - 0.1, line.z + side * 3.35);
      scene.add(rail, strip);
    }
    for (let x = -150; x < 150; x += line.gap) {
      carried.push({
        x: x + Math.random() * 4, y: 0, z: line.z + (Math.random() - 0.5) * 1.6, speed: line.speed, turn: (Math.random() - 0.5) * 0.3,
        w: 2.6 + Math.random() * 2.6, h: 1.4 + Math.random() * 2, d: 2.2 + Math.random() * 2,
      });
    }
  }
  const lineLegs = new InstancedMesh(new BoxGeometry(0.36, BELT_Y - 0.9, 0.36), metal, LINES.length * 56);
  {
    let n = 0;
    for (const line of LINES) for (let i = 0; i < 28; i++) for (const side of [-1, 1]) {
      lineLegs.setMatrixAt(n++, m.compose(new Vector3(-150 + i * 11, (BELT_Y - 0.9) / 2, line.z + side * 3.17), new Quaternion(), unit));
    }
  }
  scene.add(lineLegs);
  const carriedMesh = new InstancedMesh(new BoxGeometry(1, 1, 1), stockMat, carried.length);
  carriedMesh.frustumCulled = false;
  scene.add(carriedMesh);
  const carriedTurn = new Quaternion();
  const carriedPlace = new Vector3();
  const carriedSize = new Vector3();
  const yAxis = new Vector3(0, 1, 0);
  const moveCarried = (time: number) => {
    carried.forEach((c, i) => {
      const x = ((((c.x + c.speed * time + 150) % 300) + 300) % 300) - 150;
      carriedPlace.set(x, BELT_Y + c.h / 2, c.z);
      carriedSize.set(c.w, c.h, c.d);
      carriedMesh.setMatrixAt(i, m.compose(carriedPlace, carriedTurn.setFromAxisAngle(yAxis, c.turn), carriedSize));
    });
    carriedMesh.instanceMatrix.needsUpdate = true;
  };

  // Robots crossing the hall between the conveyors, each with a tote on its back.
  const robotBody = withWave(new MeshStandardMaterial({ color: C.metal.clone().multiplyScalar(0.3), roughness: 0.32, metalness: 0.75 }), waveU, 'robot');
  const robotTote = new MeshStandardMaterial({ color: C.scan.clone().multiplyScalar(0.28), roughness: 0.55 });
  const robotLed = new MeshBasicMaterial({ color: C.scan.clone().multiplyScalar(2.2) });
  const robots = [{ z: -10, speed: 5.2, at: -60 }, { z: -10, speed: 5.2, at: -8 }, { z: -12.5, speed: -4.2, at: 60 }, { z: -40, speed: -6, at: 10 }].map((r) => {
    const g = new Group();
    const body = new Mesh(new RoundedBoxGeometry(3.2, 0.8, 2.3, 3, 0.2), robotBody);
    body.position.y = 0.55;
    const strip = new Mesh(new BoxGeometry(3.24, 0.05, 2.34), robotLed);
    strip.position.y = 0.42;
    const tote = new Mesh(new RoundedBoxGeometry(2.6, 1.3, 1.9, 2, 0.08), robotTote);
    tote.position.y = 1.62;
    g.add(body, strip, tote);
    g.position.z = r.z;
    scene.add(g);
    return { ...r, g };
  });
  const moveRobots = (time: number) => {
    for (const r of robots) r.g.position.x = (((r.at + r.speed * time + 110) % 220 + 220) % 220) - 110;
  };

  /* ---- Scanner ---------------------------------------------------------- */
  const gantry = new Group();
  gantry.position.x = CURTAIN;
  scene.add(gantry);
  const TOP = 8.2;
  const POST_Z = BELT_HALF + 0.95;
  const stripMat = new MeshBasicMaterial({ color: C.led.clone().multiplyScalar(0.8) });
  for (const side of [-1, 1]) {
    const post = new Mesh(new RoundedBoxGeometry(0.62, TOP, 0.62, 2, 0.05), metal);
    post.position.set(0, TOP / 2, side * POST_Z);
    post.castShadow = true;
    const groove = new Mesh(new BoxGeometry(0.16, TOP - 0.6, 0.02), darkMetal);
    groove.position.set(0, TOP / 2, side * (POST_Z + 0.31));
    const light = new Mesh(new BoxGeometry(0.05, 3.6, 0.02), stripMat);
    light.position.set(0, 5.6, side * (POST_Z - 0.32));
    const foot = new Mesh(new BoxGeometry(1.9, 0.14, 1.3), darkMetal);
    foot.position.set(0, 0.07, side * POST_Z);
    foot.castShadow = true;
    gantry.add(post, groove, light, foot);
  }
  const beam = new Mesh(new RoundedBoxGeometry(0.72, 0.72, POST_Z * 2 + 0.62, 2, 0.05), metal);
  beam.position.y = TOP;
  beam.castShadow = true;
  const head = new Mesh(new RoundedBoxGeometry(1.9, 0.82, 1.5, 3, 0.14), darkMetal);
  head.position.y = TOP - 0.74;
  head.castShadow = true;
  const barrel = new Mesh(new CylinderGeometry(0.34, 0.4, 0.36, 40), new MeshStandardMaterial({ color: C.night, roughness: 0.08, metalness: 1 }));
  barrel.position.y = TOP - 1.3;
  const glass = new Mesh(new CylinderGeometry(0.28, 0.28, 0.01, 40), new MeshBasicMaterial({ color: C.scan.clone().multiplyScalar(0.5) }));
  glass.position.y = TOP - 1.485;
  const ringMat = new MeshBasicMaterial({ color: C.scan.clone().multiplyScalar(1.5) });
  const ring = new Mesh(new TorusGeometry(0.42, 0.018, 8, 48), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = TOP - 1.16;
  const statusMat = new MeshBasicMaterial({ color: C.ok.clone() });
  const status = new Mesh(new BoxGeometry(0.02, 0.07, 0.34), statusMat);
  status.position.set(0.96, TOP - 0.74, 0);
  gantry.add(beam, head, barrel, glass, ring, status);

  // The light curtain: a sheet of light fanning from the lens down to the belt.
  const fan = new BufferGeometry();
  const lensY = TOP - 1.5;
  fan.setAttribute('position', new BufferAttribute(new Float32Array([0, lensY, 0, 0, BELT_Y, -BELT_HALF, 0, BELT_Y, BELT_HALF]), 3));
  fan.setAttribute('uv', new BufferAttribute(new Float32Array([0.5, 1, 0, 0, 1, 0]), 2));
  const curtainMat = new ShaderMaterial({
    vertexShader: curtainVertex, fragmentShader: curtainFragment, transparent: true, depthWrite: false, side: DoubleSide,
    blending: AdditiveBlending, uniforms: { uColor: { value: C.scan }, uOn: { value: 0 }, uTime: { value: 0 } },
  });
  const curtain = new Mesh(fan, curtainMat);
  gantry.add(curtain);

  await breathe();

  /* ---- Parcels ---------------------------------------------------------- */
  const print = sidePrint(css('--color-ink'));
  const paper = css('--color-label');
  const ink = css('--color-ink');

  function buildParcel(spec: Parcel, index: number) {
    const size = new Vector3(spec.l * CM, spec.h * CM, spec.w * CM);
    const u: ScanUniforms = { uScan: { value: 99 }, uOn: { value: 0 }, uMesh: { value: 0 }, uSize: { value: size }, uColor: { value: C.scan } };
    const group = new Group();

    const geo = new RoundedBoxGeometry(size.x, size.y, size.z, 3, 0.05);
    geo.translate(0, size.y / 2, 0);
    // Texture is mapped in real units, so every parcel has the same grain.
    const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i));
      if (ax > 0.6) uv.setXY(i, pos.getZ(i) * 0.42, pos.getY(i) * 0.42);
      else if (ay > 0.6) uv.setXY(i, pos.getX(i) * 0.42, pos.getZ(i) * 0.42);
      else uv.setXY(i, pos.getX(i) * 0.42, pos.getY(i) * 0.42);
    }
    const cardMat = new MeshStandardMaterial({ map: board.map, normalMap: board.normal, normalScale: new Vector2(0.3, 0.3), roughness: 0.82, metalness: 0 });
    scannable(cardMat, u, true);
    const body = new Mesh(geo, cardMat);
    body.castShadow = body.receiveShadow = true;
    group.add(body);

    // Packing tape over the top and part-way down both ends, with a little sheen.
    const tapeMat = new MeshStandardMaterial({ color: C.tape, roughness: 0.28, metalness: 0, transparent: true, opacity: 0.82 });
    scannable(tapeMat, u, false);
    const tapeW = 0.62;
    const tape = new BoxGeometry(size.x + 0.012, 0.008, tapeW);
    tape.translate(0, size.y + 0.002, 0);
    const endDrop = size.y * 0.42;
    for (const side of [-1, 1]) {
      const end = new BoxGeometry(0.008, endDrop, tapeW);
      end.translate(side * (size.x / 2 + 0.004), size.y - endDrop / 2, 0);
      group.add(new Mesh(end, tapeMat));
    }
    group.add(new Mesh(tape, tapeMat));

    // Shipping label on top
    const labelMat = new MeshStandardMaterial({ map: shippingLabel(spec.order, ink, paper, mono, 300 + index * 41), roughness: 0.78 });
    scannable(labelMat, u, false);
    const labelW = Math.min(size.x * 0.34, 1.5), labelH = labelW * 0.664;
    const labelGeo = new PlaneGeometry(labelW, labelH);
    labelGeo.rotateX(-Math.PI / 2);
    labelGeo.translate(size.x * 0.42, size.y + 0.012, size.z * 0.27);
    group.add(new Mesh(labelGeo, labelMat));

    // Handling marks printed on the side
    const printMat = new MeshStandardMaterial({ map: print, transparent: true, roughness: 0.8, opacity: 0.72 });
    scannable(printMat, u, false);
    const printH = Math.min(size.y * 0.62, 0.95), printW = printH * 2;
    const printGeo = new PlaneGeometry(printW, printH);
    printGeo.translate(-size.x * 0.27, size.y * 0.5, size.z / 2 + 0.006);
    group.add(new Mesh(printGeo, printMat));

    group.position.y = BELT_Y;
    scene.add(group);
    return { spec, size, group, u, x: 0 };
  }
  const parcels = PARCELS.map(buildParcel);

  await breathe();

  /* ---- Point cloud ------------------------------------------------------ */
  // One set of points on a unit box, stretched to whichever parcel is being scanned.
  const POINTS = phone ? 4200 : 9000;
  const cloudGeo = new BufferGeometry();
  {
    const p = new Float32Array(POINTS * 3), n = new Float32Array(POINTS * 3), r = new Float32Array(POINTS * 4);
    for (let i = 0; i < POINTS; i++) {
      const face = Math.random();
      const a = Math.random() - 0.5, b = Math.random() - 0.5;
      let v: number[], w: number[];
      if (face < 0.46) { v = [a, 0.5, b]; w = [0, 1, 0]; }
      else if (face < 0.7) { v = [a, b, 0.5]; w = [0, 0, 1]; }
      else if (face < 0.88) { v = [0.5, b, a]; w = [1, 0, 0]; }
      else if (face < 0.95) { v = [a, b, -0.5]; w = [0, 0, -1]; }
      else { v = [-0.5, b, a]; w = [-1, 0, 0]; }
      p.set(v, i * 3);
      n.set(w, i * 3);
      r.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    cloudGeo.setAttribute('position', new BufferAttribute(p, 3));
    cloudGeo.setAttribute('aNormal', new BufferAttribute(n, 3));
    cloudGeo.setAttribute('aRand', new BufferAttribute(r, 4));
  }
  const cloudU = {
    uSize: { value: new Vector3(1, 1, 1) }, uScan: { value: 99 }, uCloud: { value: 0 }, uTime: { value: 0 }, uScale: { value: 60 }, uDrift: { value: 0 },
    uColor: { value: C.scan }, uHot: { value: C.soft },
  };
  const cloud = new Points(cloudGeo, new ShaderMaterial({
    vertexShader: pointVertex, fragmentShader: pointFragment, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: cloudU,
  }));
  cloud.frustumCulled = false;
  scene.add(cloud);

  /* ---- Dust caught in the light ----------------------------------------- */
  const DUST = phone ? 260 : 700;
  const dustGeo = new BufferGeometry();
  {
    const p = new Float32Array(DUST * 3), r = new Float32Array(DUST * 4);
    for (let i = 0; i < DUST; i++) {
      p.set([CURTAIN + (Math.random() - 0.5) * 44, Math.random() * 8, (Math.random() - 0.5) * 34 + 2], i * 3);
      r.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    }
    dustGeo.setAttribute('position', new BufferAttribute(p, 3));
    dustGeo.setAttribute('aRand', new BufferAttribute(r, 4));
  }
  const dustU = { uTime: { value: 0 }, uCurtain: { value: CURTAIN }, uOn: { value: 0 }, uScale: { value: 60 }, uColor: { value: C.soft } };
  const dust = new Points(dustGeo, new ShaderMaterial({
    vertexShader: dustVertex, fragmentShader: dustFragment, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: dustU,
  }));
  dust.frustumCulled = false;
  scene.add(dust);

  /* ---- Detection brackets and dimension lines --------------------------- */
  const overlay = new Group();
  overlay.position.y = BELT_Y;
  scene.add(overlay);

  const bracketMat = new MeshBasicMaterial({ color: C.scan.clone().multiplyScalar(3), transparent: true, opacity: 0 });
  const THICK = 0.045;
  const armX = new BoxGeometry(BRACKET_ARM, THICK, THICK);
  const armY = new BoxGeometry(THICK, BRACKET_ARM, THICK);
  const armZ = new BoxGeometry(THICK, THICK, BRACKET_ARM);
  const corners: { group: Group; sign: Vector3 }[] = [];
  for (const sx of [-1, 1]) for (const sy of [0, 1]) for (const sz of [-1, 1]) {
    const group = new Group();
    const ax = new Mesh(armX, bracketMat), ay = new Mesh(armY, bracketMat), az = new Mesh(armZ, bracketMat);
    ax.position.x = -sx * BRACKET_ARM / 2;
    ay.position.y = sy ? -BRACKET_ARM / 2 : BRACKET_ARM / 2;
    az.position.z = -sz * BRACKET_ARM / 2;
    group.add(ax, ay, az);
    corners.push({ group, sign: new Vector3(sx, sy, sz) });
    overlay.add(group);
  }

  const dimMat = new MeshBasicMaterial({ color: C.measure.clone().multiplyScalar(2.2), transparent: true, opacity: 0 });
  const LINE = 0.024;
  const lineGeo = new BoxGeometry(1, LINE, LINE);
  lineGeo.translate(0.5, 0, 0);
  /** A dimension line: a stretched bar with an end tick at each end. */
  const makeDim = () => {
    const g = new Group();
    const bar = new Mesh(lineGeo, dimMat);
    const tickA = new Mesh(new BoxGeometry(LINE, 0.26, LINE), dimMat);
    const tickB = new Mesh(new BoxGeometry(LINE, 0.26, LINE), dimMat);
    g.add(bar, tickA, tickB);
    overlay.add(g);
    return { g, bar, tickB, length: 1 };
  };
  const dims = [makeDim(), makeDim(), makeDim(), makeDim()]; // L, W, H, weight leader
  const anchors = [new Vector3(), new Vector3(), new Vector3(), new Vector3()];

  let laidOut = -1;
  function layout(index: number) {
    if (index === laidOut) return;
    laidOut = index;
    const { size, spec } = parcels[index];
    corners.forEach((c) => c.group.position.set((c.sign.x * size.x) / 2, c.sign.y * size.y, (c.sign.z * size.z) / 2));
    const off = 0.72;
    const [dl, dw, dh, dk] = dims;
    dl.g.position.set(-size.x / 2, 0.03, size.z / 2 + off);
    dl.g.rotation.set(0, 0, 0);
    dl.length = size.x;
    dw.g.position.set(size.x / 2 + off, 0.03, size.z / 2);
    dw.g.rotation.set(0, Math.PI / 2, 0);
    dw.length = size.z;
    dh.g.position.set(size.x / 2 + 0.5, 0, -size.z / 2 - 0.1);
    dh.g.rotation.set(0, 0, Math.PI / 2);
    dh.length = size.y;
    dk.g.position.set(-size.x * 0.1, size.y + 0.02, -size.z * 0.12);
    dk.g.rotation.set(0, 0, Math.PI / 2);
    dk.length = 0.95;

    anchors[0].set(-0.1, BELT_Y, size.z / 2 + off + 0.72);
    anchors[1].set(size.x / 2 + off + 0.95, BELT_Y, -0.1);
    anchors[2].set(size.x / 2 + 0.72, BELT_Y + size.y / 2, -size.z / 2 - 0.1);
    anchors[3].set(-size.x * 0.1, BELT_Y + size.y + 1.25, -size.z * 0.12);
    o.labels[0].value = spec.l;
    o.labels[1].value = spec.w;
    o.labels[2].value = spec.h;
    o.labels[3].value = spec.kg;
    cloudU.uSize.value.copy(size);
  }

  /* ---- The vAudit camera feed: a small pack station, filmed from above ---- */
  const feedScene = new Scene();
  feedScene.background = C.night.clone().multiplyScalar(1.6);
  const feedCam = new PerspectiveCamera(34, 1.6, 0.1, 60);
  feedCam.position.set(0, 7.2, 5);
  feedCam.lookAt(0, 0.3, 0.1);
  feedScene.add(new AmbientLight(C.led, 0.35));
  const feedKey = new DirectionalLight(C.led, 2.6);
  feedKey.position.set(3, 8, 3);
  feedScene.add(feedKey);
  const bench = new Mesh(new BoxGeometry(11, 0.2, 7), new MeshStandardMaterial({ color: C.metal.clone().multiplyScalar(0.28), roughness: 0.5, metalness: 0.5 }));
  bench.position.y = -0.1;
  feedScene.add(bench);
  const crate = new Group();
  const cardFeed = new MeshStandardMaterial({ map: board.map, roughness: 0.9, side: DoubleSide });
  const W = 3.1, H = 1.3, D = 2.2;
  const wall = (w: number, h: number, x: number, y: number, z: number, ry: number) => {
    const mesh = new Mesh(new PlaneGeometry(w, h), cardFeed);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry;
    crate.add(mesh);
  };
  wall(W, H, 0, H / 2, D / 2, 0);
  wall(W, H, 0, H / 2, -D / 2, 0);
  wall(D, H, W / 2, H / 2, 0, Math.PI / 2);
  wall(D, H, -W / 2, H / 2, 0, Math.PI / 2);
  const inside = new Mesh(new PlaneGeometry(W, D), new MeshStandardMaterial({ color: C.box.clone().multiplyScalar(0.25), roughness: 1 }));
  inside.rotation.x = -Math.PI / 2;
  inside.position.y = 0.02;
  crate.add(inside);
  for (const [x, z, ry, rx, w] of [[0, D / 2 + 0.38, 0, -1.05, W], [0, -D / 2 - 0.38, 0, 1.05, W], [W / 2 + 0.38, 0, Math.PI / 2, -1.05, D], [-W / 2 - 0.38, 0, -Math.PI / 2, -1.05, D]] as const) {
    const flap = new Mesh(new PlaneGeometry(w, 0.9), cardFeed);
    flap.position.set(x, H + 0.1, z);
    flap.rotation.set(0, ry, 0, 'YXZ');
    flap.rotateX(rx);
    crate.add(flap);
  }
  feedScene.add(crate);
  const item = new Mesh(new BoxGeometry(1.2, 0.8, 1), new MeshStandardMaterial({ color: C.scan, roughness: 0.35 }));
  feedScene.add(item);

  /* ---- Picture ---------------------------------------------------------- */
  let composer: EffectComposer;
  let renderPass: RenderPass;
  let bloom: UnrealBloomPass;
  let lens: ShaderPass;
  let width = 1, height = 1;
  const slot = { cx: 0, cy: 0, w: 1, h: 1 };
  const feedRect = { x: 0, y: 0, w: 0, h: 0 };

  function buildComposer() {
    composer?.dispose();
    const q = QUALITY[level];
    const target = new WebGLRenderTarget(4, 4, { type: HalfFloatType, samples: q.samples });
    composer = new EffectComposer(renderer, target);
    renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    composer.addPass(new ShaderPass(safetyShader));
    bloom = new UnrealBloomPass(new Vector2(256, 256), LOOK.bloom, LOOK.bloomRadius, LOOK.bloomThreshold);
    bloom.enabled = q.bloom;
    composer.addPass(bloom);
    lens = new ShaderPass(lensShader);
    lens.uniforms.uExposure.value = LOOK.exposure;
    composer.addPass(lens);
    measure();
  }

  function measure() {
    const hero = o.hero.getBoundingClientRect();
    width = Math.max(1, Math.round(hero.width));
    height = Math.max(1, Math.round(hero.height));
    const dpr = Math.min(devicePixelRatio, QUALITY[level].dpr, Math.sqrt(MAX_PIXELS / (width * height)));
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    composer.setPixelRatio(dpr);
    composer.setSize(width, height);
    const s = o.slot.getBoundingClientRect();
    slot.cx = s.left - hero.left + s.width / 2;
    slot.cy = s.top - hero.top + s.height / 2;
    slot.w = s.width;
    slot.h = s.height;
    o.hero.style.setProperty('--slot-top', `${s.top - hero.top}px`);
    o.hero.style.setProperty('--slot-bottom', `${hero.bottom - s.bottom}px`);
    const f = o.feed.getBoundingClientRect();
    feedRect.x = f.left - hero.left;
    feedRect.y = height - (f.bottom - hero.top);
    feedRect.w = f.width;
    feedRect.h = f.height;
    feedCam.aspect = f.width / Math.max(1, f.height);
    feedCam.updateProjectionMatrix();
    camera.aspect = width / height;
    // Sizes the parcel for its slot, then slides the picture so it sits in the slot's centre.
    camera.setViewOffset(width, height, width / 2 - slot.cx, height / 2 - slot.cy, width, height);
    camera.updateProjectionMatrix();
    sizeMirror();
    const scale = 900 * Math.min(dpr, 2) * (height / 900);
    cloudU.uScale.value = scale * 0.062;
    dustU.uScale.value = scale * 0.062;
  }

  function fitDistance() {
    const tan = Math.tan(((CAMERA.fov / 2) * Math.PI) / 180);
    return CAMERA.radius / Math.min((tan * slot.h) / height, (tan * camera.aspect * slot.w) / width);
  }

  /* ---- Floor reflection: the hall drawn again from under the floor, at low resolution ---- */
  const mirrorCam = new PerspectiveCamera();
  let mirrorTarget: WebGLRenderTarget | null = null;
  const bias = new Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
  const camUp = new Vector3();
  const camFront = new Vector3();
  const mirrorLook = new Vector3();
  function sizeMirror() {
    mirrorTarget?.dispose();
    mirrorTarget = null;
    const scale = QUALITY[level].mirror;
    floorU.uReflect.value = scale ? LOOK.reflection : 0;
    if (!scale) return;
    mirrorTarget = new WebGLRenderTarget(Math.round(width * scale), Math.round(height * scale), { type: HalfFloatType });
    floorU.uMirror.value = mirrorTarget.texture;
  }
  function renderMirror() {
    if (!mirrorTarget) return;
    mirrorCam.position.set(camera.position.x, -camera.position.y, camera.position.z);
    camera.getWorldDirection(camFront);
    mirrorLook.set(camera.position.x + camFront.x, -camera.position.y - camFront.y, camera.position.z + camFront.z);
    camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
    mirrorCam.up.set(camUp.x, -camUp.y, camUp.z);
    mirrorCam.lookAt(mirrorLook);
    mirrorCam.near = camera.near;
    mirrorCam.far = camera.far;
    mirrorCam.projectionMatrix.copy(camera.projectionMatrix);
    mirrorCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    mirrorCam.updateMatrixWorld();
    mirrorMatrix.copy(bias).multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
    floor.visible = false;
    cloud.visible = false;
    const shadows = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(mirrorTarget);
    renderer.clear();
    renderer.render(scene, mirrorCam);
    renderer.setRenderTarget(null);
    renderer.shadowMap.autoUpdate = shadows;
    floor.visible = true;
    cloud.visible = cloudU.uCloud.value > 0.001;
  }

  /* ---- Pointer and scroll ------------------------------------------------ */
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  };
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer) addEventListener('pointermove', onPointer, { passive: true });

  /* ---- Each frame ------------------------------------------------------- */
  const beltLen = 6;
  const dir = new Vector3();
  const look = new Vector3();
  const v = new Vector3();
  const seen = new Map<Element, Record<string, string>>();
  const put = (node: Element, key: string, value: string) => {
    let was = seen.get(node);
    if (!was) seen.set(node, (was = {}));
    if (was[key] === value) return;
    was[key] = value;
    if (key === 'text') node.textContent = value;
    else (node as HTMLElement).style.setProperty(key, value);
  };

  function draw(time: number, dt: number) {
    const beat = Math.floor(time / T.beat);
    const t = time - beat * T.beat;
    const active = beat % parcels.length;
    const s = beat * SPACING + beltAt(t) + SPACING;
    layout(active);

    // Belt and parcels
    belted.map.offset.x = -(s / beltLen) % 1;
    belted.normal.offset.x = belted.map.offset.x;
    turnRollers(s / 0.15);
    parcels.forEach((p, i) => {
      const span3 = SPACING * parcels.length;
      p.x = ((((s - i * SPACING) % span3) + span3) % span3) - SPACING;
      p.group.position.x = p.x;
      p.group.visible = p.x > -SPACING - 1 && p.x < SPACING * 1.4;
      contact[i].set(p.x, p.size.x / 2, p.size.z / 2);
      p.u.uOn.value = 0;
      p.u.uMesh.value = 0;
      p.u.uScan.value = 99;
    });

    const now = parcels[active];
    const clear = 1 - span(t, T.clear, T.clearFor);
    const on = span(t, T.laserOn, 0.2) * (1 - span(t, T.laserOff, 0.3));
    const scanHere = CURTAIN - now.x;

    now.u.uOn.value = on;
    now.u.uScan.value = scanHere;
    now.u.uMesh.value = easeOut(span(t, T.mesh, T.meshFor)) * clear;
    beltU.uOn.value = on;
    curtainMat.uniforms.uOn.value = on;
    curtain.visible = on > 0.001;
    curtainMat.uniforms.uTime.value = time;
    laserLight.intensity = on * 24;
    dustU.uOn.value = on;
    dustU.uTime.value = time;

    // Point cloud rides on the parcel, then lifts away as the scene clears.
    cloud.position.set(now.x, BELT_Y, 0);
    cloudU.uScan.value = scanHere;
    cloudU.uTime.value = time;
    const cloudIn = span(t, T.laserOn, 0.2);
    const settle = 1 - 0.72 * easeInOut(span(t, T.lock, 1.6));
    cloudU.uCloud.value = t < T.clear ? cloudIn * settle : settle * clear;
    cloudU.uDrift.value = span(t, T.clear, T.clearFor);
    cloud.visible = cloudU.uCloud.value > 0.001;

    // Brackets arrive wide and snap onto the parcel, with one pulse.
    overlay.position.x = now.x;
    const lock = easeOut(span(t, T.lock, T.lockFor));
    const pulse = Math.sin(span(t, T.lock + T.lockFor, 0.5) * Math.PI) * 0.09;
    const spread = 0.12 + (1 - lock) * 1.5 + pulse;
    const { size } = now;
    corners.forEach((c) => c.group.position.set(c.sign.x * (size.x / 2 + spread), c.sign.y ? size.y + spread : -0.02, c.sign.z * (size.z / 2 + spread)));
    bracketMat.opacity = span(t, T.lock, 0.2) * clear;
    overlay.visible = bracketMat.opacity > 0.001 || t < T.clear;

    // Dimension lines draw themselves; labels count up beside them.
    dimMat.opacity = clear;
    dims.forEach((d, k) => {
      const at = T.dims + k * T.dimsGap;
      const grow = easeOut(span(t, at, T.dimsFor));
      d.g.visible = grow > 0.001 && clear > 0.001;
      d.bar.scale.x = Math.max(0.0001, d.length * grow);
      d.tickB.position.x = d.length * grow;
      const label = o.labels[k];
      const shown = span(t, at, 0.3) * clear;
      put(label.root, 'opacity', shown.toFixed(3));
      put(label.num, 'text', (label.value * grow).toFixed(1));
    });

    // Capture: a wave of machine vision rolls out through the whole hall.
    const wave = span(t, T.chip, T.waveFor);
    waveU.uWaveFrom.value.x = now.x;
    waveU.uWave.value = wave * T.waveReach;
    waveU.uWaveAlpha.value = wave > 0 && wave < 1 ? (1 - wave) ** 1.4 : 0;
    const blink = Math.exp(-Math.max(t - T.chip, 0) * 2.4) * (t > T.chip ? 1 : 0);
    pulseLight.intensity = blink * 14;
    statusMat.color.copy(C.ok).multiplyScalar(0.5 + blink * 6);
    ringMat.color.copy(C.scan).multiplyScalar(0.9 + on * 3);
    stripMat.color.copy(C.led).multiplyScalar(0.5 + on * 1.6 + blink * 1.2);

    const chipIn = easeOut(span(t, T.chip, 0.6));
    put(o.chip, 'opacity', (span(t, T.chip, 0.3) * clear).toFixed(3));
    put(o.chip, 'translate', `0 ${((1 - chipIn) * 8).toFixed(2)}px`);
    put(o.check, 'stroke-dashoffset', (1 - easeOut(span(t, T.chip + 0.15, 0.5))).toFixed(3));
    const badge = easeOut(span(t, T.verified, 0.6));
    put(o.verified, 'opacity', (span(t, T.verified, 0.25) * clear).toFixed(3));
    put(o.verified, 'scale', (0.86 + badge * 0.14).toFixed(3));
    put(o.order, 'text', now.spec.order);

    // Camera: a slow orbit, a push-in during the scan, the pointer, and scroll lifting it overhead.
    const k = 1 - Math.exp(-dt * 3);
    pointer.sx += (pointer.x - pointer.sx) * k;
    pointer.sy += (pointer.y - pointer.sy) * k;
    const scroll = clamp(scrollY / Math.max(1, height));
    const push = easeInOut(span(t, 1.2, 3)) * (1 - easeInOut(span(t, T.clear, T.beat - T.clear)));
    const yaw = Math.sin((time / (T.beat * 3)) * Math.PI * 2) * CAMERA.drift + pointer.sx * CAMERA.mouse;
    const pitch = -pointer.sy * CAMERA.mouse * 0.6 + scroll * 0.42;
    dir.copy(CAMERA.from).normalize();
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const dx = dir.x * cosY + dir.z * sinY, dz = -dir.x * sinY + dir.z * cosY;
    dir.set(dx, dir.y + pitch, dz).normalize();
    const distance = fitDistance() * (1 - push * CAMERA.pushIn) * (1 + scroll * 0.18);
    look.copy(CAMERA.target);
    camera.position.copy(look).addScaledVector(dir, distance);
    camera.lookAt(look);
    camera.updateMatrixWorld();

    // Labels are real page text, placed where their 3D points land on screen.
    o.labels.forEach((label, i) => {
      v.copy(anchors[i]);
      v.x += now.x;
      v.project(camera);
      put(label.root, 'transform', `translate3d(${(((v.x + 1) / 2) * width).toFixed(1)}px, ${(((1 - v.y) / 2) * height).toFixed(1)}px, 0)`);
    });

    // The feed: an item is lowered into the box on the bench.
    const drop = easeOut(span(t, T.drop, T.dropFor));
    item.position.set(0, 3.7 - drop * 3.1, 0.05);
    item.rotation.y = 0.35 * (1 - drop);
    item.visible = t > T.drop - 0.05 && t < T.clear + 1;

    moveCarried(time);
    moveRobots(time);
    renderMirror();
    lens.uniforms.uTime.value = time;
    composer.render();

    // Drawn straight over the finished picture, inside the panel's rectangle.
    renderer.autoClear = false;
    renderer.setScissorTest(true);
    renderer.setViewport(feedRect.x, feedRect.y, feedRect.w, feedRect.h);
    renderer.setScissor(feedRect.x, feedRect.y, feedRect.w, feedRect.h);
    renderer.clearDepth();
    renderer.render(feedScene, feedCam);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, width, height);
    renderer.autoClear = true;
  }

  /* ---- Clock ------------------------------------------------------------- */
  let running = false, frame = 0, last = 0, clock = 0, spent = 0, counted = 0, ready = false, stopped = false;
  let frozen = false;
  let warmup = 20; // the first frames are slow everywhere while the GPU settles

  function setLevel(next: number) {
    level = next;
    renderer.shadowMap.enabled = QUALITY[level].shadows;
    key.castShadow = QUALITY[level].shadows;
    scene.traverse((x) => {
      const mat = (x as Mesh).material as MeshStandardMaterial | undefined;
      if (mat && 'needsUpdate' in mat) mat.needsUpdate = true;
    });
    buildComposer();
  }

  function tick(now: number) {
    // A frame's timestamp can be slightly older than the moment the clock started,
    // so time is never allowed to run backwards. Long gaps count as one short step.
    const raw = now - last;
    last = now;
    const dt = Math.max(0, Math.min(raw / 1000, 0.1));
    if (!frozen) clock += dt;
    draw(clock, dt);
    if (!ready) {
      ready = true;
      o.onReady();
    }
    // Steps quality down if the device cannot keep up; never back up, to avoid flicker.
    // Judged by the clock, not a frame count, so a struggling device is helped soonest.
    // Only ever steps down, to avoid flicker. A very slow device skips a level.
    if (warmup > 0) warmup--;
    else if (!frozen && raw < 500) {
      counted++;
      spent += raw;
      if (spent >= 900) {
        const average = spent / counted;
        if (average > AIM_MS && level < QUALITY.length - 1) {
          setLevel(Math.min(QUALITY.length - 1, level + (average > AIM_MS * 2 ? 2 : 1)));
          warmup = 12;
        }
        counted = spent = 0;
      }
    }
    frame = requestAnimationFrame(tick);
  }

  const setRunning = (on: boolean) => {
    if (on === running || stopped) return;
    running = on;
    o.hero.setAttribute('data-paused', String(!on));
    cancelAnimationFrame(frame);
    if (on) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const onLost = (e: Event) => {
    e.preventDefault();
    console.warn('3D hero scene lost its graphics context; showing the fallback.');
    stop();
    o.onLost();
  };
  o.canvas.addEventListener('webglcontextlost', onLost);

  buildComposer();
  // Shaders compile in the background where the browser supports it.
  await renderer.compileAsync(scene, camera);
  await breathe();
  const resize = new ResizeObserver(() => measure());
  resize.observe(o.hero);
  const io = new IntersectionObserver((e) => setRunning(e[0].isIntersecting));
  io.observe(o.hero);

  if (import.meta.env.DEV) {
    // For checking a single moment of the scene while developing.
    (window as unknown as { __scan: object }).__scan = {
      seek: (t: number) => { clock = t; frozen = true; draw(clock, 0); },
      play: () => { frozen = false; },
      level: (n: number) => setLevel(n),
      get state() { return { clock, level }; },
    };
  }

  function stop() {
    if (stopped) return;
    setRunning(false);
    stopped = true;
    resize.disconnect();
    io.disconnect();
    if (finePointer) removeEventListener('pointermove', onPointer);
    o.canvas.removeEventListener('webglcontextlost', onLost);
    composer.dispose();
    renderer.dispose();
  }
  return { stop };
}
