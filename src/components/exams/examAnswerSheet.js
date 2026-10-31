// تجهيز بيانات "نموذج إجابة المتدرب" للطباعة بنفس شكل نموذج الاختبار الورقي:
// الأسئلة متجمعة (حسب القسم لو موجود، وإلا حسب نوع السؤال) وكل سؤال بخياراته وإجابة المتدرب والإجابة الصحيحة.
import { splitSection } from '../../utils/questionSections';

const ORDINALS = [
  'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر',
  'الحادي عشر', 'الثاني عشر', 'الثالث عشر', 'الرابع عشر', 'الخامس عشر'
];

export const ordinal = (index) => ORDINALS[index] || String(index + 1);

const TYPE_TITLES = {
  true_false: 'حدد مدى صحة أو خطأ العبارات الآتية',
  single_choice: 'اختر الإجابة الصحيحة مما يلي',
  multiple_choice: 'اختر الإجابات الصحيحة مما يلي'
};
const DEFAULT_TITLE = 'أجب عن الآتي';

export const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح'];

const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// 60.00 → 60 ، 2.50 → 2.5
export const fmtNum = (value) => {
  const n = toNum(value);
  return String(Math.round(n * 100) / 100);
};

const same = (a, b) => a != null && b != null && String(a) === String(b);

const attachmentOf = (item, prefix = '') => {
  const url = item?.[`${prefix}attachment_url`];
  if (!url) return null;
  const type = String(item?.[`${prefix}attachment_type`] || '');
  const name = item?.[`${prefix}attachment_name`] || '';
  const isImage = type.startsWith('image') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(String(url));
  return { url, name, isImage };
};

const looksTrueFalse = (texts) => texts.length > 0 && texts.every((t) => /^(صح|صحيح|خطأ|غلط|خاطئ|true|false)$/i.test(String(t || '').trim()));

const buildQuestion = (question, answer) => {
  const rawText = question?.question_text ?? answer?.question_text ?? '';
  const { section, text } = splitSection(rawText);

  let options = (question?.answers || [])
    .slice()
    .sort((x, y) => toNum(x.answer_order) - toNum(y.answer_order))
    .map((option) => ({
      text: option.answer_text || '',
      attachment: attachmentOf(option),
      isCorrect: answer?.correct_answer_id != null ? same(option.id, answer.correct_answer_id) : Number(option.is_correct) === 1,
      isSelected: same(option.id, answer?.selected_answer_id)
    }));

  // السؤال اتمسح من الاختبار بعد ما الطالب حله: نكوّن الخيارات من إجابته والإجابة الصحيحة.
  if (!options.length && answer) {
    const selected = answer.selected_answer_text || '';
    const correct = answer.correct_answer_text || '';
    options = [];
    if (correct) options.push({ text: correct, attachment: attachmentOf(answer, 'correct_answer_'), isCorrect: true, isSelected: Boolean(selected) && selected === correct });
    if (selected && selected !== correct) options.push({ text: selected, attachment: attachmentOf(answer, 'selected_answer_'), isCorrect: false, isSelected: true });
  }

  const type = question?.question_type || (looksTrueFalse(options.map((o) => o.text)) ? 'true_false' : 'single_choice');
  const answered = Boolean(answer && (answer.selected_answer_id != null || answer.selected_answer_text));

  return {
    id: String(question?.id ?? answer?.question_id ?? rawText),
    section,
    type,
    text,
    attachment: attachmentOf(question) || attachmentOf(answer, 'question_'),
    points: toNum(answer?.question_points ?? question?.points),
    earned: toNum(answer?.points_earned),
    answered,
    isCorrect: Number(answer?.is_correct) === 1,
    options
  };
};

// examDetail: ناتج get_exam (فيه الأسئلة بخياراتها ونوعها) — attempt: محاولة الطالب من get_exam_attempts.
export function buildAnswerSheet(examDetail, attempt) {
  const examQuestions = (examDetail?.questions || [])
    .slice()
    .sort((a, b) => toNum(a.question_order) - toNum(b.question_order));
  const questionById = new Map(examQuestions.map((q) => [String(q.id), q]));
  const orderById = new Map(examQuestions.map((q, i) => [String(q.id), i]));
  const answers = attempt?.answers || [];

  // الأساس هو اللي الطالب اتعرض عليه فعلًا (إجاباته)، بترتيب الاختبار؛ ولو مفيش إجابات خالص نعرض أسئلة الاختبار فاضية.
  const items = answers.length
    ? answers
        .map((answer, index) => ({ answer, question: questionById.get(String(answer.question_id)), index }))
        .sort((a, b) => (orderById.get(String(a.answer.question_id)) ?? 1e6 + a.index) - (orderById.get(String(b.answer.question_id)) ?? 1e6 + b.index))
    : examQuestions.map((question) => ({ question, answer: null }));

  const groups = [];
  const byKey = new Map();
  items.forEach(({ question, answer }) => {
    const built = buildQuestion(question, answer);
    const key = built.section ? `s:${built.section}` : `t:${built.type}`;
    if (!byKey.has(key)) {
      const group = { key, title: built.section || TYPE_TITLES[built.type] || DEFAULT_TITLE, questions: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    byKey.get(key).questions.push(built);
  });

  const sections = groups.map((group, index) => ({
    ...group,
    // لو المعلم سمّى القسم "السؤال الثاني: ..." بنفسه مانكررش البادئة
    heading: /^\s*السؤال\s/.test(group.title)
      ? `${group.title.trim().replace(/[:：]\s*$/, '')}:`
      : `السؤال ${ordinal(index)}: ${group.title.replace(/[:：]\s*$/, '')}:`,
    total: group.questions.reduce((sum, q) => sum + q.points, 0),
    earned: group.questions.reduce((sum, q) => sum + q.earned, 0)
  }));

  return {
    sections,
    total: attempt?.total_score != null ? toNum(attempt.total_score) : sections.reduce((s, g) => s + g.total, 0),
    earned: attempt?.score != null ? toNum(attempt.score) : sections.reduce((s, g) => s + g.earned, 0)
  };
}

// 60 → ساعة، 30 → 30 دقيقة، 90 → ساعة ونصف
export const formatDuration = (minutes) => {
  const m = Math.round(toNum(minutes));
  if (!m) return '';
  const named = { 30: 'نصف ساعة', 60: 'ساعة', 90: 'ساعة ونصف', 120: 'ساعتان', 180: 'ثلاث ساعات' };
  return named[m] || `${m} دقيقة`;
};

// استنتاج الدبلوم والمستوى من عنوان الاختبار لو مكتوبين فيه (المستخدم يقدر يعدّلهم قبل الطباعة).
export const guessHeaderMeta = (title) => {
  const value = String(title || '').replace(/\s+/g, ' ').trim();
  const diploma = value.match(/دبلوم\s+([^\-–_(:،,]+)/);
  const level = value.match(/المستو[ىي]\s*[:\-]?\s*\(?\s*([0-9٠-٩]+|[^\s\-–_(:،,)]+)/);
  return {
    diploma: diploma ? diploma[1].replace(/^(في|ال)\s+/, '').trim() : '',
    level: level ? level[1].trim() : ''
  };
};
