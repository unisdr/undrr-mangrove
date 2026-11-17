/**
 * Build a local before/after review page from an independently captured CSS
 * baseline. Serve the output directory with any static server, then inspect
 * both frames. Pass --baseline-ref <commit> [output-directory] to build the
 * baseline from Git using the same installed Sass. The positional baseline
 * capture-directory/output-directory API also remains available.
 * This is a review fixture, not a published component example.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as sass from 'sass';

const args = process.argv.slice(2);
const baselineRefIndex = args.indexOf('--baseline-ref');
const fromRef = baselineRefIndex >= 0;
const reference = fromRef ? args[baselineRefIndex + 1] : null;
if (fromRef && (!reference || reference.startsWith('--'))) {
  throw new Error(
    'Usage: create-token-review.mjs --baseline-ref <git-ref> [output-directory]'
  );
}
const baseline = path.resolve(args[0] || '/tmp/mg-dtcg-baseline');
const output = path.resolve(
  (fromRef ? args[baselineRefIndex + 2] : args[1]) || '.cache/token-review'
);

function readBaselineReference(ref) {
  const sha = execFileSync(
    'git',
    ['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`],
    { encoding: 'utf8' }
  ).trim();
  const temporary = fs.mkdtempSync(
    path.join(tmpdir(), 'mangrove-token-review-')
  );
  try {
    const archive = execFileSync(
      'git',
      ['archive', sha, 'stories', 'tokens', 'scripts'],
      { maxBuffer: 100 * 1024 * 1024 }
    );
    execFileSync('tar', ['-x', '-C', temporary], { input: archive });
    fs.symlinkSync(
      fs.realpathSync('node_modules'),
      path.join(temporary, 'node_modules'),
      'dir'
    );
    execFileSync(process.execPath, ['scripts/build-tokens.cjs'], {
      cwd: temporary,
      stdio: 'pipe',
    });
    const css = sass.compile(
      path.join(temporary, 'stories/assets/scss/style-all.scss'),
      { style: 'compressed', logger: sass.Logger.silent }
    ).css;
    return { css, metadata: { sha } };
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

const captured = fromRef
  ? readBaselineReference(reference)
  : {
      css: fs.readFileSync(path.join(baseline, 'style-all.css'), 'utf8'),
      metadata: JSON.parse(
        fs.readFileSync(path.join(baseline, 'metadata.json'), 'utf8')
      ),
    };
const cssBefore = captured.css;
const metadata = captured.metadata;
const cssAfter = sass.compile('stories/assets/scss/style-all.scss', {
  style: 'compressed',
  logger: sass.Logger.silent,
}).css;
const themes = ['', 'preventionweb', 'irp', 'mcr', 'delta'];
const themeClass = theme => (theme ? `mg-theme-${theme}` : '');
const specimen = (theme, dynamic = false) => `
  <section class="specimen ${themeClass(theme)}" ${dynamic ? 'id="runtime"' : ''}>
    <h2>${dynamic ? 'Try the controls' : theme || 'UNDRR default'}</h2>
    <p class="probe-text">Shared text and interactive colour</p>
    <button class="mg-button mg-button-primary" type="button">Save changes</button>
    <button class="mg-button mg-button-primary mg-button-outline" type="button">Review</button>
    <div class="mg-form-field">
      <label class="mg-form-label" for="${dynamic ? 'runtime' : theme || 'default'}-field">Record name</label>
      <input class="mg-form-input" id="${dynamic ? 'runtime' : theme || 'default'}-field" value="Flood record" />
    </div>
    <article class="mg-card"><div class="mg-card__content"><h3>Content card</h3><p>Existing component with the active brand values.</p></div></article>
    <div class="probes"><span class="probe-accent">Interactive</span><span class="probe-tab">Tab colour (live reference)</span><span class="probe-type">Button size (build-time)</span></div>
  </section>`;
const frame = (label, css) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${label}</title>
<style>${css}</style>
<style>
body{margin:0;padding:20px;background:#fff;font:16px/1.5 system-ui;-webkit-font-smoothing:antialiased}
h1{font:600 22px/1.3 system-ui;margin:0 0 16px}.reference-heading{font:600 18px/1.3 system-ui;margin:28px 0 16px}
.specimen{padding:16px;margin:0 0 20px;border:1px solid #bbb;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.specimen>h2,.specimen>p,.specimen>.mg-form-field,.specimen>.mg-card,.probes{flex-basis:100%;margin:0}
.specimen>h2{font:600 18px/1.3 system-ui}
.mg-form-field{max-width:28rem}.specimen>.mg-card{padding:12px;max-width:28rem}
.probe-text{color:rgb(var(--mg-color-text))}.probes{display:flex;flex-wrap:wrap;gap:8px}
.probes span{display:inline-block;padding:4px 8px;border:1px solid currentColor}
.probe-accent{background:rgb(var(--mg-color-interactive));color:#fff}
.probe-tab{color:var(--mg-tab-color);background:var(--mg-tab-background--active)}
.probe-type{font-size:var(--mg-font-size-button)}
</style></head><body><h1>${label}</h1>${specimen('', true)}<h2 class="reference-heading">All existing themes</h2>${themes.map(theme => specimen(theme)).join('')}
<script>
window.tokenReview = {
  setTheme(theme) { document.querySelector('#runtime').className = 'specimen ' + (theme ? 'mg-theme-' + theme : ''); },
  setRootTheme(theme) { document.body.className = theme ? 'mg-theme-' + theme : ''; },
  setOverride(enabled, colour = '#7b2d43', includeScale = true) {
    const root = document.querySelector('#runtime');
    const channels = [1, 3, 5].map(index => parseInt(colour.slice(index, index + 2), 16)).join(' ');
    for (const [key, value] of [['--mg-color-interactive', channels], ['--mg-font-size-250', includeScale ? '30px' : '']]) {
      if (enabled && value) root.style.setProperty(key, value);
      else root.style.removeProperty(key);
    }
  },
  measure() { const root = document.querySelector('#runtime'); const style = getComputedStyle(root); const measure = selector => { const node = root.querySelector(selector); const css = getComputedStyle(node); return {color:css.color,background:css.backgroundColor,fontSize:css.fontSize,border:css.borderColor,height:node.getBoundingClientRect().height}; }; return { tokens:Object.fromEntries(['--mg-color-interactive','--mg-tab-color','--mg-font-size-250','--mg-font-size-button'].map(key=>[key,style.getPropertyValue(key).trim()])), accent:measure('.probe-accent'),alias:measure('.probe-tab'),eager:measure('.probe-type'),button:measure('.mg-button'),input:measure('.mg-form-input') }; }
};
</script></body></html>`;
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(
  path.join(output, 'before.html'),
  frame('Before migration', cssBefore)
);
fs.writeFileSync(
  path.join(output, 'after.html'),
  frame('After migration', cssAfter)
);
fs.writeFileSync(
  path.join(output, 'index.html'),
  `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Token migration review</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f4f5f7;color:#18212c;font:15px/1.5 system-ui;-webkit-font-smoothing:antialiased}
header{padding:20px 28px;background:#fff;border-bottom:1px solid #d8dde4}h1{font-size:24px;line-height:1.2;margin:0 0 8px;text-wrap:balance}
p{max-width:85ch;margin:0 0 16px}.controls{display:flex;flex-wrap:wrap;align-items:end;gap:16px 24px}
.field{display:grid;gap:5px;font-weight:600}.check{display:flex;align-items:center;gap:8px;min-height:40px;font-weight:400}
select,button,input[type=color]{min-height:40px;border:1px solid #8793a3;border-radius:6px;background:white;color:inherit;font:inherit}
select{padding:6px 32px 6px 10px}button{padding:6px 14px;cursor:pointer}input[type=color]{width:56px;padding:4px;cursor:pointer}
input[type=checkbox]{width:18px;height:18px;accent-color:#004f91}button:hover{background:#eef2f7}button:focus-visible,select:focus-visible,input:focus-visible{outline:2px solid #004f91;outline-offset:3px}
.helper{color:#526071;font-size:13px;margin:12px 0 0}.status{font-size:13px;color:#526071;margin:8px 0 0;font-variant-numeric:tabular-nums}
main{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:1px;background:#d8dde4}
iframe{display:block;width:100%;height:calc(100vh - 250px);min-height:600px;border:0;background:white}
details{margin-top:10px;font-size:12px;color:#526071}code{overflow-wrap:anywhere}
@media(max-width:680px){header{padding:18px 16px}.controls{gap:12px}main{grid-template-columns:1fr}iframe{height:80vh;min-height:500px}.helper{max-width:60ch}}
</style></head><body>
<header>
<h1>Token foundation: before and after</h1>
<p>The migration changes how tokens are stored. The existing themes should look and behave the same on both sides. Delta 2027 is not implemented in this review.</p>
<div class="controls">
<label class="field" for="theme">Theme<select id="theme"><option value="">UNDRR default</option><option value="preventionweb">PreventionWeb</option><option value="irp">IRP</option><option value="mcr">MCR2030</option><option value="delta">Existing Delta</option></select></label>
<label class="check" for="override"><input id="override" type="checkbox">Override interactive colour locally</label>
<label class="field" for="accent">Override colour<input id="accent" type="color" value="#7b2d43"></label>
<button id="reset" type="button">Reset controls</button>
</div>
<p class="helper">Try a theme, edit the field, hover or focus a button, then enable the colour override. The interactive swatch reads a live token; some button values are resolved at build time and can stay unchanged.</p>
<p id="status" class="status" role="status">Loading both comparisons…</p>
<details><summary>Comparison baseline</summary><code>${metadata.sha}</code>. Each frame also exposes <code>tokenReview</code> for runtime and build-time checks.</details>
</header>
<main><iframe id="before" src="before.html" title="Before migration"></iframe><iframe id="after" src="after.html" title="After migration"></iframe></main>
<script>
const frames = [...document.querySelectorAll('iframe')];
const theme = document.querySelector('#theme');
const override = document.querySelector('#override');
const accent = document.querySelector('#accent');
function applyControls() {
  let ready = 0;
  for (const frame of frames) {
    const api = frame.contentWindow.tokenReview;
    if (!api) continue;
    ready++;
    api.setTheme(theme.value);
    api.setOverride(override.checked, accent.value, false);
  }
  const label = theme.options[theme.selectedIndex].text;
  document.querySelector('#status').textContent = ready === frames.length
    ? label + (override.checked ? ' · local interactive colour ' + accent.value.toUpperCase() : ' · original token values') + ' · applied to both sides'
    : 'Loading both comparisons…';
}
for (const frame of frames) frame.addEventListener('load', applyControls);
for (const control of [theme, override, accent]) control.addEventListener('input', applyControls);
document.querySelector('#reset').addEventListener('click', () => {
  theme.value = ''; override.checked = false; accent.value = '#7b2d43';
  for (const frame of frames) if (frame.contentWindow.tokenReview) frame.contentWindow.scrollTo(0, 0);
  applyControls();
});
applyControls();
</script></body></html>`
);
console.log(`Token review written to ${path.join(output, 'index.html')}`);
