#!/usr/bin/env node
// Headless-screenshot a running Storybook story via the Chrome DevTools
// Protocol — no devDependency needed, just a local Chrome/Chromium install.
//
// jest/jsdom never loads external SCSS, so it can't catch cascade bugs
// (wrong specificity, a selector that never sets `display`, a crop that
// slices into an asset it wasn't tuned for). Use this to actually look at a
// story before trusting a CSS-only change is done — see
// docs/AI-CODING-AGENTS.md.
//
// Usage:
//   npm run storybook -- -p 6006 &  (or any port)
//   node scripts/storybook-screenshot.mjs <storyId> <out.png> [width] [height]
//   node scripts/storybook-screenshot.mjs components-pageheader--default out.png 1126 200
//
// Env:
//   STORYBOOK_URL   base URL of the running Storybook (default http://localhost:6006)
//   CHROME_PATH     path to a Chrome/Chromium binary (auto-detected on macOS otherwise)

import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CDP_PORT = 9222 + Math.floor(Math.random() * 1000); // avoid clobbering a port already in use

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const macPath =
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (process.platform === 'darwin') return macPath;
  return 'google-chrome'; // Linux: assumes it's on PATH (or set CHROME_PATH)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForCdp(port, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${port}/json/version`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error(`Chrome DevTools Protocol did not come up on port ${port}`);
}

function send(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1e9);
    const handler = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener('open', () => resolve(ws));
    ws.addEventListener('error', reject);
  });
}

async function main() {
  const [storyId, outFile, widthArg, heightArg] = process.argv.slice(2);
  if (!storyId || !outFile) {
    console.error(
      'Usage: node scripts/storybook-screenshot.mjs <storyId> <out.png> [width] [height]'
    );
    process.exit(1);
  }
  const width = Number(widthArg) || 1280;
  const height = Number(heightArg) || 800;
  const base = process.env.STORYBOOK_URL || 'http://localhost:6006';
  const url = `${base}/iframe.html?id=${storyId}&viewMode=story`;

  const profileDir = mkdtempSync(join(tmpdir(), 'mangrove-screenshot-'));
  const chrome = spawn(
    findChrome(),
    [
      '--headless',
      '--disable-gpu',
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${profileDir}`,
      '--window-size=1400,900',
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    await waitForCdp(CDP_PORT);
    const tabRes = await fetch(
      `http://localhost:${CDP_PORT}/json/new?about:blank`,
      { method: 'PUT' }
    );
    const tab = await tabRes.json();
    const ws = await connect(tab.webSocketDebuggerUrl);
    await send(ws, 'Page.enable');
    await send(ws, 'Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });
    await send(ws, 'Page.navigate', { url });
    await sleep(3500); // let webpack-served React finish mounting
    const shot = await send(ws, 'Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width, height, scale: 1 },
    });
    writeFileSync(outFile, Buffer.from(shot.data, 'base64'));
    console.log(`Saved ${outFile} (${width}x${height}, story: ${storyId})`);
    ws.close();
  } finally {
    chrome.kill('SIGKILL');
    rmSync(profileDir, { recursive: true, force: true });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
