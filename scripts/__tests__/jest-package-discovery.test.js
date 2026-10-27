/** @jest-environment node */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import config from '../../jest.config.js';

test('Jest skips package staging without hiding similarly named source fixtures', () => {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'mangrove-jest-discovery-'))
  );
  try {
    const files = [
      'src/__tests__/source.test.js',
      'src/__tests__/fixtures/npm-package/fixture.test.js',
      'npm-package/__tests__/generated.test.js',
    ];
    for (const file of files) {
      const target = path.join(root, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, "test('fixture', () => {});\n");
    }
    for (const file of ['package.json', 'npm-package/package.json']) {
      fs.writeFileSync(
        path.join(root, file),
        JSON.stringify({ name: 'duplicate-package-name' })
      );
    }
    const configFile = path.join(root, 'jest.config.json');
    fs.writeFileSync(
      configFile,
      JSON.stringify({
        rootDir: root,
        testEnvironment: 'node',
        testRegex: config.testRegex,
        testPathIgnorePatterns: config.testPathIgnorePatterns,
        modulePathIgnorePatterns: config.modulePathIgnorePatterns,
        transform: {},
      })
    );
    const cli = path.join(
      path.dirname(require.resolve('jest/package.json')),
      'bin/jest.js'
    );
    const result = spawnSync(
      process.execPath,
      [cli, '--config', configFile, '--listTests', '--runInBand', '--json'],
      { encoding: 'utf8', timeout: 15000 }
    );
    expect(result.status).toBe(0);
    expect(result.stderr).not.toMatch(/module naming collision/i);
    const found = JSON.parse(result.stdout);
    expect(found.sort()).toEqual(
      files
        .slice(0, 2)
        .map(file => path.join(root, file))
        .sort()
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
