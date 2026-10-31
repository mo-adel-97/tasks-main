// =====================================================================
// كل روابط السيرفرات اللي الواجهة بتكلمها — في مكان واحد.
// لو سيرفر اتغير، عدّل اللينك هنا بس.
// =====================================================================

// السيرفر الرئيسي (api4). api1 و api3 (APIZacat) والتسجيلات اتدمجوا فيه،
// فكل الطلبات اللي كانت رايحة لهم بقت رايحة هنا بنفس المسارات.
// ممكن يتغير وقت البناء من متغير البيئة REACT_APP_API_BASE_URL أو REACT_APP_API_URL.
export const SSTLI_API_URL = (
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "https://api4.sstli.com"
).replace(/\/+$/, "");

// ---------------------------------------------------------------------
// سيرفرات تانية (مش جزء من الدمج — نفس اللينكات القديمة بالظبط)
// ---------------------------------------------------------------------

// سيرفر ملفات PHP (الصور، الـ ERP، الشات الجماعي، الحضور...).
export const FILES_SERVER_URL = "https://filesregsiteration.sstli.com";

// موقع المعهد (سياسة الاسترداد، عرض الفواتير arc/api، صور المرفقات arc-api).
export const SSTLI_SITE_URL = "https://sstli.com";

// API المقررات المشتركة (PHP).
export const HASSEN_API_URL = "https://hassen.sstli.com/api/index.php";

// غرف الاجتماعات.
export const MEETINGS_SERVER_URL = "https://meetings.sstli.com";

// الاستبيانات.
export const SURVEYS_SITE_URL = "https://surveys.sstli.com";

// اختبارات الطلاب.
export const STUDENT_EXAMS_URL = "http://examsforstudents.sstli.com";

// سيرفر السوكيت لمكالمات الفيديو (شبكة داخلية).
export const SIGNALING_SERVER_URL = "https://192.168.50.169:8443";
