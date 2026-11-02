import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { axe } from 'jest-axe';
import MegaMenu from '../MegaMenu';
import {
  flattenMenuItems,
  filterMenuItems,
  formatLabel,
  getSiteSearchUrl,
} from '../filterUtils';

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
      'Filter menu items...'
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
      'Filter menu items...'
    );
    fireEvent.change(filterInput, { target: { value: 'doc' } });

    // Live status update
    expect(within(dialog).getByRole('status')).toHaveTextContent(
      '1 menu items found'
    );

    // Matching link rendered
    const matchLink = within(dialog).getByRole('link', {
      name: /Documents and publications/i,
    });
    expect(matchLink).toHaveAttribute('href', '/documents');

    // Fallback full site search link rendered
    const searchLink = within(dialog).getByRole('link', {
      name: /Search entire site for "doc"/i,
    });
    expect(searchLink).toHaveAttribute('href', '/search?q=doc');
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
      'Filter menu items...'
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
      'Filter menu items...'
    );
    fireEvent.change(filterInput, { target: { value: 'nonexistent' } });

    expect(
      within(dialog).getByText('No menu items match your filter')
    ).toBeInTheDocument();

    const siteSearchBtn = within(dialog).getByRole('link', {
      name: /Search entire site for "nonexistent"/i,
    });
    expect(siteSearchBtn).toHaveAttribute('href', '/search#query=nonexistent');
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
      'Filter menu items...'
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
      'Filter menu items...'
    );
    fireEvent.change(filterInput, { target: { value: 'hazard' } });

    expect(await axe(dialog)).toHaveNoViolations();
  });
});

describe('MegaMenu Desktop QuickNav Modal', () => {
  it('opens QuickNav modal on trigger button click', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    const jumpBtn = screen.getByRole('button', { name: /Jump to/i });
    fireEvent.click(jumpBtn);

    const quickNavDialog = screen.getByRole('dialog', {
      name: /Filter menu items/i,
    });
    expect(quickNavDialog).toBeInTheDocument();
  });

  it('opens QuickNav on global slash keydown', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    fireEvent.keyDown(window, { key: '/' });

    const quickNavDialog = screen.getByRole('dialog', {
      name: /Filter menu items/i,
    });
    expect(quickNavDialog).toBeInTheDocument();
  });

  it('live filters across all sections and closes on escape', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    fireEvent.keyDown(window, { key: 'k', metaKey: true });

    const quickNavDialog = screen.getByRole('dialog', {
      name: /Filter menu items/i,
    });
    const input =
      within(quickNavDialog).getByPlaceholderText(/Filter menu items/i);
    fireEvent.change(input, { target: { value: 'terminology' } });

    expect(within(quickNavDialog).getByRole('status')).toHaveTextContent(
      '1 menu items found'
    );
    expect(
      within(quickNavDialog).getByRole('link', {
        name: /^Terminology/i,
      })
    ).toBeInTheDocument();

    fireEvent.keyDown(quickNavDialog, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', { name: /Filter menu items/i })
    ).not.toBeInTheDocument();
  });

  it('offers default-on site search when no items are found and triggers on enter', () => {
    const onNavigateMock = jest.fn();

    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search"
        onNavigate={onNavigateMock}
      />
    );

    fireEvent.keyDown(window, { key: '/' });
    const quickNavDialog = screen.getByRole('dialog', {
      name: /Filter menu items/i,
    });
    const input =
      within(quickNavDialog).getByPlaceholderText(/Filter menu items/i);
    fireEvent.change(input, { target: { value: 'undrr' } });

    expect(
      within(quickNavDialog).getByText('No menu items match your filter')
    ).toBeInTheDocument();

    const emptyActions = quickNavDialog.querySelector(
      '.mg-mega-quicknav__empty-actions'
    );
    const emptyCta = within(emptyActions).getByRole('link', {
      name: /Search entire site for "undrr"/i,
    });
    expect(emptyCta).toHaveAttribute('href', '/search#query=undrr');

    // Press Enter to trigger site search
    fireEvent.keyDown(quickNavDialog, { key: 'Enter' });
    expect(onNavigateMock).toHaveBeenCalledWith('/search#query=undrr');
  });

  it('hides site search in desktop modal when enableSiteSearch is false', () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        enableSiteSearch={false}
      />
    );

    fireEvent.keyDown(window, { key: '/' });
    const quickNavDialog = screen.getByRole('dialog', {
      name: /Filter menu items/i,
    });
    const input =
      within(quickNavDialog).getByPlaceholderText(/Filter menu items/i);
    fireEvent.change(input, { target: { value: 'undrr' } });

    expect(
      within(quickNavDialog).getByText('No menu items match your filter')
    ).toBeInTheDocument();
    expect(
      within(quickNavDialog).queryByRole('link', {
        name: /Search entire site/i,
      })
    ).not.toBeInTheDocument();
  });

  it('passes axe accessibility audit for desktop QuickNav modal', async () => {
    render(
      <MegaMenu
        sections={sampleSections}
        enableFilter={true}
        searchUrl="/search?q="
      />
    );

    fireEvent.keyDown(window, { key: '/' });
    const quickNavDialog = screen.getByRole('dialog', {
      name: /Filter menu items/i,
    });

    expect(await axe(quickNavDialog)).toHaveNoViolations();
  });
});
