/**
 * Story content for the quiz components, in English and Arabic.
 *
 * Question content belongs to the consumer and is translated by the consumer;
 * only the interface labels come from the component. These fixtures let the
 * locale toolbar show a realistic right-to-left page. Other locales show the
 * English content with translated interface labels.
 */

export const QUESTIONS = {
  multipleChoice: {
    type: 'multiple_choice',
    prompt:
      'Which hazard are we talking about?\nThis invisible wave of energy can penetrate the Earth’s ozone layer and reach the surface.',
    options: [
      { value: 'uv', label: 'Ultraviolet radiation', correct: true },
      { value: 'ionospheric', label: 'Ionospheric storm' },
      { value: 'chlorine', label: 'Chlorine' },
      { value: 'anthrax', label: 'Anthrax' },
    ],
    explanation:
      'Ultraviolet radiation from the sun reaches the surface when the ozone layer does not absorb it. Overexposure can cause skin cancer and eye damage.',
  },
  multipleAnswers: {
    type: 'multiple_choice',
    multiple: true,
    prompt: 'Which of these hazards are water-related?',
    options: [
      { value: 'flood', label: 'Flood', correct: true },
      { value: 'surge', label: 'Storm surge', correct: true },
      { value: 'earthquake', label: 'Earthquake' },
    ],
    explanation:
      'Floods and storm surges are hydrometeorological hazards. An earthquake is a geological hazard, although it can trigger a tsunami.',
  },
  trueFalse: {
    type: 'true_false',
    prompt: 'A storm tide is the same thing as a tsunami.',
    answer: false,
    explanation:
      'A storm tide is the predicted tide plus a storm surge. A tsunami is a series of waves caused by a sudden displacement of water.',
  },
  shortAnswer: {
    type: 'text',
    prompt: 'Which framework guides global disaster risk reduction to 2030?',
    expected: [
      'Sendai Framework',
      'Sendai Framework for Disaster Risk Reduction',
    ],
    explanation:
      'The Sendai Framework for Disaster Risk Reduction 2015–2030 was adopted by United Nations Member States in March 2015.',
  },
  fillBlank: {
    type: 'fill_blank',
    prompt: 'The Sendai Framework was adopted in [1], Japan, in the year [2].',
    blanks: [
      { label: 'City', expected: ['Sendai'] },
      { label: 'Year', expected: ['2015'] },
    ],
  },
  image: {
    type: 'multiple_choice',
    prompt: 'Which hazard does this image show?',
    options: [
      { value: 'amr', label: 'Antimicrobial resistant microorganisms' },
      { value: 'hab', label: 'Harmful algal blooms', correct: true },
      { value: 'toxins', label: 'Marine toxins' },
      { value: 'oil', label: 'Oil pollution' },
    ],
  },
  longLabels: {
    type: 'multiple_choice',
    multiple: true,
    prompt:
      'A coastal city is revising its development plan after three consecutive years of flooding. Which of the following measures reduce existing disaster risk, as opposed to only preparing people to respond once a flood is already under way?',
    options: [
      {
        value: 'a',
        label:
          'Relocating the municipal wastewater treatment plant and two primary schools out of the mapped 1-in-100-year floodplain',
        correct: true,
      },
      {
        value: 'b',
        label:
          'Running an annual evacuation drill with neighbourhood volunteers and the national meteorological service',
      },
      {
        value: 'c',
        label:
          'Restoring upstream wetlands and mangroves so that they absorb peak flows before these reach built-up districts',
        correct: true,
      },
      {
        value: 'd',
        label: 'Hydrometeorologicalearlywarningdisseminationinfrastructure',
      },
    ],
  },
};

export const QUESTIONS_AR = {
  multipleChoice: {
    prompt:
      'عن أي خطر نتحدث؟\nموجة غير مرئية من الطاقة يمكنها اختراق طبقة الأوزون والوصول إلى سطح الأرض.',
    options: [
      { value: 'uv', label: 'الأشعة فوق البنفسجية', correct: true },
      { value: 'ionospheric', label: 'عاصفة أيونوسفيرية' },
      { value: 'chlorine', label: 'الكلور' },
      { value: 'anthrax', label: 'الجمرة الخبيثة' },
    ],
    explanation:
      'تصل الأشعة فوق البنفسجية القادمة من الشمس إلى السطح عندما لا تمتصها طبقة الأوزون، وقد يسبب التعرض المفرط لها سرطان الجلد.',
  },
  multipleAnswers: {
    prompt: 'أيٌّ من هذه الأخطار مرتبط بالمياه؟',
    options: [
      { value: 'flood', label: 'الفيضان', correct: true },
      { value: 'surge', label: 'عرام العواصف', correct: true },
      { value: 'earthquake', label: 'الزلزال' },
    ],
    explanation:
      'الفيضانات وعرام العواصف أخطار هيدرولوجية جوية، أما الزلزال فخطر جيولوجي.',
  },
  trueFalse: {
    prompt: 'مدّ العاصفة هو نفسه التسونامي.',
    explanation:
      'مدّ العاصفة هو المدّ المتوقع مضافاً إليه عرام العاصفة، أما التسونامي فسلسلة أمواج ناتجة عن إزاحة مفاجئة للمياه.',
  },
  shortAnswer: {
    prompt: 'ما الإطار الذي يوجّه الحد من مخاطر الكوارث عالمياً حتى عام 2030؟',
    expected: ['إطار سنداي', 'Sendai Framework'],
    explanation:
      'اعتُمد إطار سنداي للحد من مخاطر الكوارث 2015–2030 في مارس 2015.',
  },
  fillBlank: {
    prompt: 'اعتُمد إطار سنداي في مدينة [1] في اليابان عام [2].',
    blanks: [
      { label: 'المدينة', expected: ['سنداي', 'Sendai'] },
      { label: 'السنة', expected: ['2015', '٢٠١٥'] },
    ],
  },
  image: {
    prompt: 'ما الخطر الذي تُظهره هذه الصورة؟',
    options: [
      { value: 'amr', label: 'الكائنات الدقيقة المقاومة لمضادات الميكروبات' },
      { value: 'hab', label: 'تكاثر الطحالب الضارة', correct: true },
      { value: 'toxins', label: 'السموم البحرية' },
      { value: 'oil', label: 'التلوث النفطي' },
    ],
  },
};

export const PAGE_TEXT = {
  english: {
    title: 'How many hazards can you identify?',
    intro:
      'Take the quiz to test your disaster knowledge. Each question is checked as you go, and you can try as often as you like.',
    between:
      'The hazard information profiles describe 302 hazards in a consistent way, so that governments and partners can share one vocabulary.',
    imageAlt: 'Aerial view of green algae spreading across a lake shore',
    caption: 'Photo used for illustration.',
    after: 'About the hazard information profiles',
    afterBody:
      'The profiles were developed through a consultative process by scientists and experts across the globe.',
  },
  arabic: {
    title: 'كم خطراً يمكنك أن تتعرّف عليه؟',
    intro:
      'أجب عن الأسئلة لاختبار معلوماتك عن الكوارث. يُتحقق من كل سؤال فوراً، ويمكنك المحاولة بقدر ما تشاء.',
    between:
      'تصف ملفات معلومات الأخطار 302 خطراً بطريقة متسقة، ليتشارك الجميع المفردات نفسها.',
    imageAlt: 'منظر جوي لطحالب خضراء تنتشر على ضفة بحيرة',
    caption: 'صورة للتوضيح.',
    after: 'عن ملفات معلومات الأخطار',
    afterBody:
      'أُعدّت الملفات عبر عملية تشاورية شارك فيها علماء وخبراء من أنحاء العالم.',
  },
};

/**
 * @param {Object} globals Storybook globals
 * @param {string} key Fixture name
 * @returns {Object} The question in the toolbar's language, English otherwise
 */
export function getQuestion(globals, key) {
  return globals?.locale === 'arabic' && QUESTIONS_AR[key]
    ? { ...QUESTIONS[key], ...QUESTIONS_AR[key] }
    : QUESTIONS[key];
}

export function getPageText(globals) {
  return PAGE_TEXT[globals?.locale] ?? PAGE_TEXT.english;
}
