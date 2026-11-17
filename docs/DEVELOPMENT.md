# Development guide

Set up a local checkout to develop Mangrove components and run Storybook.
To use the library in a site, [choose an integration path](../README.md#choose-an-integration-path)
instead.

## Related guides

Use [Contributing](../CONTRIBUTING.md) for contribution rules, the
[component guide](COMPONENT-GUIDE.md) to build a component and the
[testing guide](TESTING.md) to choose checks. The [documentation index](README.md)
links the remaining references.

### Storybook documentation

The published [component standards](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs)
cover code conventions. The [getting started guide](https://mangrove.undrr.org/?path=/docs/getting-started-getting-started-guide--docs)
covers consuming Mangrove rather than developing it.

## Prerequisites

- Node.js 22.12.0 or later; CI and Docker run on Node 26. The repo ships a `.nvmrc` so `nvm use` picks the pinned version. `engines.node` in `package.json` enforces the floor.
- Yarn v4 (enabled via Corepack; version pinned via `packageManager` in `package.json`)
- Docker (optional, for containerized development)
- Git

## Getting started

### Local development

```bash
# Clone the repository
git clone git@github.com:unisdr/undrr-mangrove.git
cd undrr-mangrove

# Select the version pinned in .nvmrc (with nvm installed)
nvm use

# Node 26 does not bundle Corepack; install it to enable Yarn v4
npm install --global corepack@0.36.0
corepack enable

# Install dependencies
yarn install

# Generate tokens, icons and CSS in a fresh checkout
yarn scss

# Start Storybook development server
yarn storybook
```

Open <http://localhost:6006> after Storybook reports that it is ready. You should
see the component sidebar and live examples. For ongoing Sass/token edits, use
`yarn dev` instead; it starts the Sass watcher alongside Storybook. Stop the
foreground command with Ctrl+C and check that the watcher has stopped too.

### API-backed download examples

The **Downloads** stories use the public UNDRR APIs. For local integration testing, the separate **Local Drupal API** story targets `https://undrr.ddev.site`.

First start the sanitized Drupal DDEV deployment in its own checkout. This example requires mkcert and a locally trusted certificate for that hostname. From the Mangrove repository root, start Storybook with the mkcert root certificate and local taxonomy proxy enabled:

```bash
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" \
MANGROVE_LOCAL_API_ORIGIN=https://undrr.ddev.site \
./node_modules/.bin/storybook dev --port 6104 --host 127.0.0.1 --exact-port --ci --no-open
```

Open [Local Drupal API](http://localhost:6104/?path=/story/components-syndicated-search-downloads--local-drupal-api), then choose **Download results**. Search requests go directly to the configured Drupal endpoint; the development server proxies only taxonomy GET requests. A static Storybook server cannot provide that proxy. Endpoint settings are editable in Controls.

Use **Downloads / Fixtures** for deterministic preparing, empty and failure states. The public and local API examples show request errors and leave downloads to manual activation.

### Docker development

For consistent environments or Windows development:

```bash
# Start containers, install dependencies and generate CSS
yarn docker-up
yarn docker-install
docker exec -it undrr-mangrove-client-1 bash -c "yarn scss"

# Start Storybook in the container
docker exec -it undrr-mangrove-client-1 bash -c "yarn storybook --ci"
```

Use <http://localhost:6006> for the container server too. Stop the containers
with `yarn docker-down` when finished. `yarn docker-run` combines startup,
installation and Storybook; run the Sass generation step above first in a fresh
checkout.

## Development workflow

### Branch and commit workflow

- `main` is the primary branch and auto-deploys to GitHub Pages.
- Create short-lived feature branches from `main`.
- No `dev` branch is used.
- Name branches with a conventional prefix plus short kebab-case description:

```
feat/short-description       — new features
fix/short-description        — bug fixes
chore/short-description      — maintenance, deps, CI
docs/short-description       — documentation only
refactor/short-description   — code restructuring
```

Typical flow:

1. Create a branch from `main`.
2. Implement your changes.
3. Complete the [submission checks](../CONTRIBUTING.md#submitting-changes) for the change.
4. Open a PR to `main` with linked issues and passing CI.

### Dependency maintenance

Run `yarn check:dependencies` after dependency updates. It checks for compatible
duplicate React packages, requires React and React DOM to resolve to one matching
version, and checks every locked Storybook framework/addon/CLI package against
the core version. Storybook's independently versioned `global` and `icons`
support packages are exempt. Update each framework family together rather than
leaving older nested copies in the lockfile.

Before retaining a version-specific resolution, check that a dependency still
requests that exact range. Removing an obsolete resolution should leave
`yarn.lock` unchanged under `yarn install --immutable`.

CI builds run independently for each ref. A newer commit cancels the previous
build of that same ref; it does not cancel other PRs or an active Pages
deployment. Only the deployment job shares the `pages` concurrency lock.

The assembled `npm-package/` directory is excluded from Jest's test discovery and
module map. Tests can still read its files explicitly to verify package output.

### Commit message convention

Use conventional commits for readable history and PR-title validation:

- `fix:` - Bug fixes (patch release)
- `feat:` - New features (minor release)
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `test:` - Test additions/changes
- `refactor:` - Code refactoring
- `style:` - Code style changes

Include `BREAKING CHANGE:` in the commit body for major releases.

A local `commit-msg` hook enforces this format. It is installed by `yarn install` (via `prepare` and `core.hooksPath`) or manually with `yarn hooks:install`. The hook also rejects AI-assistant attribution trailers/lines (bot `Co-authored-by`, `Claude-Session:`, and "Generated with …"). Use `--no-verify` only in emergencies.

## Available scripts

### Development commands

```bash
# Start Storybook dev server
yarn dev                  # Sass/token watcher plus Storybook
yarn storybook            # Storybook only; run yarn scss first

# Run tests (see docs/TESTING.md for detailed patterns and coverage requirements)
yarn test                 # Run all tests
yarn test:watch          # Watch mode
yarn test:coverage       # Generate coverage report
yarn test path/to/file   # Test specific file

# Linting
yarn lint:check         # Check without changing source files
yarn lint               # Apply lint fixes
yarn prettier:check     # Check source formatting

# Component-quality audit (correctness, perf, a11y, architecture)
npx -y react-doctor@latest .   # See docs/AI-CODING-AGENTS.md

# Build
yarn build             # Build for production (SCSS + Storybook + webpack)
```

### Docker commands

```bash
# NPM scripts for Docker
yarn docker-run        # Start containers and Storybook
yarn docker-install    # Install dependencies in container
yarn docker-build      # Build in container
yarn docker-watch      # Watch mode in container
yarn docker-lint       # Lint in container

# Make commands
make up               # Start application
make install          # Install dependencies
make run              # Run Storybook
make lint             # Lint codebase
make watch            # Watch for changes
make build            # Build for release
```

## Deploying theme CSS to Drupal

CSS is **not** auto-synced and must be copied manually after each SCSS change. Built JavaScript (`dist/components/*.js`) is copied to the Drupal theme during the Drupal-side build process.

### Child themes

All theme directories live under `docroot/themes/custom/` in the Drupal project. The following child themes consume Mangrove CSS at `css/mangrove/mangrove.css`:

| Theme directory | Site |
|---|---|
| `undrr` | undrr.org (global UNDRR) |
| `pw` | preventionweb.net |
| `mcr` | mcr2030.undrr.org |
| `irp` | IRP |
| `arise` | ARISE |
| `gp` | Global Platform |
| `sfvc` | SFVC |

Other child themes (`iddrr`, `wtad`) and base themes (`base`, `ev_base`, `undrr_common`) exist but do not use Mangrove CSS.

### Workflow

1. Compile SCSS:

   ```bash
   yarn scss
   ```

   This writes compiled CSS to `stories/assets/css/`.

2. Copy the compiled CSS to each applicable child theme:

   ```bash
   cp stories/assets/css/style.css \
     /path/to/docroot/themes/custom/<theme>/css/mangrove/mangrove.css
   ```

   Repeat for each child theme that needs the update. Theme-specific stylesheets (`style-preventionweb.scss`, `style-irp.scss`, `style-mcr.scss`) compile to their own CSS files; copy the matching file to the corresponding theme.

3. Commit the updated `mangrove.css` files in the Drupal repository.

## Component development

See the [component guide](COMPONENT-GUIDE.md) for the step-by-step tutorial and the [component standards](https://mangrove.undrr.org/?path=/docs/contributing-component-standards--docs) in Storybook for code standards (React patterns, BEM, PropTypes, JSDoc, TypeScript, import order).

### TypeScript support

While JSX is the default, TypeScript is fully supported. Path aliases available: `@/*` → `src/*`, `@components/*` → `stories/Components/*`.

## Debugging

### Storybook issues

- Clear `.cache` and `node_modules` if builds fail
- Check browser console for runtime errors
- Use React DevTools for component inspection

### Test failures

- Run tests in watch mode for faster feedback
- Use `--verbose` flag for detailed output
- Check test coverage reports in `coverage/`

### Build problems

- Ensure Node version matches requirements
- Clear Yarn cache: `yarn cache clean`
- Rebuild from scratch: `rm -rf node_modules && yarn install`

## Performance considerations

Use the [testing guide](TESTING.md#performance-testing) to investigate a measured
performance problem. Review the affected component's render work, assets and
bundle size before choosing an optimization.

## Accessibility

Follow the [accessibility requirements](ACCESSIBILITY.md) when authoring a
component and the [review checklist](REVIEW-CHECKLIST.md) before submitting it.
The [testing guide](TESTING.md#accessibility-testing) covers automated and manual
checks.
