import { Pagination } from './Pagination';
import {
  LABELS_AR,
  LABELS_ES,
  LABELS_FR,
  LABELS_JA,
  LABELS_RU,
  LABELS_ZH,
} from './_labels';

const LOCALE_LABELS = {
  spanish: LABELS_ES,
  french: LABELS_FR,
  japanese: LABELS_JA,
  chinese: LABELS_ZH,
  arabic: LABELS_AR,
  russian: LABELS_RU,
};

const withLocaleLabels = (Story, context) => {
  const labels = LOCALE_LABELS[context.globals?.locale];
  if (!labels) return <Story />;
  return <Story {...context} args={{ ...context.args, labels }} />;
};

// Content text (page number decorators) per locale — separate from UI labels.
const getCaptionForLocale = locale => {
  switch (locale) {
    case 'arabic':
      return { text: 'صفحة', text2: 'من' };
    case 'japanese':
      return { text: 'ページ', text2: 'の' };
    case 'spanish':
      return { text: 'Página', text2: 'de' };
    case 'french':
      return { text: 'Page', text2: 'sur' };
    case 'chinese':
      return { text: '第', text2: '页，共' };
    case 'russian':
      return { text: 'Страница', text2: 'из' };
    default:
      return { text: 'Page', text2: 'of' };
  }
};

export default {
  title: 'Components/Navigation/Pagination',
  component: Pagination,
  decorators: [withLocaleLabels],
};

export const DefaultPagination = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return (
      <Pagination
        text={caption.text}
        text2={caption.text2}
        labels={args.labels}
      />
    );
  },

  name: 'Pagination',
};
