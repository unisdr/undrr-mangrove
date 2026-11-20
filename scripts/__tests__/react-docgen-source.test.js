/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  docblockText,
  readJsDocTags,
  readPropTypesDocgen,
  resolveStoryComponent,
} from '../ai-manifest/react-docgen-source.js';
import { dereferenceComponentMetadata } from '../ai-manifest/component-metadata.js';

const component = `import React from 'react';
import PropTypes from 'prop-types';

/**
 * Short demo card.
 *
 * @param {Object} props
 * @param {'primary'|'secondary'} [props.variant='primary'] Visual variant
 * @param {Array<{value: string}>} [props.items=[]]   Rows to show
 * @returns {JSX.Element} The card
 */
function DemoCardComponent({ variant = 'primary', items = [] }) {
  return <div className={variant}>{items.length}</div>;
}

DemoCardComponent.propTypes = {
  /** Visual variant */
  variant: PropTypes.oneOf(['primary', 'secondary']),
  items: PropTypes.array,
};

export const DemoCard = React.memo(DemoCardComponent);
`;

const story = `import { DemoCard as Card } from './DemoCard';

export default {
  title: 'Components/Demo card',
  component: Card,
};
`;

let dir;
beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-docgen-'));
  fs.writeFileSync(path.join(dir, 'DemoCard.jsx'), component);
  fs.writeFileSync(path.join(dir, 'DemoCard.stories.jsx'), story);
});
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

describe('readJsDocTags', () => {
  test('keeps @param types and strips optional brackets and defaults', () => {
    expect(
      readJsDocTags(
        [
          'Intro.',
          '@param {Object} props',
          "@param {'a'|'b'} [props.kind='a']   Which kind",
          '@param {Array<{v: string}>} [props.rows=[]] Rows',
          '@param {string} props.label Label',
          '  continued here',
          '@deprecated Use something else',
        ].join('\n')
      )
    ).toEqual({
      param: [
        '{Object} props',
        "{'a'|'b'} props.kind Which kind",
        '{Array<{v: string}>} props.rows Rows',
        '{string} props.label Label continued here',
      ],
      deprecated: ['Use something else'],
    });
  });

  test('returns an empty map for missing or tagless docblocks', () => {
    expect(readJsDocTags(undefined)).toEqual({});
    expect(readJsDocTags('Just prose.')).toEqual({});
  });

  test('docblockText returns prose before the first tag', () => {
    expect(docblockText('Prose line.\n\n@param {Object} props')).toBe(
      'Prose line.'
    );
    expect(docblockText('@param {Object} props')).toBeUndefined();
  });
});

describe('readPropTypesDocgen', () => {
  test('reads PropTypes enums and descriptions through React.memo', () => {
    const doc = readPropTypesDocgen(path.join(dir, 'DemoCard.jsx'), [
      'DemoCard',
    ]);
    expect(doc.props.variant).toMatchObject({
      description: 'Visual variant',
      required: false,
      type: { name: 'enum' },
      defaultValue: { value: "'primary'" },
    });
    expect(doc.definedInFile).toBe(path.join(dir, 'DemoCard.jsx'));
    expect(doc).not.toHaveProperty('actualName');
  });

  test('returns undefined for missing files', () => {
    expect(readPropTypesDocgen(path.join(dir, 'Nope.jsx'))).toBeUndefined();
    expect(readPropTypesDocgen(undefined)).toBeUndefined();
  });
});

describe('resolveStoryComponent', () => {
  test('follows an aliased relative import of meta.component', () => {
    expect(
      resolveStoryComponent(path.join(dir, 'DemoCard.stories.jsx'), dir)
    ).toEqual({
      filePath: path.join(dir, 'DemoCard.jsx'),
      names: ['DemoCard', 'Card'],
    });
  });

  test('returns undefined when the story file is missing', () => {
    expect(resolveStoryComponent('./missing.stories.jsx', dir)).toBeUndefined();
  });
});

describe('dereferenceComponentMetadata with Storybook 11 docgen', () => {
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), JSON.stringify(value));
  };

  test('prefers PropTypes docgen over the TypeScript component meta', () => {
    write('services/core/docgen/demo.json', {
      components: {
        demo: {
          id: 'demo',
          name: 'DemoCard',
          path: './DemoCard.stories.jsx',
          jsDocTags: { param: ['props', 'props.variant Visual variant'] },
          reactComponentMeta: {
            exportName: 'DemoCard',
            filePath: path.join(dir, 'DemoCard.jsx'),
            props: { variant: { required: true, type: { name: 'any' } } },
          },
        },
      },
    });
    const out = dereferenceComponentMetadata(
      {
        v: 1,
        components: {
          demo: {
            id: 'demo',
            docgen: {
              $ref: '../services/core/docgen/demo.json#/components/demo',
            },
          },
        },
      },
      { baseDir: path.join(dir, 'manifests') }
    ).components.demo;
    expect(out.reactDocgen.props.variant.type.name).toBe('enum');
    expect(out.reactDocgen.props.variant.required).toBe(false);
    expect(out.jsDocTags.param).toContain(
      "{'primary'|'secondary'} props.variant Visual variant"
    );
  });

  test('documents a component the docgen server could not resolve', () => {
    write('services/core/docgen/unresolved.json', {
      components: {
        unresolved: {
          id: 'unresolved',
          name: 'DemoCard',
          path: './DemoCard.stories.jsx',
          jsDocTags: {},
          error: { name: 'No component import found', message: '...' },
        },
      },
    });
    const out = dereferenceComponentMetadata(
      {
        v: 1,
        components: {
          unresolved: {
            id: 'unresolved',
            docgen: {
              $ref: '../services/core/docgen/unresolved.json#/components/unresolved',
            },
          },
        },
      },
      {
        baseDir: path.join(dir, 'manifests'),
        resolveComponent: storyPath => resolveStoryComponent(storyPath, dir),
      }
    ).components.unresolved;
    expect(out.error).toBeUndefined();
    expect(out.description).toBe('Short demo card.');
    expect(Object.keys(out.reactDocgen.props)).toEqual(['variant', 'items']);
  });

  test('keeps the docgen server data when PropTypes extraction finds nothing', () => {
    write('services/core/docgen/fallback.json', {
      components: {
        fallback: {
          id: 'fallback',
          name: 'Fallback',
          path: './Fallback.stories.jsx',
          reactComponentMeta: {
            exportName: 'Fallback',
            filePath: path.join(dir, 'does-not-exist.jsx'),
            props: { size: { required: false, type: { name: 'string' } } },
          },
        },
      },
    });
    const out = dereferenceComponentMetadata(
      {
        v: 1,
        components: {
          fallback: {
            id: 'fallback',
            docgen: {
              $ref: '../services/core/docgen/fallback.json#/components/fallback',
            },
          },
        },
      },
      { baseDir: path.join(dir, 'manifests') }
    ).components.fallback;
    expect(out.reactDocgen.props.size.type.name).toBe('string');
  });
});
