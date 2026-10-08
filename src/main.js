import { createStage } from "./stage.js";
import { ROLES, STAT_LABELS } from "./data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STAT_MAX = 5;
const WHEEL_LOCK_MS = 450;
const LOADER_MS = 2200;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/";
const SCRAMBLE_MS = 420;

const $ = (s) => document.querySelector(s);
const list = $(".roster__list");
const stats = $(".stats");
const loadout = $(".loadout");
const entry = $(".entry");
const pad = (n) => String(n).padStart(2, "0");

let stage = null;
try {
  stage = createStage($(".stage"), { reducedMotion });
  stage.preload(ROLES.filter((r) => r.image).map((r) => r.image));
} catch {
  document.documentElement.classList.add("no-webgl");
}

function scramble(el) {
  if (reducedMotion) return;
  const text = el.textContent;
  const start = performance.now();
  const tick = (now) => {
    const p = Math.min((now - start) / SCRAMBLE_MS, 1);
    const settled = Math.floor(p * text.length);
    el.textContent = [...text].map((ch, i) => (i < settled || ch === " " ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join("");
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = text;
  };
  requestAnimationFrame(tick);
}

list.innerHTML = ROLES.map((r, i) => `
  <li role="option" id="role-${i}" aria-selected="false">
    <button type="button" class="slot" data-i="${i}" tabindex="-1">
      <span class="slot__num">${pad(i + 1)}</span>
      <span class="slot__text"><small>${r.bereich}</small>${r.role}</span>
    </button>
  </li>`).join("");
stats.innerHTML = STAT_LABELS.map((label) => `
  <li><span class="stats__label">${label}</span><span class="stats__bar">${
    Array.from({ length: STAT_MAX }, (_, k) => `<i style="--k:${k}"></i>`).join("")
  }</span></li>`).join("");
const slots = [...list.querySelectorAll(".slot")];

let current = -1;

function select(i, { first = false } = {}) {
  i = (i + ROLES.length) % ROLES.length;
  if (i === current) return;
  current = i;
  const r = ROLES[i];

  slots.forEach((s, k) => {
    const on = k === i;
    s.classList.toggle("is-active", on);
    s.parentElement.setAttribute("aria-selected", on);
  });
  list.setAttribute("aria-activedescendant", `role-${i}`);
  slots[i].scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion || first ? "auto" : "smooth" });

  $("[data-index]").textContent = `${pad(i + 1)} / ${ROLES.length}`;
  $("[data-bereich]").textContent = r.bereich;
  $("[data-role]").textContent = r.role;
  $("[data-desc]").textContent = r.desc;
  $("[data-ghost]").textContent = r.bereich;
  scramble($("[data-role]"));
  [...stats.children].forEach((li, s) => {
    li.querySelectorAll("i").forEach((seg, k) => seg.classList.toggle("is-on", k < r.stats[s]));
    li.setAttribute("aria-label", `${STAT_LABELS[s]}: ${r.stats[s]} von ${STAT_MAX}`);
  });
  loadout.innerHTML = r.loadout.map((item, k) => `<li><span class="loadout__slot">A${k + 1}</span>${item}</li>`).join("");
  entry.innerHTML = r.entry.map((e) => `<li>${e}</li>`).join("");

  const panel = $(".profile");
  panel.classList.remove("is-swap");
  void panel.offsetWidth;
  panel.classList.add("is-swap");
  stage?.setRole(r, { first });
}

list.addEventListener("click", (e) => {
  const slot = e.target.closest(".slot");
  if (slot) select(Number(slot.dataset.i));
});

// keys and wheel step through the roster like a game menu
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select(current + 1); }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select(current - 1); }
  if (e.key === "Enter" && !e.target.closest("a, button")) $(".choose").click();
});
// only on the desktop lobby — on phones the page scrolls normally
const desktop = window.matchMedia("(min-width: 901px)");
let wheelLock = 0;
window.addEventListener("wheel", (e) => {
  if (!desktop.matches || Math.abs(e.deltaY) < 4 || e.target.closest(".profile")) return;
  e.preventDefault();
  const now = performance.now();
  if (now < wheelLock) return;
  wheelLock = now + WHEEL_LOCK_MS;
  select(current + Math.sign(e.deltaY));
}, { passive: false });

$(".choose").addEventListener("click", (e) => {
  e.preventDefault();
  const btn = e.currentTarget;
  btn.classList.remove("is-confirm");
  void btn.offsetWidth;
  btn.classList.add("is-confirm");
});

function runLoader() {
  const pct = $(".loader__pct");
  return new Promise((resolve) => {
    if (reducedMotion) return resolve();
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / LOADER_MS, 1);
      pct.textContent = `${Math.round(p * 100)}%`;
      if (p < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

document.fonts.ready.then(async () => {
  document.body.classList.add("is-loading");
  await runLoader();
  document.body.classList.add("is-in");
  select(0, { first: true });
  setTimeout(() => $(".loader").remove(), 700);
});
