/**
 * Guards the package root export against unisdr/undrr-mangrove#1240.
 *
 * `src/index.js` re-exports every publicly importable component. A line of the
 * form `export { default as X } from '…'` binds `undefined` when the source
 * file has no default export, and nothing anywhere reported it: the module
 * still loads, the build still succeeds, and the failure only shows up in a
 * consumer's app as "Element type is invalid". `IconCard` shipped that way.
 *
 * The bug was not the one wrong line, it was that nothing checked. This does.
 *
 * The **repository's** `package.json` maps its own root straight at
 * `src/index.js` with no bundling step, so importing it here is importing
 * exactly what a workspace or repository-URL install resolves to. The first
 * test holds that mapping.
 *
 * This is not the npm surface. The published package has no root entry point
 * at all (unisdr/undrr-mangrove#1252) and ships neither `src/` nor `dist/`;
 * an npm consumer imports `@undrr/undrr-mangrove/components/X.js`, which comes
 * from a webpack entry rather than from this file.
 */

import fs from 'node:fs';
import path from 'node:path';

// Same mocks as CodeBlock's own suite: react-syntax-highlighter ships ESM that
// Jest cannot load, and it is a leaf dependency of one exported component, not
// the thing under test here.
jest.mock('react-syntax-highlighter', () => {
  const PrismLight = () => null;
  PrismLight.registerLanguage = () => {};
  return { PrismLight };
});
jest.mock('react-syntax-highlighter/dist/esm/languages/prism/bash', () => ({}));
jest.mock(
  'react-syntax-highlighter/dist/esm/languages/prism/javascript',
  () => ({})
);
jest.mock('react-syntax-highlighter/dist/esm/languages/prism/jsx', () => ({}));

import * as packageRoot from '../index.js';

const repoRoot = path.resolve(__dirname, '..', '..');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')
);

describe('package root entry point', () => {
  it('is the file this suite imports', () => {
    // If either of these moves, the assertions below stop covering what a
    // consumer actually imports and this suite has to follow.
    expect(packageJson.exports['.']).toBe('./src/index.js');
    expect(packageJson.main).toBe('src/index.js');
  });

  it('exports at least the components the library is known to ship', () => {
    // A floor, so an index.js that accidentally exported nothing would fail
    // rather than pass the "nothing is undefined" test vacuously. It is a
    // floor and nothing more: the suite iterates the bindings that exist, so
    // it cannot fail for a component someone adds and forgets to export here.
    // Catching that needs a check against the component tree, not this file.
    expect(Object.keys(packageRoot).length).toBeGreaterThan(20);
  });
});

describe('every export from the package root', () => {
  const exportNames = Object.keys(packageRoot).sort();

  it.each(exportNames)('%s is defined', name => {
    expect(packageRoot[name]).toBeDefined();
  });

  it('includes IconCard, the export that was undefined', () => {
    // Named explicitly because this is the regression the suite exists for:
    // IconCard.jsx has only a named export, so `export { default as IconCard }`
    // bound undefined.
    expect(packageRoot.IconCard).toBeDefined();
    expect(typeof packageRoot.IconCard).toBe('function');
  });
});
