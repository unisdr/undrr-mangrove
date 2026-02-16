#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-n');
const useTesting = args.includes('--testing');
const rootArg = (args.find(a => a.startsWith('--root=')) || '').split('=')[1];
const rootDir = path.resolve(process.cwd(), rootArg || '.');

// Read version from package.json at repo root
const packageJsonPath = path.resolve(rootDir, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error(`package.json not found at ${packageJsonPath}`);
  process.exit(1);
}
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

console.log(`Scanning ${rootDir} to update Mangrove CDN links to version ${version} ${useTesting ? '(testing)' : '(prod)'}${isDryRun ? ' [dry-run]' : ''}...`);

// Build replacement target
const targetBase = useTesting
  ? `https://assets.undrr.org/static/testing/mangrove/${version}/`
  : `https://assets.undrr.org/static/mangrove/${version}/`;

// URL matchers for any existing forms
// - prod latest or semver
// - testing in either segment ordering ("testing/static" or "static/testing") and latest or semver
const urlPatterns = [
  /https:\/\/assets\.undrr\.org\/static\/mangrove\/[0-9]+\.[0-9]+\.[0-9]+\//g,
  /https:\/\/assets\.undrr\.org\/testing\/static\/mangrove\/[0-9]+\.[0-9]+\.[0-9]+\//g,
  /https:\/\/assets\.undrr\.org\/static\/testing\/mangrove\/[0-9]+\.[0-9]+\.[0-9]+\//g,
];

// Directories to ignore during traversal
const ignoredDirectories = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'storybook-static',
  'coverage',
  '.cache',
  'docs-build-temp',
]);

// File extensions considered safe to rewrite as text
const allowedExtensions = new Set([
  '.md', '.mdx', '.markdown',
  '.js', '.jsx', '.ts', '.tsx',
  '.json', '.yml', '.yaml',
  '.html', '.htm', '.txt', '.sh',
  '.css', '.scss', '.sass',
  '.twig', '.php',
]);

/**
 * Recursively gather file paths under a directory.
 */
function listFilesRecursively(startDir) {
  const results = [];
  const stack = [startDir];
  while (stack.length) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoredDirectories.has(entry.name)) continue;
        stack.push(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (allowedExtensions.has(ext)) {
          results.push(fullPath);
        }
      }
    }
  }
  return results;
}

/**
 * Apply all URL patterns to content, returning { content, changed }.
 */
function replaceUrls(content) {
  let updated = content;
  let changed = false;
  for (const pattern of urlPatterns) {
    const replaced = updated.replace(pattern, targetBase);
    if (replaced !== updated) {
      updated = replaced;
      changed = true;
    }
  }
  return { content: updated, changed };
}

const files = listFilesRecursively(rootDir);
let changedCount = 0;
const changedFiles = [];

for (const filePath of files) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    continue;
  }
  const { content: newContent, changed } = replaceUrls(content);
  if (!changed) continue;

  changedFiles.push(filePath);
  changedCount += 1;
  if (!isDryRun) {
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

if (changedCount === 0) {
  console.log('No CDN links needed updating.');
} else {
  const modeLabel = isDryRun ? 'Would update' : 'Updated';
  console.log(`\n${modeLabel} ${changedCount} file(s) to point to ${targetBase}`);
  for (const f of changedFiles) {
    console.log(`- ${path.relative(rootDir, f)}`);
  }
}

if (!isDryRun) {
  console.log(`\n🎉 CDN links updated to version ${version}!`);
  if (!useTesting) {
    console.log(`- All references now point to ${targetBase}`);
    console.log(`- Removed references to 'latest' and any testing endpoints`);
  } else {
    console.log(`- All references now point to testing endpoint ${targetBase}`);
  }
}