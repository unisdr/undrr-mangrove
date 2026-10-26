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
