/** @jest-environment node */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { extractSourceMetadata } from '../source-metadata';

let outputDir;
beforeEach(async () => {
  outputDir = await fs.mkdtemp(
    path.join(os.tmpdir(), 'metadata-extract-test-')
  );
});
afterEach(async () => {
  await fs.rm(outputDir, { recursive: true, force: true });
});

it('refuses to overwrite a built Storybook site before loading presets', async () => {
  await fs.writeFile(path.join(outputDir, 'iframe.html'), 'existing site');
  const loadPresets = jest.fn();
  await expect(
    extractSourceMetadata({ outputDir, loadPresets })
  ).rejects.toThrow('Refusing source extraction');
  expect(loadPresets).not.toHaveBeenCalled();
  expect(await fs.readFile(path.join(outputDir, 'iframe.html'), 'utf8')).toBe(
    'existing site'
  );
});

it('fails without writing partial metadata when the extraction engine returns no components', async () => {
  const apply = jest.fn(async key =>
    key === 'storyIndexGenerator'
      ? { getIndex: async () => ({ v: 5, entries: {} }) }
      : { components: { v: 0, components: {} } }
  );
  await expect(
    extractSourceMetadata({
      outputDir,
      loadPresets: async () => ({ presets: { apply } }),
    })
  ).rejects.toThrow('no component metadata');
  expect(await fs.readdir(outputDir)).toEqual([]);
  expect(apply).toHaveBeenLastCalledWith(
    'experimental_manifests',
    {},
    { manifestEntries: [], watch: false }
  );
});

it('validates serialized preset metadata without inventing optional fields or dropping extensions', async () => {
  const component = {
    id: 'example',
    name: 'Example',
    path: './Example.stories.jsx',
    description: undefined,
    upstreamExtension: { retained: true },
  };
  const index = {
    v: 5,
    entries: {
      story: { id: 'example--story', tags: ['manifest'] },
      excluded: { id: 'quality--story', tags: [] },
    },
  };
  const metadata = { v: 0, components: { example: component } };
  const apply = jest.fn(async key =>
    key === 'storyIndexGenerator'
      ? { getIndex: async () => index }
      : { components: metadata }
  );
  await extractSourceMetadata({
    outputDir,
    loadPresets: async () => ({
      configType: 'DEVELOPMENT',
      presets: { apply },
    }),
  });
  const result = JSON.parse(
    await fs.readFile(path.join(outputDir, 'manifests/components.json'), 'utf8')
  );
  expect(result.components.example).toEqual({
    id: 'example',
    name: 'Example',
    path: './Example.stories.jsx',
    upstreamExtension: { retained: true },
  });
  expect(
    JSON.parse(await fs.readFile(path.join(outputDir, 'index.json'), 'utf8'))
  ).toEqual(index);
  expect(apply).toHaveBeenLastCalledWith(
    'experimental_manifests',
    {},
    { manifestEntries: [index.entries.story], watch: false }
  );
});

it('requires fresh output rather than leave stale generated component files', async () => {
  await fs.mkdir(path.join(outputDir, 'ai-components'));
  const old = path.join(outputDir, 'ai-components', 'removed-component.json');
  await fs.writeFile(old, 'existing output');
  const loadPresets = jest.fn();
  await expect(
    extractSourceMetadata({ outputDir, loadPresets })
  ).rejects.toThrow('fresh output directory');
  expect(loadPresets).not.toHaveBeenCalled();
  expect(await fs.readFile(old, 'utf8')).toBe('existing output');
});

const extracting = extraManifests => ({
  presets: {
    apply: async key =>
      key === 'storyIndexGenerator'
        ? { getIndex: async () => ({ v: 5, entries: {} }) }
        : {
            components: {
              v: 0,
              components: {
                example: {
                  id: 'example',
                  name: 'Example',
                  path: './Example.stories.jsx',
                },
              },
            },
            ...extraManifests,
          },
  },
});

it('does not overwrite a directory populated during asynchronous extraction', async () => {
  const sentinel = path.join(outputDir, 'index.json');
  await expect(
    extractSourceMetadata({
      outputDir,
      loadPresets: async () => {
        await fs.writeFile(sentinel, 'created during extraction');
        return extracting();
      },
    })
  ).rejects.toThrow('fresh output directory');
  expect(await fs.readFile(sentinel, 'utf8')).toBe('created during extraction');
  expect(await fs.readdir(outputDir)).toEqual(['index.json']);
});

it('rejects symlink destinations without touching their targets', async () => {
  const link = `${outputDir}-link`;
  await fs.symlink(outputDir, link, 'dir');
  try {
    const loadPresets = jest.fn();
    await expect(
      extractSourceMetadata({ outputDir: link, loadPresets })
    ).rejects.toThrow('real directory');
    expect(loadPresets).not.toHaveBeenCalled();
    expect(await fs.readdir(outputDir)).toEqual([]);
  } finally {
    await fs.unlink(link);
  }
});

it.each([
  '../../escaped',
  '../escaped',
  'nested/name',
  'nested\\name',
  'bad:name',
])(
  'rejects unsafe manifest name %s before publishing any files',
  async name => {
    await expect(
      extractSourceMetadata({
        outputDir,
        loadPresets: async () => extracting({ [name]: {} }),
      })
    ).rejects.toThrow('Unsupported source manifest name');
    expect(await fs.readdir(outputDir)).toEqual([]);
  }
);

it('does not leave partial metadata when another manifest cannot be serialized', async () => {
  await expect(
    extractSourceMetadata({
      outputDir,
      loadPresets: async () => extracting({ unsupported: 1n }),
    })
  ).rejects.toThrow('BigInt');
  expect(await fs.readdir(outputDir)).toEqual([]);
});

it('publishes only one complete extraction when two writers choose the same output', async () => {
  let loaded = 0;
  let release;
  const bothLoaded = new Promise(resolve => {
    release = resolve;
  });
  const loadPresets = async () => {
    loaded += 1;
    if (loaded === 2) release();
    await bothLoaded;
    return extracting();
  };
  const results = await Promise.allSettled([
    extractSourceMetadata({ outputDir, loadPresets }),
    extractSourceMetadata({ outputDir, loadPresets }),
  ]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(
    1
  );
  expect(results.filter(result => result.status === 'rejected')).toHaveLength(
    1
  );
  expect(await fs.readdir(outputDir)).toEqual(
    expect.arrayContaining([
      'index.json',
      'manifests',
      'source-extraction.json',
    ])
  );
  expect(
    JSON.parse(
      await fs.readFile(
        path.join(outputDir, 'manifests/components.json'),
        'utf8'
      )
    ).components.example.name
  ).toBe('Example');
});

it('cleans private staging and leaves output unchanged when a file write fails', async () => {
  const parent = path.dirname(outputDir);
  const before = await fs.readdir(parent);
  const writeFile = fs.writeFile;
  const failingWrite = jest
    .spyOn(fs, 'writeFile')
    .mockImplementation(async (filename, ...args) => {
      if (
        filename.includes('.manifest-source-') &&
        filename.endsWith('/manifests/components.json')
      ) {
        throw new Error('simulated disk failure');
      }
      return writeFile(filename, ...args);
    });
  try {
    await expect(
      extractSourceMetadata({
        outputDir,
        loadPresets: async () => extracting(),
      })
    ).rejects.toThrow('simulated disk failure');
  } finally {
    failingWrite.mockRestore();
  }
  expect(await fs.readdir(outputDir)).toEqual([]);
  expect(
    (await fs.readdir(parent)).filter(
      name => name.startsWith('.manifest-source-') && !before.includes(name)
    )
  ).toEqual([]);
});
