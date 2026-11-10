#!/usr/bin/env node

/**
 * Compile schema source modules (*.schema.js) to standalone JSON files.
 *
 * Usage:
 *   node schemas/build.js                Build all schemas
 *   node schemas/build.js --validate     Build and validate with ajv
 *   node schemas/build.js --validate-only  Validate already-compiled JSON in dist/ (no rebuild)
 */

import { readdir, mkdir, writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const shouldValidate = process.argv.includes('--validate');
const validateOnly = process.argv.includes('--validate-only');

/**
 * Validate already-compiled JSON files in dist/ without re-running the build.
 * Used in CI after `yarn build` has already compiled schemas to avoid a double build.
 */
async function runValidateOnly() {
  let files;
  try {
    files = (await readdir(DIST_DIR)).filter((f) => f.endsWith('.schema.json')).sort();
  } catch {
    console.error(`schemas/dist/ not found. Run 'yarn build:schemas' first.`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error('No compiled schema files found in schemas/dist/. Run \'yarn build:schemas\' first.');
    process.exit(1);
  }

  console.log(`Validating ${files.length} compiled schema(s) in dist/...\n`);

  try {
    const { createAjv } = await import('./ajv-setup.js');
    const ajv = createAjv();
    let errors = 0;

    for (const file of files) {
      try {
        const schema = JSON.parse(readFileSync(path.join(DIST_DIR, file), 'utf-8'));
        ajv.compile(schema);
        console.log(`  VALID: ${file}`);
      } catch (err) {
        console.error(`  INVALID: ${file} — ${err.message}`);
        errors++;
      }
    }

    if (errors > 0) {
      console.error(`\n${errors} schema(s) failed validation.`);
      process.exit(1);
    }

    console.log(`\nDone. ${files.length} schema(s) valid.`);
  } catch {
    console.error(
      'Could not load AJV for validation. Ensure devDependencies are installed: yarn install',
    );
    process.exit(1);
  }
}

async function main() {
  if (validateOnly) {
    await runValidateOnly();
    return;
  }

  await mkdir(DIST_DIR, { recursive: true });

  const files = (await readdir(__dirname))
    .filter((f) => f.endsWith('.schema.js'))
    .sort();

  if (files.length === 0) {
    console.error('No schema source files found.');
    process.exit(1);
  }

  console.log(`Building ${files.length} schema(s)...\n`);

  const schemas = [];

  for (const file of files) {
    const mod = await import(path.join(__dirname, file));
    const schema = mod.default;

    if (!schema || !schema.$schema) {
      console.error(`  ERROR: ${file} does not export a valid schema document.`);
      process.exit(1);
    }

    const outName = file.replace('.schema.js', '.schema.json');
    const outPath = path.join(DIST_DIR, outName);
    const json = JSON.stringify(schema, null, 2) + '\n';

    await writeFile(outPath, json, 'utf-8');
    schemas.push({ file, outName, schema });
    console.log(`  ${file} -> dist/${outName}`);
  }

  // Remove stale JSON files that no longer have a corresponding source module.
  const expectedJsonFiles = new Set(schemas.map((s) => s.outName));
  const existingJsonFiles = (await readdir(DIST_DIR)).filter((f) =>
    f.endsWith('.schema.json'),
  );
  for (const staleFile of existingJsonFiles) {
    if (!expectedJsonFiles.has(staleFile)) {
      await unlink(path.join(DIST_DIR, staleFile));
      console.log(`  Removed stale: ${staleFile}`);
    }
  }

  if (shouldValidate) {
    console.log('\nValidating schemas...\n');

    try {
      const { createAjv } = await import('./ajv-setup.js');
      const ajv = createAjv();
      let errors = 0;

      for (const { file, schema } of schemas) {
        try {
          ajv.compile(schema);
          console.log(`  VALID: ${file}`);
        } catch (err) {
          console.error(`  INVALID: ${file} — ${err.message}`);
          errors++;
        }
      }

      if (errors > 0) {
        console.error(`\n${errors} schema(s) failed validation.`);
        process.exit(1);
      }
    } catch {
      console.error(
        'Could not load AJV for validation. Ensure devDependencies are installed: yarn install',
      );
      process.exit(1);
    }
  }

  console.log(`\nDone. ${schemas.length} schema(s) written to schemas/dist/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
