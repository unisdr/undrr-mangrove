import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from 'react-aria-components';
import ComboBox from '@undrr/undrr-mangrove/components/ComboBox.js';
import { Drawer } from '@undrr/undrr-mangrove/components/Drawer.js';
import Select from '@undrr/undrr-mangrove/components/Select.js';
import { Tab } from '@undrr/undrr-mangrove/components/Tab.js';
import './app.css';

const themeOptions = ['mangrove', 'preventionweb', 'irp', 'mcr', 'delta'].map(
  brand => ({ value: brand, label: brand })
);

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
  { value: 'fr', label: 'Français' },
];

const copy = {
  en: {
    kicker: 'Integration example',
    heading: 'Mangrove and React Aria, together',
    intro:
      'This demo models a small React island on a server-rendered Drupal page. It uses Mangrove’s assembled package and a local API fixture shaped like taxonomy data.',
    howTitle: 'How the pieces fit',
    steps: [
      {
        title: 'Data from an API',
        body: 'A JSON response supplies hazard IDs and translated labels. A Drupal site could provide the same data through its API.',
      },
      {
        title: 'Search from React Aria',
        body: 'Mangrove’s ComboBox uses React Aria for filtering, keyboard navigation, selection and required-field feedback.',
      },
      {
        title: 'One Mangrove interface',
        body: 'The Drawer, native selects, buttons and themes use Mangrove’s existing controls. Suggestions stay inside the Drawer so they inherit its theme.',
      },
    ],
    tryTitle: 'Try the integration',
    tryBody:
      'Open the form, change the theme or language, then choose a hazard. Save shows the submitted taxonomy ID here; this demo does not write to Drupal.',
    savedLabel: 'Submitted taxonomy ID',
    open: 'Open hazard form',
    close: 'Close',
    title: 'Choose a hazard',
    hazard: 'Hazard type',
    help: 'Search the taxonomy terms or open the suggestions.',
    error: 'Choose a hazard.',
    suggestions: 'Show suggested hazards',
    submit: 'Save',
    theme: 'Theme',
    language: 'Language',
    sharedTitle: 'One theme, two interaction engines',
    sharedBody:
      'Change the theme in the form, then close the Drawer. The ComboBox and these Mangrove Tabs follow the same interactive colour token. Mangrove owns their appearance; each control keeps the interaction engine that suits its job.',
    sourceToken: 'Theme source',
    comboToken: 'ComboBox accent',
    tabToken: 'Tabs indicator',
    tabsTitle: 'Why these are Mangrove Tabs',
    tabsBody:
      'This is the published Mangrove Tab component. Its React wrapper uses the same vanilla JavaScript tabs runtime that can enhance server-rendered Drupal markup. Try the arrow keys; a URL fragment can also select a panel on load.',
    tabsLabel: 'Integration choices',
    tabs: [
      {
        text: 'Existing Tabs',
        data: '<p>Use the same Mangrove tabs in React or server-rendered HTML. The current runtime supports keyboard navigation, RTL, URL hashes and mobile stacking without requiring React Aria.</p>',
      },
      {
        text: 'React Aria candidate',
        data: '<p>React Aria Tabs offer other interaction modes, including vertical layout and manual keyboard activation. They could power this same Mangrove API if a real need justifies the change and existing behaviour remains covered.</p>',
      },
    ],
    buttonsNote:
      'The form actions remain native buttons with Mangrove’s mg-button classes. React Aria is used where the searchable choice needs its collection and keyboard behaviour; it does not add a second Button or Tabs API.',
  },
  ar: {
    kicker: 'مثال على التكامل',
    heading: 'Mangrove وReact Aria معًا',
    intro:
      'يحاكي هذا العرض مكوّن React صغيرًا داخل صفحة Drupal مقدّمة من الخادم. ويستخدم حزمة Mangrove المجمّعة وبيانات محلية تشبه بيانات التصنيف من واجهة برمجة التطبيقات.',
    howTitle: 'كيف تتكامل الأجزاء',
    steps: [
      {
        title: 'بيانات من واجهة برمجة التطبيقات',
        body: 'توفّر استجابة JSON معرّفات المخاطر وتسمياتها المترجمة. ويمكن لموقع Drupal توفير البيانات نفسها عبر واجهته.',
      },
      {
        title: 'البحث عبر React Aria',
        body: 'يستخدم مربّع الاختيار في Mangrove أدوات React Aria للتصفية والتنقّل بلوحة المفاتيح والاختيار والتحقّق من الحقل المطلوب.',
      },
      {
        title: 'واجهة Mangrove موحّدة',
        body: 'يستخدم الدرج والقوائم الأصلية والأزرار والسمات عناصر Mangrove المعتادة. وتبقى الاقتراحات داخل الدرج لترث سمته.',
      },
    ],
    tryTitle: 'جرّب التكامل',
    tryBody:
      'افتح النموذج وغيّر السمة أو اللغة ثم اختر نوع خطر. يعرض الحفظ معرّف التصنيف المقدَّم هنا؛ هذا العرض لا يكتب إلى Drupal.',
    savedLabel: 'معرّف التصنيف المقدَّم',
    open: 'افتح نموذج المخاطر',
    close: 'أغلق',
    title: 'اختر نوع الخطر',
    hazard: 'نوع الخطر',
    help: 'ابحث في المصطلحات أو افتح الاقتراحات.',
    error: 'اختر نوع الخطر.',
    suggestions: 'اعرض المخاطر المقترحة',
    submit: 'احفظ',
    theme: 'السمة',
    language: 'اللغة',
    sharedTitle: 'سمة واحدة وطريقتان للتفاعل',
    sharedBody:
      'غيّر السمة في النموذج ثم أغلق الدرج. يتبع مربّع الاختيار وعلامات تبويب Mangrove الرمز نفسه للون التفاعلي. تحدد Mangrove المظهر، ويستخدم كل عنصر آلية التفاعل المناسبة له.',
    sourceToken: 'رمز السمة',
    comboToken: 'لون مربّع الاختيار',
    tabToken: 'مؤشر علامات التبويب',
    tabsTitle: 'لماذا هذه علامات تبويب Mangrove',
    tabsBody:
      'هذا مكوّن Tab المنشور من Mangrove. يستخدم غلاف React آلية JavaScript نفسها التي يمكنها تحسين صفحات Drupal المقدّمة من الخادم. جرّب مفاتيح الأسهم؛ ويمكن لجزء من عنوان URL اختيار لوحة عند تحميل الصفحة.',
    tabsLabel: 'خيارات التكامل',
    tabs: [
      {
        text: 'علامات التبويب الحالية',
        data: '<p>تعمل علامات تبويب Mangrove نفسها في React أو HTML المقدّم من الخادم. وتدعم الآلية الحالية لوحة المفاتيح واتجاه RTL وروابط العناوين والتخطيط للأجهزة الصغيرة دون React Aria.</p>',
      },
      {
        text: 'خيار React Aria',
        data: '<p>تتيح علامات تبويب React Aria أنماطًا أخرى، منها التخطيط العمودي والتنشيط اليدوي بلوحة المفاتيح. ويمكن استخدامها داخل واجهة Mangrove نفسها عند وجود حاجة حقيقية مع الحفاظ على السلوك الحالي.</p>',
      },
    ],
    buttonsNote:
      'تظل إجراءات النموذج أزرارًا أصلية بفئات mg-button من Mangrove. تُستخدم React Aria عندما يحتاج الاختيار القابل للبحث إلى سلوك القوائم ولوحة المفاتيح؛ ولا تضيف واجهة ثانية للأزرار أو علامات التبويب.',
  },
  fr: {
    kicker: 'Exemple d’intégration',
    heading: 'Mangrove et React Aria, ensemble',
    intro:
      'Cette démonstration simule un petit module React dans une page Drupal rendue par le serveur. Elle utilise le paquet Mangrove assemblé et des données locales imitant une API de taxonomie.',
    howTitle: 'Comment les éléments se complètent',
    steps: [
      {
        title: 'Données d’une API',
        body: 'Une réponse JSON fournit les identifiants des aléas et leurs libellés traduits. Un site Drupal pourrait fournir ces mêmes données via son API.',
      },
      {
        title: 'Recherche avec React Aria',
        body: 'La ComboBox de Mangrove utilise React Aria pour le filtrage, le clavier, la sélection et la validation du champ obligatoire.',
      },
      {
        title: 'Une seule interface Mangrove',
        body: 'Le tiroir, les listes natives, les boutons et les thèmes utilisent les composants Mangrove existants. Les suggestions restent dans le tiroir et héritent de son thème.',
      },
    ],
    tryTitle: 'Essayer l’intégration',
    tryBody:
      'Ouvrez le formulaire, changez le thème ou la langue, puis choisissez un aléa. Enregistrer affiche ici son identifiant de taxonomie ; cette démonstration n’écrit rien dans Drupal.',
    savedLabel: 'Identifiant de taxonomie envoyé',
    open: 'Ouvrir le formulaire',
    close: 'Fermer',
    title: 'Choisir un aléa',
    hazard: 'Type d’aléa',
    help: 'Recherchez un terme ou ouvrez les suggestions.',
    error: 'Choisissez un aléa.',
    suggestions: 'Afficher les aléas suggérés',
    submit: 'Enregistrer',
    theme: 'Thème',
    language: 'Langue',
    sharedTitle: 'Un thème, deux moteurs d’interaction',
    sharedBody:
      'Changez le thème dans le formulaire, puis fermez le tiroir. La ComboBox et ces onglets Mangrove suivent le même jeton de couleur interactive. Mangrove définit leur apparence ; chaque contrôle conserve le moteur adapté à son usage.',
    sourceToken: 'Jeton du thème',
    comboToken: 'Accent de la ComboBox',
    tabToken: 'Indicateur des onglets',
    tabsTitle: 'Pourquoi ces onglets restent Mangrove',
    tabsBody:
      'Voici le composant Tab publié par Mangrove. Son enveloppe React utilise le même moteur JavaScript que celui des pages Drupal rendues par le serveur. Essayez les flèches ; un fragment d’URL peut aussi sélectionner un panneau au chargement.',
    tabsLabel: 'Choix d’intégration',
    tabs: [
      {
        text: 'Onglets existants',
        data: '<p>Les mêmes onglets Mangrove fonctionnent dans React et le HTML rendu par le serveur. Le moteur actuel prend en charge le clavier, le sens RTL, les liens URL et l’empilement mobile sans React Aria.</p>',
      },
      {
        text: 'Piste React Aria',
        data: '<p>React Aria Tabs propose aussi une disposition verticale et une activation manuelle au clavier. Ce moteur pourrait servir la même interface Mangrove si un besoin concret le justifie et si le comportement actuel est préservé.</p>',
      },
    ],
    buttonsNote:
      'Les actions du formulaire restent des boutons natifs avec les classes mg-button de Mangrove. React Aria sert au choix avec recherche, qui demande un comportement de liste et de clavier ; il ne crée pas une deuxième interface pour les boutons ou les onglets.',
  },
};

function App() {
  const [terms, setTerms] = useState([]);
  const [theme, setTheme] = useState('mangrove');
  const [locale, setLocale] = useState('en');
  const [open, setOpen] = useState(false);
  const [portalHost, setPortalHost] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [saved, setSaved] = useState('');
  const t = copy[locale];
  // These panel strings are fixed, authored markup. Dynamic CMS HTML must be
  // filtered before it reaches Tab's intentionally unescaped panel API.
  const tabdata = useMemo(
    () =>
      t.tabs.map((tab, index) => ({
        ...tab,
        text_id: `consumer-integration-${index + 1}`,
      })),
    [t]
  );

  useEffect(() => {
    fetch('./api/hazards.json')
      .then(response => response.json())
      .then(payload => setTerms(payload.data));
  }, []);

  const items = terms.map(term => ({
    id: term.id,
    label: term.attributes.name[locale],
  }));

  const save = event => {
    event.preventDefault();
    setSaved(new FormData(event.currentTarget).get('hazard') || '');
    setOpen(false);
  };

  return (
    <I18nProvider locale={locale}>
      <main
        className={[
          'consumer-shell',
          theme !== 'mangrove' && `mg-theme-${theme}`,
        ]
          .filter(Boolean)
          .join(' ')}
        lang={locale}
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
      >
        <header className="consumer-hero">
          <p className="consumer-kicker">{t.kicker}</p>
          <h1>{t.heading}</h1>
          <p className="consumer-lede">{t.intro}</p>
        </header>

        <section className="consumer-try" aria-labelledby="consumer-try-title">
          <h2 id="consumer-try-title">{t.tryTitle}</h2>
          <p>{t.tryBody}</p>
          <button
            type="button"
            className="mg-button mg-button-secondary mg-button-outline"
            onClick={() => setOpen(true)}
          >
            {t.open}
          </button>
          <p
            role="status"
            className="consumer-result"
            data-testid="saved-value"
          >
            {saved && (
              <>
                {t.savedLabel}: <code>{saved}</code>
              </>
            )}
          </p>
        </section>

        <section className="consumer-how" aria-labelledby="consumer-how-title">
          <h2 id="consumer-how-title">{t.howTitle}</h2>
          <div className="consumer-steps">
            {t.steps.map(step => (
              <div className="consumer-step" key={step.title}>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          className="consumer-shared"
          aria-labelledby="consumer-shared-title"
        >
          <h2 id="consumer-shared-title">{t.sharedTitle}</h2>
          <p>{t.sharedBody}</p>
          <div className="consumer-token-flow">
            <div className="consumer-token">
              <span className="consumer-token__swatch consumer-token__swatch--source" />
              <span>{t.sourceToken}</span>
              <code>--mg-color-interactive</code>
            </div>
            <div className="consumer-token">
              <span className="consumer-token__swatch consumer-token__swatch--combo" />
              <span>{t.comboToken}</span>
              <code>--mg-control-accent</code>
            </div>
            <div className="consumer-token">
              <span className="consumer-token__swatch consumer-token__swatch--tabs" />
              <span>{t.tabToken}</span>
              <code>--mg-tab-indicator--active</code>
            </div>
          </div>
          <h3>{t.tabsTitle}</h3>
          <p>{t.tabsBody}</p>
          <Tab tabdata={tabdata} labels={{ tabListLabel: t.tabsLabel }} />
          <p className="consumer-shared__note">{t.buttonsNote}</p>
        </section>

        <Drawer
          isOpen={open}
          onClose={() => setOpen(false)}
          title={t.title}
          labels={{ closeLabel: t.close }}
        >
          <div ref={setPortalHost} className="consumer-fields">
            <Select
              id="consumer-theme"
              label={t.theme}
              options={themeOptions}
              value={theme}
              onChange={event => setTheme(event.target.value)}
            />
            <Select
              id="consumer-language"
              label={t.language}
              options={languageOptions}
              value={locale}
              onChange={event => setLocale(event.target.value)}
            />
            <form className="consumer-form" onSubmit={save}>
              <ComboBox
                key={locale}
                id="hazard-type"
                name="hazard"
                label={t.hazard}
                items={items}
                helpText={t.help}
                errorText={t.error}
                openButtonLabel={t.suggestions}
                required
                error={selectedKey == null ? undefined : false}
                selectedKey={selectedKey}
                onSelectionChange={setSelectedKey}
                popoverContainer={portalHost}
              />
              <button type="submit" className="mg-button mg-button-primary">
                {t.submit}
              </button>
            </form>
          </div>
        </Drawer>
      </main>
    </I18nProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
