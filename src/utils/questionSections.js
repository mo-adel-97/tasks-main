// أقسام الأسئلة (الاختبارات والاستبيانات) بدون أي تعديل في الباك إند:
// اسم القسم يتخزن كبادئة داخل نص السؤال نفسه بالشكل:  "⟦اسم القسم⟧ نص السؤال"
// الأسئلة القديمة بدون البادئة تظهر زي ما هي (بدون قسم).
// نفس الصيغة مستخدمة في تطبيق عرض الاختبارات (examsforstudents) وتطبيق الاستبيانات (estpinat).

const SECTION_PREFIX = /^\s*⟦([^⟧]*)⟧\s*/;

export const splitSection = (raw) => {
  const value = String(raw ?? '');
  const match = value.match(SECTION_PREFIX);
  if (!match) return { section: '', text: value };
  return { section: match[1].trim(), text: value.slice(match[0].length) };
};

export const stripSection = (raw) => splitSection(raw).text;

export const cleanSectionTitle = (title) =>
  String(title ?? '').replace(/[⟦⟧]/g, '').replace(/\s+/g, ' ').trim();

export const joinSection = (section, text) => {
  const body = stripSection(text);
  const title = cleanSectionTitle(section);
  return title ? `⟦${title}⟧ ${body}` : body;
};

// تجميع العناصر حسب القسم بترتيب أول ظهور لكل قسم، مع الحفاظ على ترتيب الأسئلة داخله.
// يرجع: [{ section, items: [{ item, index }] }]
export const groupBySection = (items, getRawText) => {
  const groups = [];
  const byTitle = new Map();

  (items || []).forEach((item, index) => {
    const { section } = splitSection(getRawText(item));
    if (!byTitle.has(section)) {
      const group = { section, items: [] };
      byTitle.set(section, group);
      groups.push(group);
    }
    byTitle.get(section).items.push({ item, index });
  });

  return groups;
};

export const hasSections = (items, getRawText) =>
  (items || []).some((item) => splitSection(getRawText(item)).section !== '');

// مجموعات متتالية (للمحرر): كل مجموعة = أسئلة متجاورة لها نفس القسم.
// يرجع: [{ section, start, end }] (end شامل)
export const sectionRuns = (questions, getSection = (q) => q.section || '') => {
  const runs = [];
  (questions || []).forEach((question, index) => {
    const section = getSection(question);
    const last = runs[runs.length - 1];
    if (last && last.section === section) {
      last.end = index;
    } else {
      runs.push({ section, start: index, end: index });
    }
  });
  return runs;
};

// ترتيب ثابت يخلي أسئلة كل قسم جنب بعض (بترتيب أول ظهور للقسم).
export const orderBySection = (questions, getSection = (q) => q.section || '') => {
  const order = [];
  const buckets = new Map();
  (questions || []).forEach((question) => {
    const section = getSection(question);
    if (!buckets.has(section)) {
      buckets.set(section, []);
      order.push(section);
    }
    buckets.get(section).push(question);
  });
  return order.flatMap((section) => buckets.get(section));
};
