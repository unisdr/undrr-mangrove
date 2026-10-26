export const LABELS_ES = {
  question: '¿Te ha resultado útil esta página?',
  yes: 'Sí',
  no: 'No',
  reportIssue: 'Informar de un problema en esta página',
  confirmationBeforeLink:
    'Gracias por tus comentarios. Si quieres, también puedes',
  confirmationLink: 'contarnos más',
  confirmationAfterLink: '.',
};

export const LABELS_FR = {
  question: 'Cette page vous a-t-elle été utile ?',
  yes: 'Oui',
  no: 'Non',
  reportIssue: 'Signaler un problème sur cette page',
  confirmationBeforeLink:
    'Merci pour votre avis. Si vous le souhaitez, vous pouvez aussi',
  confirmationLink: 'nous en dire plus',
  confirmationAfterLink: '.',
};

export const LABELS_JA = {
  question: 'このページは役に立ちましたか？',
  yes: 'はい',
  no: 'いいえ',
  reportIssue: 'このページの問題を報告する',
  confirmationBeforeLink: 'ご意見ありがとうございます。よろしければ、',
  confirmationSeparator: '',
  confirmationLink: '詳細をお聞かせください',
  confirmationAfterLink: '。',
};

export const LABELS_ZH = {
  question: '此页面对您有帮助吗？',
  yes: '是',
  no: '否',
  reportIssue: '报告此页面的问题',
  confirmationBeforeLink: '感谢您的反馈。如您愿意，也可以',
  confirmationSeparator: '',
  confirmationLink: '告诉我们更多信息',
  confirmationAfterLink: '。',
};

export const LABELS_AR = {
  question: 'هل كانت هذه الصفحة مفيدة؟',
  yes: 'نعم',
  no: 'لا',
  reportIssue: 'الإبلاغ عن مشكلة في هذه الصفحة',
  confirmationBeforeLink: 'شكراً لملاحظاتك. وإذا رغبت، يمكنك أيضاً',
  confirmationLink: 'إخبارنا بالمزيد',
  confirmationAfterLink: '.',
};

export const LABELS_RU = {
  question: 'Была ли эта страница полезной?',
  yes: 'Да',
  no: 'Нет',
  reportIssue: 'Сообщить о проблеме на этой странице',
  confirmationBeforeLink: 'Спасибо за ваш отзыв. При желании вы также можете',
  confirmationLink: 'рассказать нам подробнее',
  confirmationAfterLink: '.',
};
export const DEFAULT_USER_FEEDBACK_LABELS = {
  question: 'Is this page useful?',
  yes: 'Yes',
  no: 'No',
  reportIssue: 'Report an issue on this page',
  confirmationBeforeLink:
    'Thank you for your feedback. If you would like, you can also',
  confirmationSeparator: ' ',
  confirmationLink: 'tell us more',
  confirmationAfterLink: '.',
};

const TRANSLATIONS = {
  en: DEFAULT_USER_FEEDBACK_LABELS,
  ar: LABELS_AR,
  es: LABELS_ES,
  fr: LABELS_FR,
  ja: LABELS_JA,
  ru: LABELS_RU,
  zh: LABELS_ZH,
};

const EMPTY_LABELS = {};

export function resolveUserFeedbackLanguage(lang = 'en') {
  const language = String(lang).trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TRANSLATIONS, language) ? language : undefined;
}

export function getUserFeedbackLabels(lang, labels = EMPTY_LABELS) {
  return {
    ...DEFAULT_USER_FEEDBACK_LABELS,
    ...TRANSLATIONS[resolveUserFeedbackLanguage(lang)],
    ...labels,
  };
}
