import * as THREE from "three";

// Character-select stage: a faceted stand-in figure on a hex platform,
// lit in Bundeswehr navy with gold rim light. It materialises from the
// floor up behind a gold scan line, like spawning in a game lobby.
// The figure is a placeholder until real models / photos arrive.

const GOLD = 0xf9b600;
const NAVY_DEEP = 0x001521;
const PLATFORM_TOP = 0.12;
const SPAWN_MS = 750;
const DESPAWN_MS = 220;
const FIGURE_TOP = 2.05;
const IDLE_SPIN = 0.22; // rad per second when nobody is dragging
const DRAG_SPEED = 0.008;
const IDLE_AFTER_DRAG_MS = 2500;
const DUST_COUNT = 260;
const CUTOUT_HEIGHT = 1.78;
const GLOW_STRENGTH = 0.32;
const CUTOUT_SWAY = 0.1; // rad, idle sway of flat characters
const CUTOUT_MAX_TURN = 0.4; // flat characters can't spin, only lean toward the cursor

// clip everything above uCut and burn a gold seam along the cut
const cut = { value: FIGURE_TOP };
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

function buildFigure() {
  const body = withScanCut(new THREE.MeshStandardMaterial({ color: 0x557c90, roughness: 0.55, metalness: 0.15, flatShading: true }));
  const gear = withScanCut(new THREE.MeshStandardMaterial({ color: 0x24404f, roughness: 0.6, metalness: 0.2, flatShading: true }));
  const accent = withScanCut(new THREE.MeshBasicMaterial({ color: GOLD }));
  const figure = new THREE.Group();
  const add = (geo, mat, [x, y, z], [rx = 0, ry = 0, rz = 0] = [], parent = figure) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.rotation.set(rx, ry, rz);
    parent.add(m);
    return m;
  };
  const cyl = (rt, rb, h, s = 6) => new THREE.CylinderGeometry(rt, rb, h, s);

  // body, roughly 1.75 m
  add(new THREE.IcosahedronGeometry(0.115, 1), body, [0, 1.62, 0]);
  add(cyl(0.045, 0.05, 0.09), body, [0, 1.5, 0]);
  add(cyl(0.2, 0.15, 0.5, 7), body, [0, 1.22, 0]).scale.z = 0.65;
  add(cyl(0.15, 0.13, 0.16, 7), body, [0, 0.9, 0]).scale.z = 0.7;
  for (const s of [-1, 1]) {
    add(new THREE.IcosahedronGeometry(0.07, 0), body, [0.22 * s, 1.43, 0]);
    add(cyl(0.055, 0.045, 0.3), body, [0.25 * s, 1.27, 0], [0, 0, 0.12 * s]);
    add(cyl(0.045, 0.038, 0.28), body, [0.28 * s, 0.99, 0.02], [0, 0, 0.06 * s]);
    add(new THREE.IcosahedronGeometry(0.045, 0), body, [0.29 * s, 0.82, 0.03]);
    add(cyl(0.08, 0.06, 0.42), body, [0.09 * s, 0.62, 0]);
    add(cyl(0.06, 0.045, 0.42), body, [0.09 * s, 0.22, 0]);
    add(new THREE.BoxGeometry(0.09, 0.06, 0.2), gear, [0.09 * s, 0.03, 0.04]);
  }
  add(new THREE.BoxGeometry(0.07, 0.02, 0.01), accent, [0.09, 1.34, 0.107]); // chest badge

  // props: one group each, toggled per role
  const props = {};
  const prop = (name) => (props[name] = new THREE.Group()) && figure.add(props[name]) && props[name];
  let g = prop("helmet");
  add(new THREE.SphereGeometry(0.14, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), gear, [0, 1.63, 0], [], g);
  g = prop("flighthelmet");
  add(new THREE.IcosahedronGeometry(0.15, 1), gear, [0, 1.63, -0.01], [], g);
  add(new THREE.BoxGeometry(0.17, 0.06, 0.05), accent, [0, 1.63, 0.12], [], g);
  g = prop("cap");
  add(cyl(0.13, 0.12, 0.06, 8), gear, [0, 1.73, 0], [], g);
  add(new THREE.BoxGeometry(0.18, 0.012, 0.09), gear, [0, 1.705, 0.12], [], g);
  add(new THREE.BoxGeometry(0.05, 0.02, 0.01), accent, [0, 1.74, 0.125], [], g);
  g = prop("headset");
  add(new THREE.TorusGeometry(0.13, 0.012, 4, 12, Math.PI), gear, [0, 1.63, 0], [0, 0, 0], g);
  add(new THREE.BoxGeometry(0.03, 0.02, 0.1), accent, [0.11, 1.57, 0.06], [0, -0.4, 0], g);
  g = prop("backpack");
  add(new THREE.BoxGeometry(0.3, 0.4, 0.16), gear, [0, 1.2, -0.17], [], g);
  g = prop("medpack");
  add(new THREE.BoxGeometry(0.3, 0.36, 0.15), gear, [0, 1.2, -0.17], [], g);
  add(new THREE.BoxGeometry(0.12, 0.035, 0.01), accent, [0, 1.22, -0.25], [], g);
  add(new THREE.BoxGeometry(0.035, 0.12, 0.01), accent, [0, 1.22, -0.25], [], g);
  g = prop("toolbox");
  add(new THREE.BoxGeometry(0.3, 0.15, 0.12), gear, [0.32, 0.72, 0.03], [], g);
  add(new THREE.BoxGeometry(0.3, 0.02, 0.122), accent, [0.32, 0.75, 0.03], [], g);
  g = prop("tablet");
  add(new THREE.BoxGeometry(0.2, 0.27, 0.02), gear, [-0.3, 0.92, 0.1], [-0.35, 0.3, 0], g);
  add(new THREE.BoxGeometry(0.16, 0.2, 0.004), accent, [-0.3, 0.925, 0.115], [-0.35, 0.3, 0], g);
  g = prop("folder");
  add(new THREE.BoxGeometry(0.24, 0.3, 0.03), gear, [-0.31, 0.95, 0.08], [0, 0.2, 0.05], g);
  g = prop("binoculars");
  for (const s of [-1, 1]) add(cyl(0.025, 0.025, 0.1, 6), gear, [0.03 * s, 1.3, 0.13], [Math.PI / 2, 0, 0], g);
  g = prop("scanner");
  add(new THREE.BoxGeometry(0.06, 0.16, 0.04), gear, [-0.3, 0.84, 0.07], [0.3, 0, 0], g);
  add(new THREE.BoxGeometry(0.04, 0.01, 0.042), accent, [-0.3, 0.9, 0.08], [0.3, 0, 0], g);

  figure.position.y = PLATFORM_TOP;
  return { figure, props };
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

// vertical light column that flashes on spawn
function buildBeam(scene) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform float uOpacity; varying vec2 vUv; void main() { gl_FragColor = vec4(0.98, 0.71, 0.0, (1.0 - vUv.y) * uOpacity * 0.5); }",
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 4, 6, 1, true), material);
  beam.position.y = 2;
  scene.add(beam);
  return material.uniforms.uOpacity;
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

const TEXTURE_WAIT_MS = 2000;
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
  const rimL = new THREE.DirectionalLight(GOLD, 3.2);
  rimL.position.set(-2.5, 2.5, -2.5);
  const rimR = new THREE.DirectionalLight(GOLD, 1.6);
  rimR.position.set(2.5, 1.2, -2);
  scene.add(key, rimL, rimR);

  const { figure, props } = buildFigure();
  scene.add(figure);
  const pulse = buildPlatform(scene);

  // flat cut-out characters (from images) share the spawn cut with the 3D figure
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
  const cutout = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    withScanCut(new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.02, fog: false })),
  );
  cutout.visible = false;
  scene.add(cutout);
  // soft gold backlight so dark uniforms separate from the navy backdrop
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.8),
    new THREE.ShaderMaterial({
      uniforms: { uStrength: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uStrength; varying vec2 vUv; void main() { float d = length((vUv - vec2(0.5, 0.55)) * vec2(1.6, 1.0)); gl_FragColor = vec4(0.98, 0.71, 0.0, smoothstep(0.5, 0.0, d) * uStrength); }",
    }),
  );
  glow.position.set(0, PLATFORM_TOP + 1.0, -0.25);
  scene.add(glow);
  let cutoutTurn = 0;
  const beam = buildBeam(scene);
  const dust = buildDust(scene);

  let narrow = false;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    narrow = w / h < 0.9;
    camera.fov = narrow ? 38 : 30;
    camera.position.set(0, narrow ? 1.5 : 1.35, narrow ? 6.2 : 5.4);
    camera.lookAt(0, narrow ? 1.25 : 1.0, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // drag to turn the figure, like inspecting a character in a lobby
  let targetRot = -0.35;
  let dragX = null;
  let lastDrag = -Infinity;
  canvas.addEventListener("pointerdown", (e) => { dragX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    if (dragX === null) return;
    targetRot += (e.clientX - dragX) * DRAG_SPEED;
    cutoutTurn = THREE.MathUtils.clamp(cutoutTurn + (e.clientX - dragX) * DRAG_SPEED, -CUTOUT_MAX_TURN, CUTOUT_MAX_TURN);
    dragX = e.clientX;
    lastDrag = performance.now();
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
    if (!reducedMotion && dragX === null && now - lastDrag > IDLE_AFTER_DRAG_MS) targetRot += IDLE_SPIN * dt;
    figure.rotation.y += (targetRot - figure.rotation.y) * 0.12;
    if (dragX === null) cutoutTurn *= 0.94; // lean back to face the camera
    const sway = reducedMotion ? 0 : Math.sin(t * 0.7) * CUTOUT_SWAY;
    cutout.rotation.y += (cutoutTurn + sway - cutout.rotation.y) * 0.1;
    glow.material.uniforms.uStrength.value = cutout.visible ? GLOW_STRENGTH * (cut.value / FIGURE_TOP) : 0;
    if (!reducedMotion) {
      figure.position.y = PLATFORM_TOP + Math.sin(t * 1.6) * 0.004; // breathing
      const s = 1 + ((t * 0.6) % 1) * 0.9;
      pulse.scale.setScalar(s);
      pulse.material.opacity = 0.6 * (1 - ((t * 0.6) % 1));
      const d = dust.geometry.attributes.position;
      for (let i = 0; i < DUST_COUNT; i++) d.setY(i, (d.getY(i) + dt * 0.08) % 4);
      d.needsUpdate = true;
    }
    beamFlash = Math.max(0, beamFlash - dt * 1.8);
    beam.value = beamFlash;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  cut.value = 0;
  requestAnimationFrame(frame);

  return {
    preload(urls) { urls.forEach(loadTexture); },
    // despawn the current figure, swap its gear, then spawn it again
    async setRole(role, { first = false } = {}) {
      if (!first) await animateCut(0, DESPAWN_MS);
      for (const [name, group] of Object.entries(props)) group.visible = role.props.includes(name);
      figure.visible = !role.image;
      cutout.visible = Boolean(role.image);
      if (role.image) {
        const tex = loadTexture(role.image);
        await textureReady(tex);
        const aspect = tex.image ? tex.image.width / tex.image.height : 0.45;
        cutout.material.map = tex;
        cutout.material.needsUpdate = true;
        cutout.scale.set(CUTOUT_HEIGHT * aspect, CUTOUT_HEIGHT, 1);
        cutout.position.y = PLATFORM_TOP + CUTOUT_HEIGHT / 2;
      }
      beamFlash = 1;
      await animateCut(FIGURE_TOP, SPAWN_MS);
    },
  };
}
