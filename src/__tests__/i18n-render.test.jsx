import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { CopyButton } from '../../stories/Components/Buttons/CopyButton/CopyButton';
import { ServiceNotice } from '../../stories/Components/ServiceNotice/ServiceNotice';
import copyButtonFromElement from '../../stories/Components/Buttons/CopyButton/CopyButton.fromElement';
import serviceNoticeFromElement from '../../stories/Components/ServiceNotice/ServiceNotice.fromElement';
import { Drawer } from '../../stories/Components/Navigation/Drawer/Drawer';
import { Gallery } from '../../stories/Components/Gallery/Gallery';
import { Tab } from '../../stories/Components/Tab/Tab';
import OnThisPageNav from '../../stories/Components/OnThisPageNav/OnThisPageNav';
import Snackbar from '../../stories/Components/Snackbar/Snackbar';
import MegaMenu from '../../stories/Components/MegaMenu/MegaMenu';
import ShareButtons from '../../stories/Components/Buttons/ShareButtons/ShareButtons';
import { SyndicationSearchWidget } from '../../stories/Components/SyndicationSearchWidget/SyndicationSearchWidget';
import {
  SearchProvider,
  useSearchLabels,
  useSearchConfig,
  interpolateLabel,
} from '../../stories/Components/SyndicationSearchWidget/context/SearchContext';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,AAAA'),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const media = [
  { src: '/photo.jpg', alt: 'Example photo', title: 'Example photo' },
];
const tabs = [
  { text: 'Example', text_id: 'example', data: '<p>Example content</p>' },
];

it.each([
  ['CopyButton', CopyButton, {}, '.mg-copy-button', 'نسخ إلى الحافظة'],
  [
    'ServiceNotice',
    ServiceNotice,
    { title: 'Example service', onRetry: () => {} },
    '.mg-notice',
    'إعادة محاولة الاتصال',
  ],
  [
    'Drawer',
    Drawer,
    { isOpen: true, onClose: () => {}, title: 'Example drawer' },
    '.mg-drawer',
    'إغلاق',
  ],
  ['Gallery', Gallery, { media }, '.mg-gallery', 'العنصر التالي'],
  ['Tab', Tab, { tabdata: tabs }, '.mg-tabs', 'الأقسام'],
  [
    'OnThisPageNav',
    OnThisPageNav,
    { items: [{ href: '#example', text: 'Example' }] },
    '.mg-on-this-page-nav',
    'في هذه الصفحة',
  ],
  [
    'Snackbar',
    Snackbar,
    { opened: true, message: 'Example message', onClose: () => {} },
    '.mg-snackbar-wrapper',
    'إغلاق الإشعار',
  ],
  [
    'MegaMenu',
    MegaMenu,
    { sections: [] },
    '.mg-mega-wrapper',
    'التنقل الرئيسي',
  ],
  ['ShareButtons', ShareButtons, {}, '.mg-share', 'مشاركة'],
])(
  '%s uses runtime Arabic labels and places metadata on its root',
  (name, Component, props, selector, text) => {
    const { container } = render(<Component {...props} lang="ar-EG" />);
    const root = container.querySelector(selector);
    expect(root).toHaveAttribute('lang', 'ar-EG');
    expect(root).toHaveAttribute('dir', 'rtl');
    // Accessible labels may be attributes or visible copy, depending on the control.
    expect(root.outerHTML).toContain(text);
  }
);

it('CopyButton updates language without losing dedicated overrides or empty feedback', async () => {
  const originalClipboard = navigator.clipboard;
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue() },
  });
  try {
    const { rerender } = render(
      <CopyButton
        lang="fr"
        ariaLabel="Copy this URL"
        labels={{ tooltipLabel: '' }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy this URL' }));
    expect(
      await screen.findByText('Copié dans le presse-papiers.')
    ).toBeInTheDocument();
    expect(
      document.querySelector('.mg-copy-button__feedback')
    ).toBeEmptyDOMElement();
    rerender(
      <CopyButton
        lang="ar"
        ariaLabel="Copy this URL"
        labels={{ tooltipLabel: '' }}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Copy this URL' })
    ).toHaveAttribute('dir', 'rtl');
    expect(screen.getByText('تم النسخ إلى الحافظة.')).toBeInTheDocument();
  } finally {
    Object.assign(navigator, { clipboard: originalClipboard });
  }
});

it('ServiceNotice keeps dedicated labels above catalogue and label-object values', () => {
  render(
    <ServiceNotice
      lang="fr"
      title="Example"
      onRetry={() => {}}
      retryLabel="Reconnect"
      labels={{ retryLabel: 'Custom retry' }}
    />
  );
  expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
});

it('OnThisPageNav updates its accessible name when language changes', () => {
  const items = [{ href: '#one', text: 'Example section' }];
  const { rerender } = render(<OnThisPageNav lang="en" items={items} />);
  expect(
    screen.getByRole('navigation', { name: 'On this page' })
  ).toBeInTheDocument();
  rerender(<OnThisPageNav lang="fr" items={items} />);
  expect(
    screen.getByRole('navigation', { name: 'Sur cette page' })
  ).toHaveAttribute('lang', 'fr');
});

it('the QR dialog receives metadata independently of the share section', async () => {
  render(<ShareButtons lang="ar" dir="auto" />);
  fireEvent.click(screen.getByRole('button', { name: 'إنشاء رمز QR' }));
  const dialog = await waitFor(() => {
    expect(document.querySelector('dialog')).not.toBeNull();
    return document.querySelector('dialog');
  });
  expect(dialog).toHaveAttribute('lang', 'ar');
  expect(dialog).toHaveAttribute('dir', 'auto');
});

it('SearchProvider changes UI language and plural functions independently of content-language filters', () => {
  const config = { defaultFilters: [{ key: '_language', value: 'en' }] };
  function Probe() {
    const labels = useSearchLabels();
    const resolvedConfig = useSearchConfig();
    return (
      <div>
        <span>{labels.searchLabel}</span>
        <span>
          {interpolateLabel(labels.filtersButtonActive, { count: 3 })}
        </span>
        <span>{resolvedConfig.defaultFilters[0].value}</span>
      </div>
    );
  }
  const { rerender } = render(
    <SearchProvider lang="fr" config={config}>
      <Probe />
    </SearchProvider>
  );
  expect(screen.getByText('Rechercher')).toBeInTheDocument();
  const override = ({ count }) => `Custom ${count}`;
  rerender(
    <SearchProvider
      lang="ar"
      config={config}
      labels={{ filtersButtonActive: override }}
    >
      <Probe />
    </SearchProvider>
  );
  expect(screen.getByText('بحث')).toBeInTheDocument();
  expect(screen.getByText('Custom 3')).toBeInTheDocument();
  expect(screen.getByText('en')).toBeInTheDocument();
});

it.each([
  ['fr-CA', undefined, 'Rechercher…'],
  ['he-IL', { searchPlaceholder: 'חיפוש' }, 'חיפוש'],
])(
  'search external controls retain explicit direction for %s',
  async (lang, labels, placeholder) => {
    const searchTarget = document.body.appendChild(
      document.createElement('div')
    );
    const facetsTarget = document.body.appendChild(
      document.createElement('div')
    );
    searchTarget.dir = 'ltr';
    facetsTarget.dir = 'ltr';
    searchTarget.id = 'translated-search';
    facetsTarget.id = 'translated-facets';
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ tid: '1', name: 'Example term', vocabulary: 'hazards' }],
        hits: { hits: [], total: { value: 0 } },
        aggregations: {},
      }),
    });
    try {
      render(
        <SyndicationSearchWidget
          lang={lang}
          labels={labels}
          dir="rtl"
          config={{
            searchTarget: '#translated-search',
            facetsTarget: '#translated-facets',
            showFacets: true,
            facets: [],
            enableHashSync: false,
          }}
        />
      );
      await waitFor(() =>
        expect(
          searchTarget.querySelector('.mg-search__form-external')
        ).not.toBeNull()
      );
      for (const target of [searchTarget, facetsTarget]) {
        const wrapper = target.firstElementChild;
        expect(wrapper).toHaveAttribute('lang', lang);
        expect(wrapper).toHaveAttribute('dir', 'rtl');
      }
      expect(
        searchTarget.querySelector('input[type="search"]')
      ).toHaveAttribute('placeholder', placeholder);
    } finally {
      cleanup();
      searchTarget.remove();
      facetsTarget.remove();
      global.fetch = originalFetch;
    }
  }
);

it.each([
  { ariaLabel: '' },
  { labels: { ariaLabel: '' } },
  { ariaLabel: '', labels: { ariaLabel: '' } },
])(
  'CopyButton retains its translated accessible name for empty overrides: %j',
  props => {
    render(<CopyButton lang="fr" {...props} />);
    expect(
      screen.getByRole('button', { name: 'Copier dans le presse-papiers' })
    ).toBeInTheDocument();
  }
);

it.each([
  { retryLabel: '', statusUrlLabel: '' },
  { labels: { retryLabel: '', statusUrlLabel: '' } },
])(
  'ServiceNotice retains translated action names for empty overrides: %j',
  props => {
    render(
      <ServiceNotice
        lang="fr"
        title="Example service"
        onRetry={() => {}}
        statusUrl="https://example.org/status"
        {...props}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Réessayer la connexion' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Voir la page de statut/ })
    ).toBeInTheDocument();
  }
);

it('empty CMS naming attributes keep translated controls identifiable after hydration', () => {
  const copy = document.createElement('div');
  copy.lang = 'fr';
  copy.setAttribute('aria-label', '');
  copy.dataset.tooltipLabel = '';
  copy.dataset.labels = '{"ariaLabel":""}';
  const service = document.createElement('div');
  service.lang = 'fr';
  service.dataset.retry = '';
  service.dataset.retryLabel = '';
  service.dataset.statusUrl = 'https://example.org/status';
  service.dataset.statusUrlLabel = '';
  render(
    <>
      <CopyButton {...copyButtonFromElement(copy)} />
      <ServiceNotice {...serviceNoticeFromElement(service)} />
    </>
  );
  expect(
    screen.getByRole('button', { name: 'Copier dans le presse-papiers' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Réessayer la connexion' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /Voir la page de statut/ })
  ).toBeInTheDocument();
  expect(
    document.querySelector('.mg-copy-button__feedback')
  ).toBeEmptyDOMElement();
});
