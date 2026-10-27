import { getUserFeedbackLabels } from '../../stories/Components/UserFeedback/UserFeedback.labels';
import { getCopyButtonLabels } from '../../stories/Components/Buttons/CopyButton/CopyButton.hydrate';
import { getShareButtonsLabels } from '../../stories/Components/Buttons/ShareButtons/ShareButtons.hydrate';
import { getServiceNoticeLabels } from '../../stories/Components/ServiceNotice/ServiceNotice.hydrate';
import { getDrawerLabels } from '../../stories/Components/Navigation/Drawer/Drawer.hydrate';
import { getGalleryLabels } from '../../stories/Components/Gallery/Gallery.hydrate';
import { getScrollContainerLabels } from '../../stories/Components/ScrollContainer/ScrollContainer.hydrate';
import { getMegaMenuLabels } from '../../stories/Components/MegaMenu/MegaMenu.hydrate';
import { getSyndicationSearchWidgetLabels } from '../../stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.hydrate';
import { getTabLabels } from '../../stories/Components/Tab/Tab';
import { getSnackbarLabels } from '../../stories/Components/Snackbar/Snackbar';
import { getOnThisPageNavLabels } from '../../stories/Components/OnThisPageNav/OnThisPageNav';
import { interpolateLabel } from '../../stories/Components/SyndicationSearchWidget/context/SearchContext';

const catalogues = [
  ['UserFeedback', getUserFeedbackLabels, 'yes', 'Oui'],
  [
    'CopyButton',
    getCopyButtonLabels,
    'ariaLabel',
    'Copier dans le presse-papiers',
  ],
  ['ShareButtons', getShareButtonsLabels, 'mainLabel', 'Partager'],
  [
    'ServiceNotice',
    getServiceNoticeLabels,
    'retryLabel',
    'Réessayer la connexion',
  ],
  ['Drawer', getDrawerLabels, 'closeLabel', 'Fermer'],
  ['Gallery', getGalleryLabels, 'galleryAriaLabel', 'Galerie'],
  [
    'ScrollContainer',
    getScrollContainerLabels,
    'scrollLeftLabel',
    'Faire défiler à gauche',
  ],
  ['MegaMenu', getMegaMenuLabels, 'closeLabel', 'Fermer'],
  [
    'SearchWidget',
    getSyndicationSearchWidgetLabels,
    'searchLabel',
    'Rechercher',
  ],
  ['Tab', getTabLabels, 'tabListLabel', 'Sections'],
  ['Snackbar', getSnackbarLabels, 'closeLabel', 'Fermer'],
  ['OnThisPageNav', getOnThisPageNavLabels, 'label', 'Sur cette page'],
];

describe.each(catalogues)(
  '%s public label resolver',
  (name, resolve, key, french) => {
    it('selects the existing French catalogue and keeps explicit labels ahead of defaults', () => {
      expect(resolve('fr-CA')[key]).toBe(french);
      expect(resolve('fr', { [key]: 'Custom' })[key]).toBe('Custom');
      expect(resolve('fr', { [key]: '' })[key]).toBe('');
      expect(resolve('unsupported')).toEqual(resolve('en'));
    });

    it.each(['en', 'ar', 'es', 'fr', 'ja', 'ru', 'zh'])(
      'publishes all English label keys for %s',
      lang => {
        const labels = resolve(lang);
        for (const [label, value] of Object.entries(resolve('en'))) {
          expect(Object.hasOwn(labels, label)).toBe(true);
          expect(['string', 'function']).toContain(typeof labels[label]);
          expect(['string', 'function']).toContain(typeof value);
        }
        if (lang !== 'en') expect(labels).not.toEqual(resolve('en'));
      }
    );
  }
);

it('retains search function labels for Arabic/Russian plurals and explicit function overrides', () => {
  for (const lang of ['ar', 'ru']) {
    const labels = getSyndicationSearchWidgetLabels(lang);
    expect(typeof labels.filtersButtonActive).toBe('function');
    expect(
      interpolateLabel(labels.filtersButtonActive, { count: 3 })
    ).not.toMatch(/\{count\}|undefined/);
  }
  const custom = ({ count }) => `Custom ${count}`;
  const labels = getSyndicationSearchWidgetLabels('ar', {
    filtersButtonActive: custom,
  });
  expect(interpolateLabel(labels.filtersButtonActive, { count: 3 })).toBe(
    'Custom 3'
  );
});
