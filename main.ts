// A working gta6-trophy-guide-01 entry (Node 22, standard library only): the guide is this directory's app/ folder,
// plain static files a browser opens at app/index.html (ES modules, CSS, no build step), offline: it loads nothing
// over the network, and its trophy list and guides are app/data/trophies.json. The program hands it in: it copies app/
// and screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the judge reads (your
// screenshots, the first load's files and bytes, and your source), with the vendored make.fun library. Leave
// vendor/makefun-frontend.ts as it is: the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Only the plumbing, not a winner: a plain checklist of the 55 trophies with a one-line hint each. Write a real guide
// for every trophy in your own words, a roadmap to the platinum, filters and a spoiler setting in app/, put 3 or 4 PNG
// or JPEG screenshots of it in screenshots/ (the first by name is the cover; shots.json says which views this
// starter's were taken of), and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight checks, written for this entry: refuse to hand in a guide whose
// trophy file is short a trophy, or whose screenshots break the gate's caps.
const trophyDoc = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
const trophies = Array.isArray(trophyDoc) ? trophyDoc : trophyDoc.trophies;
if (!Array.isArray(trophies) || trophies.length !== 55) {
  throw new Error(`expected exactly 55 trophies, found ${Array.isArray(trophies) ? trophies.length : 'no array'}`);
}
const unguided = trophies.filter((t) => typeof t.name !== 'string' || !t.name.trim() || typeof t.guide !== 'string' || !t.guide.trim());
if (unguided.length > 0) {
  throw new Error(`${unguided.length} trophies have no name or no guide`);
}
const byGrade = {};
for (const t of trophies) byGrade[t.grade] = (byGrade[t.grade] ?? 0) + 1;

const shotDir = join(here, 'screenshots');
const shots = readdirSync(shotDir).filter((f) => !f.startsWith('.') && statSync(join(shotDir, f)).isFile()).sort();
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`expected 3 or 4 screenshots, found ${shots.length}`);
}
for (const shot of shots) {
  const bytes = readFileSync(join(shotDir, shot));
  if (bytes.length > 262144) throw new Error(`screenshot ${shot} is ${bytes.length} bytes, over the 256 KiB cap`);
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isPng && !isJpeg) throw new Error(`screenshot ${shot} is neither PNG nor JPEG`);
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 48 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);

// Summary of what was handed in, so a run's log says what the dossier holds.
const dossierBytes = statSync(join(out, 'dossier.json')).size;
console.log(
  `Leonida Ledger handed in: ${trophies.length} trophies ` +
  `(${byGrade.platinum ?? 0} platinum, ${byGrade.gold ?? 0} gold, ${byGrade.silver ?? 0} silver, ${byGrade.bronze ?? 0} bronze), ` +
  `${shots.length} screenshots (${shots.join(', ')}), dossier.json ${dossierBytes} bytes -> ${out}`,
);
