import { createTerrain } from "./terrain.js";
import { BEREICHE, STAT_LABELS, THEMES } from "./data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#";
const SCRAMBLE_MS = 520;
const SWAP_AT_MS = 240; // moment the cut bars fully cover the screen
const BOOT_MS = 1100;
const GIANT_MAX_VH = 0.3;
const STAT_MAX = 5;

const $ = (s) => document.querySelector(s);
const giant = $(".giant");
const giantInner = $(".giant__inner");
const giantWord = $(".giant__word");
const giantCode = $(".giant__code");
const cardCode = $("[data-code]");
const cardName = $("[data-name]");
const cardDesc = $("[data-desc]");
const stats = $(".stats");
const rail = $(".rail");
const cut = $(".cut");

let terrain = null;
try {
  terrain = createTerrain($(".stage"), { reducedMotion });
  terrain.preload(BEREICHE.map((b) => b.photo));
} catch {
  document.documentElement.classList.add("no-webgl");
}

const pad = (n) => String(n).padStart(2, "0");
const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

// technical labels decode like a game HUD
function scramble(el, delay = 0) {
  if (reducedMotion) return;
  const text = el.textContent;
  const start = performance.now() + delay;
  const tick = (now) => {
    const p = Math.min(Math.max((now - start) / SCRAMBLE_MS, 0), 1);
    const settled = Math.floor(p * text.length);
    el.textContent = [...text].map((ch, i) => (i < settled || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

// the Bereich name always runs edge to edge, capped by height
function fitGiant() {
  giant.style.fontSize = "100px";
  const byWidth = (100 * giant.clientWidth) / giantInner.offsetWidth;
  const byHeight = (window.innerHeight * GIANT_MAX_VH) / 0.8;
  giant.style.fontSize = `${Math.floor(Math.min(byWidth, byHeight))}px`;
}

// static markup: rail + stat rows
rail.innerHTML = BEREICHE.map((b, i) => `
  <button class="rail__item" type="button" data-i="${i}">
    <span class="rail__code">${pad(i + 1)}</span>
    <span class="rail__name">${b.name}</span>
    <span class="rail__progress" aria-hidden="true"></span>
  </button>`).join("");
stats.innerHTML = STAT_LABELS.map((label) => `
  <li><span class="stats__label">${label}</span><span class="stats__bar">${
    Array.from({ length: STAT_MAX }, (_, k) => `<i style="--k:${k}"></i>`).join("")
  }</span></li>`).join("");
document.querySelectorAll(".ticker__track").forEach((t) => {
  const copy = t.firstElementChild.cloneNode(true);
  t.append(copy);
});

const railItems = [...rail.children];
let current = -1;

function render(i) {
  const b = BEREICHE[i];
  document.body.dataset.theme = b.theme;
  terrain?.cut({ shape: b.shape, photo: b.photo, focus: b.focus, ...THEMES[b.theme] });

  giantWord.textContent = b.name;
  giantCode.textContent = pad(i + 1);
  fitGiant();
  if (!reducedMotion) restart(giant, "is-slam");

  cardCode.textContent = `BEREICH ${pad(i + 1)} / ${BEREICHE.length}`;
  cardName.textContent = b.name;
  cardDesc.textContent = b.desc;
  scramble(cardCode);
  scramble(cardName, 60);
  [...stats.children].forEach((li, s) => {
    [...li.querySelectorAll("i")].forEach((seg, k) => seg.classList.toggle("is-on", k < b.stats[s]));
    li.setAttribute("aria-label", `${STAT_LABELS[s]}: ${b.stats[s]} von ${STAT_MAX}`);
  });

  railItems.forEach((el, k) => {
    el.classList.toggle("is-active", k === i);
    el.toggleAttribute("aria-current", k === i);
  });
  restart(railItems[i], "is-active"); // restarts the autoplay progress bar
  rail.scrollTo({ left: railItems[i].offsetLeft - rail.offsetLeft - 16, behavior: reducedMotion ? "auto" : "smooth" });
}

function go(i) {
  i = (i + BEREICHE.length) % BEREICHE.length;
  if (i === current) return;
  current = i;
  if (reducedMotion) return render(i);
  restart(cut, "is-on");
  setTimeout(() => render(i), SWAP_AT_MS);
}

rail.addEventListener("click", (e) => {
  const item = e.target.closest(".rail__item");
  if (item) go(Number(item.dataset.i));
});
// autoplay: the active tile's progress bar finishing advances to the next Bereich
rail.addEventListener("animationend", (e) => {
  if (e.target.classList.contains("rail__progress") && e.target.parentElement.classList.contains("is-active")) go(current + 1);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") go(current + 1);
  if (e.key === "ArrowLeft") go(current - 1);
});
window.addEventListener("resize", fitGiant);

function countUp(el) {
  return new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / BOOT_MS, 1);
      el.textContent = String(Math.round(p * 100)).padStart(3, "0");
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

document.fonts.ready.then(async () => {
  current = 0;
  render(0);
  const boot = $(".boot");
  if (!reducedMotion) {
    await countUp($(".boot__count"));
    restart(cut, "is-on");
    await new Promise((r) => setTimeout(r, SWAP_AT_MS));
  }
  boot.hidden = true;
  document.body.classList.add("is-in");
  terrain?.reveal();
  restart(giant, "is-slam");
  document.querySelectorAll("[data-scramble]").forEach((el, k) => scramble(el, 100 + k * 120));
});
