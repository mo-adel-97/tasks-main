// منطق فلتر القيم لكل عمود (على طريقة Excel): نعرض كل القيم الموجودة في العمود
// ويحدد المستخدم قيمة أو أكثر. لا يعتمد على React حتى يسهل اختباره.
//
// filters = { [field]: Set<string> | undefined }
//   undefined / غير موجود = لا فلتر (كل القيم)
//   Set = القيم المسموح بها فقط

export const EMPTY_LABEL = "(فارغ)";

const pad = (value) => String(value).padStart(2, "0");

export const normalizeValue = (value) => {
  if (value === null || value === undefined) return "";

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ""
      : `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  return String(value).replace(/\s+/g, " ").trim();
};

// النص الذي يراه المستخدم في الخلية (accessor لو العمود يعرض قيمة مختلفة عن الحقل).
export const getCellText = (row, field, accessors) =>
  normalizeValue(accessors && accessors[field] ? accessors[field](row) : row?.[field]);

const activeEntries = (filters, skipField) =>
  Object.entries(filters || {}).filter(([field, set]) => set && field !== skipField);

export const applyColumnFilters = (rows, filters, accessors, skipField) => {
  const active = activeEntries(filters, skipField);
  if (!active.length) return rows;

  return rows.filter((row) =>
    active.every(([field, set]) => set.has(getCellText(row, field, accessors)))
  );
};

const compareValues = (a, b) => {
  if (a.value === "" && b.value !== "") return 1;
  if (b.value === "" && a.value !== "") return -1;
  return a.value.localeCompare(b.value, "ar", { numeric: true });
};

// قيم العمود مع عددها. الفلاتر الأخرى تؤثر (كما في Excel): لا نعرض إلا القيم المتاحة
// بعد تطبيق فلاتر بقية الأعمدة.
export const buildOptions = (rows, filters, field, accessors) => {
  const base = applyColumnFilters(rows, filters, accessors, field);
  const counts = new Map();

  base.forEach((row) => {
    const value = getCellText(row, field, accessors);
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts, ([value, count]) => ({
    value,
    count,
    label: value === "" ? EMPTY_LABEL : value
  })).sort(compareValues);
};

// لو اختير كل شيء فلا داعي لفلتر.
const finalize = (set, allValues) =>
  allValues.every((value) => set.has(value)) ? undefined : set;

const startFrom = (selected, allValues) =>
  selected ? new Set(selected) : new Set(allValues);

export const toggleValue = (selected, allValues, value) => {
  const set = startFrom(selected, allValues);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  return finalize(set, allValues);
};

export const setValues = (selected, allValues, values, checked) => {
  const set = startFrom(selected, allValues);
  values.forEach((value) => (checked ? set.add(value) : set.delete(value)));
  return finalize(set, allValues);
};

export const onlyValues = (allValues, values) => finalize(new Set(values), allValues);

export const isChecked = (selected, value) => !selected || selected.has(value);

// بحث بسيط يتجاهل الفروق الشائعة في الحروف العربية.
export const normalizeSearch = (text) =>
  String(text || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ً-ْ]/g, "")
    .trim();

export const matchesSearch = (option, search) => {
  const needle = normalizeSearch(search);
  return !needle || normalizeSearch(option.label).includes(needle);
};
