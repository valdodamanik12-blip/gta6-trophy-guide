// Leonida Platinum — tracker logic: checklist with localStorage progress, per-trophy counters for
// the counts PlayStation tracks, kind/grade filters, search, a spoiler setting that hides story
// trophies until they are earned, export/import of progress, and the roadmap + missables views.
// Everything is read from the local file data/trophies.json; the app makes no network request.

const STORE_KEY = 'leonida-platinum-progress-v1';
const params = new URLSearchParams(location.search);

const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const roadmapEl = document.getElementById('roadmap');
const missableEl = document.getElementById('missable-list');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');
const onlyOpenEl = document.getElementById('only-open');
const onlineNoteEl = document.getElementById('online-note');

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byName = new Map(trophies.map((t) => [t.name, t]));

// Progress state: earned trophy names, numeric counters, and the spoiler setting. Demo mode
// (?demo=1, used to render the entry's screenshots) shows a sample run in memory only and
// never writes it over a real save.
function blankState() {
  return { earned: [], counters: {}, spoiler: false };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...blankState(), ...JSON.parse(raw) };
  } catch { /* a corrupted save falls back to a blank one */ }
  return blankState();
}
let state = loadState();
if (params.get('demo') === '1') {
  state = {
    earned: ['Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Trust', 'Break the Bank', 'Master of None', 'Stick Fiddler', 'Baited My Tackle', 'Whip It Good', 'Gunslinger', 'Treat Yo Self', 'On the Spot', 'Retail Therapy'],
    counters: { 'The Shootist': 17, 'Cunning Stunts': 96, 'Strangers & Freaks': 3, 'You WAiNKer!': 41, 'The Goodtime State': 22, 'Actions Speak Louder': 140 },
    spoiler: params.get('spoiler') === '1',
  };
}
let earned = new Set(state.earned);
let counters = { ...state.counters };
let selectedName = params.get('select') || 'The Shootist';

function save() {
  if (params.get('demo') === '1') return;
  state = { earned: [...earned], counters, spoiler: spoilerEl.checked };
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const KIND_LABEL = { platinum: 'Platinum', story: 'Story', collectibles: 'Collectibles', activities: 'Activities' };

function isSpoilerHidden(t) {
  return spoilerEl.checked && t.kind === 'story' && !earned.has(t.name);
}

function matches(t) {
  const kind = kindEl.value;
  if (kind === 'online') return false; // the official list has no online trophies
  if (kind === 'missable' && !t.missable) return false;
  if (kind !== 'all' && kind !== 'missable' && t.kind !== kind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (onlyOpenEl.checked && earned.has(t.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q && !`${t.name} ${t.description}`.toLowerCase().includes(q)) return false;
  return true;
}

function gradeBadge(t) {
  const span = document.createElement('span');
  span.className = `badge grade-${t.grade}`;
  span.textContent = t.grade;
  return span;
}

function tag(text, cls) {
  const span = document.createElement('span');
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function renderProgress() {
  const total = trophies.length;
  document.getElementById('progress-count').textContent = `${earned.size} of ${total} earned`;
  document.getElementById('progress-bar').style.width = `${Math.round((earned.size / total) * 100)}%`;
  const parts = GRADE_ORDER.map((g) => {
    const all = trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => earned.has(t.name)).length;
    return `${g} ${got}/${all.length}`;
  });
  document.getElementById('progress-grades').textContent = parts.join(' · ');
}

function renderDetail(t) {
  detailEl.replaceChildren();
  const hidden = isSpoilerHidden(t);
  const h = document.createElement('h2');
  h.textContent = hidden ? 'Hidden story trophy' : t.name;
  const meta = document.createElement('p');
  meta.className = 'detail-meta';
  meta.append(gradeBadge(t), document.createTextNode(` ${KIND_LABEL[t.kind] ?? t.kind}`));
  if (t.missable) meta.append(' ', tag('MISSABLE', 'tag-missable'));
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = hidden ? 'Spoiler setting is on: this story trophy stays hidden until you earn it.' : t.description;
  const guideH = document.createElement('h3');
  guideH.textContent = 'Guide (original, with sources)';
  const guide = document.createElement('p');
  guide.textContent = hidden ? 'Earn the trophy to reveal its guide, or turn the spoiler setting off.' : t.guide;
  detailEl.append(h, meta, desc, guideH, guide);
  if (t.missable && t.missableNote && !hidden) {
    const noteH = document.createElement('h3');
    noteH.textContent = 'Why it is flagged missable';
    const note = document.createElement('p');
    note.className = 'missable-note';
    note.textContent = t.missableNote;
    detailEl.append(noteH, note);
  }
  if (!hidden) {
    const srcH = document.createElement('h3');
    srcH.textContent = 'Sources';
    const src = document.createElement('p');
    src.className = 'sources';
    src.textContent = t.sources;
    detailEl.append(srcH, src);
  }
}

function counterRow(t) {
  const wrap = document.createElement('span');
  wrap.className = 'counter';
  const current = counters[t.name] ?? 0;
  const label = document.createElement('span');
  label.textContent = `${current} / ${t.target} — ${t.targetLabel}`;
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.addEventListener('click', (ev) => { ev.stopPropagation(); counters[t.name] = Math.max(0, (counters[t.name] ?? 0) - 1); save(); render(); });
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.addEventListener('click', (ev) => { ev.stopPropagation(); counters[t.name] = Math.min(t.target, (counters[t.name] ?? 0) + 1); if (counters[t.name] >= t.target) earned.add(t.name); save(); render(); });
  wrap.append(minus, label, plus);
  return wrap;
}

function trophyRow(t) {
  const li = document.createElement('li');
  li.className = `row${earned.has(t.name) ? ' is-earned' : ''}${t.name === selectedName ? ' is-selected' : ''}`;
  const hidden = isSpoilerHidden(t);
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.name);
  box.setAttribute('aria-label', `Mark ${t.name} earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.name); else earned.delete(t.name);
    save(); render();
  });
  const main = document.createElement('div');
  main.className = 'row-main';
  const name = document.createElement('strong');
  name.textContent = hidden ? 'Hidden story trophy' : t.name;
  const desc = document.createElement('span');
  desc.className = 'row-desc';
  desc.textContent = hidden ? 'Hidden by the spoiler setting until earned.' : t.description;
  main.append(name, desc);
  if (t.target) main.append(counterRow(t));
  const badges = document.createElement('div');
  badges.className = 'row-badges';
  badges.append(gradeBadge(t), tag(KIND_LABEL[t.kind] ?? t.kind, 'tag-kind'));
  if (t.missable) badges.append(tag('MISSABLE', 'tag-missable'));
  li.append(box, main, badges);
  li.addEventListener('click', () => { selectedName = t.name; render(); });
  return li;
}

function render() {
  renderProgress();
  onlineNoteEl.hidden = kindEl.value !== 'online';
  rowsEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) if (matches(t)) { rowsEl.append(trophyRow(t)); shown++; }
  document.getElementById('showing').textContent =
    `Showing ${shown} of ${trophies.length} trophies — click a row to read its full guide and sources on the right.`;
  const selected = byName.get(selectedName) ?? trophies[0];
  renderDetail(selected);
  renderRoadmap();
  renderMissables();
}

const ROADMAP = [
  { stage: 'Stage 1 — Story first, in order', text: 'Play the campaign straight through: Gone Fishing, Chapters 1–4, the named missions (Breakfast Run, The Cartel Heist, Child\'s Play, Headliners, VCIA Takedown, Operation Savage Glory) and the final mission. That is 12 story trophies plus the gold "You Gotta Know When to Get Off". Keep a manual save at each chapter start and one before the final mission.', names: ['Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!', 'Top Of The World, Ma', 'Trust', 'Break the Bank', 'Family Matters', 'DWNFALL', 'Hi-Jacked', 'Snow Storm', 'You Gotta Know When to Get Off'] },
  { stage: 'Stage 2 — Missables, while the story is still open', text: 'Before the finale, clear everything flagged in the Missables view: the partner trophies, the VCIA departure, the Ocean Beach cocktail, the showroom escape, Bret\'s unique hunt, and the choice/retry/strange-event trophies whose methods are not yet known publicly. These are flagged from their official descriptions; a pre-finale save is your insurance.', names: ['Hot Together', 'Catch Me If You Can', 'In The Beginning…', 'Capital Offense', 'Fair Game', 'Personal Best', 'Actions Speak Louder', 'Bad Luck, I Guess', 'The Truth Is Out There'] },
  { stage: 'Stage 3 — Strangers and activities', text: 'Finish the stranger strands (Andy, Kenton, Billy, Randy, Tyrone) for their bronzes and the silver "Strangers & Freaks", sample all 9 activity types for "Master of None", and clear the one-off activity trophies: fishing against Cal, one arcade game, the stealth jewelry robbery, the armored truck, Combat Focus, the melee drive-by, bowling. "Challenging Tank" also sits here — its method is not yet known publicly, so watch for tank encounters as you play.', names: ['Road to Rehabilitation', 'This Was No Boat Accident', 'The Lone Rider', 'Supply & Demand', 'Spin On This!', 'Strangers & Freaks', 'Master of None', 'Baited My Tackle', 'Stick Fiddler', 'Sneakthief', 'A Classic Blitz Play', 'Gunslinger', 'Ten Pin', 'Let’s Go Bowling', 'Challenging Tank'] },
  { stage: 'Stage 4 — Collectibles and exploration', text: 'Sweep the map once, thoroughly: 3 card sets, WAiNK at 100 locations, 18 meditation spots, all 52 areas of Leonida, 100 vehicles discovered, 10 Scooter Bros registrations, and all 8 garage properties once the money is there. One planned tour advances all of these together.', names: ['Don\'t Touch My Deck', 'You WAiNKer!', 'Positive Mental Attitude', 'The Goodtime State', 'Whip It Good', 'On the Spot', 'Little Boxes'] },
  { stage: 'Stage 5 — Counts, medals and money', text: 'The grinds: 250 stunts, gold in all 42 Shooting Range challenges, 20 different races won, drone race wins at all 14 locations, 50 challenges, 5 bank vaults robbed and escaped, one illegal operation per gang (9), $250,000 laundered and $100,000 spent. These have PSN-tracked counts — the tracker counters mirror them.', names: ['Cunning Stunts', 'The Shootist', 'Earn Cash, Not Kudos', 'Top Fun', 'One Last Thing', 'Maximum Withdrawal', 'Pest Control', 'Dime on the Dollar', 'Treat Yo Self', 'Retail Therapy'] },
  { stage: 'Stage 6 — 100% and the platinum', text: 'Whatever the in-game completion counter still wants, finish it: the gold "A Long Road" (100% completion) is the last gate. The moment it lands with everything else done, "Vice Got a Price!" — the platinum — follows automatically.', names: ['A Long Road', 'Vice Got a Price!'] },
];

function renderRoadmap() {
  roadmapEl.replaceChildren();
  for (const step of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = step.stage;
    const p = document.createElement('p');
    p.textContent = step.text;
    const done = step.names.filter((n) => earned.has(n)).length;
    const meta = document.createElement('p');
    meta.className = 'stage-meta';
    meta.textContent = `${done}/${step.names.length} earned — ${step.names.join(' · ')}`;
    li.append(h, p, meta);
    roadmapEl.append(li);
  }
}

function renderMissables() {
  missableEl.replaceChildren();
  for (const t of trophies) if (t.missable) missableEl.append(trophyRow(t));
}

function switchView(name) {
  for (const btn of document.querySelectorAll('.view-btn')) btn.classList.toggle('is-active', btn.dataset.view === name);
  document.getElementById('view-checklist').hidden = name !== 'checklist';
  document.getElementById('view-roadmap').hidden = name !== 'roadmap';
  document.getElementById('view-missables').hidden = name !== 'missables';
}
for (const btn of document.querySelectorAll('.view-btn')) {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
}

document.getElementById('export').addEventListener('click', () => {
  const payload = JSON.stringify({ earned: [...earned], counters, spoiler: spoilerEl.checked }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-platinum-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  earned = new Set(Array.isArray(data) ? data : data.earned ?? []);
  counters = Array.isArray(data) ? {} : data.counters ?? {};
  if (!Array.isArray(data) && typeof data.spoiler === 'boolean') spoilerEl.checked = data.spoiler;
  save(); render();
});
document.getElementById('reset').addEventListener('click', () => {
  earned = new Set(); counters = {}; save(); render();
});
for (const el of [searchEl, kindEl, gradeEl, onlyOpenEl]) el.addEventListener('input', render);
spoilerEl.addEventListener('change', () => { save(); render(); });

// Deep links (also how the entry's screenshots are framed): ?view=, ?grade=, ?kind=, ?spoiler=1.
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('kind')) kindEl.value = params.get('kind');
spoilerEl.checked = state.spoiler || params.get('spoiler') === '1';
if (params.get('view')) switchView(params.get('view'));
render();
