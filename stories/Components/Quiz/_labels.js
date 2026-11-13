/**
 * Runtime UI labels for QuizQuestion and QuizScore.
 *
 * Kept free of JSX so the resolvers can be imported without React or a DOM.
 * Placeholders in braces are replaced by `formatQuizLabel`. The sentences keep
 * numbers out of grammatical agreement ("3 of 5", "answered: 2") so no plural
 * forms are needed in any of the bundled languages. Each count is either a
 * bare "N of M" or follows a label and a colon, and Japanese and Chinese use
 * counters that do not inflect.
 *
 * The translations have had a specialist-style pass by an AI model, checked
 * against Mangrove's other catalogues for terms and form of address. They have
 * not had native-speaker review and are not certified translations.
 */
import { createLabelResolver } from '../../../src/i18n';

export const DEFAULT_QUIZ_QUESTION_LABELS = {
  checkAnswer: 'Check answer',
  correct: 'Correct',
  incorrectMessage: 'Not correct yet. Try again.',
  emptyChoice: 'Choose an answer first.',
  emptyText: 'Type an answer first.',
  questionNumber: 'Question {number} of {total}',
  selectAll: 'Select all that apply.',
  fillBlankLegend: 'Complete the sentence',
  blankLabel: 'Blank {number} of {total}',
  trueLabel: 'True',
  falseLabel: 'False',
};

// Arabic: verbal nouns on controls and impersonal requests in messages, so no
// string assumes the visitor's gender.
const QUESTION_AR = {
  checkAnswer: 'التحقق من الإجابة',
  correct: 'إجابة صحيحة',
  incorrectMessage: 'الإجابة ليست صحيحة بعد. يمكنك المحاولة مرة أخرى.',
  emptyChoice: 'يُرجى اختيار إجابة أولاً.',
  emptyText: 'يُرجى كتابة إجابة أولاً.',
  questionNumber: 'السؤال {number} من {total}',
  selectAll: 'يُرجى اختيار كل ما ينطبق.',
  fillBlankLegend: 'إكمال الجملة',
  blankLabel: 'الفراغ {number} من {total}',
  trueLabel: 'صواب',
  falseLabel: 'خطأ',
};

// Spanish: usted, as in the search widget, CopyButton and ServiceNotice.
const QUESTION_ES = {
  checkAnswer: 'Comprobar respuesta',
  correct: 'Correcto',
  incorrectMessage: 'Todavía no es correcto. Vuelva a intentarlo.',
  emptyChoice: 'Elija primero una respuesta.',
  emptyText: 'Escriba primero una respuesta.',
  questionNumber: 'Pregunta {number} de {total}',
  selectAll: 'Seleccione todas las opciones que correspondan.',
  fillBlankLegend: 'Complete la frase',
  blankLabel: 'Espacio en blanco {number} de {total}',
  trueLabel: 'Verdadero',
  falseLabel: 'Falso',
};

// French: vous. A no-break space (\u00a0) precedes each colon, so the
// colon never starts a line.
const QUESTION_FR = {
  checkAnswer: 'Vérifier la réponse',
  correct: 'Bonne réponse',
  incorrectMessage: 'Ce n’est pas encore la bonne réponse. Réessayez.',
  emptyChoice: 'Choisissez d’abord une réponse.',
  emptyText: 'Saisissez d’abord une réponse.',
  questionNumber: 'Question {number} sur {total}',
  selectAll: 'Sélectionnez toutes les réponses qui conviennent.',
  fillBlankLegend: 'Complétez la phrase',
  blankLabel: 'Espace à compléter {number} sur {total}',
  trueLabel: 'Vrai',
  falseLabel: 'Faux',
};

// Japanese: です/ます. Counts use the counter 問 rather than a slash, which a
// screen reader may read as a fraction.
const QUESTION_JA = {
  checkAnswer: '答えを確認',
  correct: '正解です',
  incorrectMessage: 'まだ正解ではありません。もう一度お試しください。',
  emptyChoice: '先に答えを選んでください。',
  emptyText: '先に答えを入力してください。',
  questionNumber: '第{number}問（全{total}問）',
  selectAll: '当てはまるものをすべて選んでください。',
  fillBlankLegend: '文を完成させてください',
  blankLabel: '空欄{number}（全{total}か所）',
  trueLabel: '正しい',
  falseLabel: '誤り',
};

// Russian: вы. The feedback says «Правильно» so that it cannot be confused
// with the «Верно» and «Неверно» options of a true or false question.
const QUESTION_RU = {
  checkAnswer: 'Проверить ответ',
  correct: 'Правильно',
  incorrectMessage: 'Пока неправильно. Попробуйте ещё раз.',
  emptyChoice: 'Сначала выберите ответ.',
  emptyText: 'Сначала введите ответ.',
  questionNumber: 'Вопрос {number} из {total}',
  selectAll: 'Выберите все подходящие варианты.',
  fillBlankLegend: 'Дополните предложение',
  blankLabel: 'Пропуск {number} из {total}',
  trueLabel: 'Верно',
  falseLabel: 'Неверно',
};

// Simplified Chinese: 您, with a space either side of a numeral as in the
// search widget.
const QUESTION_ZH = {
  checkAnswer: '检查答案',
  correct: '回答正确',
  incorrectMessage: '回答还不正确，请再试一次。',
  emptyChoice: '请先选择答案。',
  emptyText: '请先输入答案。',
  questionNumber: '第 {number} 题，共 {total} 题',
  selectAll: '请选择所有适用的选项。',
  fillBlankLegend: '补全句子',
  blankLabel: '第 {number} 空，共 {total} 空',
  trueLabel: '正确',
  falseLabel: '错误',
};

export const DEFAULT_QUIZ_SCORE_LABELS = {
  scoreSoFar: '{correct} of {total} correct so far.',
  scoreSoFarWithAnswered:
    'Score so far: {correct} of {total} correct (answered: {answered}).',
  scoreFinal: 'You got {correct} of {total} correct.',
  progressLabel: 'Questions answered',
  progressValue: '{answered} of {total}',
  reset: 'Start again',
};

const SCORE_AR = {
  scoreSoFar: 'الإجابات الصحيحة حتى الآن: {correct} من {total}.',
  scoreSoFarWithAnswered:
    'الإجابات الصحيحة حتى الآن: {correct} من {total} (الأسئلة المُجاب عنها: {answered}).',
  scoreFinal: 'مجموع الإجابات الصحيحة: {correct} من {total}.',
  progressLabel: 'الأسئلة المُجاب عنها',
  progressValue: '{answered} من {total}',
  reset: 'البدء من جديد',
};

const SCORE_ES = {
  scoreSoFar: 'Aciertos hasta ahora: {correct} de {total}.',
  scoreSoFarWithAnswered:
    'Aciertos hasta ahora: {correct} de {total} (preguntas respondidas: {answered}).',
  scoreFinal: 'Total de aciertos: {correct} de {total}.',
  progressLabel: 'Preguntas respondidas',
  progressValue: '{answered} de {total}',
  reset: 'Empezar de nuevo',
};

const SCORE_FR = {
  scoreSoFar: 'Bonnes réponses pour l’instant\u00a0: {correct} sur {total}.',
  scoreSoFarWithAnswered:
    'Bonnes réponses pour l’instant\u00a0: {correct} sur {total} (questions traitées\u00a0: {answered}).',
  scoreFinal: 'Total des bonnes réponses\u00a0: {correct} sur {total}.',
  progressLabel: 'Questions traitées',
  progressValue: '{answered} sur {total}',
  reset: 'Recommencer',
};

const SCORE_JA = {
  scoreSoFar: '現在、{total}問中{correct}問正解です。',
  scoreSoFarWithAnswered:
    '現在、{total}問中{correct}問正解です（答えた問題：{answered}問）。',
  scoreFinal: '{total}問中{correct}問正解でした。',
  progressLabel: '答えた問題',
  progressValue: '{total}問中{answered}問',
  reset: '最初からやり直す',
};

// «Правильных ответов: 1» and «дано ответов: 1» are label-and-count forms that
// stay grammatical for every number.
const SCORE_RU = {
  scoreSoFar: 'Правильных ответов пока: {correct} из {total}.',
  scoreSoFarWithAnswered:
    'Правильных ответов пока: {correct} из {total} (дано ответов: {answered}).',
  scoreFinal: 'Всего правильных ответов: {correct} из {total}.',
  progressLabel: 'Дано ответов',
  progressValue: '{answered} из {total}',
  reset: 'Начать заново',
};

const SCORE_ZH = {
  scoreSoFar: '目前答对 {correct} 题，共 {total} 题。',
  scoreSoFarWithAnswered:
    '目前答对 {correct} 题，共 {total} 题（已作答 {answered} 题）。',
  scoreFinal: '共 {total} 题，您答对了 {correct} 题。',
  progressLabel: '已作答的题目',
  progressValue: '{answered} 题，共 {total} 题',
  reset: '重新开始',
};

export const getQuizQuestionLabels = createLabelResolver(
  DEFAULT_QUIZ_QUESTION_LABELS,
  {
    ar: QUESTION_AR,
    es: QUESTION_ES,
    fr: QUESTION_FR,
    ja: QUESTION_JA,
    ru: QUESTION_RU,
    zh: QUESTION_ZH,
  }
);

export const getQuizScoreLabels = createLabelResolver(
  DEFAULT_QUIZ_SCORE_LABELS,
  {
    ar: SCORE_AR,
    es: SCORE_ES,
    fr: SCORE_FR,
    ja: SCORE_JA,
    ru: SCORE_RU,
    zh: SCORE_ZH,
  }
);

/**
 * Replaces `{name}` placeholders in a label.
 *
 * @param {string} template Label with placeholders
 * @param {Object<string, string|number>} values Replacement values
 * @returns {string} The filled label; unknown placeholders are left as written
 */
export function formatQuizLabel(template, values) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (match, name) =>
    Object.hasOwn(values, name) ? String(values[name]) : match
  );
}
