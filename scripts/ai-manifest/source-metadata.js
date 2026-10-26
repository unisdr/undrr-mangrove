import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { normalizeComponentMetadata } from './component-metadata.js';

const loadSourcePresets = async configDir => {
  // This is an opt-in research boundary, not a replacement public contract.
  // Both this loader and experimental_manifests remain Storybook internals.
  const { experimental_loadStorybook } =
    await import('storybook/internal/core-server');
  return experimental_loadStorybook({ configDir, ignorePreview: false });
};

/**
 * Extract the configured project's index and metadata from source, without
 * invoking a manager/preview build, starting a server or rendering stories.
 * Existing Storybook presets still own CSF resolution, docgen and snippets.
 */
export const extractSourceMetadata = async ({
  outputDir,
  configDir = path.resolve('.storybook'),
  loadPresets = loadSourcePresets,
}) => {
  const started = performance.now();
  const target = path.resolve(outputDir);
  // Check before loading trusted presets and again before publication: they
  // may take seconds to resolve, during which another process can use target.
  const requireFreshTarget = async () => {
    let stat;
    try {
      stat = await fs.lstat(target);
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(
        `Source extraction output must be a real directory: ${target}`
      );
    }
    const existing = await fs.readdir(target);
    if (existing.includes('iframe.html')) {
      throw new Error(
        `Refusing source extraction into a Storybook site: ${target}`
      );
    }
    if (existing.length) {
      throw new Error(
        `Source extraction requires a fresh output directory: ${target}`
      );
    }
  };
  await requireFreshTarget();
  const { presets, configType } = await loadPresets(path.resolve(configDir));
  const generator = await presets.apply('storyIndexGenerator');
  const index = await generator.getIndex();
  const manifestEntries = Object.values(index.entries).filter(entry =>
    entry.tags?.includes('manifest')
  );
  const manifests = await presets.apply(
    'experimental_manifests',
    {},
    {
      manifestEntries,
      watch: false,
    }
  );
  if (
    !manifests?.components?.components ||
    !Object.keys(manifests.components.components).length
  ) {
    throw new Error(
      'Source extraction produced no component metadata; production input was not changed.'
    );
  }
  // Presets return JS objects with optional undefined fields. Apply the same
  // JSON serialization boundary as Storybook before validating its JSON input.
  manifests.components = normalizeComponentMetadata(
    JSON.parse(JSON.stringify(manifests.components)),
    { source: 'source preset extraction' }
  );
  const receipt = {
    mode: 'source-presets',
    presetConfigType: configType,
    durationMs: Math.round(performance.now() - started),
    indexEntries: Object.keys(index.entries).length,
    manifestEntries: manifestEntries.length,
    components: Object.keys(manifests.components.components).length,
    experimentalApiDependency: true,
    buildsPreview: false,
    buildsManager: false,
  };
  // Validate every filename and serialize every payload before touching the
  // destination. A broken future preset must not escape or partially publish.
  const outputs = new Map([
    ['index.json', JSON.stringify(index, null, 2)],
    ['source-extraction.json', JSON.stringify(receipt, null, 2)],
  ]);
  for (const [name, value] of Object.entries(manifests)) {
    if (!/^[A-Za-z0-9_-]+$/.test(name)) {
      throw new Error(`Unsupported source manifest name: ${name}`);
    }
    const serialized = JSON.stringify(value, null, 2);
    if (serialized === undefined) {
      throw new Error(`Source manifest is not JSON serializable: ${name}`);
    }
    outputs.set(`manifests/${name}.json`, serialized);
  }
  await fs.mkdir(path.dirname(target), { recursive: true });
  const staging = await fs.mkdtemp(
    path.join(path.dirname(target), '.manifest-source-')
  );
  try {
    await fs.mkdir(path.join(staging, 'manifests'));
    for (const [filename, contents] of outputs) {
      await fs.writeFile(path.join(staging, filename), contents, {
        flag: 'wx',
      });
    }
    await requireFreshTarget();
    // Rename publishes a complete extraction. If another writer populated the
    // target since preflight, renaming a directory onto it fails without
    // overwriting its files. Cleanup only ever removes our private staging dir.
    await fs.rename(staging, target);
  } finally {
    await fs.rm(staging, { recursive: true, force: true });
  }
  return receipt;
};
