import { bestAttemptPerStudent } from './examAttempts';

test('keeps only the highest attempt per student and counts attempts', () => {
  const result = bestAttemptPerStudent([
    { id: 1, national_id: '111', student_name: 'أحمد', score: 5, percentage: 50, submitted_at: '2026-10-01 10:00:00' },
    { id: 2, national_id: '111', student_name: 'أحمد', score: 9, percentage: 90, submitted_at: '2026-10-02 10:00:00' },
    { id: 3, national_id: '111', student_name: 'أحمد', score: 7, percentage: 70, submitted_at: '2026-10-03 10:00:00' },
    { id: 4, national_id: '222', student_name: 'سارة', score: 6, percentage: 60, submitted_at: '2026-10-01 10:00:00' },
  ]);

  expect(result.map((a) => [a.id, a.attempts_count])).toEqual([[2, 3], [4, 1]]);
});

test('ties go to the latest submission', () => {
  const result = bestAttemptPerStudent([
    { id: 1, national_id: '111', score: '8', percentage: '80', submitted_at: '2026-10-01 10:00:00' },
    { id: 2, national_id: '111', score: '8', percentage: '80', submitted_at: '2026-10-05 10:00:00' },
  ]);

  expect(result).toHaveLength(1);
  expect(result[0].id).toBe(2);
});
