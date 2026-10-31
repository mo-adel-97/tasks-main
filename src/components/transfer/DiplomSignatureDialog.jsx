import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { DIPLOM_SIGN_API } from "./DiplomSignPanel";

// نموذج "طلب تغيير تخصص" الموقّع إلكترونيًا (HTML جاهز من الـ API) — للعرض والطباعة، ولتأكيد الطلب من الإشراف.
// mode = "view" | "confirm". طلبات قديمة من غير نموذج موقّع (signGuid فاضي) بتتأكد عادي مع تنبيه.
export default function DiplomSignatureDialog({ open, mode = "view", row, userGuid, submitting, onClose, onSubmit }) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supervisionNotes, setSupervisionNotes] = useState("");
  const [accountsNotes, setAccountsNotes] = useState("");
  const frameRef = useRef(null);
  const signGuid = row?.signGuid || "";

  useEffect(() => {
    if (!open) return undefined;
    setHtml("");
    setError("");
    setSupervisionNotes(row?.supervisionNotes || "");
    setAccountsNotes(row?.accountsNotes || "");
    if (!signGuid) return undefined;
    let alive = true;
    setLoading(true);
    // النسخة الرسمية (نفس الـ PDF المحفوظ في مرفقات الطالب) مش صفحة الطالب
    fetch(`${DIPLOM_SIGN_API}/${encodeURIComponent(signGuid)}/document?${new URLSearchParams({ userGuid, variant: "pdf" })}`, { cache: "no-store" })
      .then(async (response) => {
        const text = await response.text();
        if (!response.ok) {
          let message = "تعذر تحميل نموذج التوقيع";
          try {
            message = JSON.parse(text)?.message || message;
          } catch {
            /* رد مش JSON */
          }
          throw new Error(message);
        }
        return text;
      })
      .then((text) => alive && setHtml(text))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, signGuid, userGuid]); // eslint-disable-line react-hooks/exhaustive-deps

  const print = () => frameRef.current?.contentWindow?.print();
  const confirming = mode === "confirm";

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 900, fontFamily: '"Cairo", sans-serif' }}>
        {confirming ? "تأكيد طلب تغيير التخصص" : "نموذج طلب تغيير التخصص الموقّع"}
        {row?.studentName ? <Box component="span" sx={{ fontWeight: 600, fontSize: ".9rem", mr: 1, opacity: 0.75 }}>— {row.studentName}</Box> : null}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, bgcolor: "#e9eeeb" }}>
        {!signGuid ? (
          <Alert severity="warning" sx={{ m: 2 }}>
            هذا الطلب قديم (قبل التوقيع الإلكتروني) ولا يوجد له نموذج موقّع.
          </Alert>
        ) : loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
        ) : (
          <Box component="iframe" ref={frameRef} title="نموذج طلب تغيير التخصص" srcDoc={html} sx={{ display: "block", width: "100%", maxWidth: 820, mx: "auto", bgcolor: "#fff", height: { xs: "60vh", md: confirming ? "52vh" : "72vh" }, border: 0 }} />
        )}

        {confirming ? (
          <Box sx={{ p: 2, bgcolor: "background.paper", display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <Box sx={{ gridColumn: "1 / -1", fontSize: ".85rem", color: "text.secondary" }}>
              التأكيد يحوّل الطالب للتخصص الجديد (وللفرع الجديد لو مختلف). قيد فرق السعر تسجله الحسابات بصلاحية منفصلة.
            </Box>
            <TextField size="small" multiline minRows={2} label="ملاحظة الإشراف العام (اختياري)" value={supervisionNotes} onChange={(e) => setSupervisionNotes(e.target.value)} disabled={submitting} />
            <TextField size="small" multiline minRows={2} label="ملاحظة الحسابات (اختياري)" value={accountsNotes} onChange={(e) => setAccountsNotes(e.target.value)} disabled={submitting} />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 2, py: 1.5 }}>
        {confirming ? (
          <Button
            variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleRoundedIcon />}
            disabled={submitting || loading}
            onClick={() => onSubmit?.({ supervisionNotes: supervisionNotes.trim(), accountsNotes: accountsNotes.trim() })}
            sx={{ fontWeight: 900, bgcolor: "#057546", color: "#fff", "&:hover": { bgcolor: "#034d31" } }}
          >
            تأكيد وتنفيذ
          </Button>
        ) : null}
        {signGuid && html ? (
          <Button variant="outlined" startIcon={<PrintRoundedIcon />} onClick={print} sx={{ fontWeight: 900 }}>
            طباعة
          </Button>
        ) : null}
        <Button onClick={onClose} disabled={submitting} sx={{ color: "text.primary" }}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}
