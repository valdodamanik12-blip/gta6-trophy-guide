// Leonida Platinum — GTA VI trophy guide & tracker.
// Plain ES module, no dependencies, no network: it fetches only ./data/trophies.json.
const STORE_KEY = "leonida-platinum-earned-v1";
const DEMO_EARNED = [2, 3, 8, 15, 16, 17, 20, 21, 28, 33, 35, 42, 46]; // 13, for ?demo screenshots only
const demoMode = new URLSearchParams(location.search).has("demo");

const STAGES = [
  { n: 1, title: "Stage 1 — Play the story, mind the balcony", blurb: "Chapters 1 and the early story, plus the activities you meet on the way. Do the first meditation before Chapter 1 ends (see Positive Mental Attitude), sample the activities, and scan vehicles and study animals as you travel — that progress already counts toward 100%." },
  { n: 2, title: "Stage 2 — Finish the story", blurb: "Chapters 2 to 4 and the final mission. Story trophies pop as you play; nothing here can be missed. Playing as both characters together opens after Chapter 2, which also unlocks the last meditation spot. Save manually at the start and end of each chapter — missions cannot be replayed." },
  { n: 3, title: "Stage 3 — The 100% clean-up", blurb: "After the story, the 100% Completion checklist appears under Progress, then Stats. Work it in order: shooting ranges to gold, drone races, all five robberies, collectibles, the stranger strands, the economy trophies, and 70 of the 80 challenges. The checklist is lenient — roughly 60% of true completion — and nothing on it is missable." },
  { n: 4, title: "Stage 4 — The last few and the unknowns", blurb: "The odd ones out: the choice counter, the partner moments, and the five trophies no published guide has pinned down yet. These are marked honestly in their guides instead of guessed at. The Platinum pops when the last of them does." },
];

let trophies = [];
let earned = new Set();

function loadEarned() {
  if (demoMode) { earned = new Set(DEMO_EARNED); return; }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    const ids = Array.isArray(data) ? data : data.earned;
    if (Array.isArray(ids)) earned = new Set(ids.filter((id) => Number.isInteger(id)));
  } catch { /* corrupted save: start empty */ }
}
function saveEarned() {
  if (demoMode) return; // demo progress is in-memory only, never saved
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ app: "leonida-platinum", earned: [...earned].sort((a, b) => a - b) })); } catch { /* storage full or blocked */ }
}

const $ = (sel) => document.querySelector(sel);
const listEl = $("#trophy-list");
const spoilerOn = () => $("#spoiler-toggle").checked;

function kindLabel(t) {
  return { story: "Story", collectible: "Collectible", activity: "Activity", side: "Side quest", robbery: "Robbery", combat: "Combat", economy: "Money & property", completion: "100% completion", misc: "Odd one out", platinum: "Platinum" }[t.kind] || t.kind;
}
function gradeLabel(g) { return g[0].toUpperCase() + g.slice(1); }

function isSpoilerHidden(t) {
  return spoilerOn() && t.kind === "story" && !earned.has(t.id);
}

function visibleTrophies() {
  const q = $("#search").value.trim().toLowerCase();
  const kind = $("#filter-kind").value;
  const grade = $("#filter-grade").value;
  const show = $("#filter-earned").value;
  return trophies.filter((t) => {
    if (kind === "missable" ? !t.missable : (kind !== "all" && t.kind !== kind)) return false;
    if (grade !== "all" && t.grade !== grade) return false;
    if (show === "earned" && !earned.has(t.id)) return false;
    if (show === "todo" && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.guide.toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderProgress() {
  const total = trophies.length;
  const n = earned.size;
  $("#earned-count").textContent = n;
  $("#earned-pct").textContent = total ? Math.round((n / total) * 100) + "%" : "0%";
  $("#progress-fill").style.width = total ? (n / total) * 100 + "%" : "0%";
  const parts = ["platinum", "gold", "silver", "bronze"].map((g) => {
    const have = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    return `${gradeLabel(g)} ${have}/${all}`;
  });
  $("#grade-counts").textContent = parts.join(" · ");
}

function renderList() {
  const rows = visibleTrophies();
  $("#result-count").textContent = `Showing ${rows.length} of ${trophies.length} trophies` + (demoMode ? " · demo progress (not saved)" : "");
  if (!rows.length) {
    listEl.innerHTML = `<li class="empty">No trophies match these filters. Clear the search or change a filter.</li>`;
    return;
  }
  listEl.innerHTML = rows.map((t) => {
    const got = earned.has(t.id);
    const hidden = isSpoilerHidden(t);
    return `<li class="trophy${got ? " earned" : ""}" data-id="${t.id}">
      <input type="checkbox" data-check="${t.id}" ${got ? "checked" : ""} aria-label="Mark ${hidden ? "hidden story trophy" : t.name} as earned">
      <div class="${hidden ? "spoiler-hidden" : ""}">
        <div class="trophy-name">${hidden ? "Hidden story trophy" : t.name}</div>
        <div class="trophy-desc">${hidden ? "Hidden until earned — turn off “Hide story spoilers” to reveal it." : t.description}</div>
        <div class="trophy-meta">
          <span class="pill grade-${t.grade}">${gradeLabel(t.grade)}</span>
          ${t.kind === "platinum" ? "" : `<span class="pill">${kindLabel(t)}</span>`}
          ${t.hidden ? `<span class="pill hidden-flag">Hidden on PSN</span>` : ""}
          ${t.missable ? `<span class="pill missable">Possibly missable</span>` : ""}
          ${t.target_label ? `<span class="pill target">${t.target_label}</span>` : ""}
        </div>
      </div>
      <button class="guide-btn" type="button" data-guide="${t.id}">Guide</button>
    </li>`;
  }).join("");
}

function renderRoadmap() {
  $("#roadmap-stages").innerHTML = STAGES.map((s) => {
    const items = trophies.filter((t) => t.stage === s.n);
    const done = items.filter((t) => earned.has(t.id)).length;
    return `<div class="stage"><h3>${s.title} <span class="stage-count">${done}/${items.length} earned</span></h3>
      <p>${s.blurb}</p>
      <ul>${items.map((t) => `<li class="${earned.has(t.id) ? "earned" : ""}"><a href="#/trophy-${t.id}">${t.name}</a><span class="mini-grade">${gradeLabel(t.grade)}</span>${t.missable ? " · possibly missable" : ""}</li>`).join("")}</ul>
    </div>`;
  }).join("");
}

function renderMissables() {
  const miss = trophies.filter((t) => t.missable);
  $("#missable-list").innerHTML = miss.map((t) => `
    <div class="stage"><h3>${t.name} <span class="stage-count">${gradeLabel(t.grade)}</span></h3>
      <p><em>${t.description}</em></p>
      <p>${t.guide}</p>
      <p class="source-line">Sources: ${t.sources.join("; ")}.</p>
      <p><button class="guide-btn" type="button" data-guide="${t.id}">Open full guide</button></p>
    </div>`).join("");
}

function openDetail(id) {
  const t = trophies.find((x) => x.id === id);
  if (!t) return;
  const got = earned.has(t.id);
  $("#detail-body").innerHTML = `
    <div class="trophy-meta">
      <span class="pill grade-${t.grade}">${gradeLabel(t.grade)}</span>
      ${t.kind === "platinum" ? "" : `<span class="pill">${kindLabel(t)}</span>`}
      ${t.hidden ? `<span class="pill hidden-flag">Hidden on PSN</span>` : ""}
      ${t.missable ? `<span class="pill missable">Possibly missable</span>` : ""}
      ${t.target_label ? `<span class="pill target">${t.target_label}</span>` : ""}
      <span class="pill">${got ? "Earned ✓" : "Not yet earned"}</span>
    </div>
    <h2 id="detail-name">${t.name}</h2>
    <p class="trophy-desc">“${t.description}” — official description, as PlayStation publishes it.</p>
    ${t.missable ? `<p class="warn"><strong>Possibly missable.</strong> Do the first meditation in Chapter 1, before the chapter ends — see the guide below.</p>` : ""}
    <h4>Guide</h4>
    <p>${t.guide}</p>
    <h4>Roadmap</h4>
    <p>${STAGES[t.stage - 1].title}</p>
    <h4>Sources</h4>
    <ul class="sources">${t.sources.map((s) => `<li>${s}</li>`).join("")}</ul>
    <p><label class="check"><input type="checkbox" id="detail-check" ${got ? "checked" : ""}> Mark as earned</label></p>`;
  $("#detail-overlay").hidden = false;
  $("#detail-check").addEventListener("change", (e) => {
    setEarned(t.id, e.target.checked);
    openDetail(t.id); // refresh the earned pill
  });
}
function closeDetail() { $("#detail-overlay").hidden = true; }

function setEarned(id, on) {
  if (on) earned.add(id); else earned.delete(id);
  saveEarned();
  renderProgress(); renderList(); renderRoadmap();
}

function showView(name) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + name));
  if (name === "roadmap") renderRoadmap();
  if (name === "missables") renderMissables();
}

function route() {
  const hash = location.hash || "#/checklist";
  const m = hash.match(/^#\/trophy-(\d+)$/);
  if (m) { openDetail(Number(m[1])); return; }
  closeDetail();
  const view = ["checklist", "roadmap", "missables", "about"].includes(hash.slice(2)) ? hash.slice(2) : "checklist";
  showView(view);
}

function exportProgress() {
  const blob = new Blob([JSON.stringify({ app: "leonida-platinum", exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "leonida-platinum-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importProgress(file) {
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error("bad file");
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set(ids.filter((id) => valid.has(id)));
    saveEarned(); renderProgress(); renderList(); renderRoadmap();
    $("#save-note").textContent = `Imported ${earned.size} earned trophies.`;
  } catch {
    $("#save-note").textContent = "That file could not be imported — it is not a Leonida Platinum progress file.";
  }
}

async function boot() {
  const res = await fetch("./data/trophies.json");
  const data = await res.json();
  trophies = data.trophies;
  loadEarned();
  renderProgress(); renderList(); renderRoadmap(); renderMissables();

  listEl.addEventListener("change", (e) => {
    const id = Number(e.target.dataset.check);
    if (id) setEarned(id, e.target.checked);
  });
  listEl.addEventListener("click", (e) => {
    const id = Number(e.target.dataset.guide);
    if (id) location.hash = "#/trophy-" + id;
  });
  document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => { location.hash = "#/" + b.dataset.view; }));
  $("#search").addEventListener("input", renderList);
  $("#filter-kind").addEventListener("change", renderList);
  $("#filter-grade").addEventListener("change", renderList);
  $("#filter-earned").addEventListener("change", renderList);
  $("#spoiler-toggle").addEventListener("change", renderList);
  $("#export-btn").addEventListener("click", exportProgress);
  $("#import-btn").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); e.target.value = ""; });
  $("#reset-btn").addEventListener("click", () => {
    if (confirm("Clear all earned trophies? This cannot be undone.")) {
      earned = new Set(); saveEarned(); renderProgress(); renderList(); renderRoadmap();
      $("#save-note").textContent = "Progress cleared.";
    }
  });
  $("#detail-close").addEventListener("click", () => { location.hash = "#/checklist"; });
  $("#detail-overlay").addEventListener("click", (e) => { if (e.target === e.currentTarget) location.hash = "#/checklist"; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") location.hash = "#/checklist"; });
  document.querySelector("#missable-list").addEventListener("click", (e) => {
    const id = Number(e.target.dataset.guide);
    if (id) location.hash = "#/trophy-" + id;
  });
  window.addEventListener("hashchange", route);
  route();
}

boot();
