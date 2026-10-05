# Reduced maintenance merge review

The existing kit needs occasional updates to variables and styles while preserving asset identity and edited consumers. The proposed merge adds a source-backed maintenance exporter and a standalone plugin, without the full construction and layout workflow. It maintains 520 variables, 102 text definitions, eight effects and five brands. Definition counts do not imply published or rendered acceptance.

The current draft [PR #1319](https://github.com/unisdr/undrr-mangrove/pull/1319) remains the full spike. Its base is `spike/react-aria-surface`, exact commit `f5792a9f1164b262ff5c5fc961395300bc7b17f0`. The [scope decision](https://github.com/unisdr/undrr-mangrove/pull/1319#issuecomment-5993683966) requires reduced review separately. Repository listing/search endpoints are suppressed; verify PR state and base through the exact-number endpoint. GitHub Actions are unavailable.

## Produce the actual diff

From the matching retained source checkout:

```sh
node examples/figma-plugin/dev/prepare-maintenance-review.cjs /tmp/mangrove-maintenance-review
```

The output contains `maintenance-review.patch`, `diff-stat.txt`, `changed-files.txt`, `review-manifest.json` and an isolated `reduced-checkout`. The manifest records the exact source and base commits. The generator reads the cohort manifest and overlay bytes from HEAD, archives the exact base, then stages only the cohort and three base-file edits in a temporary Git index. It does not create a branch, commit, PR or worktree, and does not alter the real index.

The 35 overlay paths are enumerated in [maintenance-merge-scope.json](../maintenance-merge-scope.json); `scripts/build-tokens.cjs` is retained from the base and may produce no changed-file entry. The patch also changes `package.json`, `.gitignore` and workspace peer metadata in `yarn.lock`. No dependency resolutions are added or changed. Do not copy the feature branch's full lockfile or package manifest. The source-backed helper modules retain assets used by existing components; removing them would narrow maintenance coverage.

## Review boundaries

| Included                                                           | Retained outside reduced merge                                            |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| YAML resolver and guarded source-derived helper roles              | Component recipes, construction, layout, Welcome and catalogue generation |
| Shared identity and variable/style importer                        | Connector compiler, capability probes and experimental histories          |
| Standalone UI, inspection and complete import receipts             | Main-component ownership registry and full-builder handback controls      |
| Focused exporter/controller/UI mocks and concise maintenance guide | Native receipts, acceptance preparation tools and broader builder mocks   |

The maintenance plugin never prunes, builds, organises or publishes. Bound foundation changes can affect manually maintained mains. Their ownership policy is managed through the retained full plugin, not the reduced entry. Renames/removals and replacement libraries still require reviewed migrations. Initial kit construction is largely one-off; broad component expansion is frozen.

## Validation and decision record

Run the manifest's verification commands in the isolated checkout. The earlier fresh reduced install used cached archives and new local `node_modules`, with dependency build scripts disabled. It passed generation, freshness, default mocks, 1,328 token tests and lint with zero errors/22 existing warnings. Optional/native builds and empty-cache setup remain unverified. A validation run using shared existing dependencies must be labelled accordingly and cannot replace that fresh-install evidence.

The 5 October preparation produces an actual patch with 38 changed paths, 10,243 insertions and one deletion. Applying it to a separately extracted exact base reproduces every changed path byte-for-byte. Independent generation, freshness and both default mocks pass in the new reduced checkout using a symlink to existing dependencies. This preparation does not repeat or broaden fresh-install acceptance.

Native standalone token import/repeat and published token restoration pass. Deliberately changed styles, exact recovery geometry, composite publication and human novice handoff remain separate. The patch itself is not reviewer acceptance.

Record the reviewer, exact source/base/patch SHA256, accepted paths, requested changes and validation evidence. Confirm whether the residual helper-role size and retained-builder ownership boundary are acceptable. Record whether reviewer policy treats remaining native style/recovery gates as merge blockers. Keep that decision explicit; do not infer it from token publication. Opening another PR or rebasing requires user approval.
