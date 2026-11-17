/** Compare snapshots created with snapshot-manifest-output.mjs. */
import { compareManifestOutput } from './output-parity.js';

const [baseline, candidate] = process.argv.slice(2);
if (!baseline || !candidate || process.argv.length !== 4) {
  console.error(
    'Usage: node scripts/ai-manifest/compare-manifest-output.mjs BASELINE CANDIDATE'
  );
  process.exit(1);
}
try {
  const { files, differences } = compareManifestOutput(baseline, candidate);
  if (differences.length) {
    console.error(differences.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      `AI output parity passed: ${files} files, including validation diagnostics; only declared generation timestamps ignored.`
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
