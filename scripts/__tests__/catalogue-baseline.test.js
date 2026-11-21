/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  diffSummaries,
  summariseCatalogue,
  summariseComponent,
} from '../ai-manifest/catalogue-baseline.js';

const detail = {
  props: {
    variant: {
      type: "'primary' | 'secondary'",
      required: false,
      default: "'primary'",
      description: 'Visual variant',
    },
    label: { type: 'string', required: true },
  },
  examples: [{ name: 'Default', code: '<X />' }, { name: 'Small' }],
};

test('summarises each prop and the example names, sorted by prop', () => {
  expect(summariseComponent(detail)).toEqual({
    props: {
      label: 'string | required | no default | undescribed',
      variant:
        "'primary' | 'secondary' | optional | default='primary' | described",
    },
    examples: ['Default', 'Small'],
  });
});

test('reads every component file and skips catalogue-level files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-baseline-'));
  try {
    fs.writeFileSync(
      path.join(dir, 'components-x.json'),
      JSON.stringify(detail)
    );
    fs.writeFileSync(path.join(dir, 'index.json'), '{}');
    fs.writeFileSync(path.join(dir, 'tokens.json'), '{}');
    expect(Object.keys(summariseCatalogue(dir))).toEqual(['components-x']);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('fails clearly when the catalogue has not been generated', () => {
  expect(() => summariseCatalogue('/nonexistent/ai-components')).toThrow(
    /Run "yarn build"/
  );
});

describe('diffSummaries', () => {
  const base = { 'components-x': summariseComponent(detail) };

  test('reports nothing for identical summaries', () => {
    expect(diffSummaries(base, structuredClone(base))).toEqual([]);
  });

  test('reports a weakened type, as the docgen server produced', () => {
    const weaker = structuredClone(base);
    weaker['components-x'].props.variant =
      'any | optional | no default | undescribed';
    expect(diffSummaries(base, weaker)).toEqual([
      "~ components-x.variant: 'primary' | 'secondary' | optional | default='primary' | described  ->  any | optional | no default | undescribed",
    ]);
  });

  test('reports removed and added props, components and examples', () => {
    const changed = structuredClone(base);
    delete changed['components-x'].props.label;
    changed['components-x'].props.size =
      'string | optional | no default | undescribed';
    changed['components-x'].examples = ['Small', 'Default'];
    changed['components-y'] = { props: {}, examples: [] };
    expect(diffSummaries(base, changed)).toEqual([
      '- components-x.label: prop removed',
      '+ components-x.size: new prop (string | optional | no default | undescribed)',
      '~ components-x examples: [Default, Small]  ->  [Small, Default]',
      '+ components-y: new component',
    ]);
    expect(diffSummaries(changed, base)).toContain(
      '- components-y: component no longer published'
    );
  });
});
