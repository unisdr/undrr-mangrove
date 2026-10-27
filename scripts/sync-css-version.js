#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const packagePath = path.join(rootDir, 'package.json');
const variablesPath = path.join(
  rootDir,
  'stories',
  'assets',
  'scss',
  '_variables.scss'
);
const { version } = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const source = fs.readFileSync(variablesPath, 'utf8');
const marker = / \* Version: [^\r\n]+/;

if (!marker.test(source)) {
  throw new Error(`CSS version marker not found in ${variablesPath}`);
}

const updated = source.replace(marker, ` * Version: ${version}`);

if (updated !== source) {
  fs.writeFileSync(variablesPath, updated, 'utf8');
  console.log(`Synchronized compiled CSS banner to Mangrove ${version}`);
}
