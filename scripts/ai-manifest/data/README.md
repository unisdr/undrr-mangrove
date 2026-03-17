# AI manifest data

Curated data consumed by `scripts/generate-ai-manifest.js` to produce
the AI-friendly component manifest deployed alongside Storybook.

| File | Purpose |
|------|---------|
| `constants.js` | Asset URLs, required scripts, logo paths, reusable HTML snippets |
| `css-utilities.js` | CSS utility class inventory (~161 classes) |
| `component-data/` | Per-component metadata: descriptions, flags, CSS classes, curated HTML |

See [`scripts/README.md`](../README.md) for the full pipeline diagram,
entry schema, and maintenance instructions.
