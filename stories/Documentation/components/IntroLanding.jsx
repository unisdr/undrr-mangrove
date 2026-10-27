import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { IconCard } from '../../Components/Cards/IconCard/IconCard';
import { VerticalCard } from '../../Components/Cards/Card/VerticalCard';
import { Hero } from '../../Components/Hero/Hero';
import ScrollContainer from '../../Components/ScrollContainer/ScrollContainer';
import { TextCta } from '../../Components/TextCta/TextCta';
import { INLINE_CTA_ARGS } from '../../Components/TextCta/_fixtures';

const heroImage =
  'https://www.undrr.org/sites/default/files/2021-04/WiA-childyouthengage.jpg';
import figcaptionImage from '../../assets/images/figcaption.jpg';
import logo from '../../assets/images/undrr-logo-white.svg';
import './intro-landing.css';

const destinations = [
  {
    icon: 'mg-icon mg-icon-graduation-cap',
    title: 'Getting started',
    summaryText:
      'Install Mangrove and choose the integration path that fits your project.',
    kind: 'getting-started-getting-started-guide',
  },
  {
    icon: 'mg-icon mg-icon-lightbulb',
    title: 'Foundations',
    summaryText:
      'Explore the principles, tokens and themes behind every component.',
    kind: 'design-decisions-experience-principles',
  },
  {
    icon: 'mg-icon mg-icon-cubes',
    title: 'Components',
    summaryText:
      'Browse production-ready patterns for content, forms and navigation.',
    kind: 'brand-component-gallery',
  },
  {
    icon: 'mg-icon mg-icon-globe',
    title: 'Platform services',
    summaryText:
      'Connect shared search, content, analytics and critical messaging services.',
    kind: 'platform-services-search-syndication',
  },
  {
    icon: 'mg-icon mg-icon-life-ring',
    title: 'Accessibility',
    summaryText:
      'Build inclusive experiences with our standards, checks and guidance.',
    kind: 'getting-started-accessibility',
  },
  {
    icon: 'mg-icon mg-icon-code-branch',
    title: 'Contributing',
    summaryText:
      'Learn the component workflow and help improve the shared library.',
    kind: 'contributing-build-a-component-step-by-step',
  },
];

function storyNavigation(kind) {
  return event => {
    event.preventDefault();
    linkTo(kind, 'docs')();
  };
}

const componentExamples = [
  {
    title: 'Start building with Mangrove',
    summaryText:
      'Install the library, choose an integration path and build your first theme-aware page.',
    button: 'Read getting started',
    link: '/?path=/docs/getting-started-getting-started-guide--docs',
    target: '_top',
    imgalt: 'A person working in a harvested field',
    imgback: heroImage,
  },
  {
    title: 'Design with shared principles',
    summaryText:
      'Use Mangrove’s experience principles to make interfaces clear, calm and recognizably purposeful.',
    button: 'Explore the principles',
    link: '/?path=/docs/design-decisions-experience-principles--docs',
    target: '_top',
    imgalt: 'People working together outdoors in Bali',
    imgback:
      'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
  },
  {
    title: 'Build editorial card layouts',
    summaryText:
      'Compose meaningful imagery, clear hierarchy, summaries and calls to action in a reusable content pattern.',
    button: 'View card documentation',
    link: '/?path=/docs/components-cards-vertical-card--docs',
    target: '_top',
    imgalt: 'Aerial view of a canal through Almaty, Kazakhstan',
    imgback:
      'https://www.undrr.org/sites/default/files/2023-11/resilient-infrastructure-pikoso-kz-shutterstock.jpg',
  },
  {
    title: 'Explore syndicated search',
    summaryText:
      'See search, filters, results and pagination working together in the library’s most complete integration.',
    button: 'Open the search story',
    link: '/?path=/story/components-syndicated-search--default',
    target: '_top',
    imgalt: 'People walking through terraced rice fields',
    imgback:
      'https://www.undrr.org/sites/default/files/styles/ultrawide_16_6/public/2023-03/Shutterstock_656134321-min.jpg?h=90c64985&itok=ukR7hDqu',
  },
  {
    title: 'Test accessible interactions',
    summaryText:
      'Review keyboard, focus, contrast, reflow and assistive-technology requirements before shipping.',
    button: 'Review accessibility',
    link: '/?path=/docs/getting-started-accessibility--docs',
    target: '_top',
    imgalt: 'People collaborating on disaster risk reduction',
    imgback:
      'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
  },
  {
    title: 'Contribute a component',
    summaryText:
      'Follow the shared structure, documentation, testing and review standards used across Mangrove.',
    button: 'Read component standards',
    link: '/?path=/docs/contributing-component-standards--docs',
    target: '_top',
    imgalt: 'A community landscape illustrating recovery and resilience',
    imgback: figcaptionImage,
  },
];

export function IntroLanding() {
  return (
    <div className="mg-intro">
      <Hero
        data={[
          {
            logo: { src: logo, alt: 'UNDRR' },
            label: 'Component library and design system',
            title: 'Build resilient digital experiences together.',
            summaryText:
              'Mangrove gives UNDRR teams accessible, reusable content patterns while leaving every product free to express its own brand.',
            imgback: heroImage,
            buttons: [
              {
                label: 'Get started',
                onClick: storyNavigation(
                  'getting-started-getting-started-guide'
                ),
              },
              {
                label: 'Browse components',
                type: 'Secondary',
                onClick: storyNavigation('brand-component-gallery'),
              },
            ],
          },
        ]}
        contained
        size="immersive"
      />

      <section
        className="mg-intro__statement mg-grid mg-grid__col-2"
        aria-labelledby="mg-intro-statement"
      >
        <h2 id="mg-intro-statement">
          One shared foundation. Many distinct products.
        </h2>
        <p>
          Cards, heroes, navigation, forms and syndicated content share
          dependable structure. Theme tokens let UNDRR, PreventionWeb, IRP,
          MCR2030 and partner sites keep their own visual identity. Use the
          toolbar above to see that system in action.
        </p>
      </section>

      <section
        className="mg-intro__section"
        aria-labelledby="mg-intro-resources"
      >
        <div className="mg-intro__section-heading">
          <p className="mg-intro__eyebrow">Explore Mangrove</p>
          <h2 id="mg-intro-resources">What’s inside</h2>
        </div>
        <div className="mg-grid mg-grid__col-3">
          {destinations.map(destination => (
            <IconCard
              data={[
                {
                  ...destination,
                  imageScale: 'small',
                  linkText: 'Explore →',
                  onClick: storyNavigation(destination.kind),
                },
              ]}
              key={destination.title}
            />
          ))}
        </div>
      </section>

      <section
        className="mg-intro__section"
        aria-labelledby="mg-intro-showcase"
      >
        <div className="mg-intro__section-heading">
          <p className="mg-intro__eyebrow">Built with Mangrove</p>
          <h2 id="mg-intro-showcase">Components working together</h2>
          <p>
            This page uses the same theme-aware cards, calls to action and
            responsive scroll behavior available to product teams.
          </p>
        </div>
        <ScrollContainer showArrows stretchItems itemWidth="19rem">
          {componentExamples.map(example => (
            <VerticalCard data={[example]} key={example.title} />
          ))}
        </ScrollContainer>
      </section>

      <TextCta {...INLINE_CTA_ARGS} />
    </div>
  );
}
