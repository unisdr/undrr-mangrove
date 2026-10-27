import React from 'react';
import { LandingPage } from './LandingPages';
import '../_shared/pattern-demo.scss';

export default {
  id: 'patterns-landing-pages',
  title: 'Patterns/Content/Landing page/Full page/Topic or initiative',
  component: LandingPage,
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

export const TopicLanding = {
  name: 'Topic or initiative',
  args: { archetype: 'topic' },
};
