/** @jest-environment node */
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  CopyButton,
  getCopyButtonLabels,
} from '../../stories/Components/Buttons/CopyButton/CopyButton.hydrate';
import {
  ServiceNotice,
  getServiceNoticeLabels,
} from '../../stories/Components/ServiceNotice/ServiceNotice.hydrate';
import { getSyndicationSearchWidgetLabels } from '../../stories/Components/SyndicationSearchWidget/_labels';

it('resolves built-in catalogues, including plural functions, without browser globals', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  expect(getCopyButtonLabels('fr').ariaLabel).toBe(
    'Copier dans le presse-papiers'
  );
  expect(getServiceNoticeLabels('fr').retryLabel).toBe(
    'Réessayer la connexion'
  );
  expect(
    typeof getSyndicationSearchWidgetLabels('ru').filtersButtonActive
  ).toBe('function');
});

it('renders translated component controls server-side with explicit metadata', () => {
  const html = renderToString(
    <>
      <CopyButton lang="ar-EG" />
      <ServiceNotice lang="fr-CA" title="Example service" onRetry={() => {}} />
    </>
  );
  expect(html).toContain('lang="ar-EG" dir="rtl"');
  expect(html).toContain('نسخ إلى الحافظة');
  expect(html).toContain('lang="fr-CA" dir="ltr"');
  expect(html).toContain('Réessayer la connexion');
});

it('preserves custom language metadata and inherited direction on the server', () => {
  const html = renderToString(
    <div dir="rtl">
      <CopyButton lang="he-IL" labels={{ ariaLabel: 'העתקה' }} />
    </div>
  );
  expect(html).toContain('lang="he-IL"');
  expect(html.match(/dir=/g)).toHaveLength(1);
  expect(html).toContain('העתקה');
});
