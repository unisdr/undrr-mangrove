import copyButton from '../../stories/Components/Buttons/CopyButton/CopyButton.fromElement';
import shareButtons from '../../stories/Components/Buttons/ShareButtons/ShareButtons.fromElement';
import drawer from '../../stories/Components/Navigation/Drawer/Drawer.fromElement';
import gallery from '../../stories/Components/Gallery/Gallery.fromElement';
import megaMenu from '../../stories/Components/MegaMenu/MegaMenu.fromElement';
import scrollContainer from '../../stories/Components/ScrollContainer/ScrollContainer.fromElement';
import serviceNotice from '../../stories/Components/ServiceNotice/ServiceNotice.fromElement';
import userFeedback from '../../stories/Components/UserFeedback/UserFeedback.fromElement';
import searchWidget from '../../stories/Components/SyndicationSearchWidget/SyndicationSearchWidget.fromElement';

it.each([
  ['CopyButton', copyButton],
  ['ShareButtons', shareButtons],
  ['Drawer', drawer],
  ['Gallery', gallery],
  ['MegaMenu', megaMenu],
  ['ScrollContainer', scrollContainer],
  ['ServiceNotice', serviceNotice],
  ['UserFeedback', userFeedback],
  ['SearchWidget', searchWidget],
])(
  '%s adapter uses local language boundaries and an explicit host direction',
  (name, fromElement) => {
    const doc = document.implementation.createHTMLDocument();
    doc.documentElement.lang = 'fr-CA';
    const parent = doc.body.appendChild(doc.createElement('section'));
    parent.dir = 'rtl';
    const container = parent.appendChild(doc.createElement('div'));
    expect(fromElement(container).lang).toBe('fr-CA');
    expect(fromElement(container).dir).toBeUndefined();
    container.lang = 'ja';
    expect(fromElement(container).lang).toBe('ja');
    container.dataset.lang = 'ar-EG';
    container.setAttribute('dir', 'LTR');
    expect(fromElement(container)).toMatchObject({ lang: 'ar-EG', dir: 'ltr' });
    container.dataset.lang = '';
    expect(fromElement(container).lang).toBe('');
    delete container.dataset.lang;
    container.lang = '';
    expect(fromElement(container).lang).toBe('');
  }
);

it('ShareButtons does not inject English strings over a selected translation', () => {
  const el = document.createElement('section');
  el.lang = 'fr';
  expect(shareButtons(el).labels).toEqual({});
  el.dataset.labels = '{"mainLabel":"Custom share","onCopy":""}';
  el.dataset.mainLabel = 'Direct label';
  expect(shareButtons(el).labels).toEqual({
    mainLabel: 'Direct label',
    onCopy: '',
  });
});

it.each([
  ['CopyButton', copyButton],
  ['ServiceNotice', serviceNotice],
  ['SearchWidget', searchWidget],
  ['Drawer', drawer],
  ['Gallery', gallery],
  ['MegaMenu', megaMenu],
  ['ShareButtons', shareButtons],
  ['ScrollContainer', scrollContainer],
])(
  '%s ignores invalid/non-object JSON label overrides',
  (name, fromElement) => {
    for (const data of ['null', '[]', '"text"', '{invalid']) {
      const el = document.createElement('div');
      el.lang = 'fr';
      el.dataset.labels = data;
      expect(() => fromElement(el)).not.toThrow();
      expect(fromElement(el).lang).toBe('fr');
    }
  }
);
it('CopyButton keeps intentional empty feedback through hydration', () => {
  const el = document.createElement('div');
  el.dataset.lang = 'fr';
  el.dataset.tooltipLabel = '';
  el.dataset.labels =
    '{"tooltipLabel":"Should not win","failedLabel":"Failure"}';
  expect(copyButton(el)).toMatchObject({
    lang: 'fr',
    tooltipLabel: '',
    labels: { failedLabel: 'Failure' },
  });
});

it('UserFeedback merges JSON overrides below individual attributes', () => {
  const el = document.createElement('div');
  el.lang = 'fr';
  el.dataset.labels = '{"yes":"Oui oui","no":"Non merci"}';
  el.dataset.noLabel = '';
  expect(userFeedback(el).labels).toEqual({ yes: 'Oui oui', no: '' });
});
it('ScrollContainer preserves an explicit empty region label', () => {
  const el = document.createElement('div');
  el.lang = 'fr';
  el.dataset.ariaLabel = '';
  expect(scrollContainer(el).ariaLabel).toBe('');
});
