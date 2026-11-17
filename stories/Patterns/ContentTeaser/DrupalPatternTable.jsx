import React from 'react';
import { DRUPAL_CONTENT_PATTERNS } from '../../Integrations/Drupal/contentPatterns';

// Documentation annotations from the source audit; selections come from the live registry.
const DETAILS = {
  news: {
    before: 'Type/labels, release date',
    after: 'Summary, sources, optional language',
    media: 'Landscape image',
  },
  publication: {
    before: 'Selected labels, published date',
    after: 'Symbol, summary, sources, optional language',
    media: 'Complete cover',
  },
  resource: {
    before: 'Resource type/labels, location, delivery',
    after: 'Summary, sources, optional language',
    media: 'None',
  },
  event: {
    before: 'Type/labels, city, occurrence range, delivery',
    after: 'Summary, optional language',
    media: 'None',
  },
  blog: {
    before: 'Type/labels, published date, authors',
    after: 'Summary',
    media: 'Landscape image',
  },
  organization: {
    before: 'Country/location',
    after: 'Summary, organization type',
    media: 'Complete logo',
  },
  collections: {
    before: 'Type/labels, freshness',
    after: 'Summary',
    media: 'Landscape image',
  },
  vacancy: {
    before: 'Type/labels, location, closing date, optional status',
    after: 'Summary',
    media: 'None',
  },
  hazard_information_profile: {
    before: 'Classification, notation',
    after: 'Summary',
    media: 'None',
  },
  conference_event: {
    before: 'Bucket, schedules, exhibition ranges, room hierarchy, format',
    after: 'Summary, type/theme links',
    media: 'Landscape image',
  },
  commitment: {
    before: 'Geographic scope, status, published date',
    after: 'Summary',
    media: 'Landscape image',
  },
  landing_page_gutenberg: {
    before: 'Type/labels',
    after: 'Summary',
    media: 'Landscape image',
  },
  national_platform: {
    before: 'Type/labels',
    after: 'Summary',
    media: 'None',
  },
  terminology: {
    before: 'Type/labels',
    after: 'Summary',
    media: 'None',
  },
  people: {
    before: 'None',
    after: 'Summary',
    media: 'None',
  },
};

/** Documentation only: never infer Drupal bundle names from presentation profiles. */
export function DrupalPatternTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Archetype / profile</th>
          <th>Drupal bundle</th>
          <th>Before title</th>
          <th>After title/summary</th>
          <th>Media</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(DRUPAL_CONTENT_PATTERNS).map(([bundle, selection]) => (
          <tr key={bundle}>
            <td>
              <code>
                {selection.type} / {selection.profile}
              </code>
            </td>
            <td>
              <code>{bundle}</code>
            </td>
            <td>{DETAILS[bundle]?.before || 'See the source audit'}</td>
            <td>{DETAILS[bundle]?.after || 'See the source audit'}</td>
            <td>{DETAILS[bundle]?.media || 'See the source audit'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
