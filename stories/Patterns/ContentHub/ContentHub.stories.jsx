import React from 'react';
import { ContentHub } from './ContentHub';
import { checkArticleGridGeometry } from '../../Atom/Layout/Grid/gridGeometryChecks';
import '../_shared/pattern-demo.scss';

export default {
  id: 'patterns-content-hub',
  title: 'Patterns/Content/Landing page/Full page/Content hub',
  component: ContentHub,
  parameters: { layout: 'fullscreen' },
  args: { showOnThisPage: true, withHero: false, routeCards: 'icon' },
  argTypes: {
    routeCards: { control: 'inline-radio', options: ['vertical', 'icon'] },
    heroSource: { control: 'inline-radio' },
    pageHeroMedia: { control: 'inline-radio' },
    headerSurface: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'tertiary', 'detached'],
    },
    initialPage: { control: false },
    locale: { table: { disable: true } },
    routePrefix: { table: { disable: true } },
  },
  render: (args, context) => (
    <ContentHub
      key={`${args.initialPage}-${context.globals.locale}`}
      {...args}
      locale={context.globals.locale}
      routePrefix={context.id}
    />
  ),
};

export const HubHome = {
  name: 'Hub home',
  args: { initialPage: 'overview', withHero: true },
};
export const HubDetailWithHero = {
  name: 'Hub detail with a hero',
  play: checkArticleGridGeometry,
  args: { initialPage: 'how-to-report', withHero: true },
};
export const HubDetail = {
  name: 'Hub detail',
  play: checkArticleGridGeometry,
  args: { initialPage: 'how-to-report' },
};
export const DeeperPage = {
  name: 'Deeper page',
  play: checkArticleGridGeometry,
  args: { initialPage: 'validate-data' },
};
export const HubDetailDetachedHeader = {
  name: 'Hub detail with a detached header',
  play: checkArticleGridGeometry,
  args: {
    initialPage: 'how-to-report',
    withHero: true,
    headerSurface: 'detached',
  },
};

// `surface="secondary"` is the one header surface the accent still touches: it
// keeps the theme's own hero colour and wears the Sendai orange as a rule under
// the bar. That rule is the only thing telling it from the default surface, so
// it needs a story a reviewer can actually look at in each theme.
// See docs/COLOUR-CONTRAST-METHODOLOGY.md#the-orange-accent-carries-no-text
export const HubDetailSecondaryHeader = {
  name: 'Hub detail with the secondary header surface',
  play: checkArticleGridGeometry,
  args: {
    initialPage: 'how-to-report',
    withHero: true,
    headerSurface: 'secondary',
  },
};
