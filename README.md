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

# build storybook
yarn run build-storybook

# linting on codebase
# WARNING: the linter config will currently make non-helpful changes 
# yarn run lint
```

## Compiled assets

- All the icons/images can be found in the ***docs/images*** directory.
- Fonts: ***docs/fonts***
- CSS directory at: ***docs/css***
- JS directory at: ***docs/js***

## Storybook and File references

| Storybook path  | File path |
| ------------- | ------------- |
| Components/UI components/Cards/Download Card   | stories/Molecules/Blocks/DownloadCard/DownloadCard  |
| Components/UI components/Cards/Publication Card  | stories/Molecules/Blocks/DownloadCard/PublicationCard  |
| Components/UI components/Text/Callout   | stories/Molecules/Text/BlockquoteComponent  |
| Components/UI components/Text/CTA Block  | stories/Molecules/Text/CtaBlock  |
| Components/UI components/Text/Heading Big Block  | stories/Molecules/Text/HeadingBig  |
| Components/UI components/Text/Post Block  | stories/Molecules/Text/Post  |
| Components/UI components/Text/Small Copy Lockup  | stories/Molecules/Text/SmallCopy  |
| Components/UI components/Text/Tertiary Block  | stories/Molecules/Text/Tertiary  |
| Components/UI components/Text/Text Background  | stories/Molecules/Text/TextBackground  |
| Components/UI components/Text/Text Cta  | stories/Molecules/Text/TextCta  |
| Components/UI components/Author Summary  | stories/Organism/Blocks/Authorcard  |
| Patterns/Card grids/Content Cards  | stories/Organism/Blocks/ContentCard  |
| Patterns/Card grids/Content Cards With and Without Image  | stories/Organism/Blocks/ContentCardWithAndWithoutImage  |
| Patterns/Card grids/Featured Cards  | stories/Organism/Blocks/FeaturedContentCard/FeaturedCard  |
| Components/UI components/Pagewide Featured Content Card  | stories/Organism/Blocks/FeaturedContentCard/PagewideContentCard  |
| Patterns/Card grids/Image Reveal Cards  | stories/Organism/Blocks/ImageRevealCards  |
| Components/UI components/Footer  | stories/Organism/Footer  |
| Components/UI components/Stats  | stories/Organism/Stats  |
| Components/UI components/Stats Card Slider  | stories/Organism/Statscardslider  |
| Utilities/Progress Bar Navigation  | stories/Atom/Navigation/ProgressBarNavigation  |

## Credit

The base configuration and bootstrapping of this [Storybook](https://storybook.js.org/)-powered library was done based off the [UNDP Design System](https://github.com/undp/design-system), which is MIT licenced, but done with their kind blessing.

## LICENSE

Components and code are MIT licenced. The UNDRR look and feel is proprietary.

