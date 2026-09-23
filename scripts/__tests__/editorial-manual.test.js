/** @jest-environment node */

import fs from 'fs';
import path from 'path';
import { buildEditorialManualTxt } from '../ai-manifest/editorial-manual.js';

const DOCS_BASE = 'https://mangrove.undrr.org/';

describe('buildEditorialManualTxt', () => {
  const sample = `# Editorial manual for Mangrove

> Edits to this file show up on both [GitHub](https://example.org) and in [Storybook](https://example.org).

Intro with a [relative link](WRITING.md), an [anchored link](WRITING.md#tone), an [absolute link](https://www.un.org/x.md) and a [same-page link](#keeping-this-updated).
`;

  const output = buildEditorialManualTxt(sample, DOCS_BASE);

  it('replaces the source H1 with its own', () => {
    expect(output.startsWith('# Mangrove editorial manual\n')).toBe(true);
    expect(output).not.toContain('# Editorial manual for Mangrove');
  });

  it('strips the GitHub/Storybook banner', () => {
    expect(output).not.toContain('Edits to this file show up on both');
  });

  it('rewrites relative .md links to GitHub, keeping anchors', () => {
    expect(output).toContain(
      '[relative link](https://github.com/unisdr/undrr-mangrove/blob/main/docs/WRITING.md)'
    );
    expect(output).toContain(
      '[anchored link](https://github.com/unisdr/undrr-mangrove/blob/main/docs/WRITING.md#tone)'
    );
  });

  it('leaves absolute and same-page links alone', () => {
    expect(output).toContain('[absolute link](https://www.un.org/x.md)');
    expect(output).toContain('[same-page link](#keeping-this-updated)');
  });

  it('appends links using the docs base', () => {
    expect(output).toContain(
      `${DOCS_BASE}?path=/docs/contributing-editorial-manual--docs`
    );
    expect(output).toContain(`${DOCS_BASE}llms.txt`);
  });

  it('handles the real docs/EDITORIAL-MANUAL.md', () => {
    const real = fs.readFileSync(
      path.resolve(process.cwd(), 'docs/EDITORIAL-MANUAL.md'),
      'utf8'
    );
    const realOutput = buildEditorialManualTxt(real, DOCS_BASE);

    expect(realOutput).not.toContain('Edits to this file show up on both');
    expect(realOutput).not.toMatch(/# Editorial manual for Mangrove/);
    expect(realOutput).not.toMatch(/\]\((?!https?:|\/|#)[^)\s]+\.md/);
    expect(realOutput).toContain('## Keeping this updated');
  });
});
