#!/usr/bin/env node
import fs from 'node:fs';
import YAML from 'yaml';
import { checkDependencyVersions } from './lib/dependency-versions.cjs';

const lock = YAML.parse(
  fs.readFileSync(new URL('../yarn.lock', import.meta.url), 'utf8')
);
const errors = checkDependencyVersions(lock);
if (errors.length) {
  console.error(`Dependency consistency failed:\n${errors.join('\n')}`);
  console.error(
    'Update React/React DOM together and align the Storybook package family. Check nested CLI/addon dependencies too.'
  );
  process.exitCode = 1;
} else {
  console.log(
    'Dependency consistency: React and Storybook versions are aligned.'
  );
}
