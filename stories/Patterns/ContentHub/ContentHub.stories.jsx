import React from 'react';
import { ContentHub } from './ContentHub';
import '../HubHeader/hub-header.scss';
import './content-hub.scss';

export default {
  title: 'Example/Content hub',
  component: ContentHub,
  parameters: { layout: 'fullscreen' },
  args: { showOnThisPage: true, withHero: false, routeCards: 'vertical' },
  argTypes: {
    routeCards: { control: 'inline-radio', options: ['vertical', 'icon'] },
    heroSource: { control: 'inline-radio', options: ['header', 'page'] },
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
  args: { initialPage: 'how-to-report', withHero: true },
};
export const HubDetailWithPageHero = {
  name: 'Hub detail with a separate page hero',
  args: { initialPage: 'how-to-report', withHero: true, heroSource: 'page' },
};
export const HubDetail = {
  name: 'Hub detail',
  args: { initialPage: 'how-to-report' },
};
export const DeeperPage = {
  name: 'Deeper page',
  args: { initialPage: 'validate-data' },
};
export const HubHomeIconRoutes = {
  name: 'Hub home with icon routes',
  args: { initialPage: 'overview', withHero: true, routeCards: 'icon' },
};
