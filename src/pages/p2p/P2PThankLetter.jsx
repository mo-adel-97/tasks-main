// خطاب شكر من شاشة إدخال الزيارات: الموظف يختار الشركة (أو يكتب أي جهة)، يعدّل النص لو حب،
// ويصدر الخطاب برقم مسلسل وQR للتحقق، وبعدين PDF أو طباعة. وتحت: خطاباته السابقة مع إعادة التحميل والإلغاء.
// الـ PDF بيتعمل من نسخة مخفية بمقاسها الطبيعي (مش من المعاينة المصغّرة) زي عرض السعر.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha
} from "@mui/material";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import NoteAddRoundedIcon from "@mui/icons-material/NoteAddRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import HistoryEduRoundedIcon from "@mui/icons-material/HistoryEduRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import ThankLetterDocument, { DEFAULT_SUBJECT, PAGE_H, PAGE_W, defaultLetterBody } from "./ThankLetterDocument";
import P2PToneChip from "./P2PToneChip";
import { GREEN, confirmBox, isoDate, p2pApi, toast, useUi } from "./p2pShared";

const emptyForm = () => ({ companyGuid: null, recipientName: "", recipientTitle: "", subject: DEFAULT_SUBJECT, body: defaultLetterBody(""), letterDate: isoDate(new Date()) });

const waitForAssets = async (root) => {
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(
    [...(root?.querySelectorAll("img") || [])].map((img) =>
      img.complete && img.naturalWidth > 0 ? Promise.resolve() : new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; })
    )
  );
};

function StepTitle({ n, icon, title, hint }) {
  const ui = useUi();
  return (
    <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.4 }}>
      <Box sx={{ width: 30, height: 30, borderRadius: "50%", display: "grid", placeItems: "center", fontWeight: 900, fontSize: 14, color: "#fff", bgcolor: GREEN, flexShrink: 0 }}>{n}</Box>
      <Box sx={{ flex: 1 }}>
        <Stack direction="row" spacing={0.6} alignItems="center">
          {icon}
          <Typography sx={{ fontWeight: 900, fontSize: 15, color: ui.greenText }}>{title}</Typography>
        </Stack>
        {hint ? <Typography variant="caption" color="text.secondary">{hint}</Typography> : null}
      </Box>
    </Stack>
  );
}

export default function P2PThankLetter() {
  const ui = useUi();
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [issued, setIssued] = useState(null); // الخطاب بعد الإصدار (برقمه وكود التحقق)
  const [letters, setLetters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [bodyTouched, setBodyTouched] = useState(false);
  const exportRef = useRef(null);
  const previewBox = useRef(null);
  const [scale, setScale] = useState(0.55);

  const loadLetters = useCallback(async () => {
    try {
      const rows = await p2pApi("/letters");
      setLetters(Array.isArray(rows) ? rows : []);
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  }, []);

  useEffect(() => {
    p2pApi("/companies").then((rows) => setCompanies((rows || []).filter((c) => c.isActive))).catch(() => {});
    loadLetters();
  }, [loadLetters]);

  useEffect(() => {
    const update = () => setScale(Math.min(0.8, Math.max(0.3, ((previewBox.current?.clientWidth || 520) - 24) / PAGE_W)));
    update();
    const timer = setTimeout(update, 50);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", update);
    };
  }, []);

  const set = (key) => (e) => {
    setIssued(null);
    setForm((p) => ({ ...p, [key]: e.target.value }));
  };

  const pickCompany = (company) => {
    setIssued(null);
    setForm((p) => ({
      ...p,
      companyGuid: company?.guid || null,
      recipientName: company?.name || p.recipientName,
      recipientTitle: company?.contactName ? `${company.contactName}${company.contactTitle ? ` — ${company.contactTitle}` : ""}` : p.recipientTitle,
      body: bodyTouched ? p.body : defaultLetterBody(company?.name || p.recipientName)
    }));
  };

  const letter = useMemo(() => issued || { ...form, serial: "", verifyCode: "" }, [issued, form]);

  const issue = async () => {
    if (!form.recipientName.trim()) return toast("warning", "مطلوب", "اكتب اسم الجهة الموجّه لها الخطاب");
    if (!form.body.trim()) return toast("warning", "مطلوب", "اكتب نص الخطاب");
    if (!(await confirmBox("إصدار الخطاب", "سيُحفظ الخطاب برقم مسلسل وكود تحقق، ولا يمكن تعديله بعد الإصدار (يمكن إلغاؤه وإصدار غيره). إصدار؟", "إصدار"))) return;
    setSaving(true);
    try {
      const result = await p2pApi("/letters", {
        method: "POST",
        body: {
          companyGuid: form.companyGuid,
          recipientName: form.recipientName,
          recipientTitle: form.recipientTitle,
          subject: form.subject,
          body: form.body,
          letterDate: form.letterDate
        }
      });
      setIssued({ ...form, serial: result.serial, verifyCode: result.verifyCode, letterDate: result.letterDate, guid: result.guid });
      toast("success", "تم إصدار الخطاب", `رقم الخطاب ${result.serial}`);
      loadLetters();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const exportPdf = async (mode) => {
    const node = exportRef.current;
    if (!node) return;
    setBusy(mode);
    try {
      await waitForAssets(node);
      const canvas = await html2canvas(node, { scale: 2.5, useCORS: true, backgroundColor: "#ffffff", width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W, logging: false });
      const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4", compress: true });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), undefined, "FAST");
      const name = `خطاب شكر ${letter.serial || ""} - ${letter.recipientName || ""}.pdf`;
      if (mode === "print") {
        const win = window.open(pdf.output("bloburl"), "_blank");
        if (!win) pdf.save(name);
      } else {
        pdf.save(name);
      }
    } catch (e) {
      toast("error", "تعذر إنشاء الملف", e.message);
    } finally {
      setBusy("");
    }
  };

  const openLetter = async (row) => {
    try {
      const full = await p2pApi(`/letters/${row.guid}`);
      setIssued(full);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  };

  const cancelLetter = async (row) => {
    if (!(await confirmBox("إلغاء الخطاب", `سيظهر الخطاب ${row.serial} "ملغيًا" لكل من يتحقق منه. إلغاء؟`, "إلغاء الخطاب"))) return;
    try {
      const r = await p2pApi(`/letters/${row.guid}/cancel`, { method: "POST", body: {} });
      toast("success", "تم", r.message);
      if (issued?.guid === row.guid) setIssued(null);
      loadLetters();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  };

  const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: 2 } };

  return (
    <Stack spacing={1.5}>
      <Grid container spacing={1.5} alignItems="flex-start">
        {/* النموذج */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.8, md: 2.4 } }}>
            <StepTitle n={1} icon={<BusinessRoundedIcon fontSize="small" sx={{ color: ui.greenText }} />} title="الجهة الموجّه لها الخطاب" hint="اختر من شركاتك ليمتلئ الاسم والمسؤول تلقائيًا، أو اكتب أي جهة" />
            <Stack spacing={1.4} sx={fieldSx}>
              <Autocomplete
                options={companies}
                getOptionLabel={(c) => c?.name || ""}
                value={companies.find((c) => c.guid === form.companyGuid) || null}
                onChange={(_, c) => pickCompany(c)}
                renderInput={(params) => <TextField {...params} label="الشركة (من شركاتي)" />}
                isOptionEqualToValue={(a, b) => a.guid === b.guid}
              />
              <TextField label="اسم الجهة *" value={form.recipientName} onChange={set("recipientName")} fullWidth inputProps={{ maxLength: 250 }} />
              <TextField label="عناية (اختياري)" value={form.recipientTitle} onChange={set("recipientTitle")} fullWidth placeholder="مثال: مدير الموارد البشرية" inputProps={{ maxLength: 250 }} />
            </Stack>

            <Divider sx={{ my: 2.2 }} />

            <StepTitle n={2} icon={<EditNoteRoundedIcon fontSize="small" sx={{ color: ui.greenText }} />} title="محتوى الخطاب" hint="النص الافتراضي جاهز ويمكنك تعديله — افصل بين الفقرات بسطر فارغ" />
            <Stack spacing={1.4} sx={fieldSx}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField label="الموضوع" value={form.subject} onChange={set("subject")} fullWidth inputProps={{ maxLength: 250 }} />
                <TextField type="date" label="التاريخ" value={form.letterDate} onChange={set("letterDate")} InputLabelProps={{ shrink: true }} sx={{ minWidth: 175 }} />
              </Stack>
              <TextField
                label="نص الخطاب"
                className="tall-multiline"
                value={form.body}
                onChange={(e) => { setBodyTouched(true); set("body")(e); }}
                multiline
                rows={10}
                fullWidth
                inputProps={{ maxLength: 4000, className: "tall-multiline-input" }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 1 }}>
                      <Tooltip title="استرجاع النص الافتراضي">
                        <IconButton size="small" onClick={() => { setBodyTouched(false); setIssued(null); setForm((p) => ({ ...p, body: defaultLetterBody(p.recipientName) })); }}>
                          <RestartAltRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
            </Stack>

            <Divider sx={{ my: 2.2 }} />

            <StepTitle n={3} icon={<VerifiedRoundedIcon fontSize="small" sx={{ color: ui.greenText }} />} title="الإصدار" hint="يصدر برقم مسلسل وختم المعهد ورمز QR للتحقق من صحته" />
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<NoteAddRoundedIcon />} onClick={() => { setBodyTouched(false); setIssued(null); setForm(emptyForm()); }} sx={{ fontWeight: 800, borderRadius: 2, whiteSpace: "nowrap", flexShrink: 0 }}>
                خطاب جديد
              </Button>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <VerifiedRoundedIcon />}
                disabled={saving || Boolean(issued)}
                onClick={issue}
                sx={{ ...ui.primaryBtn, borderRadius: 2, py: 1.1 }}
              >
                {issued ? `تم الإصدار — ${issued.serial}` : "إصدار الخطاب"}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* المعاينة */}
        <Grid item xs={12} lg={7} sx={{ position: { lg: "sticky" }, top: { lg: 12 } }}>
          <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.5, md: 2 } }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
              <Typography sx={{ ...ui.sectionTitle, flex: 1 }}>معاينة الخطاب</Typography>
              {issued ? <P2PToneChip size="small" tone="success" label={`صادر برقم ${issued.serial}`} /> : <P2PToneChip size="small" tone="warning" label="مسودة — لم يصدر بعد" />}
              <Button size="small" variant="contained" startIcon={busy === "pdf" ? <CircularProgress size={14} color="inherit" /> : <PictureAsPdfRoundedIcon />} disabled={!issued || Boolean(busy)} onClick={() => exportPdf("pdf")} sx={{ ...ui.primaryBtn, borderRadius: 2 }}>
                تحميل PDF
              </Button>
              <Button size="small" variant="outlined" startIcon={busy === "print" ? <CircularProgress size={14} /> : <PrintRoundedIcon />} disabled={!issued || Boolean(busy)} onClick={() => exportPdf("print")} sx={{ fontWeight: 800, borderRadius: 2 }}>
                طباعة
              </Button>
            </Stack>
            <Box
              ref={previewBox}
              dir="ltr"
              sx={{ width: "100%", display: "flex", justifyContent: "center", py: 2, borderRadius: 2.5, bgcolor: ui.dark ? "rgba(255,255,255,.04)" : "#e9efeb" }}
            >
              <Box sx={{ position: "relative", width: PAGE_W * scale, height: PAGE_H * scale, boxShadow: "0 14px 40px rgba(0,0,0,.22)", borderRadius: "3px", overflow: "hidden", bgcolor: "#fff" }}>
                <Box sx={{ position: "absolute", top: 0, left: 0, width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                  <ThankLetterDocument letter={letter} />
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* خطاباتي */}
      <Paper elevation={0} sx={{ ...ui.card, p: { xs: 1.5, md: 2 } }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <HistoryEduRoundedIcon sx={{ color: ui.greenText }} />
          <Typography sx={{ ...ui.sectionTitle, flex: 1 }}>خطاباتي</Typography>
          <P2PToneChip size="small" tone="info" label={`${letters.length} خطاب`} />
        </Stack>
        {!letters.length ? (
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            <HistoryEduRoundedIcon sx={{ fontSize: 42, opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>لم تصدر أي خطاب بعد</Typography>
          </Box>
        ) : (
          <Grid container spacing={1.2}>
            {letters.map((row) => (
              <Grid item xs={12} md={6} xl={4} key={row.guid}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2.5,
                    height: "100%",
                    border: `1px solid ${ui.dark ? "rgba(255,255,255,.09)" : alpha(GREEN, 0.14)}`,
                    bgcolor: row.isCancelled ? (ui.dark ? "rgba(255,255,255,.02)" : "#fafafa") : "transparent",
                    opacity: row.isCancelled ? 0.7 : 1
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 900, direction: "ltr", fontSize: 13.5 }}>{row.serial}</Typography>
                    <Box sx={{ flex: 1 }} />
                    <P2PToneChip size="small" tone={row.isCancelled ? "error" : "success"} label={row.isCancelled ? "ملغي" : "ساري"} />
                  </Stack>
                  <Typography sx={{ fontWeight: 800, mt: 0.6 }} noWrap title={row.recipientName}>{row.recipientName}</Typography>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 0.4, color: "text.secondary", fontSize: 12.5 }}>
                    <span>{row.letterDate}</span>
                    <Stack direction="row" spacing={0.4} alignItems="center"><QrCode2RoundedIcon sx={{ fontSize: 15 }} /><span style={{ direction: "ltr" }}>{row.verifyCode}</span></Stack>
                  </Stack>
                  <Stack direction="row" spacing={0.8} sx={{ mt: 1.2 }}>
                    <Button size="small" variant="outlined" startIcon={<VisibilityRoundedIcon />} onClick={() => openLetter(row)} sx={{ fontWeight: 800, borderRadius: 2 }}>عرض وتحميل</Button>
                    {!row.isCancelled ? (
                      <Button size="small" color="error" startIcon={<BlockRoundedIcon />} onClick={() => cancelLetter(row)} sx={{ fontWeight: 800, borderRadius: 2 }}>إلغاء</Button>
                    ) : null}
                  </Stack>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* نسخة التصدير: مقاسها الطبيعي ومخفية برا الشاشة */}
      <Box aria-hidden sx={{ position: "fixed", left: -20000, top: 0, direction: "ltr", pointerEvents: "none" }}>
        <ThankLetterDocument ref={exportRef} letter={letter} />
      </Box>
    </Stack>
  );
}
