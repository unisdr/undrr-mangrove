/** Remove obsolete exemptions; never add permission for new literal timings. */
import fs from 'node:fs/promises';
import postcss from 'postcss-scss';
import { motionEntries } from './stylelint-motion.mjs';
const filename = new URL('./motion-timing-baseline.json', import.meta.url);
const baseline = JSON.parse(await fs.readFile(filename, 'utf8'));
const next = {};
for (const [file, allowances] of Object.entries(baseline)) {
  let source;
  try {
    source = await fs.readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  const root = postcss.parse(source, {
    from: new URL(`../${file}`, import.meta.url).pathname,
  });
  const actual = new Map();
  for (const { key } of motionEntries(root))
    actual.set(key, (actual.get(key) || 0) + 1);
  const retained = Object.fromEntries(
    Object.entries(allowances)
      .map(([key, count]) => [key, Math.min(count, actual.get(key) || 0)])
      .filter(([, count]) => count > 0)
  );
  if (Object.keys(retained).length) next[file] = retained;
}
const changed = JSON.stringify(baseline) !== JSON.stringify(next);
if (process.argv.includes('--write')) {
  if (changed)
    await fs.writeFile(filename, `${JSON.stringify(next, null, 2)}\n`);
  console.log(
    changed
      ? 'Removed obsolete motion timing exemptions.'
      : 'Motion baseline is current.'
  );
} else if (changed) {
  console.error(
    'Motion baseline contains obsolete exemptions. Run node scripts/prune-motion-baseline.mjs --write and review the removals.'
  );
  process.exitCode = 1;
} else console.log('Motion baseline contains no obsolete exemptions.');
