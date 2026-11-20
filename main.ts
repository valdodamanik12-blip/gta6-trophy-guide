// Leonida Platinum — entry program for gta6-trophy-guide-01.
// Copies app/ and screenshots/ from beside this file into the output directory
// (/output in the grader, MAKEFUN_OUTPUT_DIR outside it) and writes
// /output/dossier.json with buildDossier from vendor/makefun-frontend.ts.
import { buildDossier } from "./vendor/makefun-frontend.ts";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

// Start from a clean output directory so stale files never leak into an entry.
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

// Hand the guide in: the whole app/ tree and the screenshots, as they are.
cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), { recursive: true });

// The dossier is built from the copied output, exactly as the scorer rebuilds it.
const dossier = buildDossier(outDir, caps);
writeFileSync(join(outDir, "dossier.json"), dossier);

console.log(`Leonida Platinum: wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
