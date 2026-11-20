// Leonida Ledger — the roadmap and missables views. Both are built from the
// official descriptions in trophies.json: each trophy carries the stage it
// belongs to, and the one missable flag the launch guides agree on.
import { STAGE_LABELS } from './render.js';

export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Before Chapter 1 ends',
    meta: 'Do it now · 1 trophy · the only missable step in the whole list',
    body: 'The moment you can, do the Chapter 1 meditation at Jason’s house (see Positive Mental Attitude). Everything else in the game can wait. Also: keep cheats off — they disable trophies and saving — and keep a manual save at the start and end of each chapter, because there is no mission replay.',
  },
  {
    stage: 2,
    title: 'Stage 2 — Play the story, Chapters 1–5',
    meta: 'About 60–80 hours · 20 trophies · 12 story trophies, all automatic',
    body: 'Just play the story. The 12 story trophies pop on their own as chapters and key missions end. Along the way, take the side-character questlines as they are marked — Andy, Kenton, Billy, Randy, Tyrone and Bret — and scan vehicles and study animals whenever you pass them, because the 100% checklist counts what you already did. Fishing with Cal and the arcade games can be done here too.',
  },
  {
    stage: 3,
    title: 'Stage 3 — After the credits: the 100% checklist',
    meta: 'About 100 hours · 17 trophies · this is where the platinum is won',
    body: 'Open Progress > Stats > 100% Completion and work down the 35 lines. The list is forgiving — roughly 60% of true completion — but the robberies, the 8 bank vaults, the 39 gang operations, the 33 underwater discoveries, all 42 shooting-range golds, all 42 drone races and all 15 Target Decks are wanted in full. Stunts, challenges, card sets, meditations and WAiNK scans only need a share of the total.',
  },
  {
    stage: 4,
    title: 'Stage 4 — Cleanup, then the platinum',
    meta: 'About 10 hours · 17 trophies · odds, ends and easter eggs',
    body: 'Whatever is left: the 8 stranger strands, the wanted-level and robbery feats with your partner, the plane, the tank, the UFO, the bowling alley, max strength for both characters, and the 500 criminal-profile actions. Tick the last box and Vice Got a Price! — the platinum — pops on its own.',
  },
];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderRoadmap(container, trophies, earned, onJumpToTrophy) {
  container.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const card = el('div', 'stage-card');
    card.append(el('h3', null, stage.title));
    card.append(el('p', 'stage-meta', stage.meta));
    card.append(el('p', null, stage.body));
    const members = trophies.filter((t) => t.stage === stage.stage);
    const done = members.filter((t) => earned.has(t.name)).length;
    card.append(el('p', 'stage-progress', `${done} of ${members.length} earned in this stage`));
    const list = el('ul', 'stage-trophies');
    for (const trophy of members) {
      const li = el('li');
      if (earned.has(trophy.name)) li.classList.add('done');
      const jump = el('button', null, `${earned.has(trophy.name) ? '✓' : '○'} ${trophy.name} — ${trophy.grade}`);
      jump.type = 'button';
      jump.addEventListener('click', () => onJumpToTrophy(trophy.id));
      li.append(jump);
      list.append(li);
    }
    card.append(list);
    container.append(card);
  }
}

export function renderMissables(container, trophies, earned, onJumpToTrophy) {
  container.replaceChildren();
  const flagged = trophies.filter((t) => t.missable);
  if (flagged.length === 0) {
    container.append(el('p', null, 'No trophy in this list is flagged missable.'));
    return;
  }
  for (const trophy of flagged) {
    const card = el('div', 'stage-card');
    card.append(el('h3', null, `${trophy.name} — ${trophy.grade}`));
    card.append(el('p', 'stage-meta', 'Possibly missable · the only one flagged by PowerPyx, Push Square and GTABase'));
    card.append(el('p', null, trophy.description));
    card.append(el('p', null, trophy.guide));
    const jump = el('button', 'guide-toggle', 'Open its full guide in the checklist');
    jump.type = 'button';
    jump.addEventListener('click', () => onJumpToTrophy(trophy.id));
    card.append(jump);
    container.append(card);
  }
  const note = el('p', 'lede',
    'One trophy in this guide is marked “not yet known” rather than missable: Bad Luck, I Guess. No launch guide has confirmed how it unlocks, so its card in the checklist says so plainly instead of guessing.');
  container.append(note);
}
