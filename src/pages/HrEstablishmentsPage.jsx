import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
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
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Swal from "sweetalert2";
import ApartmentRoundedIcon from "@mui/icons-material/ApartmentRounded";
import AddBusinessRoundedIcon from "@mui/icons-material/AddBusinessRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import LinkOffRoundedIcon from "@mui/icons-material/LinkOffRounded";
import { SSTLI_API_URL } from "../config/apiUrls";

/*
  شاشة "المنشآت والسجلات التجارية":
  - إضافة/تعديل المنشآت (اسم + سجل تجاري + رقم مميز).
  - تحديد مجموعة موظفين نشطين وربطهم بمنشأة دفعة واحدة، أو فك ربطهم.
  الموظف مربوط بمنشأة واحدة فقط، وتظهر منشأته في ملفات الموظفين.
*/

const API_BASE_URL = SSTLI_API_URL;
const API = `${API_BASE_URL}/api/hr/establishments`;

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const emptyForm = { establishmentGuid: "", establishmentName: "", commercialRegNo: "", distinctiveNo: "", notes: "", isActive: true };

const getCurrentActor = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return {
      guid: user?.guid || user?.Guid || null,
      name: user?.fullName || user?.FullName || user?.userName || user?.UserName || "مستخدم النظام"
    };
  } catch {
    return { guid: null, name: "مستخدم النظام" };
  }
};

const readJson = async (response, fallback) => {
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || json?.error || fallback);
  return json;
};

const norm = (value) => String(value ?? "").trim().toLowerCase();

const showError = (text) =>
  Swal.fire({ icon: "error", title: "خطأ", text, confirmButtonText: "حسنًا", confirmButtonColor: accentColor });

const HrEstablishmentsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const accent = isDark ? theme.palette.success.light : primaryColor;
  const border = isDark ? alpha(theme.palette.success.light, 0.25) : "#d7e8df";

  const [establishments, setEstablishments] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(null);
  const [savingForm, setSavingForm] = useState(false);

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [branchFilter, setBranchFilter] = useState("all");
  const [establishmentFilter, setEstablishmentFilter] = useState("all");
  const [selected, setSelected] = useState(() => new Set());
  const [target, setTarget] = useState("");
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [estResponse, empResponse] = await Promise.all([
        fetch(API, { cache: "no-store" }),
        fetch(`${API_BASE_URL}/api/hr/employees?isActive=true`, { cache: "no-store" })
      ]);
      const estJson = await readJson(estResponse, "تعذر تحميل المنشآت");
      const empJson = await readJson(empResponse, "تعذر تحميل الموظفين");
      setEstablishments(Array.isArray(estJson?.data) ? estJson.data : []);
      setUnassignedCount(Number(estJson?.unassignedCount) || 0);
      setEmployees(Array.isArray(empJson?.data) ? empJson.data : []);
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const branches = useMemo(() => {
    const map = new Map();
    employees.forEach((e) => {
      if (e.branchGuid && !map.has(e.branchGuid)) map.set(e.branchGuid, e.branchName || "غير محدد");
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "ar"));
  }, [employees]);

  const activeEstablishments = useMemo(() => establishments.filter((e) => e.isActive), [establishments]);

  const visible = useMemo(() => {
    const q = norm(deferredSearch);
    return employees.filter((e) => {
      if (branchFilter !== "all" && e.branchGuid !== branchFilter) return false;
      if (establishmentFilter === "none" && e.establishmentGuid) return false;
      if (establishmentFilter !== "all" && establishmentFilter !== "none" && e.establishmentGuid !== establishmentFilter)
        return false;
      if (!q) return true;
      return [e.fullName, e.employeeCode, e.nationalId, e.mobile, e.branchName, e.jobTitle].some((v) => norm(v).includes(q));
    });
  }, [employees, deferredSearch, branchFilter, establishmentFilter]);

  const allVisibleSelected = visible.length > 0 && visible.every((e) => selected.has(e.employeeGuid));

  const toggleOne = (guid) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(guid)) next.delete(guid);
      else next.add(guid);
      return next;
    });

  const toggleAllVisible = () =>
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visible.forEach((e) => next.delete(e.employeeGuid));
      else visible.forEach((e) => next.add(e.employeeGuid));
      return next;
    });

  const saveForm = async () => {
    if (!form) return;
    setSavingForm(true);
    try {
      const actor = getCurrentActor();
      const isEdit = Boolean(form.establishmentGuid);
      const response = await fetch(isEdit ? `${API}/${encodeURIComponent(form.establishmentGuid)}` : API, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, actorUserGuid: actor.guid })
      });
      const json = await readJson(response, "تعذر حفظ المنشأة");
      setForm(null);
      Swal.fire({ icon: "success", title: json?.message || "تم الحفظ", confirmButtonText: "حسنًا", confirmButtonColor: primaryColor });
      load();
    } catch (e) {
      showError(e.message);
    } finally {
      setSavingForm(false);
    }
  };

  const assign = async (unlink) => {
    if (selected.size === 0) return;
    const est = establishments.find((e) => e.establishmentGuid === target);
    if (!unlink && !est) {
      showError("برجاء اختيار المنشأة أولاً");
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: unlink ? "فك ربط الموظفين" : "ربط الموظفين بالمنشأة",
      text: unlink
        ? `سيتم فك ربط ${selected.size} موظف من منشآتهم الحالية.`
        : `سيتم ربط ${selected.size} موظف بمنشأة "${est.establishmentName}"، ومن كان مربوطًا بمنشأة أخرى سينتقل إليها.`,
      showCancelButton: true,
      confirmButtonText: "تأكيد",
      cancelButtonText: "إلغاء",
      confirmButtonColor: unlink ? accentColor : primaryColor,
      cancelButtonColor: "#6b7280"
    });
    if (!confirm.isConfirmed) return;

    setAssigning(true);
    try {
      const actor = getCurrentActor();
      const response = await fetch(`${API}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          establishmentGuid: unlink ? null : target,
          employeeGuids: [...selected],
          changedByUserGuid: actor.guid,
          changedByName: actor.name
        })
      });
      const json = await readJson(response, "تعذر ربط الموظفين");
      setSelected(new Set());
      Swal.fire({ icon: "success", title: json?.message || "تم الحفظ", confirmButtonText: "حسنًا", confirmButtonColor: primaryColor });
      load();
    } catch (e) {
      showError(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const panelSx = { borderRadius: 3, border: `1px solid ${border}`, background: theme.palette.background.paper };

  const tableSx = {
    overflow: "auto",
    maxHeight: "calc(100dvh - 330px)",
    minHeight: 240,
    "& table": { borderCollapse: "separate", borderSpacing: 0, minWidth: "100%", fontSize: 13, color: "text.primary" },
    "& th": {
      position: "sticky",
      top: 0,
      zIndex: 2,
      background: isDark ? theme.palette.background.paper : primaryColor,
      color: isDark ? theme.palette.success.light : "#fff",
      padding: "6px 8px",
      whiteSpace: "nowrap",
      fontWeight: 900,
      borderBottom: `1px solid ${border}`
    },
    "& td": { padding: "4px 8px", borderBottom: `1px solid ${border}`, textAlign: "center", whiteSpace: "nowrap", fontWeight: 600 },
    "& td.r": { textAlign: "right" },
    "& td.ltr": { direction: "ltr" },
    "& tbody tr": { cursor: "pointer" },
    "& tbody tr.sel": { background: alpha(theme.palette.success.main, isDark ? 0.18 : 0.12) },
    "& tbody tr:hover": { background: alpha(theme.palette.success.main, isDark ? 0.12 : 0.08) },
    "& th .MuiCheckbox-root": { color: "inherit" }
  };

  const fieldLabel = (text) => (
    <Box sx={{ fontSize: 12, fontWeight: 800, color: "text.secondary", mb: 0.4 }}>{text}</Box>
  );

  return (
    <Box sx={{ direction: "rtl", p: { xs: 1, md: 2 } }}>
      <Paper elevation={0} sx={{ ...panelSx, p: { xs: 1.2, md: 2 }, mb: 1.5 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <ApartmentRoundedIcon sx={{ color: accent, fontSize: 34 }} />
            <Box>
              <Box sx={{ fontWeight: 950, fontSize: "1.2rem", color: accent }}>المنشآت والسجلات التجارية</Box>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary" }}>
                حدد مجموعة موظفين واربطهم بالسجل التجاري والرقم المميز للمنشأة
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              startIcon={<AddBusinessRoundedIcon />}
              onClick={() => setForm({ ...emptyForm })}
              sx={{ fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
            >
              منشأة جديدة
            </Button>
            <Button
              variant="outlined"
              onClick={load}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              sx={{ fontWeight: 900, borderColor: accent, color: accent }}
            >
              تحديث
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
          gap: 1,
          mb: 1.5
        }}
      >
        {establishments.map((est) => (
          <Paper
            key={est.establishmentGuid}
            elevation={0}
            sx={{ ...panelSx, p: 1.2, opacity: est.isActive ? 1 : 0.6, cursor: "pointer" }}
            onClick={() => setEstablishmentFilter(est.establishmentGuid)}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Box sx={{ minWidth: 0 }}>
                <Box sx={{ fontWeight: 900, fontSize: 15, color: accent }}>{est.establishmentName}</Box>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
                  السجل التجاري: <bdi dir="ltr">{est.commercialRegNo || "-"}</bdi>
                </Typography>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
                  الرقم المميز: <bdi dir="ltr">{est.distinctiveNo || "-"}</bdi>
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  setForm({ ...emptyForm, ...est, commercialRegNo: est.commercialRegNo || "", distinctiveNo: est.distinctiveNo || "", notes: est.notes || "" });
                }}
                sx={{ minWidth: 0, color: accent }}
              >
                <EditOutlinedIcon fontSize="small" />
              </Button>
            </Stack>
            <Stack direction="row" spacing={0.7} sx={{ mt: 0.8 }}>
              <Chip size="small" label={`${est.employeeCount} موظف`} sx={{ fontWeight: 800 }} />
              {!est.isActive && <Chip size="small" color="default" variant="outlined" label="غير مفعلة" />}
            </Stack>
          </Paper>
        ))}
        <Paper
          elevation={0}
          sx={{ ...panelSx, p: 1.2, cursor: "pointer", borderStyle: "dashed" }}
          onClick={() => setEstablishmentFilter("none")}
        >
          <Box sx={{ fontWeight: 900, fontSize: 15, color: isDark ? theme.palette.warning.light : "#b45309" }}>غير مربوطين بمنشأة</Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary" }}>موظفون نشطون بدون سجل تجاري</Typography>
          <Chip size="small" label={`${unassignedCount} موظف`} sx={{ mt: 0.8, fontWeight: 800 }} />
        </Paper>
      </Box>

      <Paper elevation={0} sx={{ ...panelSx, overflow: "hidden" }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ p: 1.2 }} alignItems={{ md: "flex-end" }}>
          <Box sx={{ flex: 2 }}>
            {fieldLabel("بحث")}
            <TextField
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="الاسم أو الكود أو الهوية أو الجوال..."
              size="small"
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            {fieldLabel("الفرع")}
            <Select size="small" fullWidth value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
              <MenuItem value="all">كل الفروع</MenuItem>
              {branches.map(([guid, name]) => (
                <MenuItem key={guid} value={guid}>{name}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ flex: 1 }}>
            {fieldLabel("المنشأة الحالية")}
            <Select size="small" fullWidth value={establishmentFilter} onChange={(e) => setEstablishmentFilter(e.target.value)}>
              <MenuItem value="all">الكل</MenuItem>
              <MenuItem value="none">غير مربوطين</MenuItem>
              {establishments.map((est) => (
                <MenuItem key={est.establishmentGuid} value={est.establishmentGuid}>{est.establishmentName}</MenuItem>
              ))}
            </Select>
          </Box>
        </Stack>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems={{ md: "center" }}
          sx={{ px: 1.2, pb: 1.2 }}
        >
          <Chip
            label={`المحدد: ${selected.size} موظف`}
            color={selected.size ? "success" : "default"}
            sx={{ fontWeight: 900 }}
            onDelete={selected.size ? () => setSelected(new Set()) : undefined}
          />
          <Box sx={{ flex: 1 }} />
          <Select
            size="small"
            displayEmpty
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="" disabled>اختر المنشأة المطلوبة...</MenuItem>
            {activeEstablishments.map((est) => (
              <MenuItem key={est.establishmentGuid} value={est.establishmentGuid}>
                {est.establishmentName}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            disabled={!selected.size || !target || assigning}
            onClick={() => assign(false)}
            startIcon={assigning ? <CircularProgress size={16} color="inherit" /> : <LinkRoundedIcon />}
            sx={{ fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
          >
            ربط المحددين
          </Button>
          <Button
            variant="outlined"
            disabled={!selected.size || assigning}
            onClick={() => assign(true)}
            startIcon={<LinkOffRoundedIcon />}
            sx={{ fontWeight: 900, borderColor: accentColor, color: isDark ? theme.palette.error.light : accentColor }}
          >
            فك الربط
          </Button>
        </Stack>

        <Box sx={tableSx}>
          <table>
            <thead>
              <tr>
                <th style={{ width: 44 }}>
                  <Checkbox
                    size="small"
                    checked={allVisibleSelected}
                    indeterminate={!allVisibleSelected && visible.some((e) => selected.has(e.employeeGuid))}
                    onChange={toggleAllVisible}
                  />
                </th>
                <th>الكود</th>
                <th>اسم الموظف</th>
                <th>رقم الهوية</th>
                <th>الفرع</th>
                <th>المسمى الوظيفي</th>
                <th>المنشأة الحالية</th>
              </tr>
            </thead>
            <tbody>
              {loading && employees.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40 }}><CircularProgress size={28} sx={{ color: accent }} /></td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 30, color: theme.palette.text.secondary, fontWeight: 700 }}>لا توجد نتائج</td></tr>
              ) : (
                visible.map((e) => {
                  const isSel = selected.has(e.employeeGuid);
                  return (
                    <tr key={e.employeeGuid} className={isSel ? "sel" : undefined} onClick={() => toggleOne(e.employeeGuid)}>
                      <td><Checkbox size="small" checked={isSel} /></td>
                      <td>{e.employeeCode}</td>
                      <td className="r">{e.fullName}</td>
                      <td className="ltr">{e.nationalId || "-"}</td>
                      <td>{e.branchName}</td>
                      <td>{e.jobTitle}</td>
                      <td>
                        {e.establishmentName ? (
                          <Chip size="small" label={e.establishmentName} sx={{ fontWeight: 800 }} />
                        ) : (
                          <Box component="span" sx={{ color: "text.disabled" }}>غير مربوط</Box>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>
        <Box sx={{ px: 1.2, py: 0.8, fontSize: 12, fontWeight: 700, color: "text.secondary" }}>
          عدد النتائج: {visible.length}
        </Box>
      </Paper>

      <Dialog open={Boolean(form)} onClose={() => !savingForm && setForm(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl" } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>{form?.establishmentGuid ? "تعديل منشأة" : "منشأة جديدة"}</DialogTitle>
        <DialogContent>
          {form && (
            <Stack spacing={1.4} sx={{ pt: 0.5 }}>
              <Box>
                {fieldLabel("اسم المنشأة *")}
                <TextField size="small" fullWidth value={form.establishmentName} onChange={(e) => setForm({ ...form, establishmentName: e.target.value })} />
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Box sx={{ flex: 1 }}>
                  {fieldLabel("رقم السجل التجاري")}
                  <TextField size="small" fullWidth value={form.commercialRegNo} onChange={(e) => setForm({ ...form, commercialRegNo: e.target.value })} inputProps={{ dir: "ltr" }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  {fieldLabel("الرقم المميز")}
                  <TextField size="small" fullWidth value={form.distinctiveNo} onChange={(e) => setForm({ ...form, distinctiveNo: e.target.value })} inputProps={{ dir: "ltr" }} />
                </Box>
              </Stack>
              <Box>
                {fieldLabel("ملاحظات")}
                <TextField size="small" fullWidth multiline minRows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Box>
              {form.establishmentGuid && (
                <FormControlLabel
                  control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} color="success" />}
                  label="المنشأة مفعلة"
                />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setForm(null)} disabled={savingForm} sx={{ fontWeight: 800, color: "#6b7280" }}>
            إلغاء
          </Button>
          <Button
            variant="contained"
            onClick={saveForm}
            disabled={savingForm}
            startIcon={savingForm ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ fontWeight: 900, color: "#fff", backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
          >
            حفظ
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HrEstablishmentsPage;
