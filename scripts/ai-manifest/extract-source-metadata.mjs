#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { extractSourceMetadata } from './source-metadata.js';

const { values } = parseArgs({
  options: {
    'output-dir': { type: 'string', default: '.cache/manifest-source' },
    'config-dir': { type: 'string', default: '.storybook' },
  },
});
try {
  const receipt = await extractSourceMetadata({
    outputDir: values['output-dir'],
    configDir: values['config-dir'],
  });
  console.log(JSON.stringify(receipt, null, 2));
} catch (error) {
  console.error(`Source metadata extraction failed: ${error.message}`);
  process.exitCode = 1;
}
