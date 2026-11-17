const TAXONOMIES = ['country_region', 'hazard', 'theme'];

export class ExportTaxonomyError extends Error {}

export function needsExportTaxonomies(records, columns) {
  return TAXONOMIES.some(
    key =>
      columns.includes(`${key}_names`) &&
      records.some(record => record[`${key}_ids`].length > 0)
  );
}

export function withExportTaxonomyNames(records, columns, termMap) {
  return records.map(record => {
    const named = { ...record };
    for (const key of TAXONOMIES) {
      if (!columns.includes(`${key}_names`)) continue;
      named[`${key}_names`] = record[`${key}_ids`].map(id => {
        const name = termMap?.get(id);
        if (typeof name !== 'string' || !name.trim())
          throw new ExportTaxonomyError('Unresolved export taxonomy');
        return name;
      });
    }
    return named;
  });
}

export function exportSummary(teaser, document) {
  if (!teaser || !document) return '';
  const template = document.createElement('template');
  template.innerHTML = Array.isArray(teaser) ? teaser[0] || '' : teaser;
  const summary = template.content.querySelector('.mg-card__description');
  if (!summary || summary.closest('[hidden], [aria-hidden="true"]')) return '';
  summary
    .querySelectorAll(
      'script, style, template, noscript, [hidden], [aria-hidden="true"]'
    )
    .forEach(element => element.remove());
  summary
    .querySelectorAll('br, p, div, li, h1, h2, h3, h4, h5, h6')
    .forEach(element => {
      element.before(document.createTextNode(' '));
      element.after(document.createTextNode(' '));
    });
  return summary.textContent.replace(/\s+/g, ' ').trim();
}
