// Leonida Ledger — saved progress: localStorage plus export/import to a file.
// Nothing leaves the browser except the file the reader chooses to download.
export const EARNED_KEY = 'leonida-ledger-earned-v1';
export const SETTINGS_KEY = 'leonida-ledger-settings-v1';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { spoilers: false, hideEarned: false, kind: 'all', grade: 'all' };
    const parsed = JSON.parse(raw);
    return {
      spoilers: Boolean(parsed.spoilers),
      hideEarned: Boolean(parsed.hideEarned),
      kind: typeof parsed.kind === 'string' ? parsed.kind : 'all',
      grade: typeof parsed.grade === 'string' ? parsed.grade : 'all',
    };
  } catch {
    return { spoilers: false, hideEarned: false, kind: 'all', grade: 'all' };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Turn the earned set into a downloadable JSON file.
export function downloadProgress(earned, settings) {
  const payload = {
    app: 'leonida-ledger',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
    settings: { spoilers: settings.spoilers, hideEarned: settings.hideEarned },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload;
}

// Read an exported file back in. Only trophy names this guide knows are kept;
// anything else in the file is ignored, so a foreign file cannot inject rows.
export async function readProgressFile(file, knownNames) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const names = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(names)) throw new Error('That file has no earned list in it.');
  const known = new Set(knownNames);
  const earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
  const settings = {};
  if (parsed && typeof parsed === 'object' && parsed.settings && typeof parsed.settings === 'object') {
    if (typeof parsed.settings.spoilers === 'boolean') settings.spoilers = parsed.settings.spoilers;
    if (typeof parsed.settings.hideEarned === 'boolean') settings.hideEarned = parsed.settings.hideEarned;
  }
  return { earned, settings };
}
