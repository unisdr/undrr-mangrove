# Scripts

Utility scripts for the Mangrove project.

| Directory/File | Purpose |
|----------------|---------|
| `ai-manifest/` | AI-friendly component manifest pipeline. Generates llms.txt, component JSON, and CSS utility reference for AI agents. Entry point: `generate-ai-manifest.js`. |
| `update-cdn-version.js` | Updates CDN links in documentation files to the current version from `package.json`. Run after each release. |

See also [`CONTRIBUTING.md`](../CONTRIBUTING.md#ai-manifest-for-component-discovery) for the contributor-facing summary of what to update when components change.
