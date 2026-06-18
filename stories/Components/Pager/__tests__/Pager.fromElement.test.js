import pagerFromElement from '../Pager.fromElement';

function createContainer(attrs = {}) {
  const el = document.createElement('nav');
  Object.entries(attrs).forEach(([key, value]) => {
    el.setAttribute(`data-${key}`, value);
  });
  return el;
}

describe('pagerFromElement', () => {
  it('returns defaults when no data attributes set', () => {
    const props = pagerFromElement(createContainer());

    expect(props.page).toBe(1);
    expect(props.totalPages).toBeNull();
    expect(props.layout).toBe('centered');
    expect(props.showJumpTo).toBe(false);
    expect(props.ariaLabel).toBe('Pagination');
    expect(props.rangeLabel).toBeUndefined();
    expect(props.jumpToLabel).toBeUndefined();
    expect(props.jumpToAction).toBeUndefined();
  });

  it('extracts all attributes', () => {
    const props = pagerFromElement(
      createContainer({
        page: '5',
        'total-pages': '20',
        layout: 'bar',
        'show-jump-to': 'true',
        'aria-label': 'Results pagination',
        'range-label': 'Showing {start}–{end} of 200',
        'jump-to-label': 'Go to page',
        'jump-to-action': 'Go',
        'prev-label': 'Précédent',
        'next-label': 'Suivant',
        'go-prev-label': 'Aller à la page précédente',
        'go-next-label': 'Aller à la page suivante',
        'page-label': 'Page {page}',
        'current-page-label': 'Page {page}, page actuelle',
        'page-of-label': 'Page {page} sur {total}',
      })
    );

    expect(props.page).toBe(5);
    expect(props.totalPages).toBe(20);
    expect(props.layout).toBe('bar');
    expect(props.showJumpTo).toBe(true);
    expect(props.ariaLabel).toBe('Results pagination');
    expect(props.rangeLabel).toBe('Showing {start}–{end} of 200');
    expect(props.jumpToLabel).toBe('Go to page');
    expect(props.jumpToAction).toBe('Go');
    expect(props.prevLabel).toBe('Précédent');
    expect(props.nextLabel).toBe('Suivant');
    expect(props.goPrevLabel).toBe('Aller à la page précédente');
    expect(props.goNextLabel).toBe('Aller à la page suivante');
    expect(props.pageLabel).toBe('Page {page}');
    expect(props.currentPageLabel).toBe('Page {page}, page actuelle');
    expect(props.pageOfLabel).toBe('Page {page} sur {total}');
  });

  it('returns undefined for label props when absent', () => {
    const props = pagerFromElement(createContainer({ page: '1', 'total-pages': '10' }));
    expect(props.prevLabel).toBeUndefined();
    expect(props.nextLabel).toBeUndefined();
    expect(props.goPrevLabel).toBeUndefined();
    expect(props.goNextLabel).toBeUndefined();
    expect(props.pageLabel).toBeUndefined();
    expect(props.currentPageLabel).toBeUndefined();
    expect(props.pageOfLabel).toBeUndefined();
  });

  it('parses page as integer', () => {
    const props = pagerFromElement(createContainer({ page: '12' }));
    expect(props.page).toBe(12);
    expect(typeof props.page).toBe('number');
  });

  it('parses totalPages as integer', () => {
    const props = pagerFromElement(createContainer({ 'total-pages': '100' }));
    expect(props.totalPages).toBe(100);
    expect(typeof props.totalPages).toBe('number');
  });

  it('treats missing totalPages as null (mini-pager mode)', () => {
    const props = pagerFromElement(createContainer({ page: '3' }));
    expect(props.totalPages).toBeNull();
  });

  it('treats missing showJumpTo as false', () => {
    const props = pagerFromElement(createContainer());
    expect(props.showJumpTo).toBe(false);
  });

  it('treats showJumpTo="false" as false', () => {
    const props = pagerFromElement(
      createContainer({ 'show-jump-to': 'false' })
    );
    expect(props.showJumpTo).toBe(false);
  });

  it('does not include onPageChange in extracted props', () => {
    const props = pagerFromElement(
      createContainer({ page: '1', 'total-pages': '10' })
    );
    expect(props).not.toHaveProperty('onPageChange');
  });
});
