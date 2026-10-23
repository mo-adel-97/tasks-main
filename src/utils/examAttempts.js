// الطالب ممكن يختبر نفس الاختبار أكثر من مرة: نعرض أعلى نتيجة له بس.
// المفاضلة: النسبة ثم الدرجة ثم الأحدث في الإرسال.

const studentKey = (attempt) => {
  const id = String(attempt?.national_id ?? '').trim();
  if (id) return `id:${id}`;
  const tel = String(attempt?.student_tel ?? '').trim();
  if (tel) return `tel:${tel}`;
  const email = String(attempt?.student_email ?? '').trim().toLowerCase();
  if (email) return `mail:${email}`;
  return `name:${String(attempt?.student_name ?? '').trim()}|${attempt?.id ?? ''}`;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : -Infinity;
};

const toTime = (value) => {
  const t = Date.parse(String(value ?? '').replace(' ', 'T'));
  return Number.isFinite(t) ? t : -Infinity;
};

const isBetter = (candidate, current) => {
  const byPercentage = toNumber(candidate.percentage) - toNumber(current.percentage);
  if (byPercentage !== 0) return byPercentage > 0;
  const byScore = toNumber(candidate.score) - toNumber(current.score);
  if (byScore !== 0) return byScore > 0;
  return toTime(candidate.submitted_at) > toTime(current.submitted_at);
};

export const bestAttemptPerStudent = (attempts = []) => {
  const best = new Map();
  const counts = new Map();

  attempts.forEach((attempt) => {
    const key = studentKey(attempt);
    counts.set(key, (counts.get(key) || 0) + 1);
    const current = best.get(key);
    if (!current || isBetter(attempt, current)) best.set(key, attempt);
  });

  return [...best.entries()]
    .map(([key, attempt]) => ({ ...attempt, attempts_count: counts.get(key) }))
    .sort((a, b) => toNumber(b.percentage) - toNumber(a.percentage) || toNumber(b.score) - toNumber(a.score));
};
