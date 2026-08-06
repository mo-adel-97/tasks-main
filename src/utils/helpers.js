/* ===== Helpers: تحويل الأرقام العربية ===== */
export const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toArabicDigits(input) {
  return String(input ?? "").replace(/\d/g, (d) => AR_DIGITS[d]);
}

/* كود المقرر من (الدبلوم+المستوى+المقرر) */
export function deriveCourseCode(diplomaName, levelName, courseKey, COURSE_TITLES) {
  const dipMap = [
    { k: "الموارد البشرية", v: "HR" },
    { k: "إدارة الأعمال", v: "BUS" },
    { k: "القانون", v: "LAW" },
    { k: "الأمن السيبراني", v: "CYB" },
    { k: "المستشفيات", v: "HOS" },
    { k: "الادارة المكتبية", v: "OFF" },
    { k: "إدارة التمريض", v: "NUR" },
    { k: "إدارة السلامة", v: "SAF" },
  ];
  const lvlMap = [
    { k: "الأول", v: "L1" },
    { k: "الثاني", v: "L2" },
    { k: "الثالث", v: "L3" },
    { k: "الرابع", v: "L4" },
    { k: "الخامس", v: "L5" },
    { k: "السادس", v: "L6" },
    { k: "السابع", v: "L7" },
  ];

  const dip = dipMap.find((x) => diplomaName?.includes(x.k))?.v || "GEN";
  const lvl = lvlMap.find((x) => levelName?.includes(x.k))?.v || "LX";
  const courseName = COURSE_TITLES[courseKey] || courseKey;

  return `${dip}-${lvl}-${courseName}`;
}