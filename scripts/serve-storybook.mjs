/**
 * Serve a built Storybook over HTTP so the Storybook test runner has something
 * to point a browser at.
 *
 * `test-storybook` needs a running Storybook; it will not build or serve one.
 * A dependency-free server keeps that requirement from pulling `http-server`,
 * `wait-on` and `concurrently` into the tree for the sake of three lines of CI.
 *
 * Usage: node scripts/serve-storybook.mjs <directory> [port]
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'docs-build-temp');
const port = Number(process.argv[3] || 6006);

const contentTypes = {
  '.css': 'text/css',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(root)) {
  console.error(`serve-storybook: no such directory: ${root}`);
  process.exit(1);
}

http
  .createServer((request, response) => {
    const requested = decodeURIComponent(request.url.split('?')[0]);
    let file = path.join(root, requested);

    // Keep `..` in a request path from reaching outside the served build.
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }

    if (!fs.existsSync(file)) {
      response.writeHead(404).end('Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type':
        contentTypes[path.extname(file)] || 'application/octet-stream',
    });
    fs.createReadStream(file).pipe(response);
  })
  .listen(port, () => {
    console.log(`serve-storybook: ${root} on http://127.0.0.1:${port}`);
  });
