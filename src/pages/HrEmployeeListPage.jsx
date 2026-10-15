import React, { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  LinearProgress,
  Menu,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import BadgeIcon from "@mui/icons-material/Badge";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import PaidIcon from "@mui/icons-material/Paid";

/*
  شاشة "قائمة الموظفين" — نقل EmpHome من الديسكتوب (قائمة الموارد البشرية).
  الصلاحية: "قائمة الموظفين" (كود 96) للعرض وإدراج البدلات،
  وتعديل بيانات الموظف بصلاحية "تعديل" على إضافة مستخدم (زي الديسكتوب).
*/

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const API = `${API_BASE_URL}/api/hr-employee-list`;

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const ALLOWANCES = [
  { key: "marriageAllowance", req: "marriage", label: "بدل زواج" },
  { key: "newbornAllowance", req: "newborn", label: "بدل مولود" },
  { key: "housingAllowance", req: "housing", label: "بدل السكن" },
  { key: "transportAllowance", req: "transport", label: "بدل مواصلات" },
  { key: "vacationAllowance", req: "vacation", label: "بدل أجازة" },
  { key: "otherAllowances", req: "other", label: "بدلات اخري" }
];

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || "").trim();
  } catch {
    return "";
  }
};

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || json?.error || fallback);
  return json;
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const toNum = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const money = (value) => toNum(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const norm = (value) => String(value ?? "").trim().toLowerCase();

const escapeHtml = (value) =>
  String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const showError = (text) => Swal.fire({ icon: "error", title: "خطأ", text, confirmButtonText: "حسناً", confirmButtonColor: accentColor });

// ===================== تعديل بيانات الموظف (UpdateEmpInfo) =====================
const EditEmployeeDialog = ({ employee, lookups, userGuid, onClose, onSaved }) => {
  const open = Boolean(employee);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!employee) return;
    setForm(null);
    setLoading(true);
    fetch(`${API}/${encodeURIComponent(employee.guid)}?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then((r) => readJson(r, "تعذر تحميل بيانات الموظف"))
      .then((json) => {
        // وظيفة خارج القائمة (غير محدد) => "اختر الوظيفة".
        const job = Number(json.data?.job);
        setForm({ ...json.data, job: Number.isInteger(job) && job >= 0 && job < 19 ? job : -1, reason: "" });
      })
      .catch((e) => {
        showError(e.message);
        onClose();
      })
      .finally(() => setLoading(false));
  }, [employee, userGuid, onClose]);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const branch = lookups.branches.find((b) => norm(b.guid) === norm(form?.branchGuid)) || null;
  const department = lookups.departments.find((d) => norm(d.guid) === norm(form?.departmentGuid)) || null;

  const save = async () => {
    try {
      setSaving(true);
      const json = await readJson(
        await fetch(`${API}/${encodeURIComponent(employee.guid)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            fullName: form.fullName,
            isActive: form.isActive,
            mobile: form.mobile,
            workMobile: form.workMobile,
            iban: form.iban,
            nationalId: form.nationalId,
            email: form.email,
            branchGuid: form.branchGuid || null,
            departmentGuid: form.departmentGuid || null,
            job: Number(form.job),
            reason: form.reason
          })
        }),
        "تعذر تعديل بيانات الموظف"
      );
      await Swal.fire({ icon: "success", title: json?.message || "تم التعديل", timer: 1500, showConfirmButton: false });
      onSaved();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (name, label, props = {}) => (
    <TextField
      label={label}
      value={form?.[name] ?? ""}
      onChange={(e) => set(name, e.target.value)}
      size="small"
      fullWidth
      InputLabelProps={{ shrink: true }}
      {...props}
    />
  );

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md" disableEnforceFocus PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`, display: "flex", alignItems: "center", gap: 1 }}>
        <EditIcon /> تعديل بيانات الموظف {employee ? `— ${employee.fullName}` : ""}
      </DialogTitle>
      <DialogContent dividers>
        {loading || !form ? (
          <Stack alignItems="center" sx={{ py: 5 }}><CircularProgress sx={{ color: primaryColor }} /></Stack>
        ) : (
          <Grid container spacing={1.5}>
            <Grid item xs={12} md={8}>{field("fullName", "اسم الموظف *")}</Grid>
            <Grid item xs={12} md={4} sx={{ display: "flex", alignItems: "center" }}>
              <FormControlLabel
                control={<Switch checked={Boolean(form.isActive)} onChange={(e) => set("isActive", e.target.checked)} color="success" />}
                label={form.isActive ? "نشط" : "موقوف"}
                sx={{ fontWeight: 800 }}
              />
            </Grid>
            <Grid item xs={12} md={4}>{field("nationalId", "رقم الهوية *", { inputProps: { dir: "ltr" } })}</Grid>
            <Grid item xs={12} md={4}>{field("mobile", "جوال شخصي", { inputProps: { dir: "ltr" } })}</Grid>
            <Grid item xs={12} md={4}>{field("workMobile", "جوال عمل", { inputProps: { dir: "ltr" } })}</Grid>
            <Grid item xs={12} md={6}>{field("iban", "رقم الإيبان *", { inputProps: { dir: "ltr" } })}</Grid>
            <Grid item xs={12} md={6}>{field("email", "الايميل الشخصي *", { inputProps: { dir: "ltr", maxLength: 50 } })}</Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={lookups.branches}
                value={branch}
                getOptionLabel={(o) => o?.name || ""}
                isOptionEqualToValue={(a, b) => norm(a.guid) === norm(b.guid)}
                onChange={(_, v) => set("branchGuid", v?.guid || "")}
                renderInput={(params) => <TextField {...params} label="الفرع *" size="small" InputLabelProps={{ shrink: true }} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={lookups.departments}
                value={department}
                getOptionLabel={(o) => o?.name || ""}
                isOptionEqualToValue={(a, b) => norm(a.guid) === norm(b.guid)}
                onChange={(_, v) => set("departmentGuid", v?.guid || "")}
                renderInput={(params) => <TextField {...params} label="القسم / الإدارة *" size="small" InputLabelProps={{ shrink: true }} />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>الوظيفة *</InputLabel>
                <Select value={form.job ?? -1} label="الوظيفة *" notched onChange={(e) => set("job", e.target.value)}>
                  <MenuItem value={-1} disabled>اختر الوظيفة</MenuItem>
                  {lookups.jobs.map((j) => <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>{field("reason", "سبب التعديل *", { multiline: true, minRows: 2 })}</Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ fontWeight: 900, color: accentColor }}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving || loading || !form}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          حفظ التعديل
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== إدراج البدلات (EncodingEmpInstead) =====================
const AllowancesDialog = ({ employee, month, userGuid, onClose, onSaved }) => {
  const open = Boolean(employee);
  const [values, setValues] = useState({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!employee) return;
    setValues(ALLOWANCES.reduce((acc, a) => ({ ...acc, [a.req]: toNum(employee[a.key]) || "" }), {}));
    setNote(employee.otherAllowancesNote || "");
  }, [employee]);

  const total = ALLOWANCES.reduce((sum, a) => sum + toNum(values[a.req]), 0);
  const [year, mon] = month.split("-").map(Number);

  const save = async () => {
    if (ALLOWANCES.some((a) => toNum(values[a.req]) < 0)) {
      showError("قيم البدلات لا يمكن أن تكون بالسالب");
      return;
    }
    try {
      setSaving(true);
      const json = await readJson(
        await fetch(`${API}/${encodeURIComponent(employee.guid)}/allowances`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            year,
            month: mon,
            ...ALLOWANCES.reduce((acc, a) => ({ ...acc, [a.req]: toNum(values[a.req]) }), {}),
            note
          })
        }),
        "تعذر حفظ البدلات"
      );
      await Swal.fire({ icon: json?.result === 1 ? "warning" : "success", title: json?.message || "تم الحفظ", timer: 1600, showConfirmButton: false });
      onSaved();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm" disableEnforceFocus PaperProps={{ sx: { direction: "rtl" } }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg, ${primaryColor}, ${primaryDark})`, display: "flex", alignItems: "center", gap: 1 }}>
        <PaidIcon /> إدراج البدلات — شهر {String(mon).padStart(2, "0")}/{year}
      </DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontWeight: 900, mb: 1.5 }}>{employee?.fullName}</Typography>
        <Grid container spacing={1.5}>
          {ALLOWANCES.map((a) => (
            <Grid item xs={12} sm={6} key={a.req}>
              <TextField
                label={a.label}
                type="number"
                value={values[a.req] ?? ""}
                onChange={(e) => setValues((prev) => ({ ...prev, [a.req]: e.target.value }))}
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: 0, step: "0.01", dir: "ltr" }}
                InputProps={{ endAdornment: <InputAdornment position="end">ر.س</InputAdornment> }}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <TextField label="ملاحظة البدلات" value={note} onChange={(e) => setNote(e.target.value)} size="small" fullWidth multiline minRows={2} InputLabelProps={{ shrink: true }} inputProps={{ maxLength: 500 }} />
          </Grid>
        </Grid>
        <Paper variant="outlined" sx={{ mt: 1.5, p: 1.2, borderRadius: 2, display: "flex", justifyContent: "space-between", fontWeight: 900 }}>
          <span>إجمالي البدلات</span>
          <span dir="ltr">{money(total)} ر.س</span>
        </Paper>
        <Alert severity="info" sx={{ mt: 1.5, fontWeight: 700 }}>
          لو البدلات مسجلة لنفس الشهر قبل كده بتتحدث، والخانة اللي قيمتها صفر بتفضل بقيمتها القديمة (زي الديسكتوب).
        </Alert>
      </DialogContent>
      <DialogActions sx={{ gap: 1 }}>
        <Button onClick={onClose} disabled={saving} sx={{ fontWeight: 900, color: accentColor }}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
        >
          حفظ البدلات
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ===================== الشاشة =====================
const COLUMNS = [
  { key: "code", label: "كود", width: 70 },
  { key: "fullName", label: "اسم الموظف", width: 200, align: "right", bold: true },
  { key: "status", label: "الحالة", width: 80 },
  { key: "branch", label: "الفرع", width: 150, align: "right" },
  { key: "department", label: "القسم/الإدارة", width: 150, align: "right" },
  { key: "job", label: "الوظيفه", width: 150, align: "right" },
  ...ALLOWANCES.map((a) => ({ key: a.key, label: a.label, width: 95, money: true })),
  { key: "totalAllowances", label: "إجمالي البدلات", width: 110, money: true, bold: true },
  { key: "iban", label: "رقم الإيبان", width: 200, ltr: true },
  { key: "mobile", label: "جوال شخصي", width: 115, ltr: true },
  { key: "workMobile", label: "جوال عمل", width: 115, ltr: true },
  { key: "otherAllowancesNote", label: "ملاحظة البدلات", width: 170, align: "right", wrap: true }
];

const cellClass = (c) =>
  [c.align === "right" ? "r" : "", c.ltr || c.money ? "ltr" : "", c.wrap ? "wrap" : "", c.bold ? "b" : ""].filter(Boolean).join(" ");

const cellValue = (row, col) => (col.money ? money(row[col.key]) : row[col.key] || "");

// الصفوف بتترسم على دفعات وإنت بتعمل scroll بدل ما الجدول كله يترسم مرة واحدة.
const PAGE_SIZE = 60;

// صف خفيف (HTML عادي بدل Tooltip/IconButton/Chip لكل صف) ومتعمله memo،
// علشان فتح قايمة الإجراءات أو أي تغيير في الشاشة ما يعيدش رسم كل الصفوف.
const EmployeeRow = memo(({ row, onAction }) => (
  <tr>
    <td className="act">
      <button type="button" className="act-btn" title="الإجراءات" aria-label="الإجراءات" onClick={(e) => onAction(e.currentTarget, row)}>
        <MoreVertIcon fontSize="small" />
      </button>
    </td>
    {COLUMNS.map((c) => (
      <td key={c.key} className={cellClass(c)}>
        {c.key === "status" ? <span className={`status ${row.isActive ? "on" : "off"}`}>{row.status}</span> : cellValue(row, c)}
      </td>
    ))}
  </tr>
));

const HrEmployeeListPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const userGuid = useMemo(() => getUserGuid(), []);
  const [boot, setBoot] = useState({ loading: true, allowed: false, error: "", canEdit: false, jobs: [], branches: [], departments: [] });
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState([]);
  const [loadedMonth, setLoadedMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menu, setMenu] = useState({ anchor: null, row: null });
  const [editRow, setEditRow] = useState(null);
  const [allowRow, setAllowRow] = useState(null);
  const [renderCount, setRenderCount] = useState(PAGE_SIZE);
  const scrollRef = useRef(null);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (!userGuid) {
      setBoot((b) => ({ ...b, loading: false, allowed: false }));
      return;
    }
    fetch(`${API}/bootstrap?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (r.status === 403) return setBoot((b) => ({ ...b, loading: false, allowed: false, error: json?.message || "" }));
        if (!r.ok) throw new Error(json?.message || "تعذر تحميل الشاشة");
        setBoot({
          loading: false,
          allowed: true,
          error: "",
          canEdit: Boolean(json?.canEdit),
          jobs: json?.jobs || [],
          branches: json?.branches || [],
          departments: json?.departments || []
        });
      })
      .catch((e) => setBoot((b) => ({ ...b, loading: false, allowed: false, error: e.message })));
  }, [userGuid]);

  const load = useCallback(async () => {
    const [year, mon] = month.split("-").map(Number);
    if (!year || !mon) return;
    try {
      setLoading(true);
      const json = await readJson(
        await fetch(`${API}?userGuid=${encodeURIComponent(userGuid)}&year=${year}&month=${mon}`, { cache: "no-store" }),
        "تعذر تحميل قائمة الموظفين"
      );
      setRows(Array.isArray(json?.data) ? json.data : []);
      setLoadedMonth(month);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [month, userGuid]);

  // أول فتح: نحمّل الشهر الحالي علطول.
  useEffect(() => {
    if (boot.allowed && !loadedMonth) load();
  }, [boot.allowed, loadedMonth, load]);

  // نص البحث متجهز مرة واحدة لكل صف بدل ما يتحسب مع كل حرف.
  const indexed = useMemo(
    () => rows.map((r) => ({ row: r, text: norm([r.code, r.fullName, r.branch, r.department, r.job, r.mobile, r.workMobile, r.iban].join(" ")) })),
    [rows]
  );

  const visible = useMemo(() => {
    const q = norm(deferredSearch);
    const out = [];
    for (const { row, text } of indexed) {
      if (statusFilter === "active" && !row.isActive) continue;
      if (statusFilter === "inactive" && row.isActive) continue;
      if (q && !text.includes(q)) continue;
      out.push(row);
    }
    return out;
  }, [indexed, deferredSearch, statusFilter]);

  // أي تغيير في الفلتر يرجّع الجدول لأوله.
  useEffect(() => {
    setRenderCount(PAGE_SIZE);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [deferredSearch, statusFilter, loadedMonth]);

  const onScroll = useCallback(
    (e) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 300) {
        setRenderCount((n) => (n < visible.length ? n + PAGE_SIZE : n));
      }
    },
    [visible.length]
  );

  const totals = useMemo(() => {
    const sums = {};
    [...ALLOWANCES.map((a) => a.key), "totalAllowances"].forEach((k) => {
      sums[k] = 0;
    });
    let active = 0;
    for (const r of visible) {
      if (r.isActive) active += 1;
      for (const k in sums) sums[k] += toNum(r[k]);
    }
    return { count: visible.length, active, inactive: visible.length - active, sums };
  }, [visible]);

  const exportExcel = () => {
    if (!visible.length) return;
    const header = COLUMNS.map((c) => c.label);
    const body = visible.map((r) => COLUMNS.map((c) => (c.money ? toNum(r[c.key]) : r[c.key] || "")));
    const footer = COLUMNS.map((c, i) => (i === 0 ? `الإجمالي: ${totals.count}` : c.money ? totals.sums[c.key] : ""));
    const sheet = XLSX.utils.aoa_to_sheet([header, ...body, footer]);
    sheet["!cols"] = COLUMNS.map((c) => ({ wch: Math.max(10, Math.round(c.width / 7)) }));
    const book = XLSX.utils.book_new();
    book.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(book, sheet, "الموظفين");
    XLSX.writeFile(book, `Employees_${(loadedMonth || month).replace("-", "_")}.xlsx`);
  };

  const printList = () => {
    if (!visible.length) return;
    const head = COLUMNS.map((c) => `<th>${escapeHtml(c.label)}</th>`).join("");
    const body = visible
      .map((r) => `<tr>${COLUMNS.map((c) => `<td class="${c.ltr || c.money ? "ltr" : ""}">${escapeHtml(cellValue(r, c))}</td>`).join("")}</tr>`)
      .join("");
    const foot = COLUMNS.map((c, i) =>
      `<td>${i === 0 ? `الإجمالي: ${totals.count}<br>نشط: ${totals.active} — موقوف: ${totals.inactive}` : c.money ? money(totals.sums[c.key]) : ""}</td>`
    ).join("");
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>قائمة الموظفين ${escapeHtml(loadedMonth)}</title>
      <style>
        @page { size: A4 landscape; margin: 8mm; }
        body { font-family: Tahoma, Arial, sans-serif; color: #1b2a23; }
        h1 { font-size: 16px; margin: 0 0 6px; color: ${primaryDark}; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th { background: ${primaryColor}; color: #fff; padding: 4px 3px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        td { border-bottom: 1px solid #dfe9e4; padding: 3px; text-align: center; }
        td.ltr { direction: ltr; }
        tfoot td { font-weight: 900; background: #eef6f2; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style></head><body>
      <h1>قائمة الموظفين — شهر ${escapeHtml(loadedMonth)}</h1>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody><tfoot><tr>${foot}</tr></tfoot></table>
      <script>window.onload = () => { window.print(); };</script></body></html>`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const openMenu = useCallback((anchor, row) => setMenu({ anchor, row }), []);
  const closeMenu = useCallback(() => setMenu((m) => ({ ...m, anchor: null })), []);
  const closeEdit = useCallback(() => setEditRow(null), []);
  const closeAllow = useCallback(() => setAllowRow(null), []);
  const onEditSaved = useCallback(() => {
    setEditRow(null);
    load();
  }, [load]);
  const onAllowSaved = useCallback(() => {
    setAllowRow(null);
    load();
  }, [load]);

  const accent = isDark ? theme.palette.success.light : primaryColor;
  const border = isDark ? alpha("#fff", 0.1) : "#e3ece8";
  const panelSx = { borderRadius: 3, border: `1px solid ${border}`, backgroundColor: "background.paper", backgroundImage: "none" };

  // كل تنسيق الجدول هنا مرة واحدة (CSS) بدل style object لكل خلية.
  const tableSx = useMemo(() => {
    const headBg = isDark ? alpha(theme.palette.success.main, 0.22) : primaryColor;
    const footBg = isDark ? alpha(theme.palette.success.main, 0.14) : "#eef6f2";
    return {
      overflow: "auto",
      maxHeight: "calc(100vh - 330px)",
      minHeight: 300,
      "& table": { borderCollapse: "separate", borderSpacing: 0, minWidth: "100%", fontSize: 13, color: "text.primary" },
      "& th": {
        position: "sticky",
        top: 0,
        zIndex: 2,
        background: isDark ? theme.palette.background.paper : primaryColor,
        backgroundImage: isDark ? `linear-gradient(${headBg}, ${headBg})` : "none",
        color: isDark ? theme.palette.success.light : "#fff",
        padding: "10px 8px",
        whiteSpace: "nowrap",
        fontWeight: 900,
        borderBottom: `1px solid ${border}`
      },
      "& td": { padding: "7px 8px", borderBottom: `1px solid ${border}`, textAlign: "center", whiteSpace: "nowrap", fontWeight: 600 },
      "& td.r": { textAlign: "right" },
      "& td.ltr": { direction: "ltr" },
      "& td.wrap": { whiteSpace: "normal" },
      "& td.b": { fontWeight: 800 },
      "& td.act": { padding: "2px 4px", width: 44 },
      "& tbody tr:nth-of-type(even)": { background: alpha(theme.palette.success.main, isDark ? 0.05 : 0.035) },
      "& tbody tr:hover": { background: alpha(theme.palette.success.main, isDark ? 0.12 : 0.08) },
      "& .act-btn": {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        border: 0,
        borderRadius: "50%",
        background: "transparent",
        color: "inherit",
        cursor: "pointer",
        transition: "background-color .12s"
      },
      "& .act-btn:hover": { background: alpha(theme.palette.success.main, 0.18) },
      "& .status": { display: "inline-block", padding: "1px 10px", borderRadius: 12, fontSize: 12, fontWeight: 800, border: "1px solid currentColor" },
      "& .status.on": { color: accent },
      "& .status.off": { color: isDark ? theme.palette.error.light : accentColor },
      "& tfoot td": {
        position: "sticky",
        bottom: 0,
        background: isDark ? theme.palette.background.paper : footBg,
        backgroundImage: isDark ? `linear-gradient(${footBg}, ${footBg})` : "none",
        fontWeight: 900,
        borderTop: `2px solid ${accent}`,
        borderBottom: 0
      }
    };
  }, [theme, isDark, border, accent]);

  if (boot.loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress sx={{ color: accent }} /></Stack>;
  }

  if (!boot.allowed) {
    return (
      <Box sx={{ p: 3, direction: "rtl" }}>
        <Alert severity="warning" sx={{ fontWeight: 900 }}>{boot.error || "ليس لديك صلاحية على شاشة قائمة الموظفين"}</Alert>
      </Box>
    );
  }

  const stat = (label, value, color) => (
    <Paper elevation={0} sx={{ ...panelSx, p: 1.2, textAlign: "center", flex: 1, minWidth: 130 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ fontSize: 20, fontWeight: 950, color }}>{value}</Typography>
    </Paper>
  );

  // أول تحميل بس اللي بيخفي الجدول؛ إعادة التحميل بعد الحفظ بتسيب الصفوف ظاهرة.
  const firstLoad = loading && rows.length === 0;
  const shown = visible.length > renderCount ? visible.slice(0, renderCount) : visible;

  return (
    <Box sx={{ direction: "rtl", p: { xs: 1, md: 2 } }}>
      <Paper elevation={0} sx={{ ...panelSx, p: { xs: 1.2, md: 2 }, mb: 1.5 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <BadgeIcon sx={{ color: accent, fontSize: 34 }} />
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: "1.2rem", color: accent }}>قائمة الموظفين</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary" }}>
                بيانات الموظفين وبدلات شهر {loadedMonth || month}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <TextField
              type="month"
              label="الشهر"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ width: 170 }}
            />
            <Button
              variant="contained"
              onClick={load}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
            >
              عرض
            </Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!visible.length} sx={{ fontWeight: 900, borderColor: accent, color: accent }}>
              تصدير Excel
            </Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={printList} disabled={!visible.length} sx={{ fontWeight: 900 }}>
              طباعة
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
        {stat("إجمالي الموظفين", totals.count, "text.primary")}
        {stat("نشط", totals.active, accent)}
        {stat("موقوف", totals.inactive, isDark ? theme.palette.error.light : accentColor)}
        {stat("إجمالي البدلات", money(totals.sums.totalAllowances), isDark ? theme.palette.info.light : "#1f4e79")}
      </Stack>

      <Paper elevation={0} sx={{ ...panelSx, overflow: "hidden" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 1.2 }} alignItems={{ sm: "center" }}>
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود أو الفرع أو الجوال..."
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <ToggleButtonGroup exclusive size="small" value={statusFilter} onChange={(_, v) => v && setStatusFilter(v)} sx={{ flexShrink: 0, "& .MuiToggleButton-root": { fontWeight: 800 } }}>
            <ToggleButton value="all">الكل</ToggleButton>
            <ToggleButton value="active">نشط</ToggleButton>
            <ToggleButton value="inactive">موقوف</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box sx={{ height: 3 }}>{loading && !firstLoad ? <LinearProgress color="success" sx={{ height: 3 }} /> : null}</Box>

        <Box ref={scrollRef} onScroll={onScroll} sx={tableSx}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 44 }} />
                {COLUMNS.map((c) => (
                  <th key={c.key} style={{ minWidth: c.width }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firstLoad ? (
                <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 40 }}><CircularProgress size={28} sx={{ color: accent }} /></td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={COLUMNS.length + 1} style={{ padding: 30, color: theme.palette.text.secondary, fontWeight: 700 }}>لا توجد بيانات</td></tr>
              ) : (
                shown.map((r) => <EmployeeRow key={r.guid} row={r} onAction={openMenu} />)
              )}
            </tbody>
            {!firstLoad && visible.length ? (
              <tfoot>
                <tr>
                  <td />
                  {COLUMNS.map((c, i) => (
                    <td key={c.key} style={{ direction: c.money ? "ltr" : undefined }}>
                      {i === 0 ? `الإجمالي: ${totals.count}` : i === 1 ? `نشط: ${totals.active} — موقوف: ${totals.inactive}` : c.money ? money(totals.sums[c.key]) : ""}
                    </td>
                  ))}
                </tr>
              </tfoot>
            ) : null}
          </table>
        </Box>
      </Paper>

      <Menu
        anchorEl={menu.anchor}
        open={Boolean(menu.anchor)}
        onClose={closeMenu}
        transitionDuration={120}
        disableScrollLock
        PaperProps={{ sx: { direction: "rtl", minWidth: 190 } }}
      >
        <MenuItem
          disabled={!boot.canEdit}
          onClick={() => {
            setEditRow(menu.row);
            closeMenu();
          }}
          sx={{ fontWeight: 800, gap: 1 }}
        >
          <EditIcon fontSize="small" sx={{ color: accent }} /> تعديل البيانات
          {!boot.canEdit ? <Typography component="span" sx={{ fontSize: 10, color: "text.secondary" }}>(بدون صلاحية)</Typography> : null}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAllowRow(menu.row);
            closeMenu();
          }}
          sx={{ fontWeight: 800, gap: 1 }}
        >
          <PaidIcon fontSize="small" sx={{ color: isDark ? theme.palette.info.light : "#1f4e79" }} /> إدراج البدلات
        </MenuItem>
      </Menu>

      <EditEmployeeDialog employee={editRow} lookups={boot} userGuid={userGuid} onClose={closeEdit} onSaved={onEditSaved} />
      <AllowancesDialog employee={allowRow} month={loadedMonth || month} userGuid={userGuid} onClose={closeAllow} onSaved={onAllowSaved} />
    </Box>
  );
};

export default HrEmployeeListPage;
