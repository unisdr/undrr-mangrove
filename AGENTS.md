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
- To reconstruct issues when the list endpoint is suppressed, use the
  repository issue-event feed (`/repos/unisdr/undrr-mangrove/issues/events`),
  which contains an `issue` object with its current state. Follow every page
  advertised in its `Link` header, then deduplicate by issue number and retain
  objects whose `pull_request` is absent and whose `state` is `open`.

State the limitation in any status report. Never say there are no open issues
or pull requests from a suppressed listing response alone.
