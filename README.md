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

## Compiled assets

We do not yet make the compiled assets available directly; see:
https://gitlab.com/undrr/web-backlog/-/issues/545

## Credit

The base configuration and bootstrapping of this [Storybook](https://storybook.js.org/)-powered library was done based off the [UNDP Design System](https://github.com/undp/design-system), which is MIT licenced, but done with their kind blessing.

## LICENSE

Components and code are MIT licenced. The UNDRR look and feel is proprietary.

