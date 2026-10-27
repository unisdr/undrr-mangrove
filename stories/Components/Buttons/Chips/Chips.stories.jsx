import { Chips } from './Chips';

const getCaptionForLocale = locale => {
  switch (locale) {
    case 'english':
      const engText = { detail: 'Label' };
      return engText;
    case 'arabic':
      const arabicText = { detail: 'ملصق' };
      return arabicText;
    case 'japanese':
      const japaneseText = { detail: 'ラベル' };
      return japaneseText;
    default:
      return { detail: 'Label' };
  }
};

export default {
  title: 'Components/Buttons/Chips',
  component: Chips,

  argTypes: {
    Type: {
      options: ['Default', 'With X'],

      control: {
        type: 'inline-radio',
      },
    },
  },
};

export const DefaultChips = {
  render: (args, { globals: { locale } }) => {
    const caption = getCaptionForLocale(locale);
    return <Chips label={caption.detail} {...args}></Chips>;
  },

  name: 'Chips',
};

export const Dismissible = {
  args: {
    label: 'Earthquake',
    Type: 'With X',
  },
};

export const LongLabels = {
  render: () => (
    <div style={{ display: 'grid', gap: '0.75rem', justifyItems: 'start' }}>
      <Chips label="Disaster risk financing and insurance" href="#" />
      <Chips
        label="Réduction des risques de catastrophe"
        Type="With X"
        removeLabel="Supprimer le filtre : Réduction des risques de catastrophe"
      />
      <div dir="rtl" lang="ar">
        <Chips
          label="الحد من مخاطر الكوارث"
          Type="With X"
          removeLabel="إزالة عامل التصفية: الحد من مخاطر الكوارث"
        />
      </div>
    </div>
  ),
  name: 'Long labels and RTL',
};
