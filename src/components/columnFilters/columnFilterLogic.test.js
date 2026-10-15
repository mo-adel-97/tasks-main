import {
  applyColumnFilters,
  buildOptions,
  getCellText,
  isChecked,
  matchesSearch,
  onlyValues,
  setValues,
  toggleValue
} from "./columnFilterLogic";

const rows = [
  { id: 1, branch: "الرياض", type: "دبلوم", student: "أحمد" },
  { id: 2, branch: "الرياض", type: "دورة", student: "منى" },
  { id: 3, branch: "الدمام", type: "دبلوم", student: "سارة" },
  { id: 4, branch: "جدة", type: "دبلوم", student: "" },
  { id: 5, branch: "الدمام", type: "دورة", student: "خالد" }
];

test("options list every value with its count, sorted, blanks last", () => {
  const options = buildOptions(rows, {}, "student");
  expect(options.map((o) => o.value)).toEqual(["أحمد", "خالد", "سارة", "منى", ""]);
  expect(options[options.length - 1].label).toBe("(فارغ)");

  const branch = buildOptions(rows, {}, "branch");
  expect(branch.find((o) => o.value === "الرياض").count).toBe(2);
});

test("selecting several values keeps only those rows (multi-select)", () => {
  const allBranches = buildOptions(rows, {}, "branch").map((o) => o.value);
  let selected = toggleValue(undefined, allBranches, "جدة"); // uncheck one => the others stay
  expect([...selected].sort()).toEqual(["الدمام", "الرياض"]);

  const filtered = applyColumnFilters(rows, { branch: selected });
  expect(filtered.map((r) => r.id)).toEqual([1, 2, 3, 5]);
});

test("filters of other columns narrow the list (like Excel)", () => {
  const filters = { type: new Set(["دبلوم"]) };
  const options = buildOptions(rows, filters, "branch");
  expect(options.map((o) => o.value).sort()).toEqual(["الدمام", "الرياض", "جدة"]);
  expect(options.find((o) => o.value === "الرياض").count).toBe(1); // only the diploma in Riyadh

  // the column's own filter does not hide its own values
  const own = buildOptions(rows, { branch: new Set(["جدة"]) }, "branch");
  expect(own.length).toBe(3);
});

test("only-these / select-all / clear-shown behave like Excel", () => {
  const all = ["أ", "ب", "ج"];
  expect([...onlyValues(all, ["ب", "ج"])]).toEqual(["ب", "ج"]);
  expect(onlyValues(all, all)).toBeUndefined(); // everything selected => no filter

  const after = setValues(undefined, all, ["أ"], false); // clear the shown value
  expect([...after].sort()).toEqual(["ب", "ج"]);
  expect(setValues(after, all, ["أ"], true)).toBeUndefined();

  expect(isChecked(undefined, "x")).toBe(true);
  expect(isChecked(new Set(["a"]), "b")).toBe(false);
});

test("blank values can be filtered and accessors change what a cell shows", () => {
  expect(applyColumnFilters(rows, { student: new Set([""]) }).map((r) => r.id)).toEqual([4]);

  const accessors = { type: (row) => (row.type === "دبلوم" ? "مشترك" : "غير مشترك") };
  expect(getCellText(rows[0], "type", accessors)).toBe("مشترك");
  expect(applyColumnFilters(rows, { type: new Set(["غير مشترك"]) }, accessors).map((r) => r.id)).toEqual([2, 5]);
});

test("search ignores Arabic letter variants", () => {
  expect(matchesSearch({ label: "إدارة الأعمال" }, "ادارة")).toBe(true);
  expect(matchesSearch({ label: "فاطمة" }, "فاطمه")).toBe(true);
  expect(matchesSearch({ label: "الرياض" }, "جدة")).toBe(false);
  expect(matchesSearch({ label: "أي شيء" }, "")).toBe(true);
});
