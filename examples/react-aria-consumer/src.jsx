import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from 'react-aria-components';
import ComboBox from '@undrr/undrr-mangrove/components/ComboBox.js';
import { Drawer } from '@undrr/undrr-mangrove/components/Drawer.js';
import './app.css';

const copy = {
  en: {
    heading: 'Mangrove React island',
    intro:
      'A server-rendered page can supply taxonomy data to this optional React control. The surrounding page and ordinary forms still use Mangrove CSS and vanilla JavaScript.',
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
  },
  ar: {
    heading: 'مكوّن React داخل Mangrove',
    intro:
      'يمكن للصفحة المقدّمة من الخادم توفير بيانات التصنيف لهذا المكوّن الاختياري. وتبقى النماذج العادية قابلة للاستخدام دون React.',
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
  },
  fr: {
    heading: 'Module React dans Mangrove',
    intro:
      'Une page rendue par le serveur peut fournir des données de taxonomie à ce composant facultatif. Les formulaires ordinaires restent utilisables sans React.',
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
        <h1>{t.heading}</h1>
        <p>{t.intro}</p>
        <button type="button" onClick={() => setOpen(true)}>
          {t.open}
        </button>
        <p role="status" data-testid="saved-value">
          {saved}
        </p>

        <Drawer
          isOpen={open}
          onClose={() => setOpen(false)}
          title={t.title}
          labels={{ closeLabel: t.close }}
        >
          <div ref={setPortalHost} className="consumer-fields">
            <label>
              {t.theme}
              <select
                aria-label={t.theme}
                value={theme}
                onChange={event => setTheme(event.target.value)}
              >
                {['mangrove', 'preventionweb', 'irp', 'mcr', 'delta'].map(
                  brand => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  )
                )}
              </select>
            </label>
            <label>
              {t.language}
              <select
                aria-label={t.language}
                value={locale}
                onChange={event => setLocale(event.target.value)}
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
              </select>
            </label>
            <form onSubmit={save}>
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
              <button type="submit">{t.submit}</button>
            </form>
          </div>
        </Drawer>
      </main>
    </I18nProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
