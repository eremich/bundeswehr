import { createStage } from "./stage.js";
import { PERKS, ROLES, STAT_LABELS } from "./data.js";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STAT_MAX = 5;
const WHEEL_LOCK_MS = 450;
const LOADER_MS = 2200;
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/";
const SCRAMBLE_MS = 420;
const DOSSIER_OUT_MS = 450; // matches the CSS exit, then the panel is hidden

const $ = (s) => document.querySelector(s);
const list = $(".roster__list");
const stats = $(".stats");
const loadout = $(".loadout");
const entry = $(".entry");
const pad = (n) => String(n).padStart(2, "0");
const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
const dossier = $(".dossier");
const chooseBtn = $(".bar .choose");
// arrows and wheel switch roles only on the desktop lobby — on phones the page scrolls normally
const desktop = window.matchMedia("(min-width: 901px)");

let stage = null;
try {
  stage = createStage($(".stage"), { reducedMotion });
  stage.preload(ROLES.map((r) => r.image));
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
  <li>
    <button type="button" class="slot" data-i="${i}" aria-pressed="false">
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
    s.setAttribute("aria-pressed", on);
  });
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

// ---------- Step 02: dossier ----------
let mode = "lobby";
let closeTimer = 0;

function setStep(n) {
  document.querySelectorAll(".steps li").forEach((li) => {
    const step = Number(li.dataset.step);
    li.classList.toggle("is-active", step === n);
    li.classList.toggle("is-done", step < n);
    if (step === n) li.setAttribute("aria-current", "step");
    else li.removeAttribute("aria-current");
  });
}

function fillDossier(r) {
  $("[data-d-index]").textContent = `${pad(current + 1)} / ${ROLES.length}`;
  $("[data-d-role]").textContent = r.role;
  $("[data-d-bereich]").textContent = r.bereich;
  $(".path").innerHTML = r.path.map((p, k) => `
    <li style="--i:${k}"><span class="path__lvl">Level ${pad(k + 1)}</span><b>${p.title}</b><span class="path__text">${p.text}</span></li>`).join("");
  $(".perks").innerHTML = PERKS[r.perks].map((p, k) => `
    <li style="--i:${k}"><b>${p.value}</b><span>${p.label}</span></li>`).join("");
}

function openProfile() {
  if (mode === "profile") return;
  mode = "profile";
  clearTimeout(closeTimer);
  fillDossier(ROLES[current]);
  dossier.hidden = false;
  void dossier.offsetWidth; // let the entrance transition start from the hidden state
  document.body.classList.add("is-profile");
  setStep(2);
  stage?.setPan(true);
  stage?.flash();
  if (!reducedMotion) restart($(".sweep"), "is-on");
  scramble($("[data-d-role]"));
  const title = $("#dossier-title");
  title.focus({ preventScroll: true });
  if (!desktop.matches) dossier.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function closeProfile() {
  if (mode !== "profile") return;
  mode = "lobby";
  document.body.classList.remove("is-profile");
  setStep(1);
  stage?.setPan(false);
  closeTimer = setTimeout(() => { dossier.hidden = true; }, reducedMotion ? 0 : DOSSIER_OUT_MS);
  slots[current].focus({ preventScroll: true });
  if (!desktop.matches) window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
}

chooseBtn.addEventListener("click", openProfile);
$(".back").addEventListener("click", closeProfile);

// keys and wheel step through the roster like a game menu
document.addEventListener("keydown", (e) => {
  if (e.target.closest("input, textarea")) return;
  if (mode === "profile") {
    if (e.key === "Escape") closeProfile();
    return;
  }
  if (e.key === "Enter" && !e.target.closest("a, button")) { openProfile(); return; }
  if (!desktop.matches) return;
  if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); select(current + 1); }
  if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); select(current - 1); }
  // keep keyboard focus on the highlighted role while stepping through the list
  if (list.contains(document.activeElement)) slots[current].focus();
});
let wheelLock = 0;
window.addEventListener("wheel", (e) => {
  if (mode === "profile" || !desktop.matches || Math.abs(e.deltaY) < 4 || e.target.closest(".profile")) return;
  e.preventDefault();
  const now = performance.now();
  if (now < wheelLock) return;
  wheelLock = now + WHEEL_LOCK_MS;
  select(current + Math.sign(e.deltaY));
}, { passive: false });

const SEEN_KEY = "bw-lobby-seen";
function seenBefore() {
  try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}
function runLoader() {
  const pct = $(".loader__pct");
  return new Promise((resolve) => {
    if (reducedMotion || seenBefore()) return resolve();
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
  try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* storage blocked: loader just plays again */ }
  document.body.classList.add("is-in");
  select(0, { first: true });
  setTimeout(() => $(".loader").remove(), 700);
});
