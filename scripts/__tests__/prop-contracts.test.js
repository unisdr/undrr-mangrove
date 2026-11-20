/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  checkContracts,
  compareContracts,
  draftJsDocParams,
  isUntyped,
  jsDocType,
  readBuiltContracts,
} from '../lib/prop-contracts.js';

describe('jsDocType', () => {
  test.each([
    [{ name: 'string' }, 'string'],
    [{ name: 'bool' }, 'boolean'],
    [{ name: 'func' }, 'Function'],
    [{ name: 'node' }, 'React.ReactNode'],
    [{ name: 'element' }, 'React.ReactElement'],
    [{ name: 'custom', raw: 'validator' }, '*'],
    [
      {
        name: 'enum',
        value: [
          { value: "'sm'", computed: false },
          { value: "'lg'", computed: false },
        ],
      },
      "'sm'|'lg'",
    ],
    [{ name: 'enum', value: 'Object.keys(sizes)', computed: true }, 'string'],
    [
      { name: 'enum', value: [{ value: 'SIZES.sm', computed: true }] },
      'string',
    ],
    [
      { name: 'union', value: [{ name: 'string' }, { name: 'number' }] },
      'string|number',
    ],
    [{ name: 'arrayOf', value: { name: 'string' } }, 'Array<string>'],
    [{ name: 'objectOf', value: { name: 'number' } }, 'Object<string, number>'],
    [{ name: 'instanceOf', value: 'Date' }, 'Date'],
    [
      {
        name: 'arrayOf',
        value: {
          name: 'shape',
          value: {
            label: { name: 'node', required: true },
            href: { name: 'string', required: false },
          },
        },
      },
      'Array<{label: React.ReactNode, href?: string}>',
    ],
  ])('%j becomes %s', (type, expected) => {
    expect(jsDocType(type)).toBe(expected);
  });
});

describe('draftJsDocParams', () => {
  test('maps isRequired, defaults and descriptions to @param lines', () => {
    const draft = draftJsDocParams({
      props: {
        name: {
          type: { name: 'string' },
          required: true,
          description: 'Icon\n  name',
        },
        size: {
          type: {
            name: 'enum',
            value: [{ value: "'sm'" }, { value: "'lg'" }],
          },
          required: false,
          defaultValue: { value: "'sm'", computed: false },
          description: '',
        },
        extra: { required: false, defaultValue: { value: 'false' } },
      },
    });
    expect(draft.split('\n')).toEqual([
      ' * @param {Object} props',
      ' * @param {string} props.name           Icon name',
      " * @param {'sm'|'lg'} [props.size='sm']",
      ' * @param {*} [props.extra=false]',
    ]);
  });
});

describe('isUntyped', () => {
  test.each([
    ['any', true],
    ['any[]', true],
    ['never[]', true],
    ['unknown', true],
    ['{}', true],
    ['null', true],
    ['', true],
    ['string', false],
    ['enum', false],
    ['string | null | undefined', false],
    ['{ id: string; }[]', false],
    ['any | undefined', true],
    ['ReactElement<any, string | JSXElementConstructor<any>>', false],
    ['ReactNode', false],
  ])('%s -> %s', (name, expected) => {
    expect(isUntyped({ name })).toBe(expected);
  });
});

describe('compareContracts', () => {
  const propTypes = {
    label: { type: { name: 'string' }, required: true },
    size: { type: { name: 'enum', value: [] }, required: false },
    anything: { type: { name: 'any' }, required: false },
    // Found through a destructured default only: not a PropTypes prop.
    rest: { required: false, defaultValue: { value: '{}' } },
  };

  test('agreeing contracts have no problems', () => {
    expect(
      compareContracts(
        {
          label: { required: true, type: { name: 'string' } },
          size: { required: false, type: { name: 'enum' } },
          anything: { required: false, type: { name: 'any' } },
        },
        propTypes
      )
    ).toEqual([]);
  });

  test('reports names, optionality and missing types', () => {
    expect(
      compareContracts(
        {
          label: { required: false, type: { name: 'string' } },
          size: { required: true, type: { name: 'any' } },
          toString: { required: false, type: { name: '() => string' } },
        },
        propTypes
      )
    ).toEqual([
      'anything: in PropTypes, missing from the docgen server',
      'label: docgen server says optional, PropTypes say required',
      'size: docgen server says required, PropTypes say optional',
      'size: docgen server type is `any`, PropTypes give `string`',
      'toString: documented by the docgen server, not in PropTypes',
    ]);
  });
});

describe('checkContracts', () => {
  const contracts = [
    {
      id: 'a',
      serverProps: { x: { required: true, type: { name: 'any' } } },
      propTypes: { x: { type: { name: 'string' }, required: false } },
    },
    {
      id: 'b',
      serverProps: { x: { required: false, type: { name: 'string' } } },
      propTypes: { x: { type: { name: 'string' }, required: false } },
    },
    { id: 'c', serverProps: {}, propTypes: undefined },
    {
      id: 'd',
      serverError: { name: 'No component found', message: 'long' },
      propTypes: { x: { type: { name: 'string' } } },
    },
  ];

  test('reports every component with PropTypes and fails only enforced ones', () => {
    const { reports, failures, unknown } = checkContracts(contracts, ['b']);
    expect(reports.map(report => report.id)).toEqual(['a', 'b', 'd']);
    expect(reports[2].problems).toEqual([
      'docgen server could not read the component (No component found)',
    ]);
    expect(failures).toEqual([]);
    expect(unknown).toEqual([]);
  });

  test('an enforced component that disagrees fails', () => {
    const { failures } = checkContracts(contracts, ['a', 'b']);
    expect(failures.map(failure => failure.id)).toEqual(['a']);
  });

  test('an enforced id that is not a built component is flagged', () => {
    expect(checkContracts(contracts, ['c', 'typo']).unknown).toEqual([
      'c',
      'typo',
    ]);
  });
});

describe('readBuiltContracts', () => {
  let dir;
  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-contracts-'));
    const docgen = path.join(dir, 'services', 'core', 'docgen');
    fs.mkdirSync(docgen, { recursive: true });
    fs.writeFileSync(
      path.join(docgen, 'demo.json'),
      JSON.stringify({
        components: {
          demo: {
            name: 'Demo',
            path: './Demo.stories.jsx',
            reactComponentMeta: {
              filePath: './Demo.jsx',
              exportName: 'Demo',
              props: { x: { required: false, type: { name: 'string' } } },
            },
          },
          broken: { path: './Broken.stories.jsx', error: { name: 'Oops' } },
        },
      })
    );
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  test('pairs docgen server props with PropTypes from the same file', () => {
    const readDocgen = jest.fn((file, names) =>
      names.includes('Demo')
        ? { props: { x: { type: { name: 'string' } } } }
        : undefined
    );
    const resolveComponent = jest.fn(() => undefined);
    const contracts = readBuiltContracts(dir, { readDocgen, resolveComponent });
    expect(readDocgen).toHaveBeenCalledWith('./Demo.jsx', [
      'Demo',
      undefined,
      'Demo',
    ]);
    expect(resolveComponent).toHaveBeenCalledWith('./Broken.stories.jsx');
    expect(contracts).toEqual([
      expect.objectContaining({
        id: 'demo',
        serverProps: { x: { required: false, type: { name: 'string' } } },
        propTypes: { x: { type: { name: 'string' } } },
      }),
      expect.objectContaining({
        id: 'broken',
        serverError: { name: 'Oops' },
        propTypes: undefined,
      }),
    ]);
  });

  test('explains a missing build', () => {
    expect(() => readBuiltContracts(path.join(dir, 'nope'))).toThrow(
      /Run the Storybook build first/
    );
  });
});
