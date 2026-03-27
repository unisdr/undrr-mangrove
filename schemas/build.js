#!/usr/bin/env node

/**
 * Compile schema source modules (*.schema.js) to standalone JSON files.
 *
 * Usage:
 *   node schemas/build.js              Build all schemas
 *   node schemas/build.js --validate   Build and validate with ajv
 */

import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const shouldValidate = process.argv.includes('--validate');

async function main() {
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

  if (shouldValidate) {
    console.log('\nValidating schemas...\n');

    try {
      const Ajv2020 = (await import('ajv/dist/2020.js')).default;
      const addFormats = (await import('ajv-formats')).default;
      const ajv = new Ajv2020({ strict: false, allErrors: true });
      addFormats(ajv);
      // Register custom 'html' format (accepts any string, signals sanitization needed)
      ajv.addFormat('html', true);
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
        'Could not import ajv for validation. Install with: yarn add -D ajv',
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
