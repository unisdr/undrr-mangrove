import React, { useEffect, useImperativeHandle, useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from '../../../Atom/Icons/Icon';
import { SegmentedControl } from '../../../Components/Forms/SegmentedControl/SegmentedControl';
import { Select } from '../../../Components/Forms/Select/Select';
import {
  ANALYTICS,
  fileFacts,
  filterResources,
  linkVerb,
  pluralLabel,
  presentation,
  primaryAnalyticsLabel,
  splitTemplate,
} from './recordAccess';

/**
 * Adaptive resource presentation for the experimental publication record.
 * See docs/PUBLICATION-RECORD-SPEC.md, "Adaptive resource presentation".
 *
 * Server-rendered output is the vanilla contract: the single row or the full
 * table with every row and link. The language filter renders only after this
 * component has mounted, so no control ever appears without a script behind
 * it.
 */

/** External links open in a new tab, with an icon and a spoken warning. */
export function NewTabCue({ label }) {
  return (
    <>
      <Icon name="external-link" className="mg-publication-record__external" />
      <span className="mg-u-sr-only"> ({label})</span>
    </>
  );
}
NewTabCue.propTypes = { label: PropTypes.string };

/** A title in the work's language, isolated from the interface direction. */
function Title({ resource, workLang }) {
  return (
    <span lang={resource.labelLang || workLang} dir="auto">
      {resource.label}
    </span>
  );
}
Title.propTypes = { resource: PropTypes.object, workLang: PropTypes.string };

/** File facts, with the language name spoken in the file's language. */
function Facts({ resource, withLanguage }) {
  const { facts, language, lang } = fileFacts(resource);
  return (
    <>
      {withLanguage && language && <span lang={lang}>{language}</span>}
      {withLanguage && language && facts && ' · '}
      {facts && <bdi>{facts}</bdi>}
    </>
  );
}
Facts.propTypes = { resource: PropTypes.object, withLanguage: PropTypes.bool };

/**
 * The hosted backup as a secondary icon link. Its name is the existing
 * wording plus the title, so every backup link is unique; the short visible
 * label only shows on narrow screens.
 */
function BackupLink({ resource, labels, workLang }) {
  const { backup } = resource;
  return (
    <a
      className="mg-publication-record__backup-link"
      href={backup.href}
      hrefLang={backup.lang || resource.lang}
      data-vf-analytics-label={ANALYTICS.backup}
    >
      <Icon name="download" />
      <span className="mg-publication-record__backup-short" aria-hidden="true">
        {labels.colBackup}
      </span>
      <span className="mg-u-sr-only">
        {labels.backupLink}: <Title resource={resource} workLang={workLang} />
      </span>
    </a>
  );
}
BackupLink.propTypes = {
  resource: PropTypes.object,
  labels: PropTypes.object,
  workLang: PropTypes.string,
};

/** Tier 1: one access row. */
function AccessRow({ resource, labels, workLang }) {
  const verb = linkVerb(resource);
  const external = resource.origin === 'publisher';
  const [before, after] =
    verb === 'title'
      ? ['', '']
      : splitTemplate(verb === 'watch' ? labels.watchLink : labels.accessLink);
  return (
    <div className="mg-publication-record__access-row">
      <a
        className="mg-publication-record__primary"
        href={resource.href}
        hrefLang={resource.lang}
        dir="auto"
        {...(external ? { target: '_blank', rel: 'noopener' } : {})}
        data-vf-analytics-label={primaryAnalyticsLabel(resource)}
      >
        {before}
        <Title resource={resource} workLang={workLang} />
        {after}
        {external && <NewTabCue label={labels.opensInNewTab} />}
      </a>
      <span className="mg-publication-record__facts mg-u-font-size-250">
        <Facts resource={resource} withLanguage />
      </span>
      {resource.backup && (
        <BackupLink resource={resource} labels={labels} workLang={workLang} />
      )}
    </div>
  );
}
AccessRow.propTypes = {
  resource: PropTypes.object.isRequired,
  labels: PropTypes.object.isRequired,
  workLang: PropTypes.string,
};

/** The primary action cell: Access or Watch (new tab) or Download. */
function PrimaryAction({ resource, labels, workLang }) {
  const verb = linkVerb(resource);
  const external = resource.origin === 'publisher';
  const text =
    verb === 'watch'
      ? labels.watchShort
      : verb === 'access'
        ? labels.accessShort
        : labels.downloadShort;
  return (
    <a
      href={resource.href}
      hrefLang={resource.lang}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
      data-vf-analytics-label={primaryAnalyticsLabel(resource)}
    >
      {text}
      {/* Every repeated action names its file. */}
      <span className="mg-u-sr-only">
        {' '}
        <Title resource={resource} workLang={workLang} />
      </span>
      {external ? (
        <NewTabCue label={labels.opensInNewTab} />
      ) : (
        <Icon name="download" className="mg-publication-record__external" />
      )}
    </a>
  );
}
PrimaryAction.propTypes = {
  resource: PropTypes.object,
  labels: PropTypes.object,
  workLang: PropTypes.string,
};

/**
 * Tiers 2–4: a table. Explicit table roles keep the semantics when narrow
 * screens restyle rows as stacked cards (display: block drops them in some
 * browsers).
 */
function FilesTable({
  rows,
  resources,
  labels,
  workLang,
  showLanguage,
  captionId,
}) {
  return (
    <table
      className="mg-table mg-publication-record__files"
      role="table"
      aria-labelledby={captionId}
    >
      <caption id={captionId} className="mg-u-sr-only">
        {labels.caption}
      </caption>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">
            {labels.colTitle}
          </th>
          {showLanguage && (
            <th scope="col" role="columnheader">
              {labels.colLanguage}
            </th>
          )}
          <th scope="col" role="columnheader">
            {labels.colFormat}
          </th>
          <th scope="col" role="columnheader">
            {labels.colOriginal}
          </th>
          <th scope="col" role="columnheader">
            {labels.colBackup}
          </th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {rows.map(index => {
          const resource = resources[index];
          const { language, lang } = fileFacts(resource);
          return (
            <tr key={index} role="row">
              <th
                scope="row"
                role="rowheader"
                className="mg-publication-record__file-title"
              >
                <Title resource={resource} workLang={workLang} />
              </th>
              {showLanguage && (
                <td
                  role="cell"
                  className="mg-publication-record__file-language"
                >
                  {language && <span lang={lang}>{language}</span>}
                </td>
              )}
              <td role="cell" className="mg-publication-record__file-facts">
                <Facts resource={resource} />
              </td>
              <td role="cell" className="mg-publication-record__file-action">
                <PrimaryAction
                  resource={resource}
                  labels={labels}
                  workLang={workLang}
                />
              </td>
              <td role="cell" className="mg-publication-record__file-backup">
                {resource.backup ? (
                  <BackupLink
                    resource={resource}
                    labels={labels}
                    workLang={workLang}
                  />
                ) : (
                  <span aria-hidden="true">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
FilesTable.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.number).isRequired,
  resources: PropTypes.array.isRequired,
  labels: PropTypes.object.isRequired,
  workLang: PropTypes.string,
  showLanguage: PropTypes.bool,
  captionId: PropTypes.string.isRequired,
};

/** One shared explanation, only when some resource has a backup. */
function BackupHelp({ labels, contactHref }) {
  return (
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
  );
}
BackupHelp.propTypes = {
  labels: PropTypes.object.isRequired,
  contactHref: PropTypes.string,
};

/** Language buttons (a native radio group) or, from 6 languages, a select. */
function LanguageFilter({ kind, view, labels, language, onChange, id }) {
  const all = {
    value: 'all',
    label: (kind === 'select' ? labels.allLanguages : labels.allCount).replace(
      '{count}',
      String(view.count)
    ),
  };
  const options = [
    all,
    ...view.languages.map(group => ({
      value: group.key,
      label: `${group.label} (${group.count})`,
    })),
  ];
  if (kind === 'select')
    return (
      <Select
        id={`${id}-language`}
        label={labels.languageLabel}
        options={options}
        value={language}
        onChange={event => onChange(event.target.value)}
        analyticsLabel={ANALYTICS.filterLanguage}
        className="mg-publication-record__language-select"
      />
    );
  return (
    <SegmentedControl
      legend={labels.languageLabel}
      hideLegend
      name={`${id}-language`}
      options={options}
      value={language}
      onChange={event => onChange(event.target.value)}
      size="small"
      analyticsLabel={ANALYTICS.filterLanguage}
      className="mg-publication-record__language-filter"
    />
  );
}
LanguageFilter.propTypes = {
  kind: PropTypes.oneOf(['buttons', 'select']).isRequired,
  view: PropTypes.object.isRequired,
  labels: PropTypes.object.isRequired,
  language: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};

/**
 * The resource access block. `controller` gets `resetFilters()`, which "All
 * downloads (N)" calls before its anchor moves to the heading.
 */
export function RecordAccess({
  resources,
  labels,
  lang,
  workLang,
  contactHref,
  id,
  controller,
}) {
  const view = presentation(resources);
  const [enhanced, setEnhanced] = useState(false);
  const [language, setLanguage] = useState('all');
  const [announcement, setAnnouncement] = useState('');

  // The language filter needs a script, so it only appears once React runs.
  useEffect(() => setEnhanced(true), []);

  // Every row of the current view is shown, so find-in-page reaches them.
  const rows = enhanced
    ? filterResources(resources, { language })
    : resources.map((_, index) => index);
  const showLanguage = view.languages.length >= 2 && language === 'all';

  useImperativeHandle(controller, () => ({
    resetFilters() {
      setLanguage('all');
      setAnnouncement('');
    },
  }));

  const onLanguage = value => {
    setLanguage(value);
    setAnnouncement(
      pluralLabel(labels.showing, lang, resources.length)
        .replace(
          '{shown}',
          String(filterResources(resources, { language: value }).length)
        )
        .replace('{total}', String(resources.length))
    );
  };

  if (view.tier === 0) return null;
  const hasBackup = resources.some(resource => resource.backup);

  return (
    <div
      className={`mg-publication-record__access mg-publication-record__access--tier-${view.tier}`}
    >
      {view.tier === 1 ? (
        <AccessRow
          resource={resources[0]}
          labels={labels}
          workLang={workLang}
        />
      ) : (
        <>
          {enhanced && view.languageFilter !== 'none' && (
            <>
              <div className="mg-publication-record__filters">
                <LanguageFilter
                  kind={view.languageFilter}
                  view={view}
                  labels={labels}
                  language={language}
                  onChange={onLanguage}
                  id={id}
                />
              </div>
              <p
                className="mg-u-sr-only mg-publication-record__status"
                aria-live="polite"
              >
                {announcement}
              </p>
            </>
          )}
          <FilesTable
            rows={rows}
            resources={resources}
            labels={labels}
            workLang={workLang}
            showLanguage={showLanguage}
            captionId={`${id}-caption`}
          />
        </>
      )}
      {hasBackup && <BackupHelp labels={labels} contactHref={contactHref} />}
    </div>
  );
}
RecordAccess.propTypes = {
  resources: PropTypes.array.isRequired,
  labels: PropTypes.object.isRequired,
  lang: PropTypes.string,
  workLang: PropTypes.string,
  contactHref: PropTypes.string,
  id: PropTypes.string.isRequired,
  /** Ref that receives `{ resetFilters() }` for "All downloads (N)". */
  controller: PropTypes.object,
};
