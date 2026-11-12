/**
 * Runtime UI labels for QuizQuestion and QuizScore.
 *
 * Kept free of JSX so the resolvers can be imported without React or a DOM.
 * Placeholders in braces are replaced by `formatQuizLabel`. The sentences keep
 * numbers out of grammatical agreement ("3 of 5", "answered: 2") so no plural
 * forms are needed in any of the bundled languages.
 *
 * The translations are drafts and need native-speaker review before they are
 * treated as editorially approved.
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

const QUESTION_AR = {
  checkAnswer: 'تحقق من الإجابة',
  correct: 'إجابة صحيحة',
  incorrectMessage: 'ليست صحيحة بعد. حاول مرة أخرى.',
  emptyChoice: 'اختر إجابة أولاً.',
  emptyText: 'اكتب إجابة أولاً.',
  questionNumber: 'السؤال {number} من {total}',
  selectAll: 'اختر كل ما ينطبق.',
  fillBlankLegend: 'أكمل الجملة',
  blankLabel: 'الفراغ {number} من {total}',
  trueLabel: 'صحيح',
  falseLabel: 'خطأ',
};

const QUESTION_ES = {
  checkAnswer: 'Comprobar respuesta',
  correct: 'Correcto',
  incorrectMessage: 'Todavía no es correcto. Inténtalo de nuevo.',
  emptyChoice: 'Elige primero una respuesta.',
  emptyText: 'Escribe primero una respuesta.',
  questionNumber: 'Pregunta {number} de {total}',
  selectAll: 'Selecciona todas las opciones que correspondan.',
  fillBlankLegend: 'Completa la frase',
  blankLabel: 'Espacio {number} de {total}',
  trueLabel: 'Verdadero',
  falseLabel: 'Falso',
};

const QUESTION_FR = {
  checkAnswer: 'Vérifier la réponse',
  correct: 'Bonne réponse',
  incorrectMessage: 'Ce n’est pas encore correct. Essayez encore.',
  emptyChoice: 'Choisissez d’abord une réponse.',
  emptyText: 'Saisissez d’abord une réponse.',
  questionNumber: 'Question {number} sur {total}',
  selectAll: 'Sélectionnez toutes les réponses qui conviennent.',
  fillBlankLegend: 'Complétez la phrase',
  blankLabel: 'Espace {number} sur {total}',
  trueLabel: 'Vrai',
  falseLabel: 'Faux',
};

const QUESTION_JA = {
  checkAnswer: '答えを確認',
  correct: '正解',
  incorrectMessage: 'まだ正解ではありません。もう一度お試しください。',
  emptyChoice: '先に答えを選んでください。',
  emptyText: '先に答えを入力してください。',
  questionNumber: '問題 {number}/{total}',
  selectAll: '当てはまるものをすべて選んでください。',
  fillBlankLegend: '文を完成させてください',
  blankLabel: '空欄 {number}/{total}',
  trueLabel: '正しい',
  falseLabel: '誤り',
};

const QUESTION_RU = {
  checkAnswer: 'Проверить ответ',
  correct: 'Верно',
  incorrectMessage: 'Пока неверно. Попробуйте ещё раз.',
  emptyChoice: 'Сначала выберите ответ.',
  emptyText: 'Сначала введите ответ.',
  questionNumber: 'Вопрос {number} из {total}',
  selectAll: 'Выберите все подходящие варианты.',
  fillBlankLegend: 'Дополните предложение',
  blankLabel: 'Пропуск {number} из {total}',
  trueLabel: 'Верно',
  falseLabel: 'Неверно',
};

const QUESTION_ZH = {
  checkAnswer: '检查答案',
  correct: '回答正确',
  incorrectMessage: '还不对，请再试一次。',
  emptyChoice: '请先选择答案。',
  emptyText: '请先输入答案。',
  questionNumber: '第 {number} 题，共 {total} 题',
  selectAll: '请选择所有适用的选项。',
  fillBlankLegend: '补全句子',
  blankLabel: '空格 {number}/{total}',
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
  scoreSoFar: '{correct} من {total} صحيحة حتى الآن.',
  scoreSoFarWithAnswered:
    'النتيجة حتى الآن: {correct} من {total} صحيحة (تمت الإجابة: {answered}).',
  scoreFinal: 'نتيجتك: {correct} من {total} صحيحة.',
  progressLabel: 'الأسئلة التي تمت الإجابة عنها',
  progressValue: '{answered} من {total}',
  reset: 'ابدأ من جديد',
};

const SCORE_ES = {
  scoreSoFar: '{correct} de {total} correctas hasta ahora.',
  scoreSoFarWithAnswered:
    'Puntuación hasta ahora: {correct} de {total} correctas (respondidas: {answered}).',
  scoreFinal: 'Has acertado {correct} de {total}.',
  progressLabel: 'Preguntas respondidas',
  progressValue: '{answered} de {total}',
  reset: 'Empezar de nuevo',
};

const SCORE_FR = {
  scoreSoFar: '{correct} sur {total} pour l’instant.',
  scoreSoFarWithAnswered:
    'Score actuel : {correct} sur {total} (questions traitées : {answered}).',
  scoreFinal: 'Votre score : {correct} sur {total}.',
  progressLabel: 'Questions traitées',
  progressValue: '{answered} sur {total}',
  reset: 'Recommencer',
};

const SCORE_JA = {
  scoreSoFar: '現在、{total}問中{correct}問正解。',
  scoreSoFarWithAnswered:
    '現在のスコア：{total}問中{correct}問正解（回答済み：{answered}）。',
  scoreFinal: '{total}問中{correct}問正解でした。',
  progressLabel: '回答済みの問題',
  progressValue: '{answered}/{total}',
  reset: '最初からやり直す',
};

const SCORE_RU = {
  scoreSoFar: 'Пока верно: {correct} из {total}.',
  scoreSoFarWithAnswered:
    'Текущий результат: {correct} из {total} верно (отвечено: {answered}).',
  scoreFinal: 'Ваш результат: {correct} из {total} верно.',
  progressLabel: 'Отвечено вопросов',
  progressValue: '{answered} из {total}',
  reset: 'Начать заново',
};

const SCORE_ZH = {
  scoreSoFar: '目前共 {total} 题，答对 {correct} 题。',
  scoreSoFarWithAnswered:
    '当前得分：共 {total} 题，答对 {correct} 题（已作答：{answered}）。',
  scoreFinal: '共 {total} 题，您答对了 {correct} 题。',
  progressLabel: '已作答的题目',
  progressValue: '{answered}/{total}',
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
