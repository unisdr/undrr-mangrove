# Mangrove: the UNDRR component library

[View the component library](https://unisdr.github.io/undrr-mangrove/)

## 🚨 Pre-alpha warning 🚨

This project is under active development and at the moment provides no useful resources. [Internal notes on the project can be seen in the GitLab Wiki](https://git.un.org/undrr/web-backlog/-/wikis/Mangrove:-the-UNDRR-Component-library).

## Purpose

This project stops short of being a full design system and instead focuses on providing usable components that are informed by the UNDRR brand guidelines and project styles.

These components offer consistency, documentation, and portability to speed up quality development with the expected look and feel. They also help reduce entropy, which is critical to ensuring websites remain accessible.

If there is a Component or Pattern that you need, or you have any other feedback, question, or comment, please contact us in the issue queue.

### Assorted technical notes

- **Preact vs React**: After initially planning to use Preact, we've stayed with `react-dom` for using the components in other systems. This ensures that the Storybook and other system runtimes remain similar, avoiding issues with React-only components (e.g. `react-leaflet`).

## Development

You can use the provided `Makefile` to simplify running commands inside Docker containers. Run the following commands to create/update the codebase:

### Makefile Commands:

```bash
# Start the application, runs Storybook locally via port 6006
make up

# Install project dependencies
make install

# Run Storybook locally
make run

# Build Storybook and SASS
make build-storybook

# Lint the codebase
make lint

# Build for release (default mode is production, you can override it with --mode=development)
make build
```

If you prefer running Docker commands manually, the following commands are available

### Manual Docker Commands:

```bash
# Checkout the codebase
git clone git@github.com:unisdr/undrr-mangrove.git

cd undrr-mangrove

# Start the application, runs Storybook locally via port 6006
docker-compose up -d

# Install project dependencies
docker exec -it undrr-mangrove-client-1 bash -c "yarn install"

# Run Storybook locally
docker exec -it undrr-mangrove-client-1 bash -c "yarn run storybook --ci"

# Build Storybook and SASS
docker exec -it undrr-mangrove-client-1 bash -c "yarn run build-storybook"

# Lint the codebase
docker exec -it undrr-mangrove-client-1 bash -c "yarn run lint"

# Build for release (default mode is production)
docker exec -it undrr-mangrove-client-1 bash -c "yarn run build"
```

## Testing

When adding new components, we rely on Jest library to test the library. Jest is a JavaScript testing framework that is easy to use and provides a variety of features for testing React components.

### Creating Tests

To create tests for your component library, you can create files in the `stories/__tests__` folder. Jest will automatically discover and run any files in this folder that end in `.test.js`.

Each test file should contain one or more test cases. A test case is a function that takes two arguments: a test description and a callback function. The callback function is where you will write your test code.

The test code should assert that the component behaves as expected. You can use the Jest assertion library to do this. The Jest assertion library provides a variety of functions for asserting different types of values.

### Running Tests

To run your tests, you can use the following command:

```bash
yarn test
```

To run test coverage report, you can use:

```bash
yarn test:coverage
```

## Compiled assets

We do not yet make the compiled assets available directly; see:
https://gitlab.com/undrr/web-backlog/-/issues/545

## Credit

The base configuration and bootstrapping of this [Storybook](https://storybook.js.org/)-powered library was done based off the [UNDP Design System](https://github.com/undp/design-system), which is MIT licenced, but done with their kind blessing.

## LICENSE

Components and code are MIT licenced. The UNDRR look and feel is proprietary.
