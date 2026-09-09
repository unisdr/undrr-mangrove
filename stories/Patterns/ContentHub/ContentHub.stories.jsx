import React from 'react';
import { ContentHub } from './ContentHub';
import './content-hub.scss';

export default {
  title: 'Example/Content hub',
  component: ContentHub,
  parameters: { layout: 'fullscreen' },
  args: { parentNavigation: 'compact', showOnThisPage: true },
  argTypes: {
    parentNavigation: { control: 'inline-radio', options: ['compact', 'full'] },
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

export const BasicLanding = {
  name: 'Basic landing page',
  args: { initialPage: 'landing', parentNavigation: 'full' },
};
export const HubHome = { name: 'Hub home', args: { initialPage: 'overview' } };
export const HubDetail = {
  name: 'Hub detail',
  args: { initialPage: 'how-to-report' },
};
export const DeeperPage = {
  name: 'Deeper page',
  args: { initialPage: 'validate-data' },
};
