# AI agents

This project uses AI coding agents. See these guides:

- **[AI coding agent guidelines](docs/AI-CODING-AGENTS.md)** — practical guidance for the gaps between human and AI workflows (review checklist, AI manifest sync, CSS rename gotchas)
- **[Agent prompts](docs/AGENTS.md)** — specialized Claude Code agent prompts for auditing and review
- **[AI and MCP integration](docs/AI-MCP-INTEGRATION.md)** — how the build produces component metadata for external AI agents

## GitHub queue visibility

This GitHub organisation may be flagged in a way that makes normal repository
listing endpoints return an empty array even when issues and pull requests
exist. Do **not** interpret an empty result from `gh issue list`, `gh pr list`,
the REST `/issues` endpoint, GitHub search, or GraphQL issue/pull-request
connections as proof that the queue is empty.

- For pull requests, query the dedicated REST endpoint directly:
  `gh api 'repos/unisdr/undrr-mangrove/pulls?state=open&per_page=100'`.
- For a known issue or pull request, query its exact number directly, for
  example `gh api repos/unisdr/undrr-mangrove/issues/1274`.
- For a complete queue, use a single GraphQL request with aliases for
  `repository.issueOrPullRequest(number: N)`. GraphQL connections are
  suppressed, but exact-number lookups work. Generate aliases from 1 through
  the highest current item number, request `__typename`, `number`, `title`,
  `state`, `url` and `isDraft`, and filter for `state == "OPEN"`. Compare the
  combined open Issue and PullRequest total with
  `gh api repos/unisdr/undrr-mangrove --jq .open_issues_count`; that counter
  includes both types. Recheck the counter after the scan and report a mismatch
  instead of claiming completeness. Inspect GraphQL errors: a missing or
  deleted number must not silently become a closed item. For very large ranges,
  use bounded batches.
- The repository issue-event feed (`/repos/unisdr/undrr-mangrove/issues/events`)
  remains a fallback, but exhaustive event pagination is unnecessary when the
  exact-number GraphQL scan reconciles with the repository counter.

State the limitation in any status report. Never say there are no open issues
or pull requests from a suppressed listing response alone.
