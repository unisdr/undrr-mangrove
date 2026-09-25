import React, { useEffect, useRef } from 'react';
import { mgCiteThis, mgCiteThisDestroy } from '../../assets/js/cite-this';

function CitationExample({
  citation,
  author,
  publisher,
  year,
  title,
  site,
  url,
}) {
  const ref = useRef(null);
  useEffect(() => {
    mgCiteThis(ref.current);
    return () => mgCiteThisDestroy(ref.current);
  }, [citation, author, publisher, year, title, site, url]);

  return (
    <div
      ref={ref}
      className="mg-cite-this"
      data-mg-cite-this
      data-mg-cite-this-citation={citation}
      data-mg-cite-this-author={author}
      data-mg-cite-this-publisher={publisher}
      data-mg-cite-this-year={year}
      data-mg-cite-this-title={title}
      data-mg-cite-this-site={site}
      data-mg-cite-this-url={url}
    >
      <details className="mg-cite-this__fallback">
        <summary className="mg-cite-this__summary">Cite this</summary>
        <div className="mg-cite-this__content">
          <p className="mg-cite-this__text mg-code" data-mg-cite-this-text />
          <div className="mg-cite-this__actions">
            <button
              type="button"
              className="mg-cite-this__copy"
              data-mg-cite-this-copy
              hidden
            >
              Copy citation
            </button>
            <span
              className="mg-cite-this__status"
              data-mg-cite-this-status
              role="status"
              aria-live="polite"
            />
          </div>
        </div>
      </details>
    </div>
  );
}

function BareHtmlExample() {
  const ref = useRef(null);
  useEffect(() => {
    mgCiteThis(ref.current);
    return () => mgCiteThisDestroy(ref.current);
  }, []);
  return <div ref={ref} className="mg-cite-this" data-mg-cite-this="" />;
}

export default {
  title: 'Components/Cite this',
  component: CitationExample,
  parameters: {
    docs: {
      description: {
        component:
          'A Cite this button opens a native dialog when enhanced by vanilla JavaScript. Try opening and copying each example.',
      },
    },
  },
};

export const BarePageFallback = {
  name: 'Vanilla HTML page fallback',
  parameters: { docs: { source: { html: true } } },
  render: () => <BareHtmlExample />,
};

export const PageWithOverrides = {
  name: 'Page title and site overrides',
  render: () => (
    <CitationExample site="UNDRR" title="Understanding disaster risk" />
  ),
};

export const Metadata = {
  name: 'Configured publication metadata',
  render: () => (
    <CitationExample
      author="United Nations Office for Disaster Risk Reduction"
      publisher="UNDRR"
      year="2025"
      title="Hazard Information Profiles: 2025 version"
      url="https://www.preventionweb.net/publication/documents-and-publications/hazard-information-profiles-hips-2025-version"
    />
  ),
};

export const SchemaMetadata = {
  name: 'Matching Schema.org work',
  render: () => (
    <>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Report',
          mainEntityOfPage: window.location.href,
          name: '2025 Hazard Information Profiles',
          datePublished: '2025-01-01',
          author: { '@type': 'Organization', name: 'UNDRR and ISC' },
          publisher: { '@type': 'Organization', name: 'UNDRR' },
        })}
      </script>
      <CitationExample />
    </>
  ),
};

export const PublisherCitation = {
  name: 'Publisher citation',
  render: () => (
    <CitationExample citation="United Nations Office for Disaster Risk Reduction (2022). Global Assessment Report on Disaster Risk Reduction 2022: Our World at Risk. Geneva." />
  ),
};

export const LongCitation = {
  name: 'Long citation',
  render: () => (
    <CitationExample
      author="International Science Council, United Nations Office for Disaster Risk Reduction"
      publisher="United Nations Office for Disaster Risk Reduction"
      year="2025"
      title="Hazard Information Profiles: 2025 version, technical reference and supporting material for all hazard groups"
      url="https://www.preventionweb.net/publication/documents-and-publications/hazard-information-profiles-hips-2025-version"
    />
  ),
};
