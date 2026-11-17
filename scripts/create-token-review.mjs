/**
 * Build a local before/after review page from an independently captured CSS
 * baseline. Serve the output directory with any static server, then inspect
 * both frames. This is a review fixture, not a published component example.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as sass from 'sass';

const baseline = path.resolve(process.argv[2] || '/tmp/mg-dtcg-baseline');
const output = path.resolve(process.argv[3] || '.cache/token-review');
const cssBefore = fs.readFileSync(path.join(baseline, 'style-all.css'), 'utf8');
const cssAfter = sass.compile('stories/assets/scss/style-all.scss', {
  style: 'compressed',
  logger: sass.Logger.silent,
}).css;
const metadata = JSON.parse(
  fs.readFileSync(path.join(baseline, 'metadata.json'), 'utf8')
);
const themes = ['', 'preventionweb', 'irp', 'mcr', 'delta'];
const themeClass = theme => (theme ? `mg-theme-${theme}` : '');
const specimen = (theme, dynamic = false) => `
  <section class="specimen ${themeClass(theme)}" ${dynamic ? 'id="runtime"' : ''}>
    <h2>${dynamic ? 'Runtime probe' : theme || 'UNDRR default'}</h2>
    <p class="probe-text">Shared text and interactive colour</p>
    <button class="mg-button mg-button-primary" type="button">Save changes</button>
    <button class="mg-button mg-button-primary mg-button-outline" type="button">Review</button>
    <div class="mg-form-field">
      <label class="mg-form-label" for="${dynamic ? 'runtime' : theme || 'default'}-field">Record name</label>
      <input class="mg-form-input" id="${dynamic ? 'runtime' : theme || 'default'}-field" value="Flood record" />
    </div>
    <article class="mg-card"><div class="mg-card__content"><h3>Content card</h3><p>Existing component with the active brand values.</p></div></article>
    <div class="probes"><span class="probe-accent">Interactive</span><span class="probe-tab">Dependent tab alias</span><span class="probe-type">Eager button size</span></div>
  </section>`;
const frame = (label, css) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${label}</title>
<style>${css}</style>
<style>
body{margin:0;padding:20px;background:#fff;font:16px/1.5 system-ui}
h1{font:600 22px/1.3 system-ui;margin:0 0 16px}
.specimen{padding:16px;margin:0 0 20px;border:1px solid #bbb;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.specimen>h2,.specimen>p,.specimen>.mg-form-field,.specimen>.mg-card,.probes{flex-basis:100%;margin:0}
.specimen>h2{font:600 18px/1.3 system-ui}
.mg-form-field{max-width:28rem}.specimen>.mg-card{padding:12px;max-width:28rem}
.probe-text{color:rgb(var(--mg-color-text))}.probes{display:flex;flex-wrap:wrap;gap:8px}
.probes span{display:inline-block;padding:4px 8px;border:1px solid currentColor}
.probe-accent{background:rgb(var(--mg-color-interactive));color:#fff}
.probe-tab{color:var(--mg-tab-color);background:var(--mg-tab-background--active)}
.probe-type{font-size:var(--mg-font-size-button)}
</style></head><body><h1>${label}</h1>${themes.map(theme => specimen(theme)).join('')}${specimen('', true)}
<script>
window.tokenReview = {
  setTheme(theme) { document.querySelector('#runtime').className = 'specimen ' + (theme ? 'mg-theme-' + theme : ''); },
  setRootTheme(theme) { document.body.className = theme ? 'mg-theme-' + theme : ''; },
  setOverride(enabled) { const root = document.querySelector('#runtime'); for (const [key, value] of [['--mg-color-interactive','123 45 67'], ['--mg-font-size-250','30px']]) { if(enabled) root.style.setProperty(key,value); else root.style.removeProperty(key); } },
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
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Token migration review</title><style>body{margin:0;font:16px/1.5 system-ui}header{padding:12px 20px;background:#eee}main{display:grid;grid-template-columns:1fr 1fr}iframe{width:100%;height:calc(100vh - 100px);border:0}iframe+iframe{border-left:1px solid #999}</style></head><body><header><strong>Token migration before/after</strong><br>Baseline: ${metadata.sha}. Each frame exposes <code>tokenReview</code> for runtime theme and override checks.</header><main><iframe src="before.html" title="Before migration"></iframe><iframe src="after.html" title="After migration"></iframe></main></body></html>`
);
console.log(`Token review written to ${path.join(output, 'index.html')}`);
