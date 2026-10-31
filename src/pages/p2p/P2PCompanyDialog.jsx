// إضافة / تعديل شركة (شركات الموظف).
// وقت كتابة الاسم بيظهر الشركات المسجلة في النظام بأسماء مشابهة (من غير اسم الزميل اللي ضافها)، والمسجلة بالفعل ماتتضافش تاني.
import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import TravelExploreRoundedIcon from "@mui/icons-material/TravelExploreRounded";
import P2PToneChip from "./P2PToneChip";
import { GREEN, GREEN_DARK, p2pApi, toast, useUi } from "./p2pShared";

const EMPTY = {
  name: "",
  sector: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  contactName: "",
  contactTitle: "",
  contactPhone: "",
  notes: "",
  isActive: true
};

export default function P2PCompanyDialog({ open, company, onClose, onSaved }) {
  const ui = useUi();
  const fullScreen = useMediaQuery(ui.theme.breakpoints.down("md"));
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [matches, setMatches] = useState([]);

  // البحث في شركات النظام أثناء كتابة الاسم
  useEffect(() => {
    const q = form.name.trim();
    if (!open || q.length < 2) {
      setMatches([]);
      return undefined;
    }
    let alive = true;
    const timer = setTimeout(() => {
      p2pApi("/companies/lookup", { query: { q, ...(company?.guid ? { exceptGuid: company.guid } : {}) } })
        .then((rows) => alive && setMatches(Array.isArray(rows) ? rows : []))
        .catch(() => alive && setMatches([]));
    }, 350);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [open, form.name, company?.guid]);

  const exact = matches.find((m) => m.exact);

  useEffect(() => {
    if (open) setForm(company ? { ...EMPTY, ...Object.fromEntries(Object.entries(company).map(([k, v]) => [k, v ?? (k === "isActive" ? true : "")])) } : EMPTY);
  }, [open, company]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) return toast("warning", "مطلوب", "اكتب اسم الشركة");
    if (exact) return toast("warning", "شركة مسجلة", exact.isMine ? "هذه الشركة مسجلة ضمن شركاتك بالفعل" : "هذه الشركة مسجلة بالفعل في النظام لدى أحد الزملاء، ولا يمكن إضافتها مرة أخرى");
    setSaving(true);
    try {
      const result = company?.guid
        ? await p2pApi(`/companies/${company.guid}`, { method: "PUT", body: form })
        : await p2pApi("/companies", { method: "POST", body: form });
      onSaved?.({ ...form, guid: result.guid || company?.guid });
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (key, label, extra = {}) => (
    <TextField label={label} value={form[key]} onChange={set(key)} size="small" fullWidth {...extra} />
  );

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullScreen={fullScreen} maxWidth="md" fullWidth dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})` }}>
        {company?.guid ? "تعديل بيانات الشركة" : "شركة جديدة"}
      </DialogTitle>
      <DialogContent sx={{ pt: "18px !important" }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>{field("name", "اسم الشركة *", { autoFocus: true, inputProps: { maxLength: 200 } })}</Grid>
          <Grid item xs={12} md={6}>{field("sector", "النشاط / القطاع")}</Grid>
          {matches.length ? (
            <Grid item xs={12}>
              {exact ? (
                <Alert severity={exact.isMine ? "warning" : "error"} sx={{ borderRadius: 2, fontWeight: 700, mb: 1 }}>
                  {exact.isMine
                    ? "هذه الشركة مسجلة ضمن شركاتك بالفعل، ويمكنك اختيارها مباشرة عند إضافة الزيارة."
                    : "هذه الشركة مسجلة بالفعل في النظام لدى أحد الزملاء، ولا يمكن إضافتها مرة أخرى."}
                </Alert>
              ) : null}
              <Paper elevation={0} sx={{ border: `1px solid ${ui.dark ? "rgba(103,201,157,.25)" : "rgba(5,117,70,.18)"}`, borderRadius: 2, overflow: "hidden" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1, bgcolor: ui.soft }}>
                  <TravelExploreRoundedIcon fontSize="small" sx={{ color: ui.greenText }} />
                  <Typography sx={{ fontWeight: 900, fontSize: 13.5, color: ui.greenText }}>شركات مسجلة في النظام بأسماء مشابهة</Typography>
                </Stack>
                {matches.map((m, i) => (
                  <Stack
                    key={`${m.name}-${i}`}
                    direction="row"
                    spacing={1.2}
                    alignItems="center"
                    sx={{ px: 1.5, py: 1, borderTop: i ? `1px solid ${ui.dark ? "rgba(255,255,255,.06)" : "rgba(5,117,70,.08)"}` : "none" }}
                  >
                    <BusinessRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 14 }} noWrap>{m.name}</Typography>
                      {m.sector || m.city ? (
                        <Typography variant="caption" color="text.secondary" noWrap>{[m.sector, m.city].filter(Boolean).join(" — ")}</Typography>
                      ) : null}
                    </Box>
                    {m.exact ? <P2PToneChip size="small" tone="error" label="الاسم نفسه" /> : null}
                    <P2PToneChip size="small" tone={m.isMine ? "success" : "info"} label={m.isMine ? "ضمن شركاتك" : "مسجلة لدى أحد الزملاء"} />
                  </Stack>
                ))}
              </Paper>
            </Grid>
          ) : null}
          <Grid item xs={12} md={4}>{field("city", "المدينة")}</Grid>
          <Grid item xs={12} md={8}>{field("address", "العنوان")}</Grid>
          <Grid item xs={12} md={4}>{field("phone", "هاتف الشركة")}</Grid>
          <Grid item xs={12} md={4}>{field("email", "البريد الإلكتروني")}</Grid>
          <Grid item xs={12} md={4}>{field("website", "الموقع الإلكتروني")}</Grid>
          <Grid item xs={12} md={4}>{field("contactName", "مسؤول التدريب / الموارد البشرية")}</Grid>
          <Grid item xs={12} md={4}>{field("contactTitle", "المسمى الوظيفي")}</Grid>
          <Grid item xs={12} md={4}>{field("contactPhone", "جوال المسؤول")}</Grid>
          <Grid item xs={12}>{field("notes", "ملاحظات", { multiline: true, minRows: 2 })}</Grid>
          {company?.guid ? (
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={Boolean(form.isActive)} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} color="success" />}
                label={form.isActive ? "نشطة" : "مؤرشفة (لا تظهر عند إضافة زيارة)"}
              />
            </Grid>
          ) : null}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving || Boolean(exact)} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={ui.primaryBtn}>
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
}
