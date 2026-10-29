import React, { useId } from 'react';
import PropTypes from 'prop-types';
import { SkipLink } from '../../../Utilities/SkipLink/SkipLink';
import { projectRecord } from './recordProjection';
import { UndrrChrome } from '../../_shared/UndrrChrome';

function RecordNames({ entries }) {
  return (
    <ul>
      {entries.map((entry, index) => (
        <li key={index}>{entry}</li>
      ))}
    </ul>
  );
}
RecordNames.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.node).isRequired,
};

/** Experimental story-owned composition, not a published package renderer. */
export function PublicationRecord({
  record,
  labels,
  lang = 'en',
  dir = 'ltr',
  children,
}) {
  const prefix = `publication-${useId().replace(/:/g, '')}`;
  const value = projectRecord(record);
  const hasDetails =
    value.identifiers.length > 0 ||
    value.edition ||
    value.pages ||
    value.details.length > 0;
  const hasAside = value.cover || hasDetails;
  const chromeLocale = lang === 'ar' ? 'arabic' : 'english';
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
          </header>
          <div
            className={`mg-reading mg-publication-record__reading${hasAside ? ' mg-grid mg-grid--article' : ''}`}
          >
            <div className="mg-publication-record__main mg-reading__article">
              {value.resources.length > 0 && (
                <section
                  className="mg-reading__article"
                  aria-labelledby={`${prefix}-access`}
                >
                  <h2 id={`${prefix}-access`}>{labels.access}</h2>
                  <ul className="mg-publication-record__resources">
                    {value.resources.map((resource, index) => (
                      <li key={index}>
                        <a
                          href={resource.href}
                          hrefLang={resource.lang}
                          lang={resource.labelLang || value.lang}
                          dir="auto"
                        >
                          {resource.label}
                        </a>
                        {[
                          resource.language,
                          resource.format,
                          resource.size,
                        ].filter(Boolean).length > 0 && (
                          <p
                            className="mg-u-font-size-250"
                            lang={resource.labelLang || value.lang}
                            dir="auto"
                          >
                            {[resource.language, resource.format, resource.size]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                        {resource.backup && (
                          <>
                            <p>
                              {labels.backup}:{' '}
                              <a
                                href={resource.backup.href}
                                hrefLang={resource.backup.lang}
                                lang={resource.backup.labelLang || value.lang}
                                dir="auto"
                              >
                                {resource.backup.label}
                              </a>
                            </p>
                            {[
                              resource.backup.language,
                              resource.backup.format,
                              resource.backup.size,
                            ].filter(Boolean).length > 0 && (
                              <p
                                className="mg-u-font-size-250"
                                lang={resource.backup.labelLang || value.lang}
                                dir="auto"
                              >
                                {[
                                  resource.backup.language,
                                  resource.backup.format,
                                  resource.backup.size,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
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
                  <figure className="mg-publication-record__cover">
                    <img src={value.cover.src} alt={value.cover.alt} />
                  </figure>
                )}
                {(value.identifiers.length > 0 ||
                  value.edition ||
                  value.pages ||
                  value.details.length > 0) && (
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
  /** Authored interface labels, separate from work and resource languages. */
  labels: PropTypes.objectOf(PropTypes.string).isRequired,
  lang: PropTypes.string,
  dir: PropTypes.oneOf(['ltr', 'rtl']),
  /** Trusted authored React content. CMS consumers must sanitise HTML before producing prose. */
  children: PropTypes.node,
};
