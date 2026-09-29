/**
 * repo.js — Canonical source-repository URLs for the AI manifest pipeline.
 *
 * Kept in one place so a change of code host touches a single file.
 */

export const REPO_URL = 'https://github.com/unisdr/undrr-mangrove';

/** Base for linking to a file on the default branch; append a repo path. */
export const REPO_BLOB_MAIN = `${REPO_URL}/blob/main/`;

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
