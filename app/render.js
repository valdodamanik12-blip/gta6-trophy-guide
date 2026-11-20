// Leonida Ledger — the checklist view: rows, filters, the spoiler rule and the
// per-trophy guide pane. A story trophy stays hidden (name, description and
// guide) while spoilers are on and it is not yet earned.
export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
  platinum: 'Platinum',
};

export const STAGE_LABELS = {
  1: 'Stage 1 — Chapter 1, do it now',
  2: 'Stage 2 — The story',
  3: 'Stage 3 — After the credits',
  4: 'Stage 4 — Cleanup',
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function spoilerHidden(trophy, earned, settings) {
  return settings.spoilers && trophy.kinds.includes('story') && !earned.has(trophy.name);
}

export function trophyMatches(trophy, earned, settings, query) {
  if (settings.kind === 'online') return false; // GTA VI has no online trophies.
  if (settings.kind !== 'all' && !trophy.kinds.includes(settings.kind)) return false;
  if (settings.grade !== 'all' && trophy.grade !== settings.grade) return false;
  if (settings.hideEarned && earned.has(trophy.name)) return false;
  if (query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function buildGuidePane(trophy) {
  const pane = el('div', 'guide');
  if (trophy.missable) {
    const warn = el('p', 'missable-warn');
    warn.innerHTML = '<strong>Possibly missable.</strong> Do the Chapter 1 meditation before the chapter ends — see the guide below. Every other trophy can wait until after the story.';
    pane.append(warn);
  }
  if (trophy.id === 49) {
    const note = el('p', 'unknown-note');
    note.innerHTML = '<strong>Not yet confirmed.</strong> No guide has pinned down how this trophy unlocks. This guide says so rather than guessing — check the linked source for updates.';
    pane.append(note);
  }
  pane.append(el('p', null, trophy.guide));
  const stage = el('p', null, `Roadmap: ${STAGE_LABELS[trophy.stage] ?? 'Stage 4 — Cleanup'}.`);
  pane.append(stage);
  const head = el('h4', null, 'Sources — where each fact comes from');
  pane.append(head);
  const list = el('ul');
  for (const source of trophy.sources) {
    const li = el('li');
    const a = el('a', null, source.name);
    a.href = source.url;
    a.target = '_blank';
    a.rel = 'noopener';
    li.append(a);
    list.append(li);
  }
  pane.append(list);
  return pane;
}

export function buildTrophyRow(trophy, earned, settings, callbacks) {
  const li = el('li', 'trophy');
  if (earned.has(trophy.name)) li.classList.add('earned');
  li.dataset.trophyId = String(trophy.id);

  const row = el('div', 'trophy-row');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Earned: ${trophy.name}`);
  box.addEventListener('change', () => callbacks.onToggle(trophy.name, box.checked));
  row.append(box);

  row.append(el('span', `medal ${trophy.grade}`));

  const body = el('div', 'trophy-body');
  const hidden = spoilerHidden(trophy, earned, settings);
  if (hidden) {
    body.append(el('span', 'trophy-name spoiler-mask', 'Hidden story trophy — earn it to reveal'));
    body.append(el('p', 'trophy-desc', 'Spoiler hiding is on. Tick the box once you have earned it in the game.'));
  } else {
    const name = el('button', 'trophy-name', trophy.name);
    name.type = 'button';
    name.addEventListener('click', () => callbacks.onToggleGuide(trophy.id));
    body.append(name);
    body.append(el('p', 'trophy-desc', trophy.description));
  }

  const tags = el('div', 'trophy-tags');
  tags.append(el('span', `tag grade-${trophy.grade}`, trophy.grade));
  for (const kind of trophy.kinds) {
    if (kind === 'platinum') continue;
    tags.append(el('span', 'tag', KIND_LABELS[kind] ?? kind));
  }
  if (trophy.missable) tags.append(el('span', 'tag missable', 'Possibly missable'));
  tags.append(el('span', 'tag stage', STAGE_LABELS[trophy.stage] ?? ''));
  body.append(tags);
  row.append(body);

  if (!hidden) {
    const toggle = el('button', 'guide-toggle', callbacks.guideOpen.has(trophy.id) ? 'Hide guide' : 'Read guide');
    toggle.type = 'button';
    toggle.addEventListener('click', () => callbacks.onToggleGuide(trophy.id));
    row.append(toggle);
  }
  li.append(row);

  if (!hidden && callbacks.guideOpen.has(trophy.id)) {
    li.append(buildGuidePane(trophy));
  }
  return li;
}

export function renderChecklist(listEl, trophies, earned, settings, query, callbacks) {
  listEl.replaceChildren();
  let shown = 0;
  for (const trophy of trophies) {
    if (!trophyMatches(trophy, earned, settings, query)) continue;
    listEl.append(buildTrophyRow(trophy, earned, settings, callbacks));
    shown += 1;
  }
  return shown;
}

export function renderProgress(trophies, earned) {
  const total = trophies.length;
  const count = earned.size;
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  document.getElementById('earnedCount').textContent = String(count);
  document.getElementById('progressFill').style.width = `${pct}%`;
  document.getElementById('progressLine').textContent =
    `${count} of ${total} earned · ${pct}% to the platinum`;
  const byGrade = {};
  for (const t of trophies) {
    if (earned.has(t.name)) byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;
  }
  const totals = {};
  for (const t of trophies) totals[t.grade] = (totals[t.grade] ?? 0) + 1;
  document.getElementById('gradeCounts').textContent =
    ['platinum', 'gold', 'silver', 'bronze']
      .map((g) => `${byGrade[g] ?? 0}/${totals[g] ?? 0} ${g}`)
      .join(' · ');
}
