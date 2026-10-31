// صفحة خطاب الشكر (A4) بترويسة المعهد وختمه، ورقم الخطاب، وQR للتحقق من صحته.
// ملاحظات التصدير (html2canvas): Cairo محمّل بوزنين بس (400 و700)، ومن غير justify / textIndent / letterSpacing
// على النص العربي — غير كده الحروف بتتقطع في الـ PDF.
import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { SSTLI_API_URL } from "../../config/apiUrls";

export const PAGE_W = 827;
export const PAGE_H = 1169;
const ASSET = `${process.env.PUBLIC_URL || ""}/offer-price`;
const FONT = "'Cairo', 'Noto Kufi Arabic', Tahoma, Arial, sans-serif";
const HEADER_H = 150;
const FOOTER_H = 135;
const SIDE = 70;

const C = {
  green: "#057546",
  greenDark: "#034d31",
  text: "#1d2a23",
  muted: "#5d6b63",
  line: "#d9e6de",
  soft: "#f3f9f5"
};

export const DEFAULT_SUBJECT = "شكر وتقدير";

export const defaultLetterBody = (recipient) =>
  [
    `تتقدم إدارة المعهد السعودي المتخصص العالي للتدريب بخالص الشكر وعظيم الامتنان إلى ${recipient || "منشأتكم الموقرة"} على حسن التعاون والتواصل المثمر، وما لمسناه من حرص واهتمام بتنمية الكفاءات البشرية وتطويرها.`,
    "وإننا إذ نثمّن هذه الشراكة المهنية، لنؤكد اعتزازنا بالعمل معكم، وحرصنا المستمر على تقديم برامج تدريبية نوعية تسهم في رفع مستوى المهارات المهنية وتعزيز كفاءة الأداء، بما يتوافق مع احتياجات سوق العمل وتطلعات منشآت القطاع الخاص.",
    "كما نؤكد تطلعنا إلى مواصلة هذا التعاون البنّاء، وتوسيع آفاق الشراكة المستقبلية بما يحقق المصالح المشتركة، ويدعم مستهدفات التنمية والتطوير المهني، ويعزز جودة المخرجات التدريبية.",
    "شاكرين لكم ثقتكم الكريمة، ومقدّرين حسن تعاونكم، ومتطلعين إلى مزيد من النجاحات والإنجازات المشتركة."
  ].join("\n\n");

// صفحة التحقق على الـ API بعنوان ثابت (مش دومين الفرونت) — عشان الخطاب اللي يتعمل من أي جهاز يفتح على السيرفر الحقيقي.
export const LETTER_VERIFY_BASE_URL = `${SSTLI_API_URL}/api/p2p/letters/check/`;
export const letterVerifyUrl = (code) => LETTER_VERIFY_BASE_URL + encodeURIComponent(code || "");

const gregorian = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y} م`;
};

const hijri = (iso) => {
  if (!iso) return "";
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "2-digit", month: "2-digit", year: "numeric" })
      .formatToParts(new Date(`${iso}T12:00:00`));
    const get = (t) => parts.find((p) => p.type === t)?.value || "";
    return `${get("day")}/${get("month")}/${get("year")} هـ`;
  } catch {
    return "";
  }
};

const Meta = ({ label, children, ltr }) => (
  <div style={{ display: "flex", gap: 8, fontSize: 13, lineHeight: 1.9 }}>
    <span style={{ fontWeight: 700, color: C.green, minWidth: 64 }}>{label}:</span>
    <span style={{ fontWeight: 700, direction: ltr ? "ltr" : "rtl", unicodeBidi: "isolate" }}>{children}</span>
  </div>
);

const ThankLetterDocument = React.forwardRef(({ letter }, ref) => {
  const paragraphs = String(letter.body || "").split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  const draft = !letter.verifyCode;

  return (
    <div
      ref={ref}
      dir="rtl"
      style={{ position: "relative", width: PAGE_W, height: PAGE_H, background: "#fff", overflow: "hidden", fontFamily: FONT, color: C.text, flexShrink: 0 }}
    >
      <img alt="" src={`${ASSET}/watermark.png`} crossOrigin="anonymous"
        style={{ position: "absolute", left: (PAGE_W - 470) / 2, top: 360, width: 470, height: 470, objectFit: "contain", opacity: 0.045 }} />
      <img alt="" src={`${ASSET}/header.png`} crossOrigin="anonymous"
        style={{ position: "absolute", left: 0, top: 12, width: PAGE_W, height: HEADER_H, objectFit: "fill" }} />
      <img alt="" src={`${ASSET}/footer.png`} crossOrigin="anonymous"
        style={{ position: "absolute", left: 0, bottom: 0, width: PAGE_W, height: FOOTER_H, objectFit: "fill" }} />

      {draft ? (
        <div style={{ position: "absolute", top: 500, left: 0, right: 0, textAlign: "center", fontSize: 120, fontWeight: 700, color: "rgba(208,59,59,.07)", transform: "rotate(-22deg)" }}>
          مسودة
        </div>
      ) : null}

      <div style={{ position: "absolute", top: HEADER_H + 34, left: SIDE, right: SIDE, bottom: FOOTER_H + 22, display: "flex", flexDirection: "column" }}>
        {/* المرسل إليه (يمين) — رقم الخطاب والتاريخ (يسار) */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.8 }}>
              السادة / {letter.recipientName || "........................"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.muted, lineHeight: 1.6 }}>المحترمين</div>
            {letter.recipientTitle ? (
              <div style={{ fontSize: 14, lineHeight: 1.8, marginTop: 2 }}>
                <span style={{ fontWeight: 700 }}>عناية: </span>{letter.recipientTitle}
              </div>
            ) : null}
          </div>
          <div style={{ padding: "8px 14px", borderRight: `3px solid ${C.green}`, background: C.soft, borderRadius: 6, minWidth: 210 }}>
            <Meta label="الرقم" ltr>{letter.serial || "—"}</Meta>
            <Meta label="التاريخ">{hijri(letter.letterDate)}</Meta>
            <Meta label="الموافق">{gregorian(letter.letterDate)}</Meta>
          </div>
        </div>

        <div style={{ marginTop: 22, fontSize: 15, fontWeight: 700 }}>السلام عليكم ورحمة الله وبركاته، وبعد:</div>

        {/* الموضوع */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20 }}>
          <div style={{ flex: 1, height: 1, background: C.line }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: C.greenDark, padding: "4px 18px", border: `1px solid ${C.line}`, borderRadius: 999, background: C.soft }}>
            الموضوع: {letter.subject || DEFAULT_SUBJECT}
          </div>
          <div style={{ flex: 1, height: 1, background: C.line }} />
        </div>

        {/* نص الخطاب */}
        <div style={{ marginTop: 22 }}>
          {paragraphs.map((p, i) => (
            <div key={i} style={{ fontSize: 15, lineHeight: 2.1, textAlign: "right", marginBottom: 14 }}>{p}</div>
          ))}
        </div>

        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>وتقبلوا فائق الاحترام والتقدير،</div>

        <div style={{ flex: 1 }} />

        {/* التحقق (يمين) — التوقيع والختم (يسار) */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24 }}>
          {letter.verifyCode ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", border: `1px solid ${C.line}`, borderRadius: 10, background: "#fff" }}>
              <div style={{ background: "#fff", padding: 3, border: `1px solid ${C.line}`, borderRadius: 6, lineHeight: 0 }}>
                <QRCodeCanvas value={letterVerifyUrl(letter.verifyCode)} size={76} level="M" marginSize={0} />
              </div>
              <div style={{ fontSize: 11.5, lineHeight: 1.75, color: C.muted, width: 170 }}>
                <div style={{ fontWeight: 700, color: C.green, fontSize: 12.5 }}>التحقق من صحة الخطاب</div>
                <div>امسح الرمز للتأكد من صدور الخطاب من المعهد</div>
                <div style={{ fontWeight: 700, color: C.text, direction: "ltr", textAlign: "right" }}>{letter.verifyCode}</div>
              </div>
            </div>
          ) : <div />}
          <div style={{ textAlign: "center", width: 330 }}>
            <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.7 }}>إدارة المعهد السعودي المتخصص العالي للتدريب</div>
            <img alt="" src={`${ASSET}/stamp.jpeg`} crossOrigin="anonymous" style={{ width: 210, height: 104, objectFit: "contain", display: "block", margin: "6px auto 0" }} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default ThankLetterDocument;
