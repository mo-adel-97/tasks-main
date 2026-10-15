import { hijriToGregorian, parseHijriBatchDate } from "./hijriDate";

const ymd = (date) =>
  date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : null;

test("converts Umm al-Qura dates to Gregorian (same values the API returns)", () => {
  // كل هذه القيم اتفق عليها تحويل الباك (UmAlQuraCalendar) وتحويل المتصفح (Intl) بشكل مستقل.
  const known = {
    "14/2/1446": "2024-08-18",
    "04/11/1445": "2024-05-12",
    "16/02/1447": "2025-08-10",
    "04/05/1447": "2025-10-26",
    "29/07/1447": "2026-01-18",
    "10/03/1448": "2026-08-23",
    "21/05/1448": "2026-11-01"
  };
  Object.entries(known).forEach(([hijri, gregorian]) => {
    expect(ymd(parseHijriBatchDate(hijri))).toBe(gregorian);
  });
  expect(ymd(hijriToGregorian(1446, 2, 14))).toBe("2024-08-18");
});

test("round trip over many days and bad input", () => {
  const f = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { year: "numeric", month: "numeric", day: "numeric" });
  for (let offset = 0; offset < 900; offset += 37) {
    const date = new Date(2024, 0, 1 + offset, 12);
    const p = f.formatToParts(date);
    const g = (t) => Number(p.find((x) => x.type === t).value);
    expect(ymd(hijriToGregorian(g("year"), g("month"), g("day")))).toBe(ymd(date));
  }

  expect(parseHijriBatchDate("")).toBeNull();
  expect(parseHijriBatchDate("abc")).toBeNull();
  expect(parseHijriBatchDate("32/13/1446")).toBeNull();
});
