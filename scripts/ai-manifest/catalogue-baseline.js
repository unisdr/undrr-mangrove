/** Summaries and diffs behind catalogue-baseline.mjs; see that file. */
import fs from 'node:fs';
import path from 'node:path';

const skip = new Set([
  'index.json',
  'utilities.json',
  'tokens.json',
  'releases.json',
]);

/** One line per prop: `type | required | default=…` and a description flag. */
export function summariseComponent(detail) {
  const props = Object.fromEntries(
    Object.entries(detail.props ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, prop]) => [
        name,
        [
          prop.type ?? 'unknown',
          prop.required ? 'required' : 'optional',
          prop.default === undefined ? 'no default' : `default=${prop.default}`,
          prop.description ? 'described' : 'undescribed',
        ].join(' | '),
      ])
  );
  return {
    props,
    examples: (detail.examples ?? []).map(example => example.name),
  };
}

export function summariseCatalogue(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(
      `No catalogue at ${directory}. Run "yarn build" (or generate-ai-manifest) first.`
    );
  }
  return Object.fromEntries(
    fs
      .readdirSync(directory)
      .filter(file => file.endsWith('.json') && !skip.has(file))
      .sort()
      .map(file => [
        file.replace(/\.json$/, ''),
        summariseComponent(
          JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'))
        ),
      ])
  );
}

/** Human-readable differences between two summaries; empty when equal. */
export function diffSummaries(expected, actual) {
  const out = [];
  const ids = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const id of [...ids].sort()) {
    const a = expected[id];
    const b = actual[id];
    if (!a) {
      out.push(`+ ${id}: new component`);
      continue;
    }
    if (!b) {
      out.push(`- ${id}: component no longer published`);
      continue;
    }
    const names = new Set([...Object.keys(a.props), ...Object.keys(b.props)]);
    for (const name of [...names].sort()) {
      if (a.props[name] === b.props[name]) continue;
      if (!(name in b.props)) out.push(`- ${id}.${name}: prop removed`);
      else if (!(name in a.props))
        out.push(`+ ${id}.${name}: new prop (${b.props[name]})`);
      else out.push(`~ ${id}.${name}: ${a.props[name]}  ->  ${b.props[name]}`);
    }
    if (JSON.stringify(a.examples) !== JSON.stringify(b.examples))
      out.push(
        `~ ${id} examples: [${a.examples.join(', ')}]  ->  [${b.examples.join(', ')}]`
      );
  }
  return out;
}
