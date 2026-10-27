const UNSAFE_URL = /^(javascript|data|vbscript):/i;

const isList = el => el.tagName === 'UL' || el.tagName === 'OL';

const isOn = value => value !== undefined && value !== 'false';

const collapse = text => (text || '').replace(/\s+/g, ' ').trim();

// A direct child <a>, or one wrapped in a single element (<li><span><a>),
// as some Drupal menu templates render. Links inside nested lists are skipped.
function findLink(li) {
  const children = Array.from(li.children);
  const direct = children.find(el => el.tagName === 'A');
  if (direct) return direct;
  return children
    .filter(el => !isList(el))
    .map(el => Array.from(el.children).find(child => child.tagName === 'A'))
    .find(Boolean);
}

function readLabel(li, link) {
  if (link) {
    const img = link.querySelector('img[alt]');
    return (
      collapse(link.textContent) ||
      collapse(link.getAttribute('aria-label')) ||
      collapse(img ? img.getAttribute('alt') : '')
    );
  }
  return collapse(
    Array.from(li.childNodes)
      .filter(node => !(node.nodeType === 1 && isList(node)))
      .map(node => node.textContent)
      .join(' ')
  );
}

function readHref(link) {
  if (!link) return undefined;
  const href = (link.getAttribute('href') || '').trim();
  // Strip control characters and whitespace a browser would ignore before
  // checking the scheme, so "java\tscript:" is caught too.
  // eslint-disable-next-line no-control-regex
  const normalised = href.replace(/[\u0000-\u0020]/g, '');
  if (!href || UNSAFE_URL.test(normalised)) return undefined;
  return href;
}

/**
 * Layer 2: Extract Tree props from a DOM container holding a nested list.
 *
 * Expected HTML:
 * <div data-mg-tree
 *   data-aria-label="Section navigation"
 *   data-toggle-icon="mg-icon-arrow-right"
 *   data-guides="true">
 *   <ul>
 *     <li data-id="about" data-expanded>
 *       <a href="/about">About</a>
 *       <ul>
 *         <li data-id="team"><a href="/about/team" aria-current="page">Team</a></li>
 *       </ul>
 *     </li>
 *     <li data-id="archive">Archive</li>
 *   </ul>
 * </div>
 *
 * The list works as plain links before JavaScript runs. Each `<li>` becomes a
 * TreeItem:
 * - id: `data-id`, then the `<li>` id, then its position ("1-2"). Ids must be
 *   unique; duplicates get a numeric suffix
 * - label: text of the item's link, otherwise the item's own text (nested
 *   lists excluded); read as text, markup is not re-injected. An image-only
 *   link uses its aria-label, then the image alt
 * - href: a direct child `<a>`, or one wrapped in a single element
 *   (`<li><span><a>`); javascript:, data: and vbscript: URLs are dropped
 * - current: the link's `aria-current` value, kept on the rendered link
 * - expanded: `data-expanded` (any value but "false") or `aria-expanded="true"`
 * - selected: `data-selected` on the `<li>` or `aria-current` on its link;
 *   the first match wins, `data-selected-id` on the container is the fallback.
 *   The selected item's ancestors start expanded so it is visible
 *
 * @param {Element} container - DOM element with data attributes and a nested list
 * @returns {object} Props for the hydrated Tree
 */
export default function treeFromElement(container) {
  const { dataset } = container;
  const usedIds = new Set();
  const ancestorsById = new Map();
  const defaultExpandedIds = [];
  let selectedId = null;

  const uniqueId = candidate => {
    let id = candidate;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${candidate}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    return id;
  };

  const parseList = (list, path, ancestors) =>
    Array.from(list.children)
      .filter(el => el.tagName === 'LI')
      .map((li, index) => {
        const position = path ? `${path}-${index + 1}` : `${index + 1}`;
        const link = findLink(li);
        const sublist = Array.from(li.children).find(isList);
        const id = uniqueId(li.dataset.id || li.id || position);
        ancestorsById.set(id, ancestors);

        const item = { id, label: readLabel(li, link) };
        const href = readHref(link);
        if (href) item.href = href;

        const current = link ? link.getAttribute('aria-current') : null;
        const isCurrent = Boolean(current) && current !== 'false';
        if (href && isCurrent) item.current = current;

        const childItems = sublist
          ? parseList(sublist, position, [...ancestors, id])
          : [];
        if (childItems.length > 0) {
          item.children = childItems;
          if (
            isOn(li.dataset.expanded) ||
            li.getAttribute('aria-expanded') === 'true'
          ) {
            defaultExpandedIds.push(id);
          }
        }

        if (selectedId === null && (isOn(li.dataset.selected) || isCurrent)) {
          selectedId = id;
        }

        return item;
      });

  const rootList =
    Array.from(container.children).find(isList) ||
    container.querySelector('ul, ol');

  const items = rootList ? parseList(rootList, '', []) : [];
  const defaultSelectedId = selectedId || dataset.selectedId || null;

  (ancestorsById.get(defaultSelectedId) || []).forEach(id => {
    if (!defaultExpandedIds.includes(id)) defaultExpandedIds.push(id);
  });

  return {
    items,
    defaultExpandedIds,
    defaultSelectedId,
    guides: dataset.guides !== 'false',
    toggleIcon: dataset.toggleIcon || undefined,
    'aria-label': dataset.ariaLabel || undefined,
    'aria-labelledby': dataset.ariaLabelledby || undefined,
    className: dataset.className || undefined,
  };
}

export { treeFromElement as fromElement };
