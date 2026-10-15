// حسابات شاشة "عرض سعر" — منقولة حرفيًا من EncodingOfferPrice / FrmOfferPriceEditBeforePreview في الديسكتوب.

export const OFFER_MODE_ITEMS = 0; // عرض مختصر - بنود فقط
export const OFFER_MODE_TRAINEES = 1; // عرض تفصيلي - بنود + أسماء متدربين
export const OFFER_MODE_COUNT = 2; // عرض تفصيلي - بنود + أعداد متدربين

export const OFFER_MODES = [
  { value: OFFER_MODE_ITEMS, label: "عرض مختصر - بنود فقط" },
  { value: OFFER_MODE_TRAINEES, label: "عرض تفصيلي - بنود + أسماء متدربين" },
  { value: OFFER_MODE_COUNT, label: "عرض تفصيلي - بنود + أعداد متدربين" }
];

export const toNum = (value, fallback = 0) => {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) && String(value ?? "").trim() !== "" ? n : fallback;
};

// Math.Round(x, n) في .NET بيعمل Banker's rounding؛ هنا AwayFromZero كفاية للعرض.
export const round = (value, digits = 2) => {
  const f = 10 ** digits;
  return Math.round((Number(value) || 0) * f + Number.EPSILON * Math.sign(value || 0)) / f;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

let rowSeq = 0;
export const newRowId = () => `row-${Date.now()}-${++rowSeq}`;

// CmdAddItem_Click: بند جديد من الخدمة المختارة.
export const itemFromService = (service) => {
  const total = round(toNum(service.total), 2);
  return {
    id: newRowId(),
    serviceCode: String(service.code ?? ""),
    serviceName: String(service.name ?? "").trim(),
    unit: String(service.unit ?? ""),
    qty: 1,
    unitCost: round(toNum(service.unitCost), 3),
    taxRate: round(toNum(service.taxRate), 3),
    taxValue: round(toNum(service.taxValue), 3),
    total,
    discountPercent: 0,
    priceAfterDiscount: total,
    paidAmount: 0,
    remainingAmount: total,
    serviceGuid: String(service.guid ?? "")
  };
};

// PayGrid_CellEndEdit: إعادة حساب البند بعد تعديل خانة.
export const applyItemEdit = (item, field, rawValue) => {
  let qty = toNum(field === "qty" ? rawValue : item.qty);
  let unitCost = toNum(field === "unitCost" ? rawValue : item.unitCost);
  let taxRate = toNum(field === "taxRate" ? rawValue : item.taxRate);
  let taxValue = toNum(field === "taxValue" ? rawValue : item.taxValue);
  let total = toNum(field === "total" ? rawValue : item.total);
  let discountPercent = toNum(field === "discountPercent" ? rawValue : item.discountPercent);
  let priceAfterDiscount = toNum(field === "priceAfterDiscount" ? rawValue : item.priceAfterDiscount, total);
  let paidAmount = toNum(field === "paidAmount" ? rawValue : item.paidAmount);
  let remainingAmount = toNum(field === "remainingAmount" ? rawValue : item.remainingAmount, priceAfterDiscount);

  if (qty <= 0) qty = 1;
  unitCost = Math.max(0, unitCost);
  taxRate = Math.max(0, taxRate);
  taxValue = Math.max(0, taxValue);
  total = Math.max(0, total);
  discountPercent = clamp(discountPercent, 0, 100);
  priceAfterDiscount = Math.max(0, priceAfterDiscount);
  paidAmount = Math.max(0, paidAmount);
  remainingAmount = Math.max(0, remainingAmount);

  const afterFromPercent = () => round(total * (1 - discountPercent / 100), 2);

  switch (field) {
    case "qty":
    case "unitCost":
    case "taxRate": {
      const beforeTax = round(qty * unitCost, 3);
      taxValue = round(beforeTax * (taxRate / 100), 3);
      total = round(beforeTax + taxValue, 2);
      priceAfterDiscount = afterFromPercent();
      break;
    }
    case "taxValue": {
      const beforeTax = round(qty * unitCost, 3);
      taxRate = beforeTax > 0 ? round((taxValue / beforeTax) * 100, 3) : 0;
      total = round(beforeTax + taxValue, 2);
      priceAfterDiscount = afterFromPercent();
      break;
    }
    case "total": {
      let vatFactor = 1 + taxRate / 100;
      if (vatFactor <= 0) vatFactor = 1;
      unitCost = round(total / vatFactor / qty, 3);
      const beforeTax = round(qty * unitCost, 3);
      taxValue = round(total - beforeTax, 3);
      priceAfterDiscount = afterFromPercent();
      break;
    }
    case "discountPercent":
      discountPercent = Math.round(discountPercent);
      priceAfterDiscount = afterFromPercent();
      break;
    case "priceAfterDiscount":
      // نحافظ على المبلغ اللي كتبه المستخدم، ونحسب أقرب نسبة صحيحة للعرض فقط.
      priceAfterDiscount = clamp(priceAfterDiscount, 0, total);
      discountPercent = total > 0 ? clamp(Math.round(((total - priceAfterDiscount) / total) * 100), 0, 100) : 0;
      break;
    case "paidAmount":
      remainingAmount = round(priceAfterDiscount - paidAmount, 2);
      break;
    case "remainingAmount":
      if (remainingAmount > priceAfterDiscount) remainingAmount = priceAfterDiscount;
      paidAmount = round(priceAfterDiscount - remainingAmount, 2);
      break;
    default:
      break;
  }

  if (paidAmount > priceAfterDiscount) paidAmount = priceAfterDiscount;
  remainingAmount = Math.max(0, round(priceAfterDiscount - paidAmount, 2));

  return {
    ...item,
    qty: round(qty, 2),
    unitCost: round(unitCost, 3),
    taxRate: round(taxRate, 3),
    taxValue: round(taxValue, 3),
    total: round(total, 2),
    discountPercent: Math.round(discountPercent),
    priceAfterDiscount: round(priceAfterDiscount, 2),
    paidAmount: round(paidAmount, 2),
    remainingAmount: round(remainingAmount, 2)
  };
};

// PAYTOTAL: إجمالي التكلفة قبل الضريبة / الضريبة / الإجمالي بعد الخصم.
export const computeTotals = (items) => {
  let totalCost = 0;
  let totalTax = 0;
  let totalAfterDiscount = 0;

  items.forEach((item) => {
    if (!item.serviceName && !item.serviceGuid) return;
    let qty = toNum(item.qty, 1);
    if (qty <= 0) qty = 1;
    const total = toNum(item.total);
    let after = toNum(item.priceAfterDiscount, total);
    if (after <= 0 && total > 0) after = total;

    totalCost += round(qty * toNum(item.unitCost), 2);
    totalTax += toNum(item.taxValue);
    totalAfterDiscount += after;
  });

  return {
    totalCost: round(totalCost, 2),
    totalTax: round(totalTax, 2),
    totalAfterDiscount: round(totalAfterDiscount, 2)
  };
};

export const serviceNames = (items) => {
  const names = [];
  items.forEach((item) => {
    const name = String(item.serviceName || "").trim();
    if (name && item.serviceGuid && !names.includes(name)) names.push(name);
  });
  return names;
};

export const emptyTrainee = () => ({
  id: newRowId(),
  traineeName: "",
  nationalId: "",
  tel: "",
  specialization: "",
  studyStatus: "",
  priceBeforeDiscount: 0,
  discountPercent: 0,
  priceAfterDiscount: 0,
  paidAmount: 0,
  remainingAmount: 0,
  notes: ""
});

// ApplyTraineePrice: سعر المتدرب من البند المختار (عمود التكلفة في PayGrid زي الديسكتوب) والخصم نسبة مئوية.
export const applyTraineePrice = (trainee, items) => {
  const spec = String(trainee.specialization || "").trim();
  let before = toNum(trainee.priceBeforeDiscount);
  const service = items.find(
    (item) => String(item.serviceName || "").trim().toLowerCase() === spec.toLowerCase() && spec
  );
  const servicePrice = service ? toNum(service.unitCost) : 0;
  if (servicePrice > 0) before = round(servicePrice, 2);

  const discountPercent = round(clamp(toNum(trainee.discountPercent), 0, 100), 2);
  const after = Math.max(0, before - round(before * (discountPercent / 100), 2));
  const paid = round(Math.max(0, toNum(trainee.paidAmount)), 2);

  return {
    ...trainee,
    priceBeforeDiscount: round(before, 2),
    discountPercent,
    priceAfterDiscount: round(after, 2),
    paidAmount: paid,
    remainingAmount: round(Math.max(0, after - paid), 2)
  };
};

// UpdatePayGridQuantitiesFromTrainees: كميات وإجماليات البنود من جدول المتدربين.
export const syncItemsFromTrainees = (items, trainees) => {
  const sums = new Map();

  trainees.forEach((trainee) => {
    const name = String(trainee.traineeName || "").trim();
    const spec = String(trainee.specialization || "").trim();
    if (!name || !spec) return;

    const key = spec.toLowerCase();
    const current = sums.get(key) || { count: 0, before: 0, after: 0, paid: 0, remaining: 0 };
    current.count += 1;
    current.before += toNum(trainee.priceBeforeDiscount);
    current.after += toNum(trainee.priceAfterDiscount);
    current.paid += toNum(trainee.paidAmount);
    current.remaining += toNum(trainee.remainingAmount);
    sums.set(key, current);
  });

  return items.map((item) => {
    const key = String(item.serviceName || "").trim().toLowerCase();
    if (!key) return item;

    const s = sums.get(key);
    if (!s) {
      return { ...item, qty: 0, discountPercent: 0, priceAfterDiscount: 0, paidAmount: 0, remainingAmount: 0, total: 0 };
    }

    const discountPercent = s.before > 0 ? clamp(round(((s.before - s.after) / s.before) * 100, 2), 0, 100) : 0;
    return {
      ...item,
      qty: s.count,
      discountPercent,
      priceAfterDiscount: round(s.after, 2),
      paidAmount: round(s.paid, 2),
      remainingAmount: round(s.remaining, 2),
      total: round(s.after, 2)
    };
  });
};

// ===================== بيانات المعاينة =====================

// EnrichPrintDataFromCurrentScreen: سعر الوحدة في المستند شامل الضريبة.
export const buildPrintServices = (items) =>
  items
    .filter((item) => String(item.serviceName || "").trim())
    .map((item, index) => {
      let qty = toNum(item.qty, 1);
      if (qty <= 0) qty = 1;
      const gross = Math.max(0, toNum(item.total));
      const unitPriceIncludingTax = qty > 0 ? round(gross / qty, 2) : 0;
      const discountPercent = clamp(toNum(item.discountPercent), 0, 100);
      let after = toNum(item.priceAfterDiscount, round(gross * (1 - discountPercent / 100), 2));
      after = clamp(after, 0, gross);
      const paid = clamp(toNum(item.paidAmount), 0, after);

      return {
        id: newRowId(),
        sortOrder: index,
        diplomName: String(item.serviceName || "").trim(),
        offerUnit: item.unit || "",
        offerQty: qty,
        offerCost: round(toNum(item.unitCost), 3),
        offerSubtotal: round(gross, 2),
        priceBeforeDiscount: round(unitPriceIncludingTax, 2),
        discountValue: Math.round(discountPercent),
        priceAfterDiscount: round(after, 2),
        paidAmount: round(paid, 2),
        remainingAmount: round(after - paid, 2)
      };
    });

export const buildPrintTrainees = (trainees) =>
  trainees
    .filter((trainee) => String(trainee.traineeName || "").trim())
    .map((trainee) => ({
      id: newRowId(),
      traineeName: String(trainee.traineeName || "").trim(),
      traineeNationalId: trainee.nationalId || "",
      traineeTel: trainee.tel || "",
      specialization: trainee.specialization || "",
      studyStatus: trainee.studyStatus || "",
      priceBeforeDiscount: toNum(trainee.priceBeforeDiscount),
      discountValue: toNum(trainee.discountPercent),
      priceAfterDiscount: toNum(trainee.priceAfterDiscount),
      paidAmount: toNum(trainee.paidAmount),
      remainingAmount: toNum(trainee.remainingAmount)
    }));

// FillDefaultEditableText
export const defaultPrintTexts = (companyName) => {
  const company = String(companyName || "").trim() || "________________";
  const forCompany = (prefix) => `${prefix}${companyName ? ` لـ ${companyName}` : ""}`;

  return {
    page1Recipient: `السادة  /  ${company}`,
    page1Greeting: "السلام عليكم ورحمة الله وبركاته",
    page1AfterGreeting: "تحية طيبة وبعد،",
    page1Body: [
      "نتقدم لكم بأسمى آيات الشكر والتقدير على تعاونكم المثمر ودعمكم المتواصل ، والذي يمثل حجر الزاوية",
      "في تحقيق الأهداف المشترك.",
      "",
      "وانطلاقًا من إيماننا الراسخ بتطوير الموارد البشرية تماشيًا مع رؤية المملكة 2030 ، يسر المعهد السعودي",
      "المتخصص العالي للتدريب أن يؤكد استمراره في تقديم دبلومات ودورات معتمدة من المؤسسة العامة",
      "للتدريب التقني والمهني ، وبرامج مصنفة من وزارة الموارد البشرية والتنمية الاجتماعية .",
      "",
      "لقد أسهمت البنية التحتية والرقمية المعتمدة للمعهد في ترسيخ مكانته كجهة تدريب موثوقة، ويأتي تعاوننا",
      "معكم تجسيدًا لدورنا المجتمعي ومسؤوليتنا تجاه دعم سبل التعاون والمشاركة",
      "المجتمعية.",
      "",
      "ختامًا ، وبناءً على طلبكم الكريم ، نتشرف بإرسال العرض المالي الخاص بالمستفيدين المحددين من قبلكم",
      "سائلين المولى دوام التوفيق والسداد ."
    ].join("\n"),
    page1BoldClosing: "نتشرف بأن نرسل لسعادتكم العرض المالي الخاص بالمستفيدين المحددين من قبلكم.",
    page1Thanks: "وتفضلوا سعادتكم بقبول وافر التحية والتقدير",
    page2Title: forCompany("بيان العرض المالي"),
    page2BeforeInfoTitle: "",
    page2BeforeInfoText: "",
    page2InfoLabel: "إيضاح:",
    page2AfterInfoTitle: "",
    page2AfterInfoText: "",
    commonTerms: [
      "• السعر شامل ضريبة القيمة المضافة.",
      "• الدورة/الدبلوم معتمدة من المؤسسة العامة للتدريب التقني والمهني.",
      "• يتم اتباع نظام المؤسسة العامة للتدريب التقني والمهني بشأن قبول وتسجيل وتدريب المتدربين.",
      "• يتم التحويل على الحساب الرسمي المرفق.",
      "• العرض ساري لمدة 7 أيام من تاريخه."
    ].join("\n"),
    page2ExtraTerms: [
      "• هذه الصفحة توضح سعر الوحدة والكمية والإجمالي قبل الخصم لكل خدمة تدريبية.",
      "• تفاصيل الخصم والمدفوع والمتبقي موضحة في الصفحة التالية."
    ].join("\n"),
    page3TraineesTitle: `كشف أسماء المتدربين ${companyName ? `لـ ${companyName}` : ""}`.trim(),
    page3DetailsTitle: `تفاصيل العرض المالي ${companyName ? `لـ ${companyName}` : ""}`.trim(),
    page3ExtraTerms: "• يتم إفادتنا من قبلكم بصورة التحويل لإكمال باقي الإجراءات."
  };
};

// RecalculateRows في شاشة التعديل قبل المعاينة.
export const recalcPrintService = (row) => {
  let qty = toNum(row.offerQty, 1);
  if (qty <= 0) qty = 1;

  let unit = toNum(row.priceBeforeDiscount);
  if (unit <= 0) {
    const storedGross = toNum(row.offerSubtotal);
    if (storedGross > 0) unit = round(storedGross / qty, 2);
  }
  if (unit <= 0) unit = toNum(row.offerCost);
  unit = Math.max(0, unit);

  const gross = round(qty * unit, 2);
  let after = toNum(row.priceAfterDiscount, -1);
  let discount = toNum(row.discountValue);

  if (after < 0 || after > gross) {
    discount = clamp(discount, 0, 100);
    after = round(gross * (1 - discount / 100), 2);
  } else if (gross > 0) {
    discount = Math.round(((gross - after) / gross) * 100);
  } else {
    discount = 0;
  }

  after = Math.max(0, after);
  discount = clamp(discount, 0, 100);
  const paid = clamp(toNum(row.paidAmount), 0, after);

  return {
    ...row,
    offerQty: qty,
    priceBeforeDiscount: round(unit, 2),
    offerSubtotal: gross,
    discountValue: Math.round(discount),
    priceAfterDiscount: round(after, 2),
    paidAmount: round(paid, 2),
    remainingAmount: round(after - paid, 2)
  };
};

// ===================== تنسيقات المستند =====================

export const moneyText = (value) => {
  const v = round(toNum(value), 2);
  return v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const qtyText = (value) => {
  const v = toNum(value);
  return Number.isInteger(v) ? String(v) : String(round(v, 2));
};

export const percentText = (value) => `${Math.round(clamp(toNum(value), 0, 100))}%`;

const hijriParts = (date) => {
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const get = (type) => parseInt((parts.find((p) => p.type === type) || {}).value || "0", 10);
  return { year: get("year"), month: get("month"), day: get("day") };
};

// ToHijriDateText(DateTime.Today)
export const hijriDateText = (date = new Date()) => {
  try {
    const { year, month, day } = hijriParts(date);
    return `${year}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")} هـ`;
  } catch {
    return date.toISOString().slice(0, 10).replace(/-/g, "/");
  }
};

// CurrentHijriYearText: لو الشهر ذو الحجة بنحسب السنة الجاية.
export const currentHijriYearText = () => {
  try {
    const { year, month } = hijriParts(new Date());
    return String(month === 12 ? year + 1 : year);
  } catch {
    return String(new Date().getFullYear());
  }
};

export const issueNoText = (code) => {
  const c = String(code || "").trim();
  if (!c) return "";
  if (c.includes("/") || c.includes("هـ")) return c;
  return `${c} / ${currentHijriYearText()} هـ`;
};

export const OFFER_VERIFY_BASE_URL = "https://filesregsiteration.sstli.com/_rightchkofferprice.php?code=";

export const offerVerifyUrl = (code) => OFFER_VERIFY_BASE_URL + encodeURIComponent(String(code || "").trim());

// IsEditableBoldLine: **نص** أو [B]نص[/B] أو # نص => Bold.
export const parseBoldLine = (text) => {
  const s = String(text ?? "").trim();
  if (!s) return { text: "", bold: false };
  if (s.startsWith("**") && s.endsWith("**") && s.length > 4) return { text: s.slice(2, -2).trim(), bold: true };
  if (/^\[B\]/i.test(s) && /\[\/B\]$/i.test(s) && s.length > 7) return { text: s.slice(3, -4).trim(), bold: true };
  if (s.startsWith("#")) return { text: s.replace(/^#+/, "").trim(), bold: true };
  return { text: s, bold: false };
};

// SafeMultiline: نحافظ على السطور الفاضية بين الفقرات ونشيلها من الأول والآخر بس.
export const multilineLines = (value) => {
  const lines = String(value ?? "").replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim());
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines;
};

export const wordSpacing = (text, spaces = 2) =>
  String(text || "").trim().split(/\s+/).filter(Boolean).join(" ".repeat(Math.max(1, spaces)));
