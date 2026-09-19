/**
 * Serve a built Storybook over HTTP so the Storybook test runner has something
 * to point a browser at.
 *
 * `test-storybook` needs a running Storybook; it will not build or serve one.
 * A dependency-free server keeps that requirement from pulling `http-server`,
 * `wait-on` and `concurrently` into the tree for the sake of three lines of CI.
 *
 * Usage: node scripts/serve-storybook.mjs <directory> [port]
 *
 * The default port is deliberately not 6006. That is `yarn storybook`'s own
 * port, and defaulting here would give two bad outcomes on a machine with the
 * dev server up: this script dies on EADDRINUSE, and `yarn test-storybook`
 * then quietly runs against the dev server instead of the build under test.
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'docs-build-temp');
const port = Number(process.argv[3] || 6099);

const contentTypes = {
  '.css': 'text/css',
  // Legacy webfont format. Served as application/octet-stream it still loads,
  // but the census of a real build output turned it up alongside .mp4, and a
  // wrong type is the kind of difference that only shows up in CI.
  '.eot': 'application/vnd.ms-fontobject',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  // A <video> element ignores a source served as application/octet-stream, so
  // a story asserting on playback would pass under `yarn storybook` — where
  // webpack-dev-server sets video/mp4 — and fail only here.
  '.mp4': 'video/mp4',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.scss': 'text/x-scss; charset=utf-8',
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

/**
 * Send a short error response, and log it.
 *
 * Without the log, a request this server refuses is invisible: the only thing
 * it printed was its startup banner, so a CI failure caused here showed up as
 * unexplained test failures with nothing on the server side to read.
 *
 * @param {http.IncomingMessage} request - The request being answered.
 * @param {http.ServerResponse} response - The response to write.
 * @param {number} status - The HTTP status code.
 * @param {string} body - The response body.
 * @returns {void}
 */
const fail = (request, response, status, body) => {
  console.error(`serve-storybook: ${status} ${request.method} ${request.url}`);
  if (response.headersSent) {
    response.destroy();
    return;
  }
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(body);
};

const server = http.createServer((request, response) => {
  try {
    // `decodeURIComponent` throws URIError on a malformed percent-escape — a
    // request for `/%zz` is enough. Unhandled, that threw out of the handler
    // and took the whole process with it: the next request got ECONNREFUSED,
    // and in CI that cascaded into every remaining suite failing with no
    // explanation anywhere. See unisdr/undrr-mangrove#1244.
    const requested = decodeURIComponent(request.url.split('?')[0]);
    let file = path.join(root, requested);

    // Keep `..` in a request path from reaching outside the served build.
    if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
      fail(request, response, 403, 'Forbidden');
      return;
    }

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
      file = path.join(file, 'index.html');
    }

    if (!fs.existsSync(file)) {
      fail(request, response, 404, 'Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type':
        contentTypes[path.extname(file)] || 'application/octet-stream',
      // Without this the responses carry no validator of any kind — no ETag,
      // no Last-Modified, no Cache-Control — and Chromium is then free to
      // apply heuristic caching. Storybook's chunk filenames are not fully
      // content-hashed, so a rebuild into the same directory left the browser
      // mixing fresh chunks with stale ones and running a story that matches
      // no commit. That cost an afternoon before it was understood: the
      // symptom is an assertion failing against markup the source cannot
      // produce. Nothing here is worth caching — the whole point of this
      // server is to serve the build that was just made.
      'Cache-Control': 'no-store',
    });

    const stream = fs.createReadStream(file);
    stream.on('error', error => {
      console.error(`serve-storybook: 500 ${request.url} — ${error.message}`);
      response.destroy();
    });
    stream.pipe(response);
  } catch (error) {
    fail(request, response, 400, `Bad request: ${error.message}`);
  }
});

// Without this, a port already in use threw an unhandled EADDRINUSE and exited
// 1. CI backgrounds this script with `&`, so bash never sees that exit status:
// the next step's `curl --retry-connrefused` then spent thirty seconds retrying
// and reported a health-check timeout, naming the wrong cause.
server.on('error', error => {
  console.error(`serve-storybook: ${error.message}`);
  process.exit(1);
});

// A throw from outside the request handler — anything asynchronous — would
// otherwise also exit silently. Exiting is still the right move, because the
// server's state after one is unknown; the point is that it says so first.
process.on('uncaughtException', error => {
  console.error(`serve-storybook: fatal: ${error.stack || error.message}`);
  process.exit(1);
});

server.listen(port, () => {
  console.log(`serve-storybook: ${root} on http://127.0.0.1:${port}`);
});
