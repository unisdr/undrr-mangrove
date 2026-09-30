/**
 * repo.js — Canonical source-repository URLs for the AI manifest pipeline.
 *
 * Kept in one place so a change of code host touches a single file.
 */

export const REPO_URL = 'https://github.com/unisdr/undrr-mangrove';

/**
 * The PreventionWeb fork, kept in sync with unisdr/undrr-mangrove.
 *
 * The unisdr organization is flagged on GitHub, so its pages return 404 to
 * anonymous readers, AI tools included. The fork is publicly
 * readable and is where CI and deploys run, so every link a reader or
 * an agent is expected to follow points here instead. REPO_URL stays the
 * canonical `repository` value in machine-readable metadata.
 */
export const PUBLIC_REPO_URL =
  'https://github.com/PreventionWeb/undrr-mangrove';

/** Base for a readable link to a file on the default branch; append a repo path. */
export const PUBLIC_REPO_BLOB_MAIN = `${PUBLIC_REPO_URL}/blob/main/`;

/** Base for the raw contents of a file on the default branch; append a repo path. */
export const PUBLIC_REPO_RAW_MAIN =
  'https://raw.githubusercontent.com/PreventionWeb/undrr-mangrove/main/';

/** Where readers report a problem with a component or a guide. */
export const PUBLIC_ISSUES_URL = `${PUBLIC_REPO_URL}/issues`;

/**
 * Pull requests, issues, tags and GitHub Releases live on unisdr/undrr-mangrove
 * only. A fork does not copy them: the fork's /pull/<n> redirects to an
 * unrelated issue number or a 404, and its tags and releases lag behind. So a
 * link into the flagged organization has no public equivalent to rewrite to.
 */
const PRIVATE_GITHUB = /https:\/\/github\.com\/unisdr\/([\w.-]+)/;

const PRIVATE_URL = new RegExp(`${PRIVATE_GITHUB.source}([^\\s)>\\]"'\\\\]*)`);

/**
 * The plain-text reference for a pull request or issue URL on the unisdr
 * organization (`unisdr/undrr-mangrove#1234`), or null for any other URL.
 */
export function privateGithubRef(url) {
  const match = String(url || '').match(
    new RegExp(`^${PRIVATE_GITHUB.source}/(?:pull|issues)/(\\d+)`)
  );
  return match ? `unisdr/${match[1]}#${match[2]}` : null;
}

/**
 * Rewrite markdown bound for a published manifest so it links nothing on the
 * unisdr organization, which anonymous readers and AI tools get a 404 from.
 *
 * - File links on the default branch move to the public fork.
 * - Pull request and issue links become plain `unisdr/<repo>#<n>` references:
 *   still precise, but nothing to follow to a 404 or to the wrong fork item.
 * - Any other link (a release, tag, comparison) keeps its text and loses the URL.
 */
export function toPublicMarkdown(text) {
  if (typeof text !== 'string' || !text.includes('github.com/unisdr/')) {
    return text;
  }

  const fileLink = new RegExp(
    `${PRIVATE_GITHUB.source}/(blob|tree|raw)/main/`,
    'g'
  );
  const markdownLink = new RegExp(
    `\\[([^\\]]*)\\]\\((${PRIVATE_URL.source})\\)`,
    'g'
  );
  const angleLink = new RegExp(`<(${PRIVATE_URL.source})>`, 'g');
  const bareUrl = new RegExp(PRIVATE_URL.source, 'g');

  const describe = url =>
    privateGithubRef(url) || url.replace('https://github.com/', '');

  return text
    .replace(fileLink, (whole, repo, kind) =>
      repo === 'undrr-mangrove' ? `${PUBLIC_REPO_URL}/${kind}/main/` : whole
    )
    .replace(markdownLink, (whole, label, url) => {
      const ref = privateGithubRef(url);
      if (!ref) return label;
      // `[#1247](…)` or `[PR #1247](…)`: qualify the number in place rather
      // than leave a bare `#1247` beside the reference.
      const number = ref.slice(ref.indexOf('#'));
      const inLabel = new RegExp(`(?<![\\w/])${number}(?!\\d)`);
      return inLabel.test(label)
        ? label.replace(inLabel, ref)
        : `${label} (${ref})`;
    })
    .replace(angleLink, (whole, url) => describe(url))
    .replace(bareUrl, url => describe(url));
}

/**
 * Qualify bare `#1234` references in changelog prose as
 * `unisdr/undrr-mangrove#1234`. In CHANGELOG.md and the component changelogs a
 * bare number is a pull request or issue on the repository changes merge to;
 * left bare in a published manifest, a reader or agent on the public fork would
 * resolve it to the fork's unrelated item with the same number.
 *
 * Code spans and markdown links are left alone (a link's label names its own
 * target, such as `[web-backlog #2412](https://gitlab.com/…)`), as is a number
 * after a word with a hyphen or slash, which names some other repository.
 */
export function qualifyBareRefs(text) {
  if (typeof text !== 'string' || !text.includes('#')) return text;

  const slug = REPO_URL.replace('https://github.com/', '');
  const bareRef = /(?<![\w/&#-])#(\d+)(?![\w-])/g;

  return text
    .split(/(`[^`]*`|\[[^\]]*\]\([^)]*\))/)
    .map((part, i) =>
      i % 2 === 1
        ? part
        : part.replace(bareRef, (whole, number, offset) =>
            /[\w.]*[-/][\w.-]*\s+$/.test(part.slice(0, offset))
              ? whole
              : `${slug}#${number}`
          )
    )
    .join('');
}

/**
 * GitHub's anchor for a markdown heading: lower case, punctuation other than
 * hyphens and underscores removed, spaces turned into hyphens.
 */
export function githubHeadingAnchor(heading) {
  return String(heading)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

/**
 * Every URL into the unisdr organization in a generated manifest, other than
 * the `"repository"` identity field (the canonical repository, as package.json
 * and npm provenance name it, not a link a reader is expected to open).
 *
 * Deliberately broader than the links toPublicMarkdown() rewrites: any scheme
 * or none, `www.`, any letter case (GitHub organization names are not case
 * sensitive), raw.githubusercontent.com, api.github.com/repos, gist and a
 * percent-encoded slash, as in a badge's `?url=` parameter. A form the
 * rewriter does not handle fails the build rather than shipping.
 */
export function findPrivateLinks(content) {
  const escapedRepo = REPO_URL.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const identity = new RegExp(
    `"repository":\\s*"${escapedRepo}(?:\\.git)?"`,
    'g'
  );
  const anyPrivateUrl =
    /(?:[a-z][\w+.-]*:(?:\/\/|%2F%2F))?(?:[\w-]+\.)*(?:github\.com|githubusercontent\.com)(?:\/|%2F)(?:repos(?:\/|%2F))?unisdr(?![\w.-])[^\s)>\]"'\\]*/gi;
  return String(content).replace(identity, '').match(anyPrivateUrl) || [];
}
