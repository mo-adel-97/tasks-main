import { buildAnswerSheet, formatDuration, guessHeaderMeta } from './examAnswerSheet';

const examDetail = {
  questions: [
    {
      id: 2, question_order: 2, question_type: 'single_choice', points: '4.00', question_text: '⟦السؤال الثاني: اختار الإجابة الصحيحة⟧ سؤال اختيار',
      answers: [
        { id: 21, answer_text: 'أ', answer_order: 1, is_correct: 0 },
        { id: 22, answer_text: 'ب', answer_order: 2, is_correct: 1 }
      ]
    },
    {
      id: 1, question_order: 1, question_type: 'true_false', points: '4.00', question_text: 'عبارة',
      answers: [
        { id: 11, answer_text: 'صح', answer_order: 1, is_correct: 1 },
        { id: 12, answer_text: 'غلط', answer_order: 2, is_correct: 0 }
      ]
    }
  ]
};

const attempt = {
  score: '4.00', total_score: '8.00',
  answers: [
    { question_id: 2, question_text: '⟦السؤال الثاني: اختار الإجابة الصحيحة⟧ سؤال اختيار', question_points: 4, selected_answer_id: 21, correct_answer_id: 22, is_correct: 0, points_earned: 0 },
    { question_id: 1, question_text: 'عبارة', question_points: 4, selected_answer_id: 11, correct_answer_id: 11, is_correct: 1, points_earned: 4 },
    { question_id: 99, question_text: 'سؤال اتمسح', question_points: 2, selected_answer_id: null, selected_answer_text: null, correct_answer_text: 'الصح', is_correct: 0, points_earned: 0 }
  ]
};

test('يرتب الأسئلة بترتيب الاختبار ويجمعها بالقسم أو النوع مع الدرجات', () => {
  const sheet = buildAnswerSheet(examDetail, attempt);
  expect(sheet.total).toBe(8);
  expect(sheet.earned).toBe(4);
  expect(sheet.sections.map((s) => s.heading)).toEqual([
    'السؤال الأول: حدد مدى صحة أو خطأ العبارات الآتية:',
    'السؤال الثاني: اختار الإجابة الصحيحة:',
    'السؤال الثالث: اختر الإجابة الصحيحة مما يلي:'
  ]);
  const [tf, mcq, deleted] = sheet.sections;
  expect(tf.earned).toBe(4);
  expect(tf.questions[0].options.map((o) => [o.text, o.isSelected, o.isCorrect])).toEqual([['صح', true, true], ['غلط', false, false]]);
  expect(mcq.questions[0].options.map((o) => [o.isSelected, o.isCorrect])).toEqual([[true, false], [false, true]]);
  // سؤال اتمسح من الاختبار ومتجاوبش: يظهر بإجابته الصحيحة ومكتوب إنه مااتجاوبش
  expect(deleted.questions[0].answered).toBe(false);
  expect(deleted.questions[0].options).toEqual([{ text: 'الصح', attachment: null, isCorrect: true, isSelected: false }]);
});

test('بيانات الرأس: المدة والدبلوم والمستوى من العنوان', () => {
  expect(formatDuration(60)).toBe('ساعة');
  expect(formatDuration(45)).toBe('45 دقيقة');
  expect(guessHeaderMeta('دبلوم إدارة الموارد البشرية:المستوي الخامس')).toEqual({ diploma: 'إدارة الموارد البشرية', level: 'الخامس' });
  expect(guessHeaderMeta('إجراءات السكرتارية')).toEqual({ diploma: '', level: '' });
});
