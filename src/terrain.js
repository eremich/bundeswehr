import * as THREE from "three";

// Low-poly terrain rendered as 1-bit ordered dither (Marathon key-art look):
// every pixel is either "paper" or "ink". Each Bereich gets its own landform,
// and switching triggers a pixelation burst.

// colours must match the CSS hex values exactly, so skip three.js colour management
THREE.ColorManagement.enabled = false;

const SEG_X = 90;
const SEG_Z = 60;
const SIZE_X = 80;
const SIZE_Z = 50;
const FLY_SPEED = 2.2;
const DOT_PX = 3; // dither cell in CSS pixels
const BURST_SCALE = 5; // how coarse the pixels get at the start of a cut
const MORPH_SPEED = 1.8;
const MOBILE_MAX = 760;
const TOP_OFFSET = 92; // nav + top ticker
const PHOTO_FADE_IN = 1.6; // per second

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function ridged(x, z, f = 0.08, octaves = 4) {
  let h = 0, amp = 1;
  for (let o = 0; o < octaves; o++) { h += (1 - Math.abs(noise(x * f, z * f) * 2 - 1)) * amp; amp *= 0.5; f *= 2.1; }
  return h;
}
function smooth(x, z) {
  let h = 0, amp = 1, f = 0.06;
  for (let o = 0; o < 3; o++) { h += noise(x * f, z * f) * amp; amp *= 0.5; f *= 2; }
  return h;
}
// a valley down the middle keeps the eye travelling into the distance
const valley = (x) => 0.25 + 0.75 * Math.min(1, Math.abs(x) / 10);

const SHAPES = {
  ridges: (x, z) => ridged(x, z) * 3.2 * valley(x),
  peaks: (x, z) => Math.pow(ridged(x, z, 0.06) / 1.9, 2.4) * 10 * valley(x),
  blocks: (x, z) => (Math.round(ridged(x, z, 0.07, 2) * 2.5) / 2.5) * 2.8 * valley(x),
  dunes: (x, z) => smooth(x, z) * 3.4 * valley(x),
  waves: (x, z, t) => Math.sin(x * 0.45 + z * 0.6 + t * 1.6) * 0.55 + Math.sin(x * 0.9 - z * 0.35 + t) * 0.3 + noise(x * 0.15, z * 0.15) * 1.4,
};

const vertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const fragment = /* glsl */ `
  uniform vec3 uLight;
  uniform float uScan;
  uniform float uReveal;
  uniform float uPix;
  uniform vec3 uPaper;
  uniform vec3 uInk;
  varying vec3 vWorld;
  // recursive Bayer matrix, 8x8
  float b2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
  float b4(vec2 a) { return b2(0.5 * a) * 0.25 + b2(a); }
  float b8(vec2 a) { return b4(0.5 * a) * 0.25 + b2(a); }
  void main() {
    vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
    float diff = max(dot(n, normalize(uLight)), 0.0);
    float l = 0.02 + diff * 0.5;
    l += smoothstep(1.3, 0.0, abs(vWorld.z - uScan)) * 0.7;     // scan band sweeping away
    l *= 1.0 - smoothstep(-8.0, -42.0, vWorld.z);                 // fade into the distance
    l *= smoothstep(uReveal, uReveal - 6.0, -vWorld.z);            // reveal from the front
    float threshold = b8(gl_FragCoord.xy / uPix);
    gl_FragColor = vec4(l > threshold ? uInk : uPaper, 1.0);
  }`;

// Bereich photo as a dithered "runner portrait": same paper/ink, dissolves in
// through the dither pattern and tears into offset rows on a cut.
const photoFragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec4 uRect;        // x, y, w, h in device px (origin bottom-left)
  uniform float uImgAspect;
  uniform float uFocus;
  uniform float uOpacity;
  uniform float uBurst;
  uniform float uPix;
  uniform float uMobile;
  uniform vec3 uPaper;
  uniform vec3 uInk;
  float b2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
  float b4(vec2 a) { return b2(0.5 * a) * 0.25 + b2(a); }
  float b8(vec2 a) { return b4(0.5 * a) * 0.25 + b2(a); }
  float hash(float n) { return fract(sin(n * 91.345) * 47453.5453); }
  void main() {
    vec2 p = gl_FragCoord.xy;
    vec2 local = (p - uRect.xy) / uRect.zw;
    if (local.x < 0.0 || local.x > 1.0 || local.y < 0.0 || local.y > 1.0) discard;
    // soft edges: fade on the left (desktop) and at the bottom into the terrain
    float mask = mix(smoothstep(0.0, 0.4, local.x), 1.0, uMobile) * smoothstep(0.0, 0.3, local.y);
    if (mask * uOpacity <= b8(p / uPix + 17.0)) discard;
    // object-fit: cover, cropped around the subject
    float rectAspect = uRect.z / uRect.w;
    vec2 uv = local;
    if (uImgAspect > rectAspect) {
      float s = rectAspect / uImgAspect;
      uv.x = clamp(uFocus - s * 0.5, 0.0, 1.0 - s) + local.x * s;
    } else {
      float s = uImgAspect / rectAspect;
      uv.y = (1.0 - s) * 0.5 + local.y * s;
    }
    float row = floor(p.y / (uPix * 5.0));
    uv.x += (hash(row) - 0.5) * 0.12 * uBurst * step(0.6, hash(row + 3.0));
    float lum = dot(texture2D(uTex, uv).rgb, vec3(0.299, 0.587, 0.114));
    lum = smoothstep(0.06, 0.72, lum);
    gl_FragColor = vec4(lum > b8(p / uPix) ? uInk : uPaper, 1.0);
  }`;

export function createTerrain(canvas, { reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  renderer.autoClear = false;
  const dpr = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 200);

  const geo = new THREE.PlaneGeometry(SIZE_X, SIZE_Z, SEG_X, SEG_Z);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -SIZE_Z / 2 + 6);
  const pos = geo.attributes.position;
  const baseX = Float32Array.from({ length: pos.count }, (_, i) => pos.getX(i));
  const baseZ = Float32Array.from({ length: pos.count }, (_, i) => pos.getZ(i));

  const paper = new THREE.Color("#002437");
  const ink = new THREE.Color("#f9b600");
  const uniforms = {
    uLight: { value: new THREE.Vector3(0.4, 0.8, 0.3) },
    uScan: { value: 0 },
    uReveal: { value: 0 },
    uPix: { value: DOT_PX * dpr },
    uPaper: { value: paper },
    uInk: { value: ink },
  };
  scene.add(new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragment })));

  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const photoUniforms = {
    uTex: { value: null },
    uRect: { value: new THREE.Vector4() },
    uImgAspect: { value: 16 / 7 },
    uFocus: { value: 0.5 },
    uOpacity: { value: 0 },
    uBurst: { value: 0 },
    uPix: uniforms.uPix,
    uMobile: { value: 0 },
    uPaper: uniforms.uPaper,
    uInk: uniforms.uInk,
  };
  const photoScene = new THREE.Scene();
  const photoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  photoScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: photoUniforms,
    vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: photoFragment,
    depthTest: false,
  })));
  function texture(url) {
    if (!textures.has(url)) {
      const tex = loader.load(url, (t) => { if (photoUniforms.uTex.value === t) photoUniforms.uImgAspect.value = t.image.width / t.image.height; });
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      textures.set(url, tex);
    }
    return textures.get(url);
  }
  let photoTarget = 0;

  let shapeFrom = SHAPES.ridges;
  let shapeTo = SHAPES.ridges;
  let morph = 1;
  let burst = 0;
  let travel = 0;
  let revealStart = null;
  const pointer = new THREE.Vector2();
  const look = new THREE.Vector2();

  function sculpt(t) {
    const k = morph * morph * (3 - 2 * morph);
    for (let i = 0; i < pos.count; i++) {
      const x = baseX[i], z = baseZ[i] - travel;
      const to = shapeTo(x, z, t);
      pos.setY(i, k >= 1 ? to : shapeFrom(x, z, t) * (1 - k) + to * k);
    }
    pos.needsUpdate = true;
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 64 : 48;
    camera.updateProjectionMatrix();
    // portrait panel: right side under the nav on desktop, top band on phones
    const mobile = w < MOBILE_MAX;
    const top = h - TOP_OFFSET;
    const rect = mobile ? [0, h * 0.42, w, top - h * 0.42] : [w * 0.34, h * 0.14, w * 0.66, top - h * 0.14];
    photoUniforms.uRect.value.set(...rect.map((v) => v * dpr));
    photoUniforms.uMobile.value = mobile ? 1 : 0;
  }
  resize();
  window.addEventListener("resize", resize);
  if (!reducedMotion) {
    window.addEventListener("pointermove", (e) => {
      pointer.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    }, { passive: true });
  }

  const timer = new THREE.Timer();
  function frame(now) {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();
    if (!reducedMotion) travel += FLY_SPEED * dt;
    morph = Math.min(1, morph + dt * MORPH_SPEED);
    burst = Math.max(0, burst - dt * 3.5);
    sculpt(reducedMotion ? 0 : t);
    photoUniforms.uOpacity.value = Math.min(photoTarget, photoUniforms.uOpacity.value + dt * PHOTO_FADE_IN);
    photoUniforms.uBurst.value = burst;

    look.lerp(pointer, 0.05);
    camera.position.set(look.x * 2.4, 7 + look.y * 1.3, 16);
    camera.lookAt(look.x * 3, 3.6, -14);
    uniforms.uLight.value.set(0.4 + look.x * 0.9, 0.8, 0.3 - look.y * 0.5);
    uniforms.uScan.value = 6 - ((t * 11) % 50);
    uniforms.uPix.value = DOT_PX * dpr * (1 + burst * burst * BURST_SCALE);
    if (revealStart !== null) uniforms.uReveal.value = reducedMotion ? 60 : Math.min(60, ((now - revealStart) / 1000) * 50);
    renderer.clear();
    renderer.render(scene, camera);
    if (photoUniforms.uTex.value) renderer.render(photoScene, photoCam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    reveal() { revealStart = performance.now(); photoTarget = 1; },
    preload(urls) { urls.forEach(texture); },
    // hard cut: palette swaps instantly, land morphs, pixels burst then settle
    cut({ shape, photo, focus, paper: p, ink: k }) {
      const tex = texture(photo);
      photoUniforms.uTex.value = tex;
      photoUniforms.uFocus.value = focus;
      if (tex.image) photoUniforms.uImgAspect.value = tex.image.width / tex.image.height;
      photoUniforms.uOpacity.value = reducedMotion ? 1 : 0;
      shapeFrom = shapeTo;
      shapeTo = SHAPES[shape] ?? SHAPES.ridges;
      morph = reducedMotion ? 1 : 0;
      paper.set(p);
      ink.set(k);
      renderer.setClearColor(paper);
      if (!reducedMotion) burst = 1;
    },
  };
}
