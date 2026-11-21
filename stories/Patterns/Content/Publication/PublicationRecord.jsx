import React, { useId, useRef } from 'react';
import PropTypes from 'prop-types';
import { SkipLink } from '../../../Utilities/SkipLink/SkipLink';
import { projectRecord } from './recordProjection';
import { ANALYTICS, coverAccess, pluralLabel } from './recordAccess';
import { RecordAccess } from './RecordResources';
import { UndrrChrome } from '../../_shared/UndrrChrome';

function RecordNames({ entries }) {
  return (
    <ul>
      {entries.map((entry, index) => (
        // Each name or identifier resolves its own direction, so a Latin DOI
        // after an Arabic entry is not reordered.
        <li key={index} dir="auto">
          {entry}
        </li>
      ))}
    </ul>
  );
}
RecordNames.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.node).isRequired,
};

// Dates follow the editorial manual ("15 March 2026"), which en-US does not,
// in Latin digits as Drupal prints them.
function formatDate(isoDate, lang) {
  let text = isoDate;
  try {
    text = new Intl.DateTimeFormat(
      `${lang === 'en' ? 'en-GB' : lang}-u-nu-latn`,
      { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
    ).format(new Date(`${isoDate}T00:00:00Z`));
  } catch {
    // Unknown language tag: keep the ISO date.
  }
  return <time dateTime={isoDate}>{text}</time>;
}

/** Experimental story-owned composition, not a published package renderer. */
export function PublicationRecord({
  record,
  labels,
  lang = 'en',
  dir = 'ltr',
  children,
}) {
  const prefix = `publication-${useId().replace(/:/g, '')}`;
  const access = useRef(null);
  // "All downloads (N)" resets the language filter to All before the browser
  // follows the anchor to the resources heading. Without JavaScript (and in
  // tiers 1 and 2) it is a plain anchor.
  const openList = () => access.current?.resetFilters();

  const value = projectRecord(record);
  const hasDetails =
    value.identifiers.length > 0 ||
    value.edition ||
    value.pages ||
    value.resourcesAdded ||
    value.details.length > 0;
  const hasAside = value.cover || hasDetails;
  const coverLink = value.cover ? coverAccess(value.resources) : undefined;
  // Always present with a linked cover, so readers who look under the cover
  // find the files: "All downloads (N)" for several, "Download options" for one.
  const allDownloads = !coverLink
    ? ''
    : value.resources.length > 1
      ? pluralLabel(labels.allDownloads, lang, value.resources.length)
      : labels.downloadOptions;
  const chromeLocale = lang === 'ar' ? 'arabic' : 'english';
  // The Description always comes first and the files section always follows
  // it, for every number of files. The header's "Files (N)" link, the cover
  // and the link under it keep the files findable.
  const filesId = `${prefix}-access`;
  const filesSection = value.resources.length > 0 && (
    <section
      className="mg-reading__article mg-publication-record__files-section"
      aria-labelledby={filesId}
      data-vf-google-analytics-region={ANALYTICS.region}
    >
      <RecordAccess
        resources={value.resources}
        labels={labels}
        lang={lang}
        workLang={value.lang}
        contactHref={value.contactHref}
        id={prefix}
        heading={labels.filesHeading}
        headingId={filesId}
        controller={access}
      />
    </section>
  );
  return (
    <div lang={lang} dir={dir} className="mg-publication-record">
      <SkipLink targetId={`${prefix}-main`} label={labels.skip} />
      <div lang={chromeLocale === 'arabic' ? 'ar' : 'en'} dir={dir}>
        <UndrrChrome locale={chromeLocale} id={prefix} />
      </div>
      <main
        id={`${prefix}-main`}
        tabIndex={-1}
        className="mg-container mg-demo-shell mg-container--spacer"
      >
        <div className="mg-container mg-publication-record__layout">
          <header className="mg-publication-record__header">
            <p>
              <a href="https://www.undrr.org/publications" className="mg-tag">
                {labels.publication}
              </a>
            </p>
            <h1 className="mg-u-font-size-900" lang={value.lang} dir="auto">
              {value.title}
            </h1>
            {value.summary && (
              <p
                className="mg-demo-lede mg-u-font-size-500"
                lang={value.lang}
                dir="auto"
              >
                {value.summary}
              </p>
            )}
            {value.originalTitle && (
              <p lang={value.originalTitle.lang} dir="auto">
                {value.originalTitle.text}
              </p>
            )}
            {(value.authors.length > 0 ||
              value.sources.length > 0 ||
              value.publicationYear) && (
              <dl className="mg-publication-record__metadata mg-publication-record__identity mg-u-font-size-250">
                {value.authors.length > 0 && (
                  <div>
                    <dt>{labels.authors}</dt>
                    <dd lang={value.lang} dir="auto">
                      <RecordNames entries={value.authors} />
                    </dd>
                  </div>
                )}
                {value.sources.length > 0 && (
                  <div>
                    <dt>{labels.sources}</dt>
                    <dd lang={value.lang} dir="auto">
                      <RecordNames
                        entries={value.sources.map((source, index) =>
                          source.href ? (
                            <a key={index} href={source.href}>
                              {source.label}
                            </a>
                          ) : (
                            source.label
                          )
                        )}
                      />
                    </dd>
                  </div>
                )}
                {value.publicationYear && (
                  <div>
                    <dt>{labels.year}</dt>
                    <dd lang={value.lang} dir="auto">
                      <time dateTime={value.publicationYear}>
                        {value.publicationYear}
                      </time>
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {value.resources.length > 0 && (
              <p className="mg-publication-record__files-jump mg-u-font-size-250">
                <a
                  href={`#${filesId}`}
                  data-vf-analytics-label={ANALYTICS.filesJump}
                >
                  {pluralLabel(labels.filesJump, lang, value.resources.length)}
                  <span aria-hidden="true"> ↓</span>
                </a>
              </p>
            )}
          </header>
          <div
            className={`mg-reading mg-publication-record__reading${hasAside ? ' mg-grid mg-grid--article' : ''}`}
          >
            <div className="mg-publication-record__main mg-reading__article">
              {children && (
                <section
                  className="mg-reading__article"
                  aria-labelledby={`${prefix}-description`}
                >
                  <h2 id={`${prefix}-description`}>{labels.description}</h2>
                  <div
                    className="mg-content"
                    lang={value.bodyLang || value.lang}
                    dir="auto"
                  >
                    {children}
                  </div>
                </section>
              )}
              {filesSection}
              {(value.citation || value.canonicalUrl) && (
                <section
                  className="mg-reading__article"
                  aria-labelledby={`${prefix}-citation`}
                >
                  <h2 id={`${prefix}-citation`}>{labels.citation}</h2>
                  {value.citation && (
                    <p lang={value.lang} dir="auto">
                      {value.citation}
                    </p>
                  )}
                  {value.canonicalUrl && (
                    <p>
                      <a href={value.canonicalUrl}>{labels.recordLink}</a>
                    </p>
                  )}
                </section>
              )}
              {value.related.length > 0 && (
                <section
                  className="mg-reading__article"
                  aria-labelledby={`${prefix}-related`}
                >
                  <h2 id={`${prefix}-related`}>{labels.related}</h2>
                  <ul>
                    {value.related.map((link, index) => (
                      <li key={index}>
                        <a href={link.href} lang={value.lang} dir="auto">
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            {hasAside && (
              <aside className="mg-publication-record__aside">
                {value.cover && (
                  <div
                    className="mg-publication-record__cover-group"
                    data-vf-google-analytics-region={
                      coverLink ? ANALYTICS.coverRegion : undefined
                    }
                  >
                    <figure
                      className={`mg-publication-record__cover${coverLink ? ' mg-publication-record__cover--linked' : ''}`}
                    >
                      <img src={value.cover.src} alt={value.cover.alt} />
                      {coverLink && (
                        // Pointer shortcut duplicating the first labelled
                        // resource link, so it is hidden from assistive
                        // technology and the tab order. It overlays the image
                        // instead of wrapping it, so informative alt text
                        // stays exposed.
                        <a
                          className="mg-publication-record__cover-link"
                          href={coverLink.href}
                          hrefLang={coverLink.lang}
                          {...(coverLink.newWindow
                            ? { target: '_blank', rel: 'noopener' }
                            : {})}
                          aria-hidden="true"
                          tabIndex={-1}
                          data-vf-analytics-label={coverLink.analyticsLabel}
                        >
                          <span className="mg-publication-record__cover-badge">
                            <span
                              className={`mg-icon mg-icon-${coverLink.icon}`}
                              aria-hidden="true"
                            />
                          </span>
                        </a>
                      )}
                    </figure>
                    {allDownloads && (
                      <p className="mg-publication-record__all-downloads mg-u-font-size-250">
                        <a
                          href={`#${filesId}`}
                          onClick={openList}
                          data-vf-analytics-label={ANALYTICS.allDownloads}
                        >
                          {allDownloads}
                        </a>
                      </p>
                    )}
                  </div>
                )}
                {hasDetails && (
                  <section
                    className="mg-reading__article"
                    aria-labelledby={`${prefix}-details`}
                  >
                    <h2 id={`${prefix}-details`}>{labels.details}</h2>
                    <dl className="mg-publication-record__metadata">
                      {value.identifiers.length > 0 && (
                        <div>
                          <dt>{labels.identifiers}</dt>
                          <dd lang={value.lang} dir="auto">
                            <RecordNames entries={value.identifiers} />
                          </dd>
                        </div>
                      )}
                      {value.edition && (
                        <div>
                          <dt>{labels.edition}</dt>
                          <dd lang={value.lang} dir="auto">
                            {value.edition}
                          </dd>
                        </div>
                      )}
                      {value.pages && (
                        <div>
                          <dt>{labels.pages}</dt>
                          <dd lang={value.lang} dir="auto">
                            {value.pages}
                          </dd>
                        </div>
                      )}
                      {value.resourcesAdded && (
                        // When the hosted copies were added (Drupal's media
                        // creation date). Not a link check.
                        <div>
                          <dt>{labels.addedLabel}</dt>
                          <dd>{formatDate(value.resourcesAdded, lang)}</dd>
                        </div>
                      )}
                      {value.details.map((detail, index) => (
                        <div key={index} lang={value.lang} dir="auto">
                          <dt>{detail.label}</dt>
                          <dd lang={value.lang} dir="auto">
                            {detail.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
PublicationRecord.propTypes = {
  /** Approved, public record-local presentation selection; see the story specification. */
  record: PropTypes.object.isRequired,
  /**
   * Authored interface labels, separate from work and resource languages.
   * `allDownloads` holds CLDR plural forms (`one`, `other`, and `zero`, `two`,
   * `few`, `many` where the language uses them) with a `{count}` placeholder.
   */
  labels: PropTypes.objectOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.objectOf(PropTypes.string),
    ])
  ).isRequired,
  lang: PropTypes.string,
  dir: PropTypes.oneOf(['ltr', 'rtl']),
  /** Trusted authored React content. CMS consumers must sanitise HTML before producing prose. */
  children: PropTypes.node,
};
