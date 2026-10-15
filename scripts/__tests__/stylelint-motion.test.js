/** @jest-environment node */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const cases = [
  ['shorthand', '.x { transition: opacity 200ms ease; }', true],
  ['animation shorthand', '.x { animation: spin 1s infinite; }', true],
  ['scientific notation positive', '.x { transition-duration: 1e2ms; }', true],
  [
    'scientific notation negative exponent',
    '.x { animation-duration: 2e-1s; }',
    true,
  ],
  [
    'comment-separated mixin',
    '.x { @include transition/**/(opacity 200ms); }',
    true,
  ],
  ['ms vendor prefix', '.x { -ms-transition-duration: 200ms; }', true],
  [
    'namespaced mixin',
    '.x { @include motion.transition(opacity 200ms); }',
    true,
  ],
  ['scientific zero', '.x { transition-duration: 0e2ms; }', false],
  ['duration longhand', '.x { transition-duration: 0.2s; }', true],
  ['delay longhand', '.x { animation-delay: -20ms; }', true],
  ['mixin', '.x { @include transition(opacity 0.2s, transform 200ms); }', true],
  ['multiline mixin', '.x { @include transition(\n opacity 0.2s\n ); }', true],
  [
    'fallback literal',
    '.x { transition: opacity var(--duration, 200ms); }',
    true,
  ],
  [
    'zero lifecycle delay',
    '.x { transition: visibility 0s linear 0s; }',
    false,
  ],
  [
    'documented tokens',
    '.x { transition: opacity var(--mg-motion-duration-fast) var(--mg-motion-easing-standard); }',
    false,
  ],
  [
    'loop property',
    '.x { --cycle: 1.5s; animation: spin var(--cycle) linear infinite; }',
    false,
  ],
  ['quoted name', '.x { animation: "200ms" var(--cycle); }', false],
  [
    'comment',
    '.x { transition: opacity var(--duration) /* 200ms previously */; }',
    false,
  ],
  [
    'reduce is no blanket exception',
    '@media (prefers-reduced-motion: reduce) { .x { transition-duration: 0.01ms !important; } }',
    true,
  ],
];

const runner = `
import stylelint from 'stylelint';
import plugin from './scripts/stylelint-motion.mjs';
const cases=JSON.parse(process.argv[1]);
const results=[];
for(const [name,code] of cases){
 const result=await stylelint.lint({code,codeFilename:'stories/new-motion.scss',customSyntax:'postcss-scss',config:{plugins:[plugin],rules:{'mangrove/no-unapproved-motion-timing':true}}});
 results.push([name,result.errored,result.results[0].warnings]);
}
process.stdout.write(JSON.stringify(results));
`;
let results;
beforeAll(() => {
  const run = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', runner, JSON.stringify(cases)],
    { cwd: root, encoding: 'utf8' }
  );
  expect(run.status).toBe(0);
  results = new Map(
    JSON.parse(run.stdout).map(([name, errored, warnings]) => [
      name,
      { errored, warnings },
    ])
  );
});
test.each(cases)('%s', (name, code, expected) => {
  expect(results.get(name).errored).toBe(expected);
  if (expected)
    expect(results.get(name).warnings[0].rule).toBe(
      'mangrove/no-unapproved-motion-timing'
    );
});

test('the legacy baseline permits an existing call but rejects its duplication and changes', () => {
  const check = `
import fs from 'node:fs';
import stylelint from 'stylelint';
import plugin from './scripts/stylelint-motion.mjs';
const baseline=JSON.parse(fs.readFileSync('./scripts/motion-timing-baseline.json','utf8'));
const filename=Object.keys(baseline).find(file=>Object.keys(baseline[file]).some(key=>key.startsWith('transition:')));
const key=Object.keys(baseline[filename]).find(key=>key.startsWith('transition:'));
const declaration=key+';';
const lint=async code=>(await stylelint.lint({code,codeFilename:filename,config:{plugins:[plugin],rules:{'mangrove/no-unapproved-motion-timing':true}}})).errored;
const count=baseline[filename][key];
process.stdout.write(JSON.stringify([
 await lint('.x{'+declaration+'}'),
 await lint('.x{'+declaration.repeat(count+1)+'}'),
 await lint('.x{'+declaration.replace(/\\d+(?:\\.\\d+)?(?:ms|s)/,'987ms')+'}')
]));
`;
  const run = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', check],
    { cwd: root, encoding: 'utf8' }
  );
  expect(run.status).toBe(0);
  expect(JSON.parse(run.stdout)).toEqual([false, true, true]);
});

test('the baseline cannot retain removed timing exemptions', () => {
  const run = spawnSync(
    process.execPath,
    ['scripts/prune-motion-baseline.mjs'],
    { cwd: root, encoding: 'utf8' }
  );
  expect(run.stderr).toBe('');
  expect(run.status).toBe(0);
});
