import React from 'react';
import { CtaButton } from '../Buttons/CtaButton/CtaButton';
import authorImage from '../../assets/images/author.png';

export const scrollCardExamples = [
  {
    image:
      'https://www.undrr.org/sites/default/files/2020-01/Home---about-us_0.jpg',
    alt: 'A person looking across a harvested field',
    title: 'Anticipatory action protects harvests and livelihoods',
    summary:
      'Early financing helps communities act before drought and extreme weather become disasters.',
    action: 'Read the brief',
  },
  {
    image:
      'https://www.undrr.org/sites/default/files/styles/por/public/2022-08/Bali.JPG.jpg',
    alt: 'People working together outdoors in Bali',
    title: 'Financing resilient cities',
    summary:
      'A practical look at how local authorities can align public investment, infrastructure planning and climate adaptation.',
    action: 'Explore the report',
  },
  {
    image:
      'https://www.undrr.org/sites/default/files/styles/por/public/2024-05/Kamal-Kishore_UNDRR-SRSG-C-A.Tardy_min.jpg',
    alt: 'Portrait of UNDRR Special Representative Kamal Kishore',
    title: 'Local knowledge in risk planning',
    summary: 'Community expertise makes risk information more useful.',
    action: 'Meet the experts',
  },
  {
    image: authorImage,
    alt: 'Portrait of a disaster risk reduction leader',
    title: 'Five ways to strengthen early warning systems for everyone',
    summary:
      'From accessible alerts to last-mile communication, these examples show how inclusive design can turn forecasts into action and reach people in time.',
    action: 'View the guidance',
  },
  {
    image:
      'https://www.undrr.org/sites/default/files/styles/por/public/2020-12/2019-01-10_SRSG-Mami-Mizutori-HD_003.jpg',
    alt: 'A disaster risk reduction leader speaking on camera',
    title: 'Risk data that supports better decisions',
    summary:
      'Open standards make evidence easier to compare across borders and over time.',
    action: 'Explore the data',
  },
];

export function ScrollExampleCard({ card, index, showAction = false }) {
  return (
    <article
      className="mg-card mg-card__vc"
      style={{ minWidth: '350px', boxSizing: 'border-box' }}
    >
      <div className="mg-card__visual">
        <img alt={card.alt} className="mg-card__image" src={card.image} />
      </div>
      <div className="mg-card__content">
        <header className="mg-card__title">
          <a href={`#scroll-example-${index + 1}`}>{card.title}</a>
        </header>
        <p className="mg-card__summary">{card.summary}</p>
        {showAction && (
          <CtaButton
            Type="Primary"
            Variant="CTA"
            label={card.action}
            href="https://www.undrr.org"
          />
        )}
      </div>
    </article>
  );
}
