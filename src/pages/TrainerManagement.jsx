import { DESKTOP_BREAKPOINT, navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from '../components/NavigationShell';
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";




const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5258";



const primary = "#057546";
const primaryDark = "#034d31";
const border = "#dce8e2";
const soft = "#f7fbf9";

/*
 * مهم جدًا:
 * الديسكتوب يحفظ CboTrainerType.SelectedIndex و CboBookType.SelectedIndex.
 * لذلك القيمة value هنا هي الـ index نفسه، وليس النص.
 * لو ترتيب النصوص في Designer عندك مختلف غيّر ترتيب/أسماء هذه المصفوفات فقط.
 */
const TRAINER_DEPARTMENTS = [
  { value: 0, label: "دبلومات" },
  { value: 1, label: "دورات تأهيلية" },
  { value: 2, label: "دورات تطويرية" }
];

const BOOK_TYPES = [
  { value: 0, label: "مواد تخصصية" },
  { value: 1, label: "مواد عامة" }
];

const NATIONALITIES = [
  "سعودي",
  "مصري",
  "سوداني"
];

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const currentUser = readUser();
const getUserGuid = () =>
  String(
    currentUser?.guid ||
      currentUser?.Guid ||
      currentUser?.userGuid ||
      currentUser?.UserGuid ||
      ""
  ).trim();

const emptyTrainer = () => ({
  guid: "",
  code: "",
  name: "",
  address: "",
  nationalId: "",
  nationalName: "",
  email: "",
  tel: "",
  mob: "",
  eduction: "",
  otherEduction: "",
  isUse: true,
  branchGuid: "",
  branchName: "",
  trainerDepart: -1,
  bookType: -1,
  dailyTime: 0,
  weekTime: 0,
  useMainAllow: false
});

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function BranchDialog({ open, rows, onClose, onPick }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) =>
      `${r.code || ""} ${r.name || ""}`.toLowerCase().includes(needle)
    );
  }, [q, rows]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      PaperProps={{ sx: { borderRadius: { xs: 1.4, sm: 2.4 }, m: { xs: 0.7, sm: 2 }, maxHeight: "90vh" } }}
    >
      <DialogTitle sx={{ fontWeight: 900, fontSize: { xs: 15, sm: 20 }, py: 1 }}>
        قائمة الفروع
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 0.7, sm: 1.2 } }}>
        <TextField
          fullWidth
          autoFocus
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث بالكود أو اسم الفرع..."
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ mb: 0.7, "& input": { fontSize: { xs: 11, sm: 13 } } }}
        />

        <Box sx={{ display: "grid", gap: 0.45 }}>
          {filtered.map((row, index) => (
            <Paper
              key={`${row.guid}-${index}`}
              variant="outlined"
              onDoubleClick={() => onPick(row)}
              sx={{
                px: { xs: 0.7, sm: 1 },
                py: { xs: 0.5, sm: 0.7 },
                cursor: "pointer",
                borderColor: border,
                "&:hover": { bgcolor: "#edf8f3", borderColor: primary }
              }}
            >
              <Box sx={{ display: "grid", gridTemplateColumns: "55px minmax(0,1fr) 55px", gap: 0.5, alignItems: "center" }}>
                <Typography sx={{ fontSize: { xs: 10, sm: 12 }, fontWeight: 900 }}>{row.code || "-"}</Typography>
                <Typography noWrap sx={{ fontSize: { xs: 10.5, sm: 13 }, fontWeight: 800 }}>{row.name || "-"}</Typography>
                <Button size="small" onClick={() => onPick(row)} sx={{ minWidth: 0, fontSize: { xs: 9, sm: 11 } }}>اختيار</Button>
              </Box>
            </Paper>
          ))}

          {!filtered.length && <Alert severity="info">لا توجد فروع مطابقة.</Alert>}
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>إغلاق</Button></DialogActions>
    </Dialog>
  );
}

function TrainerLookupDialog({ open, rows, loading, q, setQ, onClose, onPick }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{ sx: { borderRadius: { xs: 1.4, sm: 2.4 }, m: { xs: 0.7, sm: 2 }, maxHeight: "92vh" } }}
    >
      <DialogTitle sx={{ fontWeight: 900, fontSize: { xs: 15, sm: 20 }, py: 1 }}>
        قائمة المدربين
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 0.7, sm: 1.2 } }}>
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="بحث باسم المدرب..."
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ mb: 0.7 }}
        />

        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}><CircularProgress size={26} /></Box>
        ) : (
          <Box sx={{ display: "grid", gap: 0.45 }}>
            {rows.map((row, index) => (
              <Paper
                key={`${row.guid || row.code}-${index}`}
                variant="outlined"
                onDoubleClick={() => onPick(row)}
                sx={{ px: 0.8, py: 0.55, cursor: "pointer", borderColor: border, "&:hover": { bgcolor: "#eef8f3", borderColor: primary } }}
              >
                <Box sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "48px minmax(0,1fr) 48px", sm: "65px minmax(0,1fr) 90px 65px" },
                  alignItems: "center",
                  gap: 0.5
                }}>
                  <Typography sx={{ fontWeight: 900, fontSize: { xs: 10, sm: 12.5 } }}>{row.code || "-"}</Typography>
                  <Typography noWrap sx={{ fontWeight: 800, fontSize: { xs: 10.5, sm: 13 } }}>{row.name || "-"}</Typography>
                  <Typography sx={{ display: { xs: "none", sm: "block" }, fontWeight: 700, fontSize: 12 }}>{row.status || "-"}</Typography>
                  <Button size="small" onClick={() => onPick(row)} sx={{ minWidth: 0, fontSize: { xs: 9, sm: 11 } }}>اختيار</Button>
                </Box>
              </Paper>
            ))}
            {!rows.length && <Alert severity="info">لا يوجد مدربون مطابقون للبحث.</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions><Button onClick={onClose}>إغلاق</Button></DialogActions>
    </Dialog>
  );
}

export default function TrainerManagement() {
  const isDesktop = useMediaQuery(`(min-width:${DESKTOP_BREAKPOINT}px)`, { noSsr: true });
  const userGuid = useMemo(() => getUserGuid(), []);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [ops, setOps] = useState({ canView: false, canAdd: false, canEdit: false, canFind: false });
  const [model, setModel] = useState(emptyTrainer());
  const [branches, setBranches] = useState([]);
  const [branchOpen, setBranchOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupQ, setLookupQ] = useState("");
  const [lookupRows, setLookupRows] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = Boolean(model.guid);
  const setField = useCallback((field, value) => setModel((m) => ({ ...m, [field]: value })), []);

  // الصلاحية من نفس UserPermissionsController المستخدم في السايدبار.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!userGuid) return;
        const response = await fetch(`${API_BASE_URL}/api/user-permissions/${encodeURIComponent(userGuid)}`, { cache: "no-store" });
        const result = await response.json().catch(() => null);
        const allowed = response.ok && result?.data?.file?.canView === true && result?.data?.file?.screens?.addTrainer === true;
        if (alive) setAuthorized(Boolean(allowed));
      } catch {
        if (alive) setAuthorized(false);
      } finally {
        if (alive) setPermissionLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [userGuid]);

  const loadBootstrap = useCallback(async () => {
    if (!authorized || !userGuid) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/trainer-management/bootstrap?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" });
      const raw = await response.text();
      let result = null;
      try { result = raw ? JSON.parse(raw) : null; } catch { result = null; }
      if (!response.ok) throw new Error(result?.message || result?.error || raw || "تعذر تحميل شاشة المدربين");

      setOps({
        canView: Boolean(result?.data?.permissions?.canView),
        canAdd: Boolean(result?.data?.permissions?.canAdd),
        canEdit: Boolean(result?.data?.permissions?.canEdit),
        canFind: Boolean(result?.data?.permissions?.canFind)
      });
      setBranches(Array.isArray(result?.data?.branches) ? result.data.branches : []);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر التحميل", text: e?.message || "تعذر تحميل شاشة المدربين" });
    } finally {
      setLoading(false);
    }
  }, [authorized, userGuid]);

  useEffect(() => { if (authorized) loadBootstrap(); }, [authorized, loadBootstrap]);

  const newTrainer = useCallback(() => {
    setModel(emptyTrainer());
    setLookupRows([]);
    setLookupQ("");
    setLookupOpen(false);
  }, []);

  // مثل الديسكتوب: لا تفتح قائمة المدربين قبل اختيار الفرع.
  const openTrainerLookup = useCallback(async () => {
    if (!model.branchGuid) {
      await Swal.fire({ icon: "warning", title: "اختر الفرع أولاً", text: "برجاء اختيار الفرع أولاً ثم البحث عن المدرب." });
      return;
    }
    if (!ops.canFind) {
      await Swal.fire({ icon: "error", title: "غير مسموح", text: "لا توجد لديك صلاحية البحث عن مدرب." });
      return;
    }
    setLookupQ("");
    setLookupRows([]);
    setLookupOpen(true);
  }, [model.branchGuid, ops.canFind]);

  useEffect(() => {
    if (!lookupOpen || !model.branchGuid || !ops.canFind) return;
    const timer = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const params = new URLSearchParams({ userGuid, branchGuid: model.branchGuid, q: lookupQ || "" });
        const response = await fetch(`${API_BASE_URL}/api/trainer-management/trainers?${params}`, { cache: "no-store" });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || "تعذر تحميل قائمة المدربين");
        setLookupRows(Array.isArray(result?.data) ? result.data : []);
      } catch (e) {
        setLookupRows([]);
      } finally {
        setLookupLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [lookupOpen, lookupQ, model.branchGuid, ops.canFind, userGuid]);

  const loadTrainer = useCallback(async (row) => {
    setLookupOpen(false);
    setLoading(true);
    try {
      const params = new URLSearchParams({ userGuid, branchGuid: model.branchGuid });
      const response = await fetch(`${API_BASE_URL}/api/trainer-management/trainers/${encodeURIComponent(row.code)}?${params}`, { cache: "no-store" });
      const raw = await response.text();
      let result = null;
      try { result = raw ? JSON.parse(raw) : null; } catch { result = null; }
      if (!response.ok) throw new Error(result?.message || result?.error || raw || "تعذر تحميل بيانات المدرب");
      const t = result?.data || {};
      setModel({
        guid: String(t.guid || ""),
        code: String(t.code || row.code || ""),
        name: String(t.name || ""),
        address: String(t.address || ""),
        nationalId: String(t.nationalId || ""),
        nationalName: String(t.nationalName || ""),
        email: String(t.email || ""),
        tel: String(t.tel || ""),
        mob: String(t.mob || ""),
        eduction: String(t.eduction || ""),
        otherEduction: String(t.otherEduction || ""),
        isUse: Boolean(t.isUse),
        branchGuid: String(t.branchGuid || model.branchGuid || ""),
        branchName: String(t.branchName || model.branchName || ""),
        trainerDepart: Number.isFinite(Number(t.trainerDepart)) ? Number(t.trainerDepart) : -1,
        bookType: Number.isFinite(Number(t.bookType)) ? Number(t.bookType) : -1,
        dailyTime: toNumber(t.dailyTime),
        weekTime: toNumber(t.weekTime),
        useMainAllow: Boolean(t.useMainAllow)
      });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر التحميل", text: e?.message || "تعذر تحميل بيانات المدرب" });
    } finally {
      setLoading(false);
    }
  }, [model.branchGuid, model.branchName, userGuid]);

  const validate = useCallback(() => {
    if (!model.name.trim()) return "برجاء إدخال اسم المدرب";
    if (!model.nationalId.trim()) return "برجاء إدخال رقم الهوية";
    if (!model.mob.trim()) return "برجاء إدخال رقم الجوال";
    if (!model.branchGuid) return "برجاء اختيار الفرع التابع له المدرب أولاً";
    if (Number(model.trainerDepart) < 0) return "برجاء تحديد القسم التدريبي التابع له المدرب";
    if (Number(model.bookType) < 0) return "برجاء اختيار نوع المقررات التي يدرسها المدرب";
    if (toNumber(model.dailyTime) <= 0) return "برجاء إدخال ساعات العمل اليومية";
    if (toNumber(model.weekTime) <= 0) return "برجاء إدخال ساعات العمل الأسبوعية";
    return "";
  }, [model]);

  const save = useCallback(async () => {
    const error = validate();
    if (error) {
      await Swal.fire({ icon: "warning", title: "راجع البيانات", text: error });
      return;
    }

    if (!isEdit && !ops.canAdd) {
      await Swal.fire({ icon: "error", title: "غير مسموح", text: "لا توجد لديك صلاحية إضافة مدرب." });
      return;
    }
    if (isEdit && !ops.canEdit) {
      await Swal.fire({ icon: "error", title: "غير مسموح", text: "لا توجد لديك صلاحية تعديل المدرب." });
      return;
    }

    let reason = "";
    if (isEdit) {
      const r = await Swal.fire({
        title: "سبب التعديل",
        input: "textarea",
        inputPlaceholder: "اكتب سبب تعديل بيانات المدرب...",
        showCancelButton: true,
        confirmButtonText: "حفظ التعديل",
        cancelButtonText: "رجوع",
        inputValidator: (v) => !String(v || "").trim() ? "سبب التعديل مطلوب" : undefined
      });
      if (!r.isConfirmed) return;
      reason = String(r.value || "").trim();
    }

    const payload = {
      actorUserGuid: userGuid,
      reason,
      trainer: {
        guid: String(model.guid || ""),
        code: String(model.code || ""),
        name: model.name.trim(),
        address: model.address.trim(),
        nationalId: model.nationalId.trim(),
        nationalName: model.nationalName.trim(),
        email: model.email.trim(),
        tel: model.tel.trim(),
        mob: model.mob.trim(),
        eduction: model.eduction.trim(),
        otherEduction: model.otherEduction.trim(),
        isUse: Boolean(model.isUse),
        branchGuid: model.branchGuid,
        branchName: model.branchName,
        trainerDepart: Number(model.trainerDepart),
        bookType: Number(model.bookType),
        dailyTime: toNumber(model.dailyTime),
        weekTime: toNumber(model.weekTime),
        useMainAllow: Boolean(model.useMainAllow)
      }
    };

    setSaving(true);
    try {
      const response = await fetch(
        isEdit
          ? `${API_BASE_URL}/api/trainer-management/${encodeURIComponent(model.guid)}`
          : `${API_BASE_URL}/api/trainer-management`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const raw = await response.text();
      let result = null;
      try { result = raw ? JSON.parse(raw) : null; } catch { result = null; }
      if (!response.ok) throw new Error([result?.message, result?.error, result?.detail].filter(Boolean).join(" — ") || raw || "تعذر حفظ المدرب");

      setModel((m) => ({ ...m, guid: String(result?.data?.guid || m.guid || ""), code: String(result?.data?.code || m.code || "") }));
      await Swal.fire({ icon: "success", title: isEdit ? "تم تعديل المدرب" : "تم إضافة المدرب", text: result?.message || "تمت العملية بنجاح" });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر الحفظ", text: e?.message || "تعذر حفظ المدرب" });
    } finally {
      setSaving(false);
    }
  }, [isEdit, model, ops, userGuid, validate]);

  if (permissionLoading) {
    return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}><CircularProgress /></Box>;
  }

  if (!authorized) {
    return <Box sx={{ p: 1 }}><Alert severity="error">لا توجد لديك صلاحية إضافة مدرب ضمن قائمة ملف.</Alert></Box>;
  }

  const fieldSx = {
    "& .MuiInputBase-root": { minHeight: { xs: 33, sm: 38 } },
    "& .MuiInputBase-input": { fontSize: { xs: 10.6, sm: 13 }, py: { xs: 0.45, sm: 0.7 } },
    "& .MuiInputLabel-root": { fontSize: { xs: 9.3, sm: 12 } }
  };

  const page = (
    <Box dir="rtl" sx={{ minHeight: "100vh", bgcolor: soft, p: { xs: 0.35, sm: 0.8 }, overflowX: "hidden" }}>
      <Paper elevation={0} sx={{ border: `1px solid ${border}`, borderRadius: { xs: 1.1, sm: 2 }, overflow: "hidden" }}>
        <Box sx={{ bgcolor: primaryDark, color: "#fff", px: { xs: 0.65, sm: 1.4 }, py: { xs: 0.55, sm: 0.9 }, display: "flex", alignItems: "center", gap: 0.55 }}>
          {!isDesktop && <IconButton onClick={() => setMobileSidebarOpen(true)} sx={{ color: "#fff", p: 0.3 }}><MenuRoundedIcon /></IconButton>}
          <SchoolIcon />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 14.5, sm: 20 } }}>إضافة مدرب</Typography>
            <Typography sx={{ opacity: 0.9, fontSize: { xs: 8.5, sm: 11 } }}>ملف — بيانات المدرب والقسم التدريبي والمقررات</Typography>
          </Box>
          <Chip label={isEdit ? `تعديل #${model.code}` : "مدرب جديد"} size="small" sx={{ bgcolor: "#fff", color: primaryDark, fontWeight: 900, fontSize: { xs: 8.5, sm: 11 } }} />
        </Box>

        <Box sx={{ p: { xs: 0.55, sm: 0.9 }, borderBottom: `1px solid ${border}` }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3,minmax(0,1fr))", sm: "repeat(3,max-content)" }, gap: 0.45 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={newTrainer} disabled={!ops.canAdd && !isEdit} sx={{ bgcolor: "#1976d2", fontWeight: 900, minWidth: 0, fontSize: { xs: 9.5, sm: 12.5 } }}>جديد</Button>
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={openTrainerLookup} disabled={!ops.canFind} sx={{ fontWeight: 900, minWidth: 0, fontSize: { xs: 9.5, sm: 12.5 } }}>بحث</Button>
            <Button variant="contained" color="success" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />} onClick={save} disabled={saving || loading || (isEdit ? !ops.canEdit : !ops.canAdd)} sx={{ fontWeight: 900, minWidth: 0, fontSize: { xs: 9.5, sm: 12.5 } }}>{isEdit ? "حفظ التعديل" : "حفظ"}</Button>
          </Box>
        </Box>

        {loading && <Box sx={{ px: 1, py: 0.5, display: "flex", gap: 0.5, alignItems: "center" }}><CircularProgress size={15} /><Typography sx={{ fontSize: 10.5 }}>جاري التحميل...</Typography></Box>}

        <Box sx={{ p: { xs: 0.55, sm: 1 } }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", sm: "repeat(4,minmax(0,1fr))" },
            gap: { xs: 0.55, sm: 0.8 },
            "& .MuiTextField-root": fieldSx
          }}>
            <TextField label="كود" size="small" value={model.code} InputProps={{ readOnly: true }}  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField label="اسم المدرب" size="small" value={model.name} onChange={(e) => setField("name", e.target.value)} required />

            <TextField
              label="الفرع"
              size="small"
              value={model.branchName}
              onClick={() => setBranchOpen(true)}
              InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" /></InputAdornment> }}
              sx={{ cursor: "pointer" }}
            />

            <TextField label="رقم الهوية" size="small" value={model.nationalId} onChange={(e) => setField("nationalId", e.target.value)} required  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField
              select
              label="الجنسية"
              size="small"
              value={model.nationalName}
              onChange={(e) => setField("nationalName", e.target.value)}
              SelectProps={{
                MenuProps: {
                  PaperProps: {
                    sx: {
                      maxHeight: 220,
                      "& .MuiMenuItem-root": {
                        fontFamily: "Cairo",
                        fontSize: { xs: 11, sm: 13 },
                        minHeight: { xs: 32, sm: 36 }
                      }
                    }
                  }
                }
              }}
            >
              <MenuItem value="">-- اختر --</MenuItem>
              {NATIONALITIES.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="الجوال" size="small" value={model.mob} onChange={(e) => setField("mob", e.target.value)} required />
            <TextField label="الهاتف" size="small" value={model.tel} onChange={(e) => setField("tel", e.target.value)}  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField label="الإيميل" size="small" value={model.email} onChange={(e) => setField("email", e.target.value)}  inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField
              select
              label="القسم التدريبي"
              size="small"
              value={model.trainerDepart}
              onChange={(e) => setField("trainerDepart", Number(e.target.value))}
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {TRAINER_DEPARTMENTS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </TextField>

            <TextField
              select
              label="المقررات"
              size="small"
              value={model.bookType}
              onChange={(e) => setField("bookType", Number(e.target.value))}
            >
              <MenuItem value={-1}>-- اختر --</MenuItem>
              {BOOK_TYPES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
            </TextField>

            <TextField label="ساعات العمل اليومية" type="number" size="small" value={model.dailyTime} onChange={(e) => setField("dailyTime", e.target.value)} inputProps={{ min: 0, step: 0.5 , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }} />
            <TextField label="ساعات العمل الأسبوعية" type="number" size="small" value={model.weekTime} onChange={(e) => setField("weekTime", e.target.value)} inputProps={{ min: 0, step: 0.5 , dir: "ltr" , style: { direction: "ltr", unicodeBidi: "isolate" } }} />

            <TextField label="العنوان" size="small" value={model.address} onChange={(e) => setField("address", e.target.value)} sx={{ gridColumn: { xs: "1 / -1", sm: "span 2" } }} />

            <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.3, minHeight: 34 }}>
              <FormControlLabel
                control={<Checkbox checked={model.isUse} onChange={(e) => setField("isUse", e.target.checked)} size="small" />}
                label={<Typography sx={{ fontSize: { xs: 9.7, sm: 12.5 }, fontWeight: 800 }}>نشط</Typography>}
              />
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", px: 0.3, minHeight: 34, gridColumn: { xs: "1 / -1", sm: "span 2" } }}>
              <FormControlLabel
                control={<Checkbox checked={model.useMainAllow} onChange={(e) => setField("useMainAllow", e.target.checked)} size="small" />}
                label={<Typography sx={{ color: "#d32f2f", fontSize: { xs: 9.2, sm: 12.5 }, fontWeight: 900 }}>يسمح للمدرب بتدريب أي مقرر من نوع مواد عامة</Typography>}
              />
            </Box>

            <TextField
              label="المؤهل العلمي"
              multiline
              minRows={3}
              value={model.eduction}
              onChange={(e) => setField("eduction", e.target.value)}
              sx={{ gridColumn: { xs: "1 / -1", sm: "span 2" } }}
            />
            <TextField
              label="مؤهلات أخرى"
              multiline
              minRows={3}
              value={model.otherEduction}
              onChange={(e) => setField("otherEduction", e.target.value)}
              sx={{ gridColumn: { xs: "1 / -1", sm: "span 2" } }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );

  return (
    <NavigationShell variant="standard" mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)}><Box sx={{ minHeight: "100vh", bgcolor: soft }}>
      {isDesktop ? (
        <>
          
          <Box sx={{
            ...navigationContentSx
          }}>{page}</Box>
        </>
      ) : (
        <>
          
          {page}
        </>
      )}

      <BranchDialog
        open={branchOpen}
        rows={branches}
        onClose={() => setBranchOpen(false)}
        onPick={(row) => {
          setModel((m) => ({ ...m, branchGuid: String(row.guid || ""), branchName: String(row.name || "") }));
          setBranchOpen(false);
        }}
      />

      <TrainerLookupDialog
        open={lookupOpen}
        rows={lookupRows}
        loading={lookupLoading}
        q={lookupQ}
        setQ={setLookupQ}
        onClose={() => setLookupOpen(false)}
        onPick={loadTrainer}
      />
    </Box></NavigationShell>
  );
}
