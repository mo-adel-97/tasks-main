import { SIDEBAR_ICON_LIST } from "./sidebarIcons";

/*
  بحث الأيقونات بالعربي أو الإنجليزي.
  الكلمة العربية بتتحوّل لكلمات إنجليزية من القاموس ده، وبعدين بندوّر بيها في أسماء الأيقونات
  (الأقرب الأول: اللي اسمها بيبدأ بالكلمة، بعدين اللي فيها الكلمة).
  لإضافة كلمة: سطر جديد [كلمات عربية مفصولة بـ |، كلمات إنجليزية مفصولة بمسافة].
*/
const DICTIONARY = [
  ["الرئيسية|رئيسيه|بيت|منزل|البداية|الصفحة الرئيسية", "home house dashboard"],
  ["ملف شخصي|الملف الشخصي|بروفايل|حسابي|بياناتي", "accountcircle badge contactpage person face"],
  ["شخص|فرد|مستخدم|يوزر", "person accountcircle face"],
  ["مستخدمين|اشخاص|ناس|افراد|اعضاء", "people groups group supervisor"],
  ["موظف|موظفين|عامل|عمال|طاقم|فريق", "badge groups people engineering work supervisor"],
  ["اضافة مستخدم|مستخدم جديد|تسجيل مستخدم", "personadd groupadd"],
  ["مدير|اداره|ادارة|مشرف|ادمن", "admin supervisor manageaccounts businesscenter"],
  ["عميل|عملاء|زبون|زبائن", "people contacts handshake groups"],
  ["طالب|طلاب|متدرب|متدربين|دارس", "school person face howtoreg"],
  ["مدرب|مدربين|معلم|مدرس|استاذ", "copresent castforeducation school person"],
  ["تعليم|دراسه|دراسة|مدرسه|مدرسة|معهد|جامعه", "school menubook castforeducation"],
  ["كتاب|كتب|مكتبه|مكتبة|مكتبات|منهج|مناهج", "menubook librarybooks book autostories locallibrary"],
  ["دبلوم|شهاده|شهادة|تخرج|خريج|خريجين", "workspacepremium school militarytech verified"],
  ["دوره|دورة|دورات|كورس|كورسات|تدريب", "castforeducation copresent school menubook"],
  ["اختبار|اختبارات|امتحان|امتحانات|سؤال|اسئله|اسئلة|كويز", "quiz assignment livehelp factcheck"],
  ["استبيان|استبيانات|تصويت|راي|رأي|تقييم", "poll ratereview thumbup star feedback"],
  ["فلوس|مال|اموال|نقود|نقدي|كاش", "attachmoney money paid payments localatm savings wallet currencyexchange monetization"],
  ["دفع|سداد|مدفوعات|دفعه|دفعة", "payment payments paid creditcard"],
  ["تحصيل|اقساط|قسط|متابعه سداد|متابعة السداد", "requestquote paid payments savings"],
  ["حساب|حسابات|محاسبه|محاسبة|ماليه|مالية|بنك|بنوك", "accountbalance accountbalancewallet calculate wallet"],
  ["خزنه|خزنة|خزينه|خزينة|محفظه|محفظة", "wallet accountbalancewallet savings"],
  ["فاتوره|فاتورة|فواتير|ايصال|إيصال|سند", "receipt receiptlong requestquote description"],
  ["ضريبه|ضريبة|ضرائب|نسبه|نسبة|خصم|خصومات", "percent discount pricechange"],
  ["سعر|اسعار|أسعار|عرض سعر|تسعير", "requestquote sell pricechange localoffer"],
  ["مبيعات|بيع|مندوب|مندوبين|متجر|محل", "storefront store sell shoppingcart pointofsale"],
  ["شراء|مشتريات|سله|سلة|طلبات شراء", "shoppingcart shoppingbag"],
  ["هديه|هدية|عروض|كوبون|مكافاه|مكافأة|جوائز|جائزه", "cardgiftcard redeem emojievents loyalty"],
  ["عموله|عمولة|عمولات|ربح|ارباح|أرباح|دخل", "trendingup paid savings monetization"],
  ["تقرير|تقارير|احصائيات|إحصائيات|احصاء", "assessment analytics barchart summarize insights"],
  ["رسم بياني|رسوم بيانيه|مخطط|منحنى|نمو", "barchart showchart piechart timeline trendingup"],
  ["لوحه|لوحة|داشبورد|لوحه تحكم|لوحة التحكم", "dashboard spacedashboard gridview"],
  ["ملف|ملفات|مجلد|مجلدات|ارشيف|أرشيف", "folder folderopen archive insertdrivefile"],
  ["مستند|مستندات|وثيقه|وثيقة|وثائق|ورقه|ورقة|اوراق", "description article insertdrivefile contentpaste"],
  ["رفع|تحميل|ارفاق|مرفق|مرفقات", "upload cloudupload attachfile attachment"],
  ["تنزيل|تصدير|داونلود", "download clouddownload importexport"],
  ["طباعه|طباعة|طابعه|طابعة", "print"],
  ["بي دي اف|pdf", "pictureaspdf"],
  ["عقد|عقود|اتفاقيه|اتفاقية|شراكه|شراكة", "handshake description gavel"],
  ["قانون|قانوني|محكمه|محكمة|سياسه|سياسة|لائحه|لائحة", "gavel policy balance"],
  ["مهمه|مهمة|مهام|تكليف|واجب", "task assignment taskalt checklist"],
  ["قائمه|قائمة|قوائم|ليست|كشف", "list formatlistbulleted viewlist checklist"],
  ["متابعه|متابعة|تتبع|حاله|حالة", "pendingactions timeline trackchanges checklist"],
  ["موافقه|موافقة|اعتماد|قبول|تم", "checkcircle taskalt doneall verified"],
  ["رفض|الغاء|إلغاء|منع|حظر|ممنوع", "block cancel highlightoff"],
  ["حذف|مسح|ازاله|إزالة", "delete deletesweep remove"],
  ["تعديل|تحرير|تغيير", "edit editnote"],
  ["اضافه|إضافة|جديد|انشاء|إنشاء", "add addcircle notadd createnewfolder"],
  ["بحث|استعلام|تفتيش", "search managesearch personsearch"],
  ["فلتر|تصفيه|تصفية|ترتيب", "filteralt sort tune"],
  ["عرض|مشاهده|مشاهدة|معاينه|معاينة", "visibility preview"],
  ["تاريخ|تقويم|موعد|مواعيد|جدول|جداول", "calendarmonth event eventnote daterange today"],
  ["وقت|ساعه|ساعة|زمن|مؤقت|دوام", "schedule accesstime timer watchlater"],
  ["حضور|انصراف|بصمه|بصمة", "fingerprint howtoreg schedule eventavailable"],
  ["اجازه|إجازة|اجازات|إجازات|عطله|عطلة", "eventbusy beachaccess event history"],
  ["سجل|تاريخ العمليات|نشاط|نشاطات|حركات", "history manage historymanage timeline"],
  ["رسائل|رساله|رسالة|شات|محادثه|محادثة|دردشه", "message chat forum sms questionanswer"],
  ["بريد|ايميل|إيميل|بريد الكتروني", "email mail inbox send"],
  ["هاتف|تليفون|جوال|موبايل|اتصال|مكالمه|مكالمة", "phone call phoneintalk phoneandroid contactphone"],
  ["اشعار|إشعار|اشعارات|إشعارات|تنبيه|تنبيهات", "notifications notificationsactive campaign"],
  ["اعلان|إعلان|اعلانات|تسويق|حمله|حملة|حملات", "campaign announcement campaignoutlined"],
  ["تواصل|خدمات|خدمه عملاء|خدمة العملاء|دعم|مساعده|مساعدة|دعم فني", "supportagent support headsetmic contactsupport livehelp"],
  ["شكوى|شكاوى|ملاحظات|اقتراح|اقتراحات", "feedback report comment ratereview"],
  ["سؤال|استفسار|مساعده|اسئله شائعه", "help helpoutline livehelp questionanswer"],
  ["اعدادات|إعدادات|ضبط|تخصيص|اعداد", "settings tune settingsapplications"],
  ["ادوات|أدوات|صيانه|صيانة|اصلاح", "build handyman construction hardware engineering"],
  ["امان|أمان|حمايه|حماية|صلاحيات|صلاحيه|صلاحية", "security shield verifieduser admin policy"],
  ["قفل|كلمه السر|كلمة السر|باسورد|مفتاح", "lock key vpnkey password lockreset"],
  ["خروج|تسجيل خروج", "logout exittoapp"],
  ["فرع|فروع|مبنى|شركه|شركة|مقر|مؤسسه|مؤسسة", "apartment business domain corporatefare locationcity"],
  ["مكتب|مكاتب|استقبال|ريسبشن", "meetingroom chair storefront supportagent"],
  ["قسم|اقسام|أقسام|اداره|إدارات", "category accounttree businesscenter workspaces"],
  ["وظيفه|وظيفة|وظائف|عمل|شغل", "work workoutline businesscenter badge"],
  ["مخزن|مخازن|مستودع|جرد|عهده|عهدة|اصول|أصول", "warehouse inventory inventory2 category"],
  ["سياره|سيارة|نقل|توصيل|شحن", "directionscar localshipping directionsbus"],
  ["سفر|طيران|رحله|رحلة", "flight travelexplore"],
  ["مكان|موقع|عنوان|خريطه|خريطة", "locationon place map mylocation"],
  ["لغه|لغة|لغات|ترجمه|ترجمة|عالمي", "translate language public"],
  ["صحه|صحة|طبي|مستشفى|علاج|دواء", "localhospital medicalservices healthandsafety medication"],
  ["رياضه|رياضة|لياقه|لياقة", "fitnesscenter sportssoccer"],
  ["كمبيوتر|حاسب|لابتوب|جهاز|اجهزه|أجهزة", "computer laptop phoneandroid tablet"],
  ["برمجه|برمجة|كود|نظام|سيستم|تقني|تقنيه", "code terminal dataobject api storage"],
  ["صوره|صورة|صور|كاميرا|فيديو", "image photocamera camera videocam collections"],
  ["كيو ار|باركود|رمز|qr", "qrcode qrcode2 qrcodescanner"],
  ["نجمه|نجمة|مميز|مفضله|مفضلة|تميز", "star favorite grade workspacepremium"],
  ["كاس|كأس|بطوله|بطولة|فوز|انجاز|إنجاز|اوسمه", "emojievents militarytech workspacepremium celebration"],
  ["فكره|فكرة|افكار|ابداع|إبداع", "lightbulb emojiobjects psychology"],
  ["تحويل|نقل طالب|تبديل|تبادل", "swaphoriz swapvert currencyexchange compareArrows"],
  ["تحديث|مزامنه|مزامنة|تجديد", "sync refresh autorenew update systemupdate"],
  ["مشاركه|مشاركة|ارسال|إرسال", "share send"],
  ["رابط|لينك", "link launch openinnew"],
  ["معلومات|تفاصيل|بيانات", "info description article"],
  ["تحذير|خطا|خطأ|مشكله|مشكلة", "warning error reportproblem report"],
  ["كل|تطبيقات|ايقونات|شبكه|شبكة", "apps gridview widgets viewmodule"],
  ["هيكل|شجره|شجرة|تنظيم", "accounttree hub devicehub"],
  ["خطه|خطة|خطط|استراتيجيه|هدف|اهداف", "flag rocketlaunch insights timeline"],
  ["جوده|جودة|فحص|مراجعه|مراجعة|تدقيق", "factcheck verified checklist ratereview"]
];

// توحيد الكتابة العربية: الهمزات والتاء المربوطة والياء والتشكيل و"ال" التعريف.
export const normalizeArabic = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();

const stripAl = (word) => (word.startsWith("ال") && word.length > 3 ? word.slice(2) : word);

const ENTRIES = DICTIONARY.map(([ar, en]) => ({
  words: ar.split("|").map((w) => normalizeArabic(w)).filter(Boolean),
  terms: en.toLowerCase().split(/\s+/).filter(Boolean)
}));

const hasArabic = (value) => /[؀-ۿ]/.test(value);

// الكلمات الإنجليزية المقابلة للكلمة العربية (بالترتيب: المطابق تماماً الأول).
export const arabicToTerms = (query) => {
  const q = normalizeArabic(query);
  if (!q) return [];
  const qWords = q.split(" ").map(stripAl);
  const exact = [];
  const partial = [];
  const qq = qWords.join(" ");
  for (const entry of ENTRIES) {
    for (const word of entry.words) {
      const wWords = word.split(" ").map(stripAl);
      const w = wWords.join(" ");
      if (w === qq) {
        exact.push(...entry.terms);
        break;
      }
      // كلمة كاملة مطابقة، أو بداية كلمة (وإنت لسه بتكتب) — مش أي جزء جوه الكلمة.
      const prefix = qq.length >= 2 && w.startsWith(qq);
      const wholeWord = qWords.some((x) => x.length > 2 && wWords.includes(x));
      const wordPrefix = qWords.some((x) => x.length >= 3 && wWords.some((y) => y.startsWith(x)));
      if (prefix || wholeWord || wordPrefix) {
        partial.push(...entry.terms);
        break;
      }
    }
  }
  return [...new Set([...exact, ...partial])];
};

/**
 * يرجّع مفاتيح الأيقونات المطابقة للبحث مرتبة من الأقرب للأبعد.
 * entries: [key, name, Icon] زي SIDEBAR_ICON_LIST.
 */
export const searchIcons = (query, entries = SIDEBAR_ICON_LIST) => {
  const raw = String(query ?? "").trim().toLowerCase();
  if (!raw) return entries.map(([key]) => key);

  const terms = hasArabic(raw) ? arabicToTerms(raw) : [raw];
  if (!terms.length) return [];

  const scored = [];
  for (const [key, name] of entries) {
    const k = key.toLowerCase();
    const n = String(name).toLowerCase();
    let best = Infinity;
    terms.forEach((term, index) => {
      // ترتيب الكلمة في القاموس + نوع التطابق (مطابق / بيبدأ بيها / فيها).
      let score = Infinity;
      if (k === term || n === term) score = 0;
      else if (k.startsWith(term) || n.startsWith(term)) score = 1;
      else if (k.includes(term) || n.includes(term)) score = 2;
      if (score !== Infinity) best = Math.min(best, index * 3 + score);
    });
    if (best !== Infinity) scored.push([best, key]);
  }
  return scored.sort((a, b) => a[0] - b[0]).map(([, key]) => key);
};
