import React from 'react';
import { LandingPage } from './LandingPages';
import '../_shared/pattern-demo.scss';

export default {
  id: 'patterns-landing-pages',
  title: 'Patterns/Content/Collection/Full page/Collection index',
  component: LandingPage,
  tags: ['!autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    archetype: { control: false },
    locale: { table: { disable: true } },
    id: { table: { disable: true } },
  },
  render: (args, context) => (
    <LandingPage
      key={`${args.archetype}-${context.globals.locale}`}
      {...args}
      locale={context.globals.locale}
      id={context.id}
    />
  ),
};

export const IndexLanding = {
  name: 'Collection index',
  args: { archetype: 'index' },
};
