import React from 'react';
import { linkTo } from '@storybook/addon-links';
import { useGlobals } from '@storybook/preview-api';

/**
 * A card that navigates to a target story and updates a Storybook global,
 * for use in the brand guide overview page.
 *
 * Uses linkTo() and useGlobals() instead of <a href> to avoid navigating
 * the preview iframe directly — which strips the Storybook UI shell and
 * breaks on GitHub Pages where Storybook is deployed to a subpath.
 */
export function StorybookNavCard({ title, summary, imgback, imgalt, theme }) {
  const [, updateGlobals] = useGlobals();

  function handleClick(e) {
    e.preventDefault();
    updateGlobals({ theme });
    linkTo('Brand/Brand identity', 'Docs')();
  }

  return (
    <article
      className="mg-card mg-card__vc"
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    >
      <div className="mg-card__visual">
        <img alt={imgalt} className="mg-card__image" src={imgback} />
      </div>
      <div className="mg-card__content">
        <header className="mg-card__title">
          <a href="#" onClick={handleClick}>
            {title}
          </a>
        </header>
        <p className="mg-card__summary">{summary}</p>
      </div>
    </article>
  );
}
