// Leonida Platinum — GTA VI trophy guide and tracker: the program that hands the entry in.
//
// The grader runs this file as `node /bot/main.ts` with the repository mounted READ-ONLY at /bot,
// no network, an arbitrary working directory, and exactly one writable place: the output directory
// named by MAKEFUN_OUTPUT_DIR (/output in the grader). So this program:
//   - finds the repository root from MAKEFUN_BOT_DIR, falling back to this file's own directory
//     (import.meta.url) — NEVER from process.cwd(), which the grader does not guarantee;
//   - writes ONLY inside the output directory;
//   - uses nothing but the Node standard library and the vendored dossier library;
//   - starts no server, spawns no child process, reads no stdin, and leaves no timer or handle
//     behind, so it exits 0 on its own, far inside the 10 second limit.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root: the grader's MAKEFUN_BOT_DIR when it is set, otherwise the folder this
// file lives in. Either way the answer never depends on where the process was launched from.
const botDir = process.env.MAKEFUN_BOT_DIR;
const repoRoot = botDir !== undefined && botDir !== '' ? botDir : dirname(fileURLToPath(import.meta.url));

// The one writable directory. In the grader this is /output; outside it, MAKEFUN_OUTPUT_DIR
// stands in for /output, exactly as the kit's rules describe.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the static app and the screenshots across, then write the dossier the judge reads.
// buildDossier is the kit's own library (vendor/makefun-frontend.ts, byte for byte unchanged):
// the scorer rebuilds the dossier with its copy and compares the two byte for byte, so the caps
// passed here are the scorer's own caps from the rules — they only refuse, never reshape.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});

// Determinism matters: the program runs twice in the grader and both runs must write the same
// bytes. Nothing above depends on the clock, on randomness, or on directory order — buildDossier
// walks the copied tree in its own sorted order — so the dossier is a pure function of app/ and
// screenshots/ as committed.
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossier);
