/**
 * repo.js — Canonical source-repository URLs for the AI manifest pipeline.
 *
 * Kept in one place so a change of code host touches a single file.
 */

export const REPO_URL = 'https://github.com/unisdr/undrr-mangrove';

/** Base for linking to a file on the default branch; append a repo path. */
export const REPO_BLOB_MAIN = `${REPO_URL}/blob/main/`;
