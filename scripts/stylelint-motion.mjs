/**
 * Ratchet literal motion timings without rewriting existing component behaviour.
 * The reviewed baseline records exact declarations/mixin calls and counts per
 * file. Removing a legacy declaration is safe; adding or changing one fails.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import stylelint from 'stylelint';

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);
const baseline = JSON.parse(
  fs.readFileSync(
    new URL('./motion-timing-baseline.json', import.meta.url),
    'utf8'
  )
);
export const ruleName = 'mangrove/no-unapproved-motion-timing';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: value =>
    `Use documented motion tokens or a component timing property instead of literal timing in "${value}"`,
});

export function literalTimings(value) {
  // Ignore quoted animation names and comments; inspect var() fallbacks too.
  const plain = value.replace(
    /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\*[\s\S]*?\*\//g,
    ''
  );
  return [
    ...plain.matchAll(/(?<![\w.-])-?(?:\d*\.)?\d+(?:e[+-]?\d+)?(?:ms|s)\b/gi),
  ]
    .map(match => match[0])
    .filter(value => Number.parseFloat(value) !== 0);
}

export function motionEntries(root) {
  const entries = [];
  const add = (node, property, value) => {
    if (!literalTimings(value).length) return;
    // This is an accessibility reset, not an interaction duration. Keep this
    // exception exact: a blanket exemption for reduced-motion would hide bugs.
    if (
      root.source?.input.file?.endsWith(
        '/stories/assets/scss/_foundational.scss'
      ) &&
      /^(animation|transition)-duration$/.test(property) &&
      value.trim() === '0.01ms' &&
      node.important &&
      node.parent?.parent?.name === 'media' &&
      node.parent.parent.params === '(prefers-reduced-motion: reduce)'
    )
      return;
    entries.push({
      node,
      key: `${property}: ${value.replace(/\s+/g, ' ').trim()}`,
    });
  };
  root.walkDecls(
    /^(?:-(?:webkit|moz|o|ms)-)?(?:transition|animation)(?:-duration|-delay)?$/i,
    node => add(node, node.prop.toLowerCase(), node.value)
  );
  root.walkAtRules('include', node => {
    if (
      /^(?:[\w-]+\.)?transition\s*\(/.test(
        node.params.replace(/\/\*[\s\S]*?\*\//g, '')
      )
    )
      add(node, '@include', node.params);
  });
  return entries;
}

const rule = primary => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })
  )
    return;
  const filename = path
    .relative(projectRoot, root.source?.input.file || '')
    .split(path.sep)
    .join('/');
  const allowed = baseline[filename] || {};
  const seen = new Map();
  for (const { node, key } of motionEntries(root)) {
    const count = (seen.get(key) || 0) + 1;
    seen.set(key, count);
    if (count <= (allowed[key] || 0)) continue;
    stylelint.utils.report({
      result,
      ruleName,
      node,
      message: messages.rejected(key),
      word: literalTimings(node.value || node.params)[0],
    });
  }
};
rule.ruleName = ruleName;
rule.messages = messages;
export default stylelint.createPlugin(ruleName, rule);
