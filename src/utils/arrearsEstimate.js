// تقدير المتأخرات (تقريبي) للطالب من كشف حسابه.
//
// الفكرة: الدبلوم مدته سنتان (24 شهرًا)، والواجب أن يُسدَّد سعره (بعد الخصم)
// على أقساط شهرية متساوية تبدأ من تاريخ بداية دفعة الطالب (وليس من تاريخ تسجيله)،
// فإن لم يتوفر تاريخ الدفعة نستخدم تاريخ أول رسوم في كشف الحساب.
// فنحسب كم قسطًا حان موعده حتى اليوم،
// ونقارن ما كان يجب سداده بما سُدِّد فعلًا. الفرق هو المتأخر التقريبي.
//
//   سعر الدبلوم بعد الخصم = مجموع المدين (الرسوم) - الخصومات والتسويات
//   القسط الشهري          = سعر الدبلوم بعد الخصم ÷ 24
//   الأقساط المستحقة      = الأشهر الكاملة منذ بداية الدفعة (بحد أقصى 24)
//   المستحق سداده         = القسط الشهري × الأقساط المستحقة
//   المتأخر               = المستحق سداده - المسدد فعليًا   (لا يزيد على الرصيد المتبقي)
//
// هذا تقدير للاسترشاد فقط وليس مطالبة رسمية: قد يكون للطالب اتفاق سداد مختلف.
// نفس المعادلة مطبقة في الباك (SstliReceptionApi/Services/StudentArrears.cs).

import { parseHijriBatchDate } from './hijriDate';

export const DIPLOMA_MONTHS = 24;

// دفعات حقيقية (سند قبض / سداد ...). أي دائن آخر (قيد يومية، خصم ...) يُعامل كخصم/تسوية.
const PAYMENT_NAME = /قبض|سداد|تحصيل|دفع/;

// رسوم التسجيل وسندات الصرف (استرداد للطالب) ليست من سعر الدبلوم.
// الباك يعرف نوع القيد من الجداول؛ هنا نقرّب ذلك من اسم القيد فقط.
const NON_TUITION_CHARGE_NAME = /رسوم|صرف/;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

// عدد الأشهر الكاملة بين تاريخين (تسجيل 27/7 واليوم 20/9 = شهران كاملان).
export const wholeMonthsBetween = (start, end) => {
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
};

export const estimateArrears = (
  statements,
  { months = DIPLOMA_MONTHS, today = new Date(), batchDate = null } = {}
) => {
  const rows = (Array.isArray(statements) ? statements : [])
    .map((row, index) => ({ row, index, date: toDate(row?.dayDate) }))
    .sort((a, b) => {
      const diff = (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
      return diff || a.index - b.index;
    })
    .map((item) => item.row);

  if (!rows.length) return { available: false, reason: "no-statement" };

  let charges = 0;
  let payments = 0;
  let adjustments = 0;

  rows.forEach((row) => {
    if (!NON_TUITION_CHARGE_NAME.test(String(row.name || ""))) {
      charges += toNumber(row.maden);
    }

    const credit = toNumber(row.daen);
    if (credit > 0) {
      if (PAYMENT_NAME.test(String(row.name || ""))) payments += credit;
      else adjustments += credit;
    }
  });

  if (charges <= 0) return { available: false, reason: "no-charges" };

  // بداية الدفعة (هجري مثل 14/2/1446) هي أساس احتساب الأقساط؛ وإلا فأول رسوم في الكشف.
  const batchStart =
    batchDate instanceof Date ? batchDate : parseHijriBatchDate(batchDate);
  const firstCharge = rows.find(
    (row) => toNumber(row.maden) > 0 && !NON_TUITION_CHARGE_NAME.test(String(row.name || ""))
  );
  const chargeStart = toDate(firstCharge?.dayDate) || toDate(rows[0]?.dayDate);
  const startDate = batchStart || chargeStart;
  const startSource = batchStart ? 'batch' : 'first-charge';

  if (!startDate) return { available: false, reason: "no-start-date" };

  const netPrice = Math.max(0, charges - adjustments);
  const lastBalance = Number(rows[rows.length - 1]?.balance);
  const balance = Number.isFinite(lastBalance)
    ? lastBalance
    : netPrice - payments;

  const monthlyInstallment = netPrice / months;
  const monthsElapsed = wholeMonthsBetween(startDate, today);
  const dueInstallments = Math.min(monthsElapsed, months);
  const expectedPaid = Math.min(netPrice, monthlyInstallment * dueInstallments);

  const overdue = Math.max(
    0,
    Math.min(Math.max(balance, 0), expectedPaid - payments)
  );

  const courseEnded = monthsElapsed >= months;

  let state = "on-track";
  if (balance <= 0) state = "paid-off";
  else if (monthsElapsed === 0) state = "not-started";
  else if (overdue > 0 && courseEnded) state = "course-ended";
  else if (overdue > 0) state = "overdue";

  return {
    available: true,
    state,
    months,
    startDate,
    startSource,
    monthsElapsed,
    monthsRemaining: Math.max(0, months - monthsElapsed),
    dueInstallments,
    courseEnded,
    charges,
    adjustments,
    netPrice,
    monthlyInstallment,
    expectedPaid,
    payments,
    balance,
    overdue,
    overdueInstallments: monthlyInstallment > 0 ? overdue / monthlyInstallment : 0
  };
};

// نتيجة الباك (POST /api/payment-follow/arrears) بنفس شكل تقدير الفرونت.
// الباك هو المصدر الأدق لأنه يقرأ أنواع القيود من دفتر الحسابات.
export const fromServerArrears = (item) => {
  if (!item || !item.applicable) return { available: false, reason: "not-applicable" };

  const [year, month, day] = String(item.startDate || "").split("-").map(Number);
  const startDate = year ? new Date(year, month - 1, day) : null;

  return {
    available: true,
    source: "server",
    state: item.state,
    months: item.months,
    startDate,
    startSource: item.startSource,
    monthsElapsed: item.monthsElapsed,
    monthsRemaining: item.monthsRemaining,
    dueInstallments: item.dueInstallments,
    courseEnded: item.monthsElapsed >= item.months,
    netPrice: item.netPrice,
    monthlyInstallment: item.monthlyInstallment,
    expectedPaid: item.expectedPaid,
    payments: item.payments,
    balance: item.balance,
    overdue: item.overdue,
    overdueInstallments: item.overdueInstallments,
    hasOpeningBalance: Boolean(item.hasOpeningBalance)
  };
};
