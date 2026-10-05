#!/usr/bin/env node
/** Generate/check maintenance data and runtime independently of the full kit. */
'use strict';
try {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check'))
    throw new Error('Use --check or no arguments.');
  require('./build-figma-maintenance-tokens.cjs').main(args);
  require('./build-figma-maintenance-plugin.cjs').main(args);
} catch (error) {
  process.stderr.write(`build-figma-maintenance: ${error.message}\n`);
  process.exitCode = 1;
}
