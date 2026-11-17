import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import MegaMenu from '../MegaMenu';
import {
  flattenMenuItems,
  filterMenuItems,
  formatLabel,
  getSiteSearchUrl,
  HighlightText,
} from '../filterUtils';

// Native focus containment is verified in a real browser. jsdom only models
// the open attribute for rendering and interaction assertions.
const originalShowModal = HTMLDialogElement.prototype.showModal;
const originalCloseDialog = HTMLDialogElement.prototype.close;
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterAll(() => {
  HTMLDialogElement.prototype.showModal = originalShowModal;
  HTMLDialogElement.prototype.close = originalCloseDialog;
});

const sampleSections = [
  {
    title: 'Knowledge Base',
    bannerHeading: 'Knowledge Base',
    bannerDescription: '<p>Explore latest research</p>',
    bannerButton: { label: 'Explore Knowledge Base', url: '/knowledge-base' },
    items: [
      {
        title: 'Browse by content type',
        items: [
          { title: 'Documents and publications', url: '/documents' },
          { title: 'Policies and Plans', url: '/policies' },
        ],
      },
      {
        title: 'Explore by hazard',
        items: [
          { title: 'Floods', url: '/hazards/floods' },
          { title: 'Droughts', url: '/hazards/droughts' },
        ],
      },
    ],
  },
  {
    title: 'Understanding Risk',
    bannerHeading: 'Understanding Risk',
    bannerDescription: '<p>Understand risk</p>',
    bannerButton: { url: '/risk' },
    items: [
      {
        title: 'Terminology',
        url: '/terminology',
      },
    ],
  },
];

describe('MegaMenu filter utilities', () => {
  it('flattens menu items across all hierarchy levels', () => {
    const flat = flattenMenuItems(sampleSections);
    const titles = flat.map(item => item.title);

    expect(titles).toContain('Knowledge Base');
    expect(titles).toContain('Documents and publications');
    expect(titles).toContain('Policies and Plans');
    expect(titles).toContain('Floods');
    expect(titles).toContain('Terminology');
  });

  it('preserves breadcrumb paths in flattened items', () => {
    const flat = flattenMenuItems(sampleSections);
    const docs = flat.find(i => i.title === 'Documents and publications');

    expect(docs).toBeDefined();
    expect(docs.fullPath).toBe('Knowledge Base › Browse by content type');
    expect(docs.url).toBe('/documents');
  });

  it('filters items by title case-insensitively', () => {
    const flat = flattenMenuItems(sampleSections);
    const results = filterMenuItems(flat, 'flood');

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Floods');
  });

  it('filters items by ancestor category path', () => {
    const flat = flattenMenuItems(sampleSections);
    const results = filterMenuItems(flat, 'hazard');

    expect(results.length).toBeGreaterThanOrEqual(2);
    expect(results.map(r => r.title)).toEqual(
      expect.arrayContaining(['Floods', 'Droughts'])
    );
  });

  it('ranks destination titles above ancestor-only matches and removes duplicate URLs', () => {
    const results = filterMenuItems(
      [
        { title: 'Guidelines', url: '/guide', fullPath: 'Reports' },
        { title: 'Annual Reports', url: '/annual', fullPath: 'Publications' },
        { title: 'Reports', url: '/reports', fullPath: '' },
        { title: 'Annual Reports', url: '/annual', fullPath: 'Reports' },
      ],
      'reports'
    );
    expect(results.map(item => item.url)).toEqual([
      '/reports',
      '/annual',
      '/guide',
    ]);
  });

  it.each(['carers', 'carrers', 'careeers', 'caerers'])(
    'recovers a one-edit typo %s in titles and ancestor words',
    query => {
      const items = flattenMenuItems([
        {
          title: 'About Us',
          items: [
            {
              title: 'Careers',
              url: '/careers',
              items: [{ title: 'Open Positions', url: '/jobs' }],
            },
          ],
        },
      ]);
      expect(filterMenuItems(items, query).map(item => item.url)).toEqual([
        '/careers',
        '/jobs',
      ]);
    }
  );

  it('keeps literal matches exclusive and avoids fuzzy short queries or phrases', () => {
    const items = [
      { title: 'Careers', url: '/careers', fullPath: '' },
      { title: 'Carers guide', url: '/carers', fullPath: '' },
      { title: 'Risk', url: '/risk', fullPath: '' },
    ];
    expect(filterMenuItems(items, 'carers').map(item => item.url)).toEqual([
      '/carers',
    ]);
    expect(filterMenuItems(items, 'riks')).toHaveLength(1);
    expect(filterMenuItems(items, 'rik')).toEqual([]);
    expect(filterMenuItems(items, 'carers advice')).toEqual([]);
    expect(filterMenuItems(items, 'cxrxers')).toEqual([]);
  });

  it('ranks fuzzy titles before ancestor matches and deduplicates their URLs', () => {
    const items = [
      { title: 'Open Positions', url: '/jobs', fullPath: 'About Us › Careers' },
      { title: 'Careers', url: '/careers', fullPath: 'About Us' },
      { title: 'Careers', url: '/jobs', fullPath: 'Other' },
      {
        title: 'Internships',
        url: '/internships',
        fullPath: 'About Us › Careers',
      },
    ];
    expect(filterMenuItems(items, 'carers')).toEqual([
      items[1],
      items[2],
      items[3],
    ]);
  });

  it('counts edits as Unicode characters rather than UTF-16 code units', () => {
    const items = [{ title: '𐐀𐐁𐐂𐐃𐐄', url: '/unicode', fullPath: '' }];
    expect(filterMenuItems(items, '𐐀𐐁𐐃𐐂𐐄')).toEqual(items);
    expect(filterMenuItems(items, '𐐀𐐁𐐃𐐄')).toEqual(items);
    expect(filterMenuItems(items, '𐐀𐐁𐐁𐐁𐐄')).toEqual([]);
  });

  it.each([
    'news events',
    'events news',
    'news and events',
    'events & news',
    'news & events',
  ])('matches conjunctions and unordered terms for %s', query => {
    const items = flattenMenuItems([
      {
        title: 'News & Events',
        url: '/news',
        items: [{ title: 'Latest News', url: '/latest' }],
      },
      { title: 'News archive', url: '/archive' },
    ]);
    expect(filterMenuItems(items, query).map(item => item.url)).toEqual([
      '/news',
      '/latest',
    ]);
    expect(getSiteSearchUrl('/search', query)).toBe(
      '/search#query=' + encodeURIComponent(query)
    );
  });

  it('requires every word and ranks title matches before ancestor and combined matches', () => {
    const items = [
      { title: 'Positions', fullPath: 'Open opportunities', url: '/combined' },
      { title: 'Application guide', fullPath: 'Open Positions', url: '/path' },
      { title: 'Open Positions', fullPath: 'Careers', url: '/title' },
      { title: 'Open archive', fullPath: 'About', url: '/missing' },
    ];
    expect(
      filterMenuItems(items, 'positions open').map(item => item.url)
    ).toEqual(['/title', '/path', '/combined']);
    expect(filterMenuItems(items, 'positions open unavailable')).toEqual([]);
    expect(
      filterMenuItems(
        [{ title: 'Research and development', url: '/rd' }],
        'development & research'
      )
    ).toHaveLength(1);
    expect(
      filterMenuItems([{ title: 'Sand dunes', url: '/sand' }], 's dunes')
    ).toHaveLength(1);
  });

  it('highlights separately matched words while preserving displayed punctuation', () => {
    const { container } = render(
      <HighlightText text="News & Events" query="events and news" />
    );
    expect(container).toHaveTextContent('News & Events');
    expect(
      Array.from(
        container.querySelectorAll('mark'),
        element => element.textContent
      )
    ).toEqual(['News', '&', 'Events']);
  });

  it.each(['GAR', 'gar', 'G-A-R', 'G.A.R.', 'G A R'])(
    'infers word initials for %s and preserves the original site-search query',
    query => {
      const items = flattenMenuItems([
        {
          title: 'Publications',
          items: [
            {
              title: 'Global Assessment Report 2025',
              url: '/gar',
              items: [{ title: 'Downloads', url: '/downloads' }],
            },
          ],
        },
      ]);
      expect(filterMenuItems(items, query).map(item => item.url)).toEqual([
        '/gar',
        '/downloads',
      ]);
      expect(getSiteSearchUrl('/search', query)).toBe(
        '/search#query=' + encodeURIComponent(query)
      );
    }
  );

  it('infers CamelCase initials and optional connector words without splitting capital runs', () => {
    const items = flattenMenuItems([
      { title: 'PreventionWeb', url: '/pw' },
      { title: 'Preventionweb', url: '/lower' },
      { title: 'International Day for Disaster Risk Reduction', url: '/day' },
      { title: 'XMLParser', url: '/xml' },
      { title: 'UNDRR', url: '/undrr' },
    ]);
    expect(filterMenuItems(items, 'pw').map(item => item.url)).toEqual(['/pw']);
    expect(filterMenuItems(items, 'iddrr').map(item => item.url)).toEqual([
      '/day',
    ]);
    expect(filterMenuItems(items, 'idf drr')).toEqual([]);
    expect(filterMenuItems(items, 'xp').map(item => item.url)).toEqual([
      '/xml',
    ]);
    expect(filterMenuItems(items, 'ud')).toEqual([]);
    expect(filterMenuItems(items, 'g')).toEqual([]);
  });

  it('ranks literal titles before inferred acronyms, preserving deduplication', () => {
    const items = [
      {
        title: 'Downloads',
        fullPath: 'Global Assessment Report',
        url: '/downloads',
      },
      { title: 'Global Assessment Report', fullPath: '', url: '/expanded' },
      { title: 'GAR archive', fullPath: '', url: '/archive' },
      { title: 'GAR', fullPath: '', url: '/literal' },
      { title: 'Global Assessment Report', fullPath: '', url: '/literal' },
    ];
    expect(filterMenuItems(items, 'gar').map(item => item.url)).toEqual([
      '/literal',
      '/archive',
      '/expanded',
      '/downloads',
    ]);
    expect(
      filterMenuItems(
        [
          {
            title: 'Report',
            fullPath: 'Global › Assessment',
            url: '/separate',
          },
        ],
        'gar'
      )
    ).toEqual([]);
    expect(
      filterMenuItems(
        [{ title: 'Global Assessment Report', url: '/full' }],
        'ga'
      )
    ).toEqual([]);
  });

  it.each(['RO', 'ro', 'R-O'])(
    'ranks exact acronym %s ahead of incidental inside-word matches',
    query => {
      const items = flattenMenuItems([
        { title: 'Conference Proceedings', url: '/proceedings' },
        { title: 'Working Groups', url: '/groups' },
        { title: 'Nairobi Office', url: '/nairobi' },
        { title: 'Junior Professional Officers', url: '/junior' },
        { title: 'Regional Offices', url: '/regional' },
        { title: 'Regional Organizations', url: '/organizations' },
      ]);
      expect(filterMenuItems(items, query).map(item => item.url)).toEqual([
        '/regional',
        '/organizations',
        '/proceedings',
        '/groups',
        '/nairobi',
        '/junior',
      ]);
      expect(filterMenuItems(items, 'region')[0].url).toBe('/regional');
    }
  );

  it('ranks exact titles and whole-word prefixes above acronym and inside-word matches', () => {
    const items = flattenMenuItems([
      { title: 'Conference Proceedings', url: '/inside' },
      { title: 'Regional Offices', url: '/initials' },
      { title: 'Annual Road Report', url: '/word' },
      { title: 'Road Maps', url: '/prefix' },
      { title: 'RO', url: '/exact' },
    ]);
    expect(filterMenuItems(items, 'ro').map(item => item.url)).toEqual([
      '/exact',
      '/prefix',
      '/word',
      '/initials',
      '/inside',
    ]);
  });

  it('does not highlight arbitrary individual letters in spelled acronym queries', () => {
    const { container } = render(
      <HighlightText text="Global Assessment Report" query="G-A-R" />
    );
    expect(container).toHaveTextContent('Global Assessment Report');
    expect(container.querySelector('mark')).toBeNull();
  });

  it('formats label templates with variables', () => {
    const formatted = formatLabel('Search all for "{query}" ({count})', {
      query: 'tsunami',
      count: 4,
    });
    expect(formatted).toBe('Search all for "tsunami" (4)');
  });

  describe('getSiteSearchUrl', () => {
    it('defaults to syndicated search hash parameter on /search', () => {
      expect(getSiteSearchUrl('/search', 'undrr')).toBe('/search#query=undrr');
      expect(getSiteSearchUrl(undefined, 'undrr')).toBe('/search#query=undrr');
    });

    it('preserves existing query template formats', () => {
      expect(getSiteSearchUrl('/search?q=', 'climate')).toBe(
        '/search?q=climate'
      );
      expect(getSiteSearchUrl('/search#query=', 'flood')).toBe(
        '/search#query=flood'
      );
      expect(getSiteSearchUrl('/search?query=', 'risk')).toBe(
        '/search?query=risk'
      );
    });

    it('handles custom base paths', () => {
      expect(getSiteSearchUrl('/site-search', 'disaster')).toBe(
        '/site-search#query=disaster'
      );
    });
  });
});

describe('MegaMenu Mobile Filter UI', () => {
  it('uses a shared outlined CTA and decorative arrow icon for mobile site search', () => {
    render(<MegaMenu sections={sampleSections} enableFilter />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Open navigation menu' })
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByRole('searchbox'), {
      target: { value: 'doc' },
    });
    const link = within(dialog).getByRole('link', {
      name: 'Search entire site for "doc"',
    });
    expect(link).toHaveClass(
      'mg-button',
      'mg-button-secondary',
      'mg-button-outline'
    );
    expect(link.querySelector('.mg-icon-arrow-right')).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('keeps the mobile drawer open while an IME handles composing Escape', () => {
    render(<MegaMenu sections={sampleSections} enableFilter />);
    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);
    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByRole('searchbox');
    input.focus();
    fireEvent.change(input, { target: { value: '文書' } });
    expect(fireEvent.keyDown(input, { key: 'Escape', isComposing: true })).toBe(
      true
    );
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(input).toHaveValue('文書');
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(dialog).toHaveAttribute('aria-hidden', 'true');
    expect(opener).toHaveFocus();
  });

  it('renders filter input in mobile sidebar when enableFilter is true', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog');
    const filterInput = within(dialog).getByPlaceholderText(
      'Find a page in this menu'
    );
    expect(filterInput).toBeInTheDocument();
  });

  it('live filters mobile items and displays fallback search link', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog');
    const filterInput = within(dialog).getByPlaceholderText(
      'Find a page in this menu'
    );
    fireEvent.change(filterInput, { target: { value: 'doc' } });

    // Live status update
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '1 menu items found'
    );
    expect(within(dialog).getByRole('status')).toHaveClass('mg-u-sr-only');

    // Matching link rendered
    const matchLink = within(dialog).getByRole('link', {
      name: /Documents and publications/i,
    });
    expect(matchLink).toHaveAttribute('href', '/documents');

    // Fallback full site search link rendered
    const searchLink = within(dialog).getByRole('link', {
      name: /Search entire site for "doc"/i,
    });
    // The rendered href leaves out the query, so click tracking never reports
    // what the visitor typed; the query is added only while the link is
    // followed, then removed again.
    expect(searchLink).toHaveAttribute('href', '/search?q=');
    jest.useFakeTimers();
    try {
      // A right click must not put the query into the context menu's link.
      fireEvent(
        searchLink,
        new MouseEvent('auxclick', { bubbles: true, button: 2 })
      );
      expect(searchLink).toHaveAttribute('href', '/search?q=');
      // A middle click opens a new tab and leaves the drawer open.
      fireEvent(
        searchLink,
        new MouseEvent('auxclick', { bubbles: true, button: 1 })
      );
      expect(searchLink).toHaveAttribute('href', '/search?q=doc');
      jest.runOnlyPendingTimers();
      expect(searchLink).toHaveAttribute('href', '/search?q=');
      // A click follows the link and closes the drawer.
      fireEvent.click(searchLink);
      expect(searchLink).toHaveAttribute('href', '/search?q=doc');
      jest.runOnlyPendingTimers();
      expect(searchLink).toHaveAttribute('href', '/search?q=');
    } finally {
      jest.useRealTimers();
    }
  });

  it('clears mobile filter and restores normal navigation on clear button click', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog');
    const filterInput = within(dialog).getByPlaceholderText(
      'Find a page in this menu'
    );
    fireEvent.change(filterInput, { target: { value: 'policy' } });

    const clearBtn = within(dialog).getByRole('button', {
      name: 'Clear filter',
    });
    fireEvent.click(clearBtn);

    expect(filterInput.value).toBe('');
    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
  });

  it('offers prominent site search when no mobile items match', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search"
      />
    );

    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog');
    const filterInput = within(dialog).getByPlaceholderText(
      'Find a page in this menu'
    );
    fireEvent.change(filterInput, { target: { value: 'nonexistent' } });

    expect(
      within(dialog).getByText('No matching pages in this menu')
    ).toBeInTheDocument();

    const siteSearchBtn = within(dialog).getByRole('link', {
      name: /Search entire site for "nonexistent"/i,
    });
    expect(siteSearchBtn).toHaveAttribute('href', '/search#query=');
    jest.useFakeTimers();
    try {
      fireEvent.click(siteSearchBtn);
      expect(siteSearchBtn).toHaveAttribute(
        'href',
        '/search#query=nonexistent'
      );
      jest.runOnlyPendingTimers();
      expect(siteSearchBtn).toHaveAttribute('href', '/search#query=');
    } finally {
      jest.useRealTimers();
    }
  });

  it('hides site search on mobile when enableSiteSearch is false', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        enableSiteSearch={false}
      />
    );

    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog');
    const filterInput = within(dialog).getByPlaceholderText(
      'Find a page in this menu'
    );
    fireEvent.change(filterInput, { target: { value: 'nonexistent' } });

    expect(
      within(dialog).queryByRole('link', {
        name: /Search entire site/i,
      })
    ).not.toBeInTheDocument();
  });

  it('passes accessibility audit in filtered state', async () => {
    const { container } = render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    const opener = screen.getByRole('button', { name: 'Open navigation menu' });
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog');
    const filterInput = within(dialog).getByPlaceholderText(
      'Find a page in this menu'
    );
    fireEvent.change(filterInput, { target: { value: 'hazard' } });

    expect(await axe(dialog)).toHaveNoViolations();
  });
});

async function openDesktopSection(name = 'Knowledge Base') {
  fireEvent.focus(screen.getByRole('link', { name, exact: true }));
  return screen.findByRole('region', { name, exact: true });
}

async function openDesktopFinder(name = 'Knowledge Base') {
  const panel = await openDesktopSection(name);
  fireEvent.click(within(panel).getByRole('button', { name: 'Find in menu' }));
  return panel;
}

describe('MegaMenu contextual desktop finder', () => {
  it('keeps Search unchanged and reveals the finder only after its utility action', async () => {
    render(
      <MegaMenu
        sections={[
          ...sampleSections,
          { title: 'Search', bannerButton: { url: '/search' } },
        ]}
        enableFilter
        hoverDelay={0}
      />
    );
    expect(screen.getByRole('link', { name: 'Search' })).toHaveAttribute(
      'href',
      '/search'
    );
    expect(
      screen.queryByRole('button', { name: 'Find a page' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    const panel = await openDesktopSection();
    expect(within(panel).queryByRole('searchbox')).not.toBeInTheDocument();
    expect(
      within(panel).getByRole('navigation', {
        name: 'Knowledge Base categories',
      })
    ).toBeInTheDocument();
    fireEvent.click(
      within(panel).getByRole('button', { name: 'Find in menu' })
    );
    expect(
      within(panel).getByRole('searchbox', { name: 'Find in menu' })
    ).toHaveFocus();
    expect(
      within(panel).getByRole('dialog', { name: 'Find in menu' })
    ).toHaveAttribute('open');
  });

  it('filters descendants in a modal and preserves the underlying menu', async () => {
    render(<MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />);
    const panel = await openDesktopFinder();
    const input = within(panel).getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'doc' } });
    expect(
      within(panel).getByRole('link', { name: /Documents and publications/ })
    ).toHaveAttribute('href', '/documents');
    expect(within(panel).getByRole('status')).toHaveClass('mg-u-sr-only');
    expect(
      within(panel).getByRole('dialog', { name: 'Find in menu' })
    ).toHaveAttribute('open');
    fireEvent.click(
      within(panel).getByRole('button', { name: 'Clear filter' })
    );
    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(
      within(panel).getByRole('dialog', { name: 'Find in menu' })
    ).toHaveAttribute('open');
    fireEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    expect(
      within(panel).getByRole('button', { name: 'Find in menu' })
    ).toHaveFocus();
    expect(
      within(panel).getByRole('navigation', {
        name: 'Knowledge Base categories',
      })
    ).toBeInTheDocument();
  });

  it('searches the entire menu regardless of the entry section and resets on Back', async () => {
    render(<MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />);
    const panel = await openDesktopFinder();
    fireEvent.change(within(panel).getByRole('searchbox'), {
      target: { value: 'terminology' },
    });
    expect(
      within(panel).getByRole('link', { name: /^Terminology/ })
    ).toHaveAttribute('href', '/terminology');
    fireEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    expect(
      within(panel).getByRole('navigation', {
        name: 'Knowledge Base categories',
      })
    ).toBeInTheDocument();
    const otherPanel = await openDesktopFinder('Understanding Risk');
    expect(within(otherPanel).getByRole('searchbox')).toHaveValue('');
    fireEvent.change(within(otherPanel).getByRole('searchbox'), {
      target: { value: 'doc' },
    });
    expect(
      within(otherPanel).getByRole('link', {
        name: /Documents and publications/,
      })
    ).toHaveAttribute('href', '/documents');
  });

  it('dismisses and clears the finder when filtering is disabled, without reopening when enabled', async () => {
    const { rerender } = render(
      <MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />
    );
    const panel = await openDesktopFinder();
    fireEvent.change(within(panel).getByRole('searchbox'), {
      target: { value: 'doc' },
    });
    rerender(
      <MegaMenu sections={sampleSections} enableFilter={false} hoverDelay={0} />
    );
    expect(within(panel).queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
    expect(document.querySelector('.mg-mega-topbar__item-link')).toHaveFocus();
    rerender(
      <MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />
    );
    expect(within(panel).queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(
      within(panel).getByRole('button', { name: 'Find in menu' })
    );
    expect(within(panel).getByRole('searchbox')).toHaveValue('');
  });

  it('dismisses when a data update removes its left-column utility', async () => {
    const { rerender } = render(
      <MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />
    );
    const panel = await openDesktopFinder();
    rerender(
      <MegaMenu
        sections={sampleSections.map((s, i) =>
          i === 0 ? { ...s, bannerDescription: '' } : s
        )}
        enableFilter
        hoverDelay={0}
      />
    );
    expect(within(panel).queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe('hidden');
    expect(document.querySelector('.mg-mega-topbar__item-link')).toHaveFocus();
    rerender(
      <MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />
    );
    expect(within(panel).queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('leaves composing Escape to the IME without closing either menu', async () => {
    render(<MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />);
    const panel = await openDesktopFinder();
    const input = within(panel).getByRole('searchbox');
    fireEvent.change(input, { target: { value: '文書' } });
    expect(fireEvent.keyDown(input, { key: 'Escape', isComposing: true })).toBe(
      true
    );
    expect(within(panel).getByRole('dialog')).toHaveAttribute('open');
    expect(input).toHaveValue('文書');
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(within(panel).queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      within(panel).getByRole('button', { name: 'Find in menu' })
    ).toHaveFocus();
  });

  it('moves focus through result links without hijacking text editing or browser shortcuts', async () => {
    render(<MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />);
    expect(fireEvent.keyDown(window, { key: '/' })).toBe(true);
    expect(fireEvent.keyDown(window, { key: 'k', ctrlKey: true })).toBe(true);
    const panel = await openDesktopFinder();
    const input = within(panel).getByRole('searchbox');
    input.focus();
    expect(fireEvent.keyDown(input, { key: 'ArrowLeft' })).toBe(true);
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'hazard' } });
    const links = within(panel).getAllByRole('link');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(links[0]).toHaveFocus();
    fireEvent.keyDown(links[0], { key: 'ArrowDown' });
    expect(links[1]).toHaveFocus();
    fireEvent.keyDown(links[1], { key: 'ArrowUp' });
    fireEvent.keyDown(links[0], { key: 'ArrowUp' });
    expect(input).toHaveFocus();
    const dialog = within(panel).getByRole('dialog');
    const close = within(dialog).getByRole('button', { name: 'Close' });
    const lastLink = within(dialog).getAllByRole('link').at(-1);
    lastLink.focus();
    fireEvent.keyDown(lastLink, { key: 'Tab' });
    expect(close).toHaveFocus();
    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true });
    expect(lastLink).toHaveFocus();
    input.focus();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(within(panel).queryByRole('searchbox')).not.toBeInTheDocument();
    const finderButton = within(panel).getByRole('button', {
      name: 'Find in menu',
    });
    expect(finderButton).toHaveFocus();
    fireEvent.keyDown(finderButton, { key: 'Escape' });
    expect(
      screen.queryByRole('region', { name: 'Knowledge Base' })
    ).not.toBeInTheDocument();
  });

  it('offers Ctrl+K only while focus is inside the expanded menu', async () => {
    render(<MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />);
    expect(fireEvent.keyDown(window, { key: 'k', ctrlKey: true })).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const panel = await openDesktopSection();
    const trigger = within(panel).getByRole('button', { name: 'Find in menu' });
    expect(trigger).toHaveAttribute('aria-keyshortcuts', 'Meta+k Control+k');
    trigger.focus();
    expect(fireEvent.keyDown(trigger, { key: 'k', ctrlKey: true })).toBe(false);
    expect(
      within(panel).getByRole('dialog', { name: 'Find in menu' })
    ).toHaveAttribute('open');
    expect(
      fireEvent.keyDown(within(panel).getByRole('searchbox'), {
        key: 'k',
        ctrlKey: true,
      })
    ).toBe(true);
    fireEvent.click(within(panel).getByRole('button', { name: 'Close' }));
    expect(trigger).toHaveFocus();
  });

  it('activates the contextual fallback on Enter and honours disabled site search', async () => {
    const onNavigate = jest.fn();
    const { rerender } = render(
      <MegaMenu
        sections={sampleSections}
        enableFilter
        hoverDelay={0}
        onNavigate={onNavigate}
      />
    );
    const panel = await openDesktopFinder();
    const input = within(panel).getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'earthquake' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onNavigate).toHaveBeenCalledWith('/search#query=earthquake');
    rerender(
      <MegaMenu
        sections={sampleSections}
        enableFilter
        hoverDelay={0}
        enableSiteSearch={false}
      />
    );
    const reopened = await openDesktopFinder();
    fireEvent.change(within(reopened).getByRole('searchbox'), {
      target: { value: 'earthquake' },
    });
    expect(
      within(within(reopened).getByRole('dialog')).queryByRole('link')
    ).not.toBeInTheDocument();
  });

  it('localizes the menu-wide scope and preserves label overrides', async () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter
        hoverDelay={0}
        lang="fr-CA"
        labels={{ menuFilterLabel: 'Chercher dans le menu' }}
      />
    );
    const panel = await openDesktopSection();
    fireEvent.click(
      within(panel).getByRole('button', { name: 'Chercher dans le menu' })
    );
    expect(
      within(panel).getByRole('searchbox', {
        name: 'Chercher dans le menu',
      })
    ).toBeInTheDocument();
    fireEvent.change(within(panel).getByRole('searchbox'), {
      target: { value: 'earthquake' },
    });
    expect(within(panel).getByRole('status')).toHaveTextContent(
      'Aucune page correspondante dans ce menu'
    );
  });

  it('passes axe in normal, filtered and empty states', async () => {
    render(<MegaMenu sections={sampleSections} enableFilter hoverDelay={0} />);
    const panel = await openDesktopFinder();
    expect(await axe(panel)).toHaveNoViolations();
    fireEvent.change(within(panel).getByRole('searchbox'), {
      target: { value: 'hazard' },
    });
    expect(await axe(panel)).toHaveNoViolations();
    fireEvent.change(within(panel).getByRole('searchbox'), {
      target: { value: 'earthquake' },
    });
    expect(await axe(panel)).toHaveNoViolations();
  });
});
