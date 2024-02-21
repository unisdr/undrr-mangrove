# Mangrove: the UNDRR component library

[View the component library](https://unisdr.github.io/undrr-mangrove/)

## 🚨 Pre-alpha warning 🚨

This project is under active development and at the moment provides no useful resources. [Internal notes on the project can be seen in the GitLab Wiki](https://git.un.org/undrr/web-backlog/-/wikis/Mangrove:-the-UNDRR-Component-library).

## Purpose

This project stops short of being a full design system and instead focus on providing usable components that are informed by the UNDRR brand guidelines and project styles.

These components offer consistency, documentation and portability to speed quality development with the expected look and feel. These will also help reduce entropy, critical in ensuring websites remain accessible.

If there is a Component or Pattern that you need, or you have any other feedback, question or comment please contact us in the issue queue.

## Development

Run the following commands to create/update the code.

```bash
# checkout the codebase
git clone

# install project dependencies
yarn install

# runs storybook locally
yarn run storybook

# build storybook and sass
yarn run build-storybook

# linting on codebase
yarn run lint
```

## Development via Docker

Run the following commands to create/update the code.

```bash
# checkout the codebase
git clone git@github.com:unisdr/undrr-mangrove.git

cd undrr-mangrove.git

# start the application, runs storybook locally via port 6006
docker-compose up -d

# install project dependencies
docker exec -it undrr-mangrove_client_1 bash -c "yarn install"

# runs storybook locally
docker exec -it undrr-mangrove_client_1 bash -c "yarn run storybook"

# build storybook and sass
docker exec -it undrr-mangrove_client_1 bash -c "yarn build-storybook"

# linting on codebase
docker exec -it undrr-mangrove_client_1 bash -c "yarn run lint"
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

