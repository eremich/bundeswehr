import * as THREE from "three";

// Character-select stage: the chosen character stands on a hex platform,
// lit in Bundeswehr navy and gold. It materialises from the floor up behind
// a gold scan line, like spawning in a game lobby.

const GOLD = 0xf9b600;
const NAVY_DEEP = 0x001521;
const PLATFORM_TOP = 0.12;
const SPAWN_MS = 750;
const DESPAWN_MS = 220;
const FIGURE_TOP = 2.05;
const DRAG_SPEED = 0.008;
const DUST_COUNT = 260;
const CUTOUT_HEIGHT = 1.78;
const GLOW_STRENGTH = 0.32;
const CUTOUT_SWAY = 0.1; // rad, idle sway of flat characters
const CUTOUT_MAX_TURN = 0.4; // flat characters can't spin, only lean toward the cursor
const TEXTURE_WAIT_MS = 2000;
// on the profile screen the camera slides right so the character sits in the left third
const PAN_X = 1.35;
const PAN_EASE = 0.08;

// camera framings: phones get the character closer, short desktops pull back
// so the platform clears the bottom bar
const FRAMING = {
  narrow: { fov: 34, pos: [0, 1.35, 5.0], look: 1.0 },
  short: { fov: 30, pos: [0, 1.3, 6.1], look: 0.82 },
  wide: { fov: 30, pos: [0, 1.3, 5.8], look: 0.74 },
};
const NARROW_ASPECT = 0.9;
const NARROW_WIDTH = 700; // phone layout: the stage is a short band, not a tall column
const SHORT_ASPECT = 1.7;

// clip everything above uCut and burn a gold seam along the cut
const cut = { value: 0 };
function withScanCut(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCut = cut;
    shader.vertexShader = shader.vertexShader
      .replace("void main() {", "varying float vWY;\nvoid main() {")
      .replace("#include <project_vertex>", "#include <project_vertex>\n  vWY = (modelMatrix * vec4(transformed, 1.0)).y;");
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float uCut;\nvarying float vWY;\nvoid main() {\n  if (vWY > uCut) discard;")
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.78, 0.15), smoothstep(0.07, 0.0, uCut - vWY));");
  };
  return material;
}

function buildPlatform(scene) {
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 1.05, PLATFORM_TOP, 6),
    new THREE.MeshStandardMaterial({ color: 0x0c2433, roughness: 0.5, metalness: 0.4, flatShading: true }),
  );
  base.position.y = PLATFORM_TOP / 2;
  base.rotation.y = Math.PI / 6;
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.08, 1.11, 6, 1), new THREE.MeshBasicMaterial({ color: GOLD, side: THREE.DoubleSide }));
  ring.rotation.set(-Math.PI / 2, 0, Math.PI / 6 + Math.PI / 2);
  ring.position.y = 0.005;
  const pulse = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.62, 64),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }),
  );
  pulse.rotation.x = -Math.PI / 2;
  pulse.position.y = PLATFORM_TOP + 0.003;
  const grid = new THREE.GridHelper(40, 80, GOLD, GOLD);
  grid.material.transparent = true;
  grid.material.opacity = 0.07;
  scene.add(base, ring, pulse, grid);
  return pulse;
}

// additive gold shader used by the spawn beam and the backlight
function goldGlow(fragmentShader, uniforms) {
  return new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader,
  });
}

// vertical light column that flashes on spawn
function buildBeam(scene) {
  const material = goldGlow(
    "uniform float uOpacity; varying vec2 vUv; void main() { gl_FragColor = vec4(0.98, 0.71, 0.0, (1.0 - vUv.y) * uOpacity * 0.5); }",
    { uOpacity: { value: 0 } },
  );
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4, 6, 1, true), material);
  beam.position.y = 2;
  scene.add(beam);
  return material.uniforms.uOpacity;
}

// soft gold backlight so dark uniforms separate from the navy backdrop
function buildBacklight(scene) {
  const material = goldGlow(
    "uniform float uStrength; varying vec2 vUv; void main() { float d = length((vUv - vec2(0.5, 0.55)) * vec2(1.6, 1.0)); gl_FragColor = vec4(0.98, 0.71, 0.0, smoothstep(0.5, 0.0, d) * uStrength); }",
    { uStrength: { value: 0 } },
  );
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), material);
  glow.position.set(0, PLATFORM_TOP + 1.0, -0.25);
  scene.add(glow);
  return material.uniforms.uStrength;
}

function buildDust(scene) {
  const pos = new Float32Array(DUST_COUNT * 3);
  for (let i = 0; i < DUST_COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 8;
    pos[i * 3 + 1] = Math.random() * 4;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(geo, new THREE.PointsMaterial({ color: GOLD, size: 0.018, transparent: true, opacity: 0.55, depthWrite: false }));
  scene.add(dust);
  return dust;
}

const textureReady = (tex) => new Promise((resolve) => {
  const start = performance.now();
  const check = () => (tex.image || performance.now() - start > TEXTURE_WAIT_MS ? resolve() : setTimeout(check, 50));
  check();
});

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export function createStage(canvas, { reducedMotion }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(NAVY_DEEP, 5, 14);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

  scene.add(new THREE.HemisphereLight(0x9cc3d6, NAVY_DEEP, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(2, 3, 3);
  scene.add(key);

  const pulse = buildPlatform(scene);
  const beam = buildBeam(scene);
  const backlight = buildBacklight(scene);
  const dust = buildDust(scene);

  const loader = new THREE.TextureLoader();
  const textures = new Map();
  const loadTexture = (url) => {
    if (!textures.has(url)) {
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      textures.set(url, tex);
    }
    return textures.get(url);
  };
  const character = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    withScanCut(new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, fog: false })),
  );
  character.visible = false;
  scene.add(character);

  let framing = FRAMING.wide;
  let pan = 0;
  let panTarget = 0;
  let panWanted = false;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / h;
    const f = w < NARROW_WIDTH || aspect < NARROW_ASPECT ? FRAMING.narrow : aspect > SHORT_ASPECT ? FRAMING.short : FRAMING.wide;
    framing = f;
    // phones stack the dossier below the stage, so the character stays centred there
    panTarget = panWanted && f !== FRAMING.narrow ? PAN_X : 0;
    camera.aspect = aspect;
    camera.fov = f.fov;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // drag to lean the character toward the cursor, like inspecting it in a lobby
  let turn = 0;
  let dragX = null;
  canvas.addEventListener("pointerdown", (e) => { dragX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (dragX === null) return;
    turn = THREE.MathUtils.clamp(turn + (e.clientX - dragX) * DRAG_SPEED, -CUTOUT_MAX_TURN, CUTOUT_MAX_TURN);
    dragX = e.clientX;
  });
  const endDrag = () => { dragX = null; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  let tween = null; // { from, to, start, dur, done }
  const animateCut = (to, dur) => new Promise((done) => {
    if (reducedMotion) { cut.value = to; return done(); }
    tween = { from: cut.value, to, start: performance.now(), dur, done };
  });
  let beamFlash = 0;

  const timer = new THREE.Timer();
  function frame(now) {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const t = timer.getElapsed();

    if (tween) {
      const p = Math.min((now - tween.start) / tween.dur, 1);
      cut.value = tween.from + (tween.to - tween.from) * easeOut(p);
      if (p === 1) { const { done } = tween; tween = null; done(); }
    }
    if (dragX === null) turn *= 0.94; // lean back to face the camera
    const sway = reducedMotion ? 0 : Math.sin(t * 0.7) * CUTOUT_SWAY;
    character.rotation.y += (turn + sway - character.rotation.y) * 0.1;
    backlight.value = character.visible ? GLOW_STRENGTH * (cut.value / FIGURE_TOP) : 0;
    if (!reducedMotion) {
      const s = 1 + ((t * 0.6) % 1) * 0.9;
      pulse.scale.setScalar(s);
      pulse.material.opacity = 0.6 * (1 - ((t * 0.6) % 1));
      const d = dust.geometry.attributes.position;
      for (let i = 0; i < DUST_COUNT; i++) d.setY(i, (d.getY(i) + dt * 0.08) % 4);
      d.needsUpdate = true;
    }
    pan += (panTarget - pan) * (reducedMotion ? 1 : PAN_EASE);
    camera.position.set(framing.pos[0] + pan, framing.pos[1], framing.pos[2]);
    camera.lookAt(pan, framing.look, 0);
    beamFlash = Math.max(0, beamFlash - dt * 1.8);
    beam.value = beamFlash;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    preload(urls) { urls.forEach(loadTexture); },
    setPan(on) {
      panWanted = on;
      panTarget = on && framing !== FRAMING.narrow ? PAN_X : 0;
    },
    flash() { beamFlash = 1; },
    // despawn the current character, swap the image, then spawn the new one
    async setRole(role, { first = false } = {}) {
      if (!first) await animateCut(0, DESPAWN_MS);
      const tex = loadTexture(role.image);
      await textureReady(tex);
      const aspect = tex.image ? tex.image.width / tex.image.height : 0.4;
      character.material.map = tex;
      character.material.needsUpdate = true;
      character.scale.set(CUTOUT_HEIGHT * aspect, CUTOUT_HEIGHT, 1);
      character.position.y = PLATFORM_TOP + CUTOUT_HEIGHT / 2;
      character.visible = true;
      beamFlash = 1;
      await animateCut(FIGURE_TOP, SPAWN_MS);
    },
  };
}
