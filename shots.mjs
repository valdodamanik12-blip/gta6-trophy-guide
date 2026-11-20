// Leonida Ledger — screenshot + verification driver (Node 22, standard library
// only). Drives the Playwright chromium-headless-shell binary over CDP with
// Node's built-in WebSocket: no npm packages, no /opt/meta-chromium.
// Usage: node shots.mjs [--serve-port 8091] [--verify-only]
// It (re)takes screenshots/1-checklist.jpg … 4-spoilers.jpg at 1280x800,
// JPEG quality 82, then verifies persistence, export/import, filters and
// the spoiler toggle, and asserts the app makes no off-origin request.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = 8091;
const BASE = `http://127.0.0.1:${PORT}`;
const SHELL = `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const SHOTS = join(here, 'screenshots');
const verifyOnly = process.argv.includes('--verify-only');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SEEDED = [
  'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Vice City, Baby!',
  'Trust', 'Break the Bank', 'Baited My Tackle', 'Stick Fiddler', 'Whip It Good',
  'You WAiNKer!', 'One Last Thing', 'In The Beginning…', 'Treat Yo Self',
];

async function cdp() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9222/json/list');
      const targets = await res.json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('CDP did not come up');
}

let msgId = 0;
const pending = new Map();
function connect(url) {
  const ws = new WebSocket(url);
  ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(JSON.stringify(data.error)));
      else resolve(data.result);
    }
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener('open', () => resolve({
      ws,
      send: (method, params = {}) => new Promise((res, rej) => {
        const id = ++msgId;
        pending.set(id, { resolve: res, reject: rej });
        ws.send(JSON.stringify({ id, method, params }));
      }),
    }));
    ws.addEventListener('error', reject);
  });
}

async function evalJs(send, expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(`page JS error: ${JSON.stringify(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)}`);
  return r.result.value;
}

async function shot(send, file) {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
  writeFileSync(join(SHOTS, file), Buffer.from(r.data, 'base64'));
  const size = statSync(join(SHOTS, file)).size;
  console.log(`shot ${file}: ${size} bytes${size > 262144 ? '  *** OVER 256 KiB ***' : ''}`);
  return size;
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const server = spawn(process.execPath, ['serve.ts', '--port', String(PORT)], { cwd: here, stdio: 'ignore' });
  const browser = spawn(SHELL, ['--remote-debugging-port=9222', '--no-sandbox', '--window-size=1280,800', 'about:blank'], { stdio: 'ignore' });
  const requests = [];
  try {
    const { send } = await connect(await cdp());
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Network.enable');
    // Record every request URL by polling the log via Runtime later; simpler:
    // enable Network and listen through a second socket is overkill — instead
    // we read performance entries from the page after each shot.
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${BASE}/` });
    await sleep(1500);

    // Seed 13 earned trophies, as a returning player would have them.
    await evalJs(send, `localStorage.setItem('leonida-ledger-earned-v1', JSON.stringify(${JSON.stringify(SEEDED)})); 'seeded';`);
    await send('Page.navigate', { url: `${BASE}/` });
    await sleep(1200);
    const rendered = await evalJs(send, `document.querySelectorAll('#trophyList .trophy').length`);
    console.log(`checklist rows rendered: ${rendered}`);
    const progress = await evalJs(send, `document.getElementById('progressLine').textContent`);
    console.log(`progress line: ${progress}`);

    if (!verifyOnly) {
      // Shot 1 (cover): checklist with the missable trophy's full guide open.
      await evalJs(send, `(() => { const row = document.querySelector('[data-trophy-id="28"]'); row.scrollIntoView({block:'start'}); row.querySelector('.guide-toggle').click(); return 'opened'; })()`);
      await sleep(400);
      await shot(send, '1-checklist.jpg');
      // Shot 2: the roadmap to the platinum.
      await evalJs(send, `document.querySelector('[data-tab="roadmap"]').click(); window.scrollTo(0,0); 'roadmap';`);
      await sleep(400);
      await shot(send, '2-roadmap.jpg');
      // Shot 3: the missables view.
      await evalJs(send, `document.querySelector('[data-tab="missables"]').click(); window.scrollTo(0,0); 'missables';`);
      await sleep(400);
      await shot(send, '3-missables.jpg');
      // Shot 4: spoiler hiding at work on the story filter, with earned hidden
      // so the masked (unearned) story trophies are what the shot shows.
      await evalJs(send, `(() => { document.querySelector('[data-tab="checklist"]').click(); document.querySelector('#spoilers').click(); document.querySelector('[data-kind="story"]').click(); document.querySelector('#hideEarned').click(); window.scrollTo(0,0); return 'spoilers'; })()`);
      await sleep(400);
      await shot(send, '4-spoilers.jpg');
      // Remove the starter's old shots if they are still there.
      for (const stale of ['2-silver.jpg', '3-bronze.jpg']) {
        const p = join(SHOTS, stale);
        if (existsSync(p)) rmSync(p);
      }
      console.log('screenshots now:', readdirSync(SHOTS).join(', '));
    }

    // ---- verification (runs on a clean state) ----
    await evalJs(send, `localStorage.clear(); 'cleared';`);
    await send('Page.navigate', { url: `${BASE}/` });
    await sleep(1200);

    // 1. Persistence: tick a box, reload, it must still be ticked.
    await evalJs(send, `document.querySelector('[data-trophy-id="1"] input[type=checkbox]').click(); 'ticked';`);
    await sleep(300);
    await send('Page.navigate', { url: `${BASE}/` });
    await sleep(1200);
    const persisted = await evalJs(send, `document.querySelector('[data-trophy-id="1"] input[type=checkbox]').checked`);
    console.log(`VERIFY persistence after reload: ${persisted === true ? 'PASS' : 'FAIL'}`);

    // 2. Export: click export, a file must land in the download dir.
    try { await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp/leonida-dl' }); } catch { await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: '/tmp/leonida-dl' }); }
    mkdirSync('/tmp/leonida-dl', { recursive: true });
    await evalJs(send, `document.getElementById('export').click(); 'exported';`);
    await sleep(1500);
    const dl = readdirSync('/tmp/leonida-dl').filter((f) => f.endsWith('.json'));
    console.log(`VERIFY export file: ${dl.length ? `PASS (${dl[0]})` : 'FAIL'}`);

    // 3. Import: feed a file with 3 earned names, the count must become 3.
    const importPayload = { app: 'leonida-ledger', earned: ['Just Like Paradise', 'Paradise Lost', 'Top Fun'] };
    writeFileSync('/tmp/leonida-import.json', JSON.stringify(importPayload));
    const doc = await send('DOM.getDocument', { depth: -1 });
    const q = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: '#import' });
    await send('DOM.setFileInputFiles', { files: ['/tmp/leonida-import.json'], nodeId: q.nodeId });
    await sleep(800);
    const afterImport = await evalJs(send, `document.getElementById('progressLine').textContent`);
    console.log(`VERIFY import (expect 3 of 55): ${afterImport.includes('3 of 55') ? 'PASS' : 'FAIL'} — ${afterImport}`);

    // 4. Filters: collectibles kind must show exactly 4 rows.
    await evalJs(send, `localStorage.clear(); 'cleared';`);
    await send('Page.navigate', { url: `${BASE}/` });
    await sleep(1200);
    const coll = await evalJs(send, `(() => { document.querySelector('[data-kind="collectibles"]').click(); return document.querySelectorAll('#trophyList .trophy').length; })()`);
    console.log(`VERIFY collectibles filter (expect 4): ${coll === 4 ? 'PASS' : 'FAIL'} — got ${coll}`);
    const search = await evalJs(send, `(() => { document.querySelector('[data-kind="all"]').click(); const s = document.getElementById('search'); s.value = 'meditat'; s.dispatchEvent(new Event('input', {bubbles:true})); return document.querySelectorAll('#trophyList .trophy').length; })()`);
    console.log(`VERIFY search 'meditat' (expect 2: Positive Mental Attitude + A Long Road's guide mentions meditations): ${search === 2 ? 'PASS' : 'FAIL'} — got ${search}`);

    // 5. Spoiler toggle: story names must be masked, and unmasked again after untick.
    const masked = await evalJs(send, `(() => { const s = document.getElementById('search'); s.value=''; s.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('[data-kind="story"]').click(); document.getElementById('spoilers').click(); return document.getElementById('trophyList').textContent.includes('Paradise Lost'); })()`);
    console.log(`VERIFY spoiler hides story names (expect false): ${masked === false ? 'PASS' : 'FAIL'} — name visible: ${masked}`);
    const maskedCount = await evalJs(send, `document.querySelectorAll('.spoiler-mask').length`);
    console.log(`VERIFY spoiler placeholders shown: ${maskedCount} (expect 12)`);

    // 6. Network: every resource the page loaded must be same-origin.
    const resources = await evalJs(send, `performance.getEntriesByType('resource').map(e => e.name)`);
    const offOrigin = resources.filter((u) => !u.startsWith(BASE) && !u.startsWith('data:'));
    console.log(`VERIFY no off-origin requests: ${offOrigin.length === 0 ? 'PASS' : 'FAIL'} — ${offOrigin.length} off-origin, ${resources.length} total`);
    if (offOrigin.length) console.log('  off-origin:', offOrigin.join(', '));

    console.log('VERIFY done.');
  } finally {
    browser.kill();
    server.kill();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
