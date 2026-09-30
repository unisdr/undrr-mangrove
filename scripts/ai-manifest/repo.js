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
      return label === ref.slice(ref.indexOf('#')) ? ref : `${label} (${ref})`;
    })
    .replace(angleLink, (whole, url) => describe(url))
    .replace(bareUrl, url => describe(url));
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
 * Every github.com/unisdr URL in a generated manifest, other than the
 * `"repository"` identity field (the canonical repository, as package.json and
 * npm provenance name it, not a link a reader is expected to open).
 */
export function findPrivateLinks(content) {
  const identity = new RegExp(`"repository":\\s*"${REPO_URL}(?:\\.git)?"`, 'g');
  return (
    String(content)
      .replace(identity, '')
      .match(new RegExp(PRIVATE_URL.source, 'g')) || []
  );
}
