# Contributing: issues

This file covers where to file tickets, which template and labels to use, and
how to keep descriptions from reading like AI output.

> **Canonical location:** <https://gitlab.com/undrr/web-backlog/-/wikis/CONTRIBUTING_ISSUES>
> **Last updated:** 2026-03-11
>
> If you're reading this in a project repo, check the wiki for the latest version.

## How to use this

1. Copy this file to your project repo's root directory as
   `CONTRIBUTING_ISSUES.md`.
2. Reference it from your `README.md` and any agent-specific config files
   (see [Adding this to your repo](#adding-this-to-your-repo) at the bottom
   for details).
3. When you want a ticket, point your AI tool at the file:

> Make a ticket for adding a date range filter to the publications listing.
> See CONTRIBUTING_ISSUES.md for the process.

## Creating tickets

Most tickets go in [web-backlog](https://gitlab.com/undrr/web-backlog/-/issues),
the central tracker for the UNDRR Drupal platform, regardless of which repo
you're working in. This includes work originating from GitHub-hosted repos
like [undrr-mangrove](https://github.com/unisdr/undrr-mangrove). Code-specific
bugs can go in the relevant code repo's issue tracker, but when in doubt, use
web-backlog. Issues can be moved later if needed.

The project wiki has the full details on process:

- [Issue management](https://gitlab.com/undrr/web-backlog/-/wikis/process/Issue-management) -- templates, titles, descriptions, workflow, weights, prioritization
- [Issue labels](https://gitlab.com/undrr/web-backlog/-/wikis/process/issue-labels) -- label taxonomy and when to apply each one

### Quick reference

1. [Create a new issue in web-backlog](https://gitlab.com/undrr/web-backlog/-/issues/new)
   using the **Default** template for features, bugs, and content requests.
   Other templates cover deployments, releases, config changes, security
   updates, and dependency work.
2. Titles should describe the outcome, not the implementation. Prefix with the
   area or site when it helps: "PW: Add date filter to publications listing".
3. Every issue needs at least one `workflow::` label, one `priority::` label,
   and relevant descriptive labels (site, feature area, etc.).
4. The issue template has a Planning section -- the project team fills that in
   during triage.

### Minimum labels

If you can't access the wiki for the full label list, these are the safe
defaults that the issue template already applies:

- `workflow::needs-info` -- starting state for new issues
- `type::enhancement` or `bug` -- pick whichever fits
- `priority::medium-urgency` -- adjust if you know better

The full label taxonomy is in the wiki at
[process/issue-labels](https://gitlab.com/undrr/web-backlog/-/wikis/process/issue-labels).
Use it when you can; fall back to the above when you can't.

### Writing style

Ticket descriptions should read like a person wrote them, not like a language
model assembled them. Before posting, check for common AI tells: puffed-up
significance ("serves as a testament"), em dash overuse, rule-of-three
constructions, bold-colon lists, and synonym cycling.

If your AI coding tool has the
[humanizer](https://github.com/blader/humanizer) skill installed, run it on the
ticket text before posting. If not, consider installing it:

```bash
mkdir -p ~/.claude/skills
git clone https://github.com/blader/humanizer.git ~/.claude/skills/humanizer
```

The humanizer catches 24 AI writing patterns documented in Wikipedia's
"Signs of AI writing" guide. In Claude Code it runs as `/humanizer`; the
approach can be adapted for other tools.

## For AI coding assistants

If you're an AI assistant helping create or manage tickets, this section is
for you.

### Accessing the wiki

The wiki pages linked above are not public. You have a few options:

- GitLab MCP server -- if one is configured, fetch wiki pages via the API.
  The [gitlab-mcp](https://github.com/anthonychu/gitlab-mcp) package provides
  this. It needs a GitLab personal access token with `api` scope.
- Local wiki clone -- ask the user where their clone lives. Common
  location: `~/Documents/git/web-backlog.wiki/`. If they don't have one yet:

  ```bash
  git clone git@gitlab.com:undrr/web-backlog.wiki.git
  ```

  If their clone might be stale, suggest `git pull` before reading from it.

### Key wiki files

- `process/Issue-management.md` -- how to write issues, which template to use,
  workflow stages, weights
- `process/issue-labels.md` -- every label with descriptions and when to apply

### Defaults

The default project for tickets is **web-backlog**
(GitLab project ID: `43454458`). The user will say if a ticket belongs
somewhere else.

### Before posting

If you have the [humanizer](https://github.com/blader/humanizer) skill, run it
on the ticket description before posting. If you don't, mention it to the user
and suggest they install it.

### If you can't create issues directly

Some tools (GitHub Copilot, Cursor, etc.) can't call the GitLab API. In that
case, draft the full issue description using the Default template structure,
then give the user the
[new issue URL](https://gitlab.com/undrr/web-backlog/-/issues/new) so they can
paste it in and create it manually.

### When you're stuck

If you can't access the wiki, ask the user. Don't guess at labels or workflow
stages. Use the minimum labels listed above as a fallback.

---

## Adding this to your repo

Details for steps 1 and 2 from the top of this file.

**README reference** -- add something like:

```markdown
For ticket creation guidance, see [CONTRIBUTING_ISSUES.md](CONTRIBUTING_ISSUES.md).
```

**Agent-specific config files** -- add a pointer in whichever of these your
repo uses:

- Claude Code: `CLAUDE.md`
- GitHub Copilot: `.github/copilot-instructions.md`
- Cursor: `.cursor/rules/`
- Other tools: wherever they look for project context

**Checking for staleness** -- compare the "Last updated" date at the top of
your copy against the
[canonical version in the wiki](https://gitlab.com/undrr/web-backlog/-/wikis/CONTRIBUTING_ISSUES).
