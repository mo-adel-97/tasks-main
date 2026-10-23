// إضافة / تعديل شركة (شركات الموظف).
import React, { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  Switch,
  TextField,
  useMediaQuery
} from "@mui/material";
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

  useEffect(() => {
    if (open) setForm(company ? { ...EMPTY, ...Object.fromEntries(Object.entries(company).map(([k, v]) => [k, v ?? (k === "isActive" ? true : "")])) } : EMPTY);
  }, [open, company]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) return toast("warning", "مطلوب", "اكتب اسم الشركة");
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
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={ui.primaryBtn}>
          حفظ
        </Button>
      </DialogActions>
    </Dialog>
  );
}
