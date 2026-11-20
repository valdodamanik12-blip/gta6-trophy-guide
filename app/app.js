// Leonida Ledger — boot and wiring: load the trophy data, keep the checklist,
// filters and settings in sync, and switch between the four views.
import { loadEarned, saveEarned, loadSettings, saveSettings, downloadProgress, readProgressFile } from './store.js';
import { renderChecklist, renderProgress } from './render.js';
import { renderRoadmap, renderMissables } from './roadmap.js';

const listEl = document.getElementById('trophyList');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const spoilersEl = document.getElementById('spoilers');
const hideEarnedEl = document.getElementById('hideEarned');
const resultLine = document.getElementById('resultLine');
const emptyState = document.getElementById('emptyState');
const onlineNote = document.getElementById('onlineNote');
const spoilerNote = document.getElementById('spoilerNote');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

let earned = loadEarned();
let settings = loadSettings();
let query = '';
const guideOpen = new Set();

function persist() {
  saveEarned(earned);
  saveSettings(settings);
}

function renderAll() {
  const shown = renderChecklist(listEl, trophies, earned, settings, query.toLowerCase(), {
    guideOpen,
    onToggle: (name, checked) => {
      if (checked) earned.add(name);
      else earned.delete(name);
      persist();
      renderAll();
    },
    onToggleGuide: (id) => {
      if (guideOpen.has(id)) guideOpen.delete(id);
      else guideOpen.add(id);
      renderAll();
    },
  });
  renderProgress(trophies, earned);
  emptyState.hidden = shown !== 0;
  resultLine.textContent =
    settings.kind === 'all' && settings.grade === 'all' && !query
      ? `Showing all ${trophies.length} trophies. Click a name to read its guide.`
      : `Showing ${shown} of ${trophies.length} trophies.`;
  onlineNote.hidden = settings.kind !== 'online';
  spoilerNote.hidden = !settings.spoilers;
  renderRoadmap(document.getElementById('roadmapStages'), trophies, earned, jumpToTrophy);
  renderMissables(document.getElementById('missableList'), trophies, earned, jumpToTrophy);
}

function jumpToTrophy(id) {
  guideOpen.add(id);
  settings.kind = 'all';
  settings.grade = 'all';
  query = '';
  searchEl.value = '';
  syncControls();
  switchTab('checklist');
  renderAll();
  const row = listEl.querySelector(`[data-trophy-id="${id}"]`);
  if (row) row.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function switchTab(name) {
  for (const button of document.querySelectorAll('.tab')) {
    const active = button.dataset.tab === name;
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  for (const view of document.querySelectorAll('.view')) {
    view.classList.toggle('active', view.id === `view-${name}`);
  }
}

function syncControls() {
  spoilersEl.checked = settings.spoilers;
  hideEarnedEl.checked = settings.hideEarned;
  gradeEl.value = settings.grade;
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.classList.toggle('active', chip.dataset.kind === settings.kind);
  }
}

for (const button of document.querySelectorAll('.tab')) {
  button.addEventListener('click', () => switchTab(button.dataset.tab));
}
for (const chip of document.querySelectorAll('#kindChips .chip')) {
  chip.addEventListener('click', () => {
    settings.kind = chip.dataset.kind;
    persist();
    syncControls();
    renderAll();
  });
}
gradeEl.addEventListener('change', () => {
  settings.grade = gradeEl.value;
  persist();
  renderAll();
});
spoilersEl.addEventListener('change', () => {
  settings.spoilers = spoilersEl.checked;
  persist();
  renderAll();
});
hideEarnedEl.addEventListener('change', () => {
  settings.hideEarned = hideEarnedEl.checked;
  persist();
  renderAll();
});
searchEl.addEventListener('input', () => {
  query = searchEl.value.trim();
  renderAll();
});

document.getElementById('export').addEventListener('click', () => {
  downloadProgress(earned, settings);
});
document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const { earned: imported, settings: importedSettings } = await readProgressFile(
      file,
      trophies.map((t) => t.name),
    );
    earned = imported;
    settings = { ...settings, ...importedSettings };
    persist();
    syncControls();
    renderAll();
  } catch (error) {
    alert(`Could not import that file: ${error.message}`);
  }
  event.target.value = '';
});

syncControls();
renderAll();
