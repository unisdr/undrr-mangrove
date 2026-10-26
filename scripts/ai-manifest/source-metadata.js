import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

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
  // Never mix this input-only directory with an existing deployable site.
  try {
    await fs.access(path.join(target, 'iframe.html'));
    throw new Error(
      `Refusing source extraction into a Storybook site: ${target}`
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
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
  await fs.mkdir(path.join(target, 'manifests'), { recursive: true });
  await fs.writeFile(
    path.join(target, 'index.json'),
    JSON.stringify(index, null, 2)
  );
  for (const [name, value] of Object.entries(manifests)) {
    await fs.writeFile(
      path.join(target, 'manifests', `${name}.json`),
      JSON.stringify(value, null, 2)
    );
  }
  await fs.writeFile(
    path.join(target, 'source-extraction.json'),
    JSON.stringify(receipt, null, 2)
  );
  return receipt;
};
