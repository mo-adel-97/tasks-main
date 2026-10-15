// تحويل تاريخ هجري مثل "14/2/1446" (يوم/شهر/سنة) إلى تاريخ ميلادي بتقويم أم القرى.
// المتصفح يعرف التحويل من ميلادي إلى هجري فقط، فنبحث عن اليوم الميلادي المطابق.

const HIJRI_FORMATTER = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric'
});

const hijriParts = (date) => {
  const parts = HIJRI_FORMATTER.formatToParts(date);
  const get = (type) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day') };
};

const hijriKey = ({ year, month, day }) => year * 10000 + month * 100 + day;

export const hijriToGregorian = (year, month, day) => {
  if (!(year >= 1318 && year <= 1500 && month >= 1 && month <= 12 && day >= 1 && day <= 30)) {
    return null;
  }

  // تقريب أولي ثم نقترب يومًا بيوم حتى يتطابق التاريخ الهجري.
  const approxYear = Math.floor(year * 0.970229 + 621.5774);
  let guess = new Date(approxYear, 0, 1, 12, 0, 0);
  const target = hijriKey({ year, month, day });

  for (let step = 0; step < 900; step += 1) {
    const current = hijriKey(hijriParts(guess));
    if (current === target) return new Date(guess.getFullYear(), guess.getMonth(), guess.getDate());

    // الفرق التقريبي بالأيام (سنة هجرية ≈ 354.37 يومًا، شهر ≈ 29.53 يومًا)
    const now = hijriParts(guess);
    const diffDays = Math.round(
      (year - now.year) * 354.367 + (month - now.month) * 29.53 + (day - now.day)
    );
    const move = diffDays === 0 ? (current < target ? 1 : -1) : Math.sign(diffDays) * Math.max(1, Math.abs(diffDays) > 3 ? Math.floor(Math.abs(diffDays) * 0.8) : 1);
    guess = new Date(guess.getFullYear(), guess.getMonth(), guess.getDate() + move, 12, 0, 0);
  }

  return null;
};

// بعض الشهور الهجرية 29 يومًا: نتراجع يومًا أو يومين بدل الفشل.
export const parseHijriBatchDate = (text) => {
  if (!text) return null;

  const numbers = String(text)
    .trim()
    .split(/[/\-.]/)
    .map((part) => Number(part.trim()));

  if (numbers.length !== 3 || numbers.some((n) => !Number.isFinite(n) || n <= 0)) return null;

  const [first, month, last] = numbers;
  const [day, year] = first > 1000 ? [last, first] : [first, last];

  for (let candidate = day; candidate >= Math.max(1, day - 2); candidate -= 1) {
    const date = hijriToGregorian(year, month, candidate);
    if (date) return date;
  }

  return null;
};
