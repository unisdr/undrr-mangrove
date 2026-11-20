import React, { useEffect, useId, useRef } from 'react';
import { mgShowMore, mgShowMoreSetOpen } from '../../../assets/js/show-more';
import PropTypes from 'prop-types';
import { SkipLink } from '../../../Utilities/SkipLink/SkipLink';
import { projectRecord } from './recordProjection';
import { Icon } from '../../../Atom/Icons/Icon';
import {
  ANALYTICS,
  coverAccess,
  linkVerb,
  pluralLabel,
  primaryAnalyticsLabel,
  resourceMeta,
  showAllDownloads,
  isCollapsible,
  splitTemplate,
} from './recordAccess';
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
function fillDate(template, isoDate, lang) {
  const [before, after] = splitTemplate(template || '{date}', '{date}');
  let text = isoDate;
  try {
    text = new Intl.DateTimeFormat(
      `${lang === 'en' ? 'en-GB' : lang}-u-nu-latn`,
      { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }
    ).format(new Date(`${isoDate}T00:00:00Z`));
  } catch {
    // Unknown language tag: keep the ISO date.
  }
  return (
    <>
      {before}
      <time dateTime={isoDate}>{text}</time>
      {after}
    </>
  );
}

// File facts follow the interface direction so they line up under their
// link; LTR runs such as "PDF, 1.6 MB" still read correctly inside RTL.
function Meta({ meta }) {
  if (!meta.text) return null;
  return (
    <p className="mg-publication-record__meta mg-u-font-size-250">
      {meta.facts}
      {meta.facts && meta.language && ' · '}
      {meta.language && <span lang={meta.lang}>{meta.language}</span>}
    </p>
  );
}
Meta.propTypes = { meta: PropTypes.object.isRequired };

/** External links open in a new tab, with an icon and a spoken warning. */
function NewTabCue({ label }) {
  return (
    <>
      <Icon name="external-link" className="mg-publication-record__external" />
      <span className="mg-u-sr-only"> ({label})</span>
    </>
  );
}
NewTabCue.propTypes = { label: PropTypes.string };

/**
 * One resource as Drupal's download box presents it (unisdr/undrr-mangrove#1505):
 * A. publisher + backup: "Access {title}", then the backup line with the file
 *    facts and the backup explanation;
 * B. hosted only: the title, then the file facts;
 * C. publisher only: "Access {title}", then the facts when known.
 */
function ResourceItem({
  resource,
  labels,
  workLang,
  contactHref,
  collapsible,
}) {
  const verb = linkVerb(resource);
  const external = resource.origin === 'publisher';
  const [before, after] =
    verb === 'title'
      ? ['', '']
      : splitTemplate(verb === 'watch' ? labels.watchLink : labels.accessLink);
  const meta = resourceMeta(resource);
  const titleLang = resource.labelLang || workLang;
  const { backup } = resource;
  return (
    <li data-mg-show-more-item={collapsible ? '' : undefined}>
      <p className="mg-publication-record__primary">
        <a
          href={resource.href}
          hrefLang={resource.lang}
          dir="auto"
          {...(external ? { target: '_blank', rel: 'noopener' } : {})}
          data-vf-analytics-label={primaryAnalyticsLabel(resource)}
        >
          {before}
          <span lang={titleLang} dir="auto">
            {resource.label}
          </span>
          {after}
          {external && <NewTabCue label={labels.opensInNewTab} />}
        </a>
      </p>
      {meta.line === 'primary' && <Meta meta={meta} />}
      {backup && (
        <div className="mg-publication-record__backup">
          <p>
            <a
              href={backup.href}
              hrefLang={backup.lang || resource.lang}
              data-vf-analytics-label={ANALYTICS.backup}
            >
              {labels.backupLink}
              {/* The title keeps each backup link's name unique; the visible
                  label stays first, as in Drupal. */}
              <span className="mg-u-sr-only">
                :{' '}
                <span lang={titleLang} dir="auto">
                  {resource.label}
                </span>
              </span>
            </a>
          </p>
          <Meta meta={meta} />
          <details className="mg-publication-record__backup-help">
            <summary>{labels.backupHelp}</summary>
            <p>
              {labels.backupExplanation}
              {contactHref && (
                <>
                  {' '}
                  {labels.problems}{' '}
                  {/* Opens in a new tab, as in Drupal, so the reader keeps the
                      record open while writing to us. */}
                  <a
                    href={contactHref}
                    target="_blank"
                    rel="noopener"
                    data-vf-analytics-label={ANALYTICS.contact}
                  >
                    {labels.contactUs}
                    <NewTabCue label={labels.opensInNewTab} />
                  </a>
                  {labels.sentenceEnd ?? '.'}
                </>
              )}
            </p>
          </details>
        </div>
      )}
    </li>
  );
}
ResourceItem.propTypes = {
  resource: PropTypes.object.isRequired,
  labels: PropTypes.object.isRequired,
  workLang: PropTypes.string,
  contactHref: PropTypes.string,
  /** Hidden by ShowMore's items mode until the list is opened. */
  collapsible: PropTypes.bool,
};

/**
 * The resource groups, in one list. From COLLAPSE_FROM files, groups after
 * the first VISIBLE are marked for ShowMore's items mode, a true disclosure:
 * they are hidden with hidden="until-found" (so find-in-page still reaches
 * them) until the toggle opens the list. Without JavaScript the toggle stays
 * hidden and every group is open. A host page only needs show-more.js: its
 * auto-init picks up the toggle.
 */
function ResourceList({ value, labels, lang, listId, toggleRef }) {
  const { resources } = value;
  const collapses = resources.some((_, index) =>
    isCollapsible(index, resources.length)
  );
  const showAll = pluralLabel(labels.showAllFiles, lang, resources.length);
  const showFewer = labels.showFewerFiles;

  // In React the module's auto-init has already run, so enhance this toggle
  // here; mgShowMore is idempotent, so a host's auto-init is harmless.
  // Items mode reads the items when it starts, so start again when they
  // change: the cleanup restores the old markup first.
  const itemsKey = resources.map(resource => resource.href).join('\n');
  useEffect(() => {
    const button = toggleRef.current;
    return collapses && button ? mgShowMore(button) : undefined;
  }, [collapses, itemsKey, toggleRef]);

  // Keep the visible label right when the interface language changes.
  useEffect(() => {
    const label = toggleRef.current?.querySelector('[data-mg-show-more-label]');
    if (!label) return;
    label.textContent =
      toggleRef.current.getAttribute('aria-expanded') === 'true'
        ? showFewer
        : showAll;
  }, [showAll, showFewer, toggleRef]);

  return (
    <>
      <ul id={listId} className="mg-publication-record__resources">
        {resources.map((resource, index) => (
          <ResourceItem
            key={index}
            resource={resource}
            labels={labels}
            workLang={value.lang}
            contactHref={value.contactHref}
            collapsible={isCollapsible(index, resources.length)}
          />
        ))}
      </ul>
      {collapses && (
        <button
          ref={toggleRef}
          type="button"
          hidden
          className="mg-button mg-button-secondary mg-show-more--button mg-publication-record__show-all"
          data-mg-show-more="true"
          data-mg-show-more-mode="items"
          data-mg-show-more-target={`#${listId}`}
          data-mg-show-more-label-collapsed={showAll}
          data-mg-show-more-label-open={showFewer}
          data-vf-analytics-label={ANALYTICS.showAll}
        >
          <span data-mg-show-more-label>{showAll}</span>
        </button>
      )}
    </>
  );
}
ResourceList.propTypes = {
  value: PropTypes.object.isRequired,
  labels: PropTypes.object.isRequired,
  lang: PropTypes.string,
  listId: PropTypes.string.isRequired,
  toggleRef: PropTypes.object.isRequired,
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
  const toggleRef = useRef(null);
  const listId = `${prefix}-resources`;
  // "All downloads (N)" opens a collapsed list before the browser follows
  // the anchor to the resources heading. Without JavaScript the list is
  // already open and the link is a plain anchor.
  const openList = () => mgShowMoreSetOpen(toggleRef.current, true);

  const value = projectRecord(record);
  const hasDetails =
    value.identifiers.length > 0 ||
    value.edition ||
    value.pages ||
    value.details.length > 0;
  const hasAside = value.cover || hasDetails;
  const coverLink = value.cover ? coverAccess(value.resources) : undefined;
  const allDownloads =
    coverLink && showAllDownloads(value.resources)
      ? pluralLabel(labels.allDownloads, lang, value.resources.length)
      : '';
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
                  data-vf-google-analytics-region={ANALYTICS.region}
                >
                  <h2 id={`${prefix}-access`}>{labels.access}</h2>
                  <ResourceList
                    value={value}
                    labels={labels}
                    lang={lang}
                    listId={listId}
                    toggleRef={toggleRef}
                  />
                  {value.resourcesAdded && (
                    <p className="mg-publication-record__added mg-u-font-size-250">
                      {fillDate(labels.added, value.resourcesAdded, lang)}
                    </p>
                  )}
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
                          href={`#${prefix}-access`}
                          onClick={openList}
                          data-vf-analytics-label={ANALYTICS.allDownloads}
                        >
                          {allDownloads}
                        </a>
                      </p>
                    )}
                  </div>
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
