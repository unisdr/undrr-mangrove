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
