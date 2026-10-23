import { printWhenReady } from "./printReady";

// طباعة "أمر صرف نقدية" و"إقرار استلام نقدية" من بيانات الشاشة مباشرة
// (بدل فتح /print في نافذة جديدة، اللي مش بيبعت توكن الدخول).
// الشكل مطابق للنماذج الورقية المعتمدة: الشعار، العنوان، الحقول على خطوط منقطة، والتوقيعات.

const COMPANY_NAME = "شركة معهد السعودي المتخصص العالي للتدريب";

const esc = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const formatDate = (value) => {
  if (!value) return "";
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return text;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const formatAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return esc(value);
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const printedAt = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// حقل على خط منقط؛ لو القيمة فاضية الخط يفضل للكتابة باليد
const field = (value, cls = "") =>
  `<span class="fill ${cls}">${esc(value) || "&nbsp;"}</span>`;

const STYLES = `
  @page { size: A4; margin: 14mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    direction: rtl;
    font-family: "Segoe UI", Tahoma, "Arabic Typesetting", Arial, sans-serif;
    color: #1d2a26;
    font-size: 15.5px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { position: relative; min-height: 250mm; display: flex; flex-direction: column; }
  .head {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 10px; border-bottom: 2px solid #0b7a46;
  }
  .head .org { display: grid; gap: 6px; font-weight: 700; font-size: 16px; color: #1d2a26; }
  .head .org small { font-weight: 600; font-size: 14px; color: #4b5d57; }
  .head img { width: 132px; height: auto; margin: -14px 0; }
  .title {
    text-align: center; margin: 26px 0 6px;
    font-size: 25px; font-weight: 800; color: #0b5e37; letter-spacing: .3px;
  }
  .title-line { width: 120px; height: 3px; background: #a3262b; margin: 0 auto 26px; border-radius: 2px; }
  .rows { display: grid; gap: 20px; }
  .row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px 14px; line-height: 1.9; }
  .lbl { font-weight: 700; white-space: nowrap; color: #24342f; }
  .lbl.w { min-width: 74px; }
  .fill {
    flex: 1 1 140px; min-width: 120px;
    border-bottom: 1.6px dotted #6d7f79;
    padding: 0 6px 1px; font-weight: 600; color: #0f1f1a;
  }
  .fill.short { flex: 0 1 170px; }
  .fill.num { flex: 0 1 130px; text-align: center; direction: ltr; font-variant-numeric: tabular-nums; }
  .fill.amount { flex: 0 1 140px; text-align: center; font-size: 18px; font-weight: 800; direction: ltr; }
  .fill.block { flex: 1 1 100%; min-height: 58px; display: flex; align-items: flex-end; }
  .sign {
    margin-top: 48px; display: flex; justify-content: space-between; gap: 40px;
  }
  .sign .box { display: grid; gap: 36px; min-width: 210px; text-align: center; }
  .sign .box .who { font-weight: 700; }
  .sign .box .name { font-weight: 600; color: #3b4b46; min-height: 20px; }
  .sign .box .line { border-top: 1.4px solid #6d7f79; }
  .void {
    position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none;
    font-size: 120px; font-weight: 900; color: rgba(163, 38, 43, .12); transform: rotate(-24deg);
  }
  .foot {
    margin-top: auto; padding-top: 14px; display: flex; justify-content: space-between;
    font-size: 11.5px; color: #75857f; border-top: 1px solid #dfe6e3;
  }
`;

const buildPaymentOrder = (form) => `
  <div class="head">
    <div class="org">${esc(form.branchName || "المركز الرئيسي")}<small>${COMPANY_NAME}</small></div>
    <img src="${esc(LOGO_URL())}" alt="">
  </div>
  <div class="title">أمر صرف نقدية</div>
  <div class="title-line"></div>
  <div class="rows">
    <div class="row"><span class="lbl w">كود</span>${field(form.code, "num")}</div>
    <div class="row"><span class="lbl w">التاريخ</span>${field(formatDate(form.orderDate), "num")}</div>
    <div class="row"><span class="lbl w">الفرع</span>${field(form.branchName)}</div>
    <div class="row"><span class="lbl w">أدفعوا لأمر</span>${field(form.orderTo)}</div>
    <div class="row">
      <span class="lbl w">مبلغ وقدره</span>${field(formatAmount(form.amount), "amount")}<span class="lbl">ريال</span>
    </div>
    <div class="row"><span class="lbl w">بالحروف</span>${field(form.amountText)}</div>
    <div class="row"><span class="lbl w">وذلك مقابل</span>${field(form.orderFor, "block")}</div>
  </div>
  <div class="sign">
    <div class="box"><span class="who">مقدم الطلب</span><span class="name">${esc(form.createdByName)}</span><span class="line"></span></div>
    <div class="box"><span class="who">المدير العام</span><span class="name"></span><span class="line"></span></div>
  </div>
`;

const buildReceiptAcknowledgment = (form) => `
  <div class="head">
    <div class="org">${COMPANY_NAME}<small>${esc(form.branchName)}</small></div>
    <img src="${esc(LOGO_URL())}" alt="">
  </div>
  <div class="title">إقرار استلام نقدية</div>
  <div class="title-line"></div>
  <div class="rows">
    <div class="row"><span class="lbl w">كود</span>${field(form.code, "num")}</div>
    <div class="row"><span class="lbl w">التاريخ</span>${field(formatDate(form.orderDate), "num")}</div>
    <div class="row"><span class="lbl w">الفرع</span>${field(form.branchName)}</div>
    <div class="row">
      <span class="lbl w">أقر أنا</span>${field(form.receiptMan)}
      <span class="lbl">هوية رقم</span>${field(form.nationalId, "num")}
      <span class="lbl">جوال رقم</span>${field(form.receiptTel, "num")}
    </div>
    <div class="row">
      <span class="lbl">بأنني استلمت مبلغ وقدره</span>${field(formatAmount(form.amount), "amount")}<span class="lbl">ريال</span>
    </div>
    <div class="row"><span class="lbl w">بالحروف</span>${field(form.amountText)}</div>
    <div class="row">
      <span class="lbl">من ${COMPANY_NAME} من يد السيد</span>${field("", "short")}
    </div>
    <div class="row"><span class="lbl">وذلك نظير القيام بـ</span>${field(form.orderFor, "block")}</div>
  </div>
  <div class="sign">
    <div class="box"><span class="who">توقيع المستلم</span><span class="name">${esc(form.receiptMan)}</span><span class="line"></span></div>
    <div class="box"><span class="who">المحاسب</span><span class="name">${esc(form.createdByName)}</span><span class="line"></span></div>
  </div>
`;

const LOGO_URL = () => `${window.location.origin}${process.env.PUBLIC_URL || ""}/logo.jpg`;

/**
 * @param {"payment-order" | "receipt-acknowledgment"} kind
 * @param {object} form بيانات الشاشة بعد الحفظ (code, orderDate, branchName, amount, amountText, orderFor, ...)
 */
export async function printCashVoucher(kind, form) {
  const isPayment = kind === "payment-order";
  const title = `${isPayment ? "أمر صرف نقدية" : "إقرار استلام نقدية"} ${form.code || ""}`.trim();
  const body = isPayment ? buildPaymentOrder(form) : buildReceiptAcknowledgment(form);

  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">
    <title>${esc(title)}</title><style>${STYLES}</style></head>
    <body><div class="sheet">
      ${form.isUse === false ? '<div class="void">ملغي</div>' : ""}
      ${body}
      <div class="foot"><span>${esc(title)}</span><span>تاريخ الطباعة: ${printedAt()}</span></div>
    </div></body></html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const cleanup = () => setTimeout(() => iframe.remove(), 1000);

  try {
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    iframe.contentWindow.addEventListener("afterprint", cleanup, { once: true });
    await printWhenReady(iframe.contentWindow);
    setTimeout(() => iframe.isConnected && iframe.remove(), 60000);
  } catch (error) {
    iframe.remove();
    throw error;
  }
}
