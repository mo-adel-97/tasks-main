import { estimateArrears, fromServerArrears, wholeMonthsBetween } from "./arrearsEstimate";

const today = new Date("2026-09-20T12:00:00");

const ledger = (rows) =>
  rows.map(([dayDate, name, maden, daen, balance]) => ({
    dayDate,
    name,
    maden,
    daen,
    balance
  }));

test("whole months between dates", () => {
  expect(wholeMonthsBetween(new Date("2024-07-27"), new Date("2026-09-20"))).toBe(25);
  expect(wholeMonthsBetween(new Date("2026-08-20"), new Date("2026-09-20"))).toBe(1);
  expect(wholeMonthsBetween(new Date("2026-09-21"), new Date("2026-09-20"))).toBe(0);
});

test("course ended: the whole remaining balance is overdue", () => {
  const result = estimateArrears(
    ledger([
      ["2024-07-27T16:15:56", "أستمارة تسجيل", 18000, 0, 18000],
      ["2024-07-27T16:15:56", "سند قبض", 0, 3800, 14200],
      ["2024-07-28T00:00:00", "قيد يومية", 0, 2700, 11500],
      ["2025-02-09T08:41:43", "سند قبض", 0, 479, 11021],
      ["2025-11-04T09:20:21", "سند قبض", 0, 1000, 10021]
    ]),
    { today }
  );

  expect(result.available).toBe(true);
  expect(result.netPrice).toBe(15300); // 18000 - خصم 2700
  expect(result.payments).toBe(5279);
  expect(result.monthlyInstallment).toBeCloseTo(637.5);
  expect(result.courseEnded).toBe(true);
  expect(result.dueInstallments).toBe(24);
  expect(result.overdue).toBeCloseTo(10021);
  expect(result.state).toBe("course-ended");
  expect(result.overdueInstallments).toBeCloseTo(15.72, 1);
});

test("mid course: behind schedule", () => {
  // 12 whole months elapsed, price 24000 => 1000 / month => 12000 should be paid
  const result = estimateArrears(
    ledger([
      ["2025-09-10T10:00:00", "أستمارة تسجيل", 24000, 0, 24000],
      ["2025-09-10T10:00:00", "سند قبض", 0, 5000, 19000],
      ["2026-03-01T10:00:00", "سند قبض", 0, 2000, 17000]
    ]),
    { today }
  );

  expect(result.monthsElapsed).toBe(12);
  expect(result.expectedPaid).toBe(12000);
  expect(result.overdue).toBe(5000);
  expect(result.state).toBe("overdue");
  expect(result.courseEnded).toBe(false);
  expect(result.monthsRemaining).toBe(12);
});

test("ahead of schedule: nothing overdue", () => {
  const result = estimateArrears(
    ledger([
      ["2026-03-15T10:00:00", "أستمارة تسجيل", 12000, 0, 12000],
      ["2026-03-15T10:00:00", "سند قبض", 0, 6000, 6000]
    ]),
    { today }
  );

  expect(result.monthsElapsed).toBe(6);
  expect(result.expectedPaid).toBe(3000);
  expect(result.overdue).toBe(0);
  expect(result.state).toBe("on-track");
});

test("fully paid", () => {
  const result = estimateArrears(
    ledger([
      ["2024-01-01T10:00:00", "أستمارة تسجيل", 9000, 0, 9000],
      ["2024-01-02T10:00:00", "سند قبض", 0, 9000, 0]
    ]),
    { today }
  );

  expect(result.overdue).toBe(0);
  expect(result.state).toBe("paid-off");
});

test("registered this month: not started, nothing overdue", () => {
  const result = estimateArrears(
    ledger([["2026-09-05T10:00:00", "أستمارة تسجيل", 18000, 0, 18000]]),
    { today }
  );

  expect(result.monthsElapsed).toBe(0);
  expect(result.overdue).toBe(0);
  expect(result.state).toBe("not-started");
});

test("overdue never exceeds the remaining balance; no data is handled", () => {
  const capped = estimateArrears(
    ledger([
      ["2024-01-01T10:00:00", "أستمارة تسجيل", 1000, 0, 1000],
      ["2024-01-02T10:00:00", "سند قبض", 0, 900, 100]
    ]),
    { today }
  );
  expect(capped.overdue).toBe(100);

  expect(estimateArrears([], { today }).available).toBe(false);
  expect(estimateArrears(null, { today }).available).toBe(false);
});

test("the batch start date (Hijri) is the start of the installments, not the registration date", () => {
  const rows = ledger([
    ["2026-01-10T10:00:00", "أستمارة تسجيل", 12000, 0, 12000]
  ]);

  // registered in January but the batch starts 23/8/2026 (10/03/1448): not even one month passed
  const withBatch = estimateArrears(rows, { today, batchDate: "10/03/1448" });
  expect(withBatch.startSource).toBe("batch");
  expect(withBatch.monthsElapsed).toBe(0);
  expect(withBatch.overdue).toBe(0);
  expect(withBatch.state).toBe("not-started");

  // without a batch date it falls back to the first charge (8 months => 4000)
  const withoutBatch = estimateArrears(rows, { today });
  expect(withoutBatch.startSource).toBe("first-charge");
  expect(withoutBatch.monthsElapsed).toBe(8);
  expect(withoutBatch.overdue).toBe(4000);

  // two months after the batch start
  const later = estimateArrears(rows, { today: new Date("2026-10-24T12:00:00"), batchDate: "10/03/1448" });
  expect(later.monthsElapsed).toBe(2);
  expect(later.expectedPaid).toBe(1000);
  expect(later.overdue).toBe(1000);
});

test("screenshot student with his batch date 14/2/1446", () => {
  const result = estimateArrears(
    ledger([
      ["2024-07-27T16:15:56", "أستمارة تسجيل", 18000, 0, 18000],
      ["2024-07-27T16:15:56", "سند قبض", 0, 3800, 14200],
      ["2024-07-28T00:00:00", "قيد يومية", 0, 2700, 11500],
      ["2025-02-09T08:41:43", "سند قبض", 0, 479, 11021],
      ["2025-11-04T09:20:21", "سند قبض", 0, 1000, 10021]
    ]),
    { today, batchDate: "14/2/1446" }
  );

  expect(result.startSource).toBe("batch");
  expect(result.startDate.getFullYear() + "-" + (result.startDate.getMonth() + 1) + "-" + result.startDate.getDate()).toBe("2024-8-18");
  expect(result.monthsElapsed).toBe(25);
  expect(result.courseEnded).toBe(true);
  expect(result.overdue).toBeCloseTo(10021);
});

test("registration fees and refunds (سند صرف) are not part of the diploma price", () => {
  const result = estimateArrears(
    ledger([
      ["2024-12-02T10:00:00", "أستمارة تسجيل", 20000, 0, 20000],
      ["2024-12-09T10:00:00", "مرتجع استمارة", 0, 20000, 0],
      ["2024-12-09T10:00:00", "استمارة رسوم", 125, 0, 125],
      ["2024-12-09T10:00:00", "سند صرف", 375, 0, 500],
      ["2025-07-06T10:00:00", "أستمارة تسجيل", 20000, 0, 20500],
      ["2025-07-10T10:00:00", "قيد يومية", 0, 3000, 17500]
    ]),
    { today }
  );

  expect(result.netPrice).toBe(17000); // 40000 - 20000 - 3000
});

test("server result is adapted to the card shape", () => {
  const adapted = fromServerArrears({
    applicable: true, state: "overdue", startDate: "2024-08-18", startSource: "batch", months: 24,
    monthsElapsed: 25, monthsRemaining: 0, dueInstallments: 24, netPrice: 15300, monthlyInstallment: 637.5,
    expectedPaid: 15300, payments: 5279, balance: 10021, overdue: 10021, overdueInstallments: 15.7
  });

  expect(adapted.available).toBe(true);
  expect(adapted.courseEnded).toBe(true);
  expect(adapted.startDate.getFullYear()).toBe(2024);
  expect(fromServerArrears({ applicable: false }).available).toBe(false);
  expect(fromServerArrears(null).available).toBe(false);
});
