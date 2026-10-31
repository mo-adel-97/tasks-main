import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, IconButton, InputAdornment, TextField, Tooltip, Typography } from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import DrawRoundedIcon from "@mui/icons-material/DrawRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FolderSharedRoundedIcon from "@mui/icons-material/FolderSharedRounded";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { getCurrentUserGuid, readApiJson } from "../../utils/receptionExtras";
import { SSTLI_API_URL } from "../../config/apiUrls";

export const DIPLOM_SIGN_API = `${SSTLI_API_URL}/api/diplom-change-sign`;

const isGuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || "")) &&
  !/^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(String(value || ""));

const money = (value) => (value === null || value === undefined ? "—" : Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 }));

// 05xxxxxxxx => 9665xxxxxxxx (رابط واتساب)
const whatsappNumber = (mobile) => {
  const digits = String(mobile || "").replace(/\D/g, "");
  if (digits.startsWith("966")) return digits;
  if (digits.startsWith("05")) return `966${digits.slice(1)}`;
  if (digits.startsWith("5") && digits.length === 9) return `966${digits}`;
  return digits;
};

// PDF من النموذج الموقّع (نسخة variant=pdf بعرض A4 ثابت) عشان يتحفظ في مرفقات الطالب.
// بيترسم في iframe مخفي، والصفحات بتتقسم على ارتفاع A4.
export async function buildSignedPdf(signGuid) {
  const params = new URLSearchParams({ userGuid: getCurrentUserGuid(), variant: "pdf" });
  const response = await fetch(`${DIPLOM_SIGN_API}/${encodeURIComponent(signGuid)}/document?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("تعذر تحميل النموذج الموقّع");
  const html = await response.text();

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, { position: "fixed", left: "-20000px", top: "0", width: "794px", height: "1200px", border: "0" });
  document.body.appendChild(frame);
  try {
    await new Promise((resolve) => {
      frame.onload = resolve;
      frame.srcdoc = html;
    });
    const doc = frame.contentDocument;
    if (doc.fonts?.load) {
      await Promise.all([doc.fonts.load("400 14px 'Cairo'", "ابجد"), doc.fonts.load("700 14px 'Cairo'", "ابجد")]).catch(() => null);
      await doc.fonts.ready;
    }
    await Promise.all(
      [...doc.images].map((img) => (img.complete ? null : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })))
    );
    const height = Math.ceil(doc.body.scrollHeight);
    frame.style.height = `${height}px`;
    const canvas = await html2canvas(doc.body, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: 794, height, windowWidth: 794, windowHeight: height, logging: false });

    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const slice = Math.floor((canvas.width * pageH) / pageW); // ارتفاع صفحة A4 بوحدات الـ canvas
    for (let y = 0, page = 0; y < canvas.height; y += slice, page += 1) {
      const part = document.createElement("canvas");
      part.width = canvas.width;
      part.height = Math.min(slice, canvas.height - y);
      const ctx = part.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, part.width, part.height);
      ctx.drawImage(canvas, 0, y, canvas.width, part.height, 0, 0, canvas.width, part.height);
      if (page > 0) pdf.addPage();
      pdf.addImage(part.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, pageW, (part.height * pageW) / canvas.width, undefined, "FAST");
    }
    return pdf.output("blob");
  } finally {
    frame.remove();
  }
}

// حفظ النموذج الموقّع في مرفقات الطالب (مرة واحدة لكل نموذج — الباك إند بيتجاهل التكرار)
export async function archiveSignedForm(signGuid) {
  const blob = await buildSignedPdf(signGuid);
  const form = new FormData();
  form.append("userGuid", getCurrentUserGuid());
  form.append("file", blob, "form.pdf");
  return readApiJson(await fetch(`${DIPLOM_SIGN_API}/${encodeURIComponent(signGuid)}/archive`, { method: "POST", body: form }));
}

const fmtTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("ar-EG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

// توقيع الطالب الإلكتروني على نموذج "طلب تغيير تخصص" قبل إرسال الطلب:
// إصدار النموذج => رابط (QR / واتساب / فتح على جهاز المكتب) => متابعة الحالة لحد ما الطالب يوقّع.
// onChange({ signGuid, signed }) — زرار إرسال الطلب مايشتغلش غير لما signed = true.
export default function DiplomSignPanel({ student, context, newDiplom, priceBranch, disabled, onChange }) {
  const [price, setPrice] = useState({ loading: false, value: null, source: "", adminFee: 250 });
  // الرسوم الإدارية للتحويل اختيارية (الموظف بيحدد هل تنطبق على الطالب)
  const [applyFee, setApplyFee] = useState(true);
  const [mobile, setMobile] = useState(student?.studentTel || student?.tel || "");
  const [sign, setSign] = useState(null); // { signGuid, url, docNo, newPrice }
  const [status, setStatus] = useState(null); // { status, signed, signedAt, reason }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  // نسخة PDF من النموذج الموقّع في مرفقات الطالب
  const [archive, setArchive] = useState({ state: "idle", message: "" });
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const selectionKey = `${newDiplom?.guid || ""}|${priceBranch?.guid || ""}`;

  // تغيير التخصص أو الفرع => النموذج القديم مابقاش صالح
  useEffect(() => {
    setSign(null);
    setStatus(null);
    setError("");
    setArchive({ state: "idle", message: "" });
    onChangeRef.current?.({ signGuid: null, signed: false });
    if (!newDiplom?.guid || !priceBranch?.guid) {
      setPrice({ loading: false, value: null, source: "", adminFee: 250 });
      return undefined;
    }
    let alive = true;
    setPrice((p) => ({ ...p, loading: true }));
    const params = new URLSearchParams({ userGuid: getCurrentUserGuid(), newDiplomGuid: newDiplom.guid, priceBranchGuid: priceBranch.guid });
    if (context?.regType !== null && context?.regType !== undefined) params.set("regType", String(context.regType));
    fetch(`${DIPLOM_SIGN_API}/price?${params}`, { cache: "no-store" })
      .then(readApiJson)
      .then((r) => alive && setPrice({ loading: false, value: r?.price ?? null, source: r?.source || "", adminFee: r?.adminFee ?? 250 }))
      .catch((e) => alive && (setPrice({ loading: false, value: null, source: "", adminFee: 250 }), setError(e.message)));
    return () => {
      alive = false;
    };
  }, [selectionKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // متابعة التوقيع كل 4 ثواني لحد ما الطالب يوقّع
  useEffect(() => {
    if (!sign?.signGuid || status?.signed) return undefined;
    let alive = true;
    const check = async () => {
      try {
        const params = new URLSearchParams({ userGuid: getCurrentUserGuid() });
        const r = await readApiJson(await fetch(`${DIPLOM_SIGN_API}/${sign.signGuid}?${params}`, { cache: "no-store" }));
        if (!alive) return;
        setStatus(r?.data || null);
        if (r?.data?.signed) onChangeRef.current?.({ signGuid: sign.signGuid, signed: true });
      } catch {
        /* نجرب تاني في الدورة الجاية */
      }
    };
    check();
    const timer = setInterval(check, 4000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [sign?.signGuid, status?.signed]);

  // أول ما الطالب يوقّع: النموذج بيتحفظ PDF في مرفقاته
  const saveToStudentFile = async () => {
    if (!sign?.signGuid) return;
    setArchive({ state: "saving", message: "" });
    try {
      await archiveSignedForm(sign.signGuid);
      setArchive({ state: "done", message: "" });
    } catch (e) {
      setArchive({ state: "error", message: e.message || "تعذر حفظ النموذج في مرفقات الطالب" });
    }
  };

  useEffect(() => {
    if (!status?.signed || archive.state !== "idle") return;
    if (status.archived) setArchive({ state: "done", message: "" });
    else saveToStudentFile();
  }, [status?.signed, status?.archived]); // eslint-disable-line react-hooks/exhaustive-deps

  const issue = async () => {
    setError("");
    const digits = mobile.replace(/\D/g, "");
    if (digits && (digits.length < 9 || digits.length > 15)) {
      setError("رقم جوال الطالب غير صحيح");
      return;
    }
    if (price.value === null) {
      setError("التخصص الجديد غير موجود في عروض أو قائمة أسعار الفرع المختار، برجاء مراجعة قائمة الأسعار");
      return;
    }
    setBusy(true);
    try {
      const branch = student?.branchGuid || student?.studyBranchGuid;
      const r = await readApiJson(
        await fetch(DIPLOM_SIGN_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid: getCurrentUserGuid(),
            accountGuid: student?.accountGuid,
            studentGuid: isGuid(student?.studentGuid) ? student.studentGuid : null,
            diplomGuid: isGuid(student?.diplomGuid) ? student.diplomGuid : null,
            branchGuid: isGuid(branch) ? branch : null,
            regDocGuid: isGuid(student?.regDocGuid) ? student.regDocGuid : null,
            nationalId: student?.nationalId || "",
            studentName: student?.studentName || "",
            newDiplomGuid: newDiplom.guid,
            newDiplomName: newDiplom.name,
            priceBranchGuid: priceBranch.guid,
            priceBranchName: priceBranch.name,
            mobile: digits,
            applyAdminFee: applyFee
          })
        })
      );
      setSign(r.data);
      setStatus({ status: "pending", signed: false });
      onChangeRef.current?.({ signGuid: r.data.signGuid, signed: false });
    } catch (e) {
      setError(e.message || "تعذر إصدار نموذج التوقيع");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sign.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* المتصفح رافض النسخ */
    }
  };

  const whatsappText = sign
    ? `مرحبًا ${student?.studentName || ""}،\nنرجو مراجعة نموذج طلب تغيير التخصص من المعهد السعودي المتخصص العالي للتدريب والتوقيع عليه إلكترونيًا عبر الرابط التالي:\n${sign.url}`
    : "";

  const ready = Boolean(newDiplom?.guid && priceBranch?.guid);
  const signed = Boolean(status?.signed);
  const expired = status?.status === "expired" || status?.status === "cancelled";

  return (
    <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, border: "1px solid", borderColor: signed ? "success.main" : "divider", bgcolor: signed ? "rgba(5,117,70,.06)" : "transparent" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <DrawRoundedIcon color="primary" />
        <Typography sx={{ fontWeight: 900, fontFamily: '"Cairo", sans-serif', flex: 1 }}>توقيع الطالب الإلكتروني</Typography>
        {sign ? (
          signed ? (
            <Chip size="small" icon={<CheckCircleRoundedIcon style={{ color: "#fff" }} />} label={`تم التوقيع ${fmtTime(status?.signedAt)}`} sx={{ bgcolor: "#057546", color: "#fff", fontWeight: 800 }} />
          ) : expired ? (
            <Chip size="small" color="warning" label="انتهت صلاحية الرابط" />
          ) : (
            <Chip size="small" color="warning" variant="outlined" icon={<HourglassTopRoundedIcon />} label="بانتظار توقيع الطالب" />
          )
        ) : null}
      </Box>

      {!ready ? (
        <Typography sx={{ fontSize: ".85rem", color: "text.secondary" }}>اختر التخصص الجديد والفرع أولًا لإصدار نموذج التوقيع.</Typography>
      ) : (
        <>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", fontSize: ".9rem", mb: 1.2, fontFamily: '"Cairo", sans-serif' }}>
            <span>
              سعر الدبلوم الجديد:{" "}
              <b>{price.loading ? "..." : price.value !== null ? `${money(price.value)} ريال` : "غير موجود في قائمة الفرع"}</b>
              {price.source ? <span style={{ opacity: 0.7 }}> ({price.source})</span> : null}
            </span>
            {sign ? (
              <span>
                الرسوم الإدارية: <b>{Number(sign.adminFee) > 0 ? `${money(sign.adminFee)} ريال` : "بدون رسوم"}</b>
              </span>
            ) : null}
          </Box>

          {!sign && !price.loading && price.value === null ? (
            <Alert severity="warning" sx={{ mb: 1.2 }}>التخصص الجديد غير موجود في عروض أو قائمة أسعار هذا الفرع، ولا يمكن إصدار النموذج قبل إضافته لقائمة الأسعار.</Alert>
          ) : null}

          {!sign ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.2, alignItems: "center" }}>
              <TextField
                size="small"
                label="جوال الطالب (لإرسال الرابط)"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputProps={{ dir: "ltr", inputMode: "tel", maxLength: 16 }}
                disabled={disabled || busy}
              />
              <FormControlLabel
                sx={{ m: 0 }}
                control={<Checkbox checked={applyFee} onChange={(e) => setApplyFee(e.target.checked)} disabled={disabled || busy} />}
                label={<span style={{ fontWeight: 700, fontFamily: '"Cairo", sans-serif' }}>تطبيق رسوم إدارية ({money(price.adminFee)} ريال)</span>}
              />
            </Box>
          ) : null}

          {sign ? (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
              {!signed ? (
                <Box sx={{ p: 1, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #e2e8e4", lineHeight: 0 }}>
                  <QRCodeSVG value={sign.url} size={112} level="M" />
                </Box>
              ) : null}
              <Box sx={{ flex: 1, minWidth: 240 }}>
                {signed ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, fontSize: ".82rem", fontWeight: 700, color: archive.state === "error" ? "error.main" : "text.secondary" }}>
                    {archive.state === "saving" ? <CircularProgress size={14} /> : <FolderSharedRoundedIcon fontSize="small" color={archive.state === "done" ? "success" : "inherit"} />}
                    {archive.state === "done"
                      ? "تم حفظ النموذج الموقّع في مرفقات الطالب"
                      : archive.state === "saving"
                        ? "جارٍ حفظ النموذج في مرفقات الطالب…"
                        : archive.state === "error"
                          ? archive.message
                          : ""}
                    {archive.state === "error" ? (
                      <Button size="small" onClick={saveToStudentFile} sx={{ fontWeight: 900, minWidth: 0 }}>إعادة المحاولة</Button>
                    ) : null}
                  </Box>
                ) : null}
                <Typography sx={{ fontSize: ".8rem", color: "text.secondary", mb: 0.5 }}>
                  {signed
                    ? `وقّع الطالب على النموذج ${sign.docNo}. يمكنك الآن إرسال الطلب.`
                    : `النموذج ${sign.docNo}: امسح الرمز بجوال الطالب، أو أرسل له الرابط، أو افتحه على جهاز المكتب ليوقّع.`}
                </Typography>
                <TextField
                  size="small"
                  fullWidth
                  value={sign.url}
                  inputProps={{ dir: "ltr", readOnly: true, style: { fontSize: 12 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={copied ? "تم النسخ" : "نسخ الرابط"}>
                          <IconButton size="small" onClick={copy}>
                            <ContentCopyRoundedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
                <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                  {!signed ? (
                    <Button
                      size="small"
                      variant="outlined"
                      color="success"
                      startIcon={<WhatsAppIcon />}
                      href={`https://wa.me/${whatsappNumber(mobile)}?text=${encodeURIComponent(whatsappText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      disabled={!whatsappNumber(mobile)}
                      sx={{ fontWeight: 900 }}
                    >
                      إرسال واتساب
                    </Button>
                  ) : null}
                  <Button size="small" variant="outlined" startIcon={<OpenInNewRoundedIcon />} href={sign.url} target="_blank" rel="noopener noreferrer" sx={{ fontWeight: 900 }}>
                    {signed ? "عرض النموذج الموقّع" : "فتح النموذج"}
                  </Button>
                  {expired ? (
                    <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={issue} disabled={busy} sx={{ fontWeight: 900 }}>
                      إصدار رابط جديد
                    </Button>
                  ) : null}
                </Box>
              </Box>
            </Box>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <DrawRoundedIcon />}
              onClick={issue}
              disabled={disabled || busy || price.loading || price.value === null}
              sx={{ mt: 1.2, fontWeight: 900 }}
            >
              استخراج نموذج التوقيع
            </Button>
          )}
        </>
      )}

      {error ? <Alert severity="error" sx={{ mt: 1.2 }}>{error}</Alert> : null}
    </Box>
  );
}
