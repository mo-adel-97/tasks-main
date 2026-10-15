import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import * as XLSX from "xlsx";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import RuleFolderOutlinedIcon from "@mui/icons-material/RuleFolderOutlined";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonSearchOutlinedIcon from "@mui/icons-material/PersonSearchOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import {
  CenterLoader,
  EmptyState,
  NoAccess,
  SectionCard,
  SoftChip,
  TaskDetails,
  TasksPageShell,
  confirmAction,
  showError,
  toast
} from "./TasksUi";
import { OVERDUE_COLOR, apiGet, apiPost, isoDate, useTasksPalette } from "./tasksCommon";

// =========================================================
// تقارير المهام
// =========================================================

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

const Kpi = ({ label, value, color }) => {
  const p = useTasksPalette();
  const t = color ? p.tone(color) : null;
  return (
    <SectionCard sx={{ p: 2 }}>
      <Typography sx={{ fontSize: 13, color: p.muted }}>{label}</Typography>
      <Box component="div" style={{ fontSize: 26, lineHeight: 1.35, fontWeight: 700 }} sx={{ color: t ? t.fg : p.text, mt: 0.5 }}>{value}</Box>
    </SectionCard>
  );
};

export const TasksReportsPage = () => {
  const p = useTasksPalette();
  const today = new Date();
  const [fromDate, setFromDate] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [toDate, setToDate] = useState(isoDate(today));
  const [unit, setUnit] = useState(null);
  const [state, setState] = useState({ loading: true, forbidden: "", rows: [], units: [] });
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const params = { fromDate, toDate };
      if (unit?.guid) params.unitGuid = unit.guid;
      const json = await apiGet("/reports", params);
      setState({ loading: false, forbidden: "", rows: json.data || [], units: json.units || [] });
    } catch (e) {
      if (e.status === 403) setState({ loading: false, forbidden: e.message, rows: [], units: [] });
      else {
        setState((s) => ({ ...s, loading: false }));
        showError(e);
      }
    }
  }, [fromDate, toDate, unit]);

  useEffect(() => {
    load();
    // التحميل الأول فقط، وبعدها بزر "عرض"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? state.rows.filter((r) => [r.name, r.jobTitle, r.units].some((v) => String(v || "").toLowerCase().includes(q))) : state.rows;
  }, [state.rows, search]);

  const totals = useMemo(() => rows.reduce((t, r) => ({
    total: t.total + r.total, done: t.done + r.done, onTime: t.onTime + r.doneOnTime, open: t.open + r.openNow, overdue: t.overdue + r.overdueNow
  }), { total: 0, done: 0, onTime: 0, open: 0, overdue: 0 }), [rows]);

  if (state.forbidden) return <NoAccess message={state.forbidden} />;

  const exportExcel = () => {
    const header = ["الموظف", "المسمى الوظيفي", "الوحدة", "إجمالي المهام", "المكتملة", "المنجزة في موعدها", "نسبة الإنجاز %", "نسبة الالتزام بالموعد %", "قيد العمل حاليًا", "المتأخرة حاليًا", "المعتذر عنها", "لم تُفتح", "متوسط مدة التنفيذ (ساعة)"];
    const data = rows.map((r) => [r.name, r.jobTitle, r.units, r.total, r.done, r.doneOnTime, pct(r.done, r.total), pct(r.doneOnTime, r.done), r.openNow, r.overdueNow, r.rejected, r.notSeen, r.avgHours ?? ""]);
    const sheet = XLSX.utils.aoa_to_sheet([header, ...data]);
    sheet["!cols"] = header.map(() => ({ wch: 18 }));
    const book = XLSX.utils.book_new();
    book.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(book, sheet, "تقرير المهام");
    XLSX.writeFile(book, `تقرير_المهام_${fromDate}_${toDate}.xlsx`);
  };

  const th = { position: "sticky", top: 0, zIndex: 1, background: p.section, color: p.text, padding: "10px 12px", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", textAlign: "right", borderBottom: `1px solid ${p.borderStrong}` };
  const td = { padding: "10px 12px", borderBottom: `1px solid ${p.border}`, textAlign: "right", color: p.text, fontSize: 13 };
  const rateColor = (rate) => (rate >= 80 ? "#059669" : rate >= 50 ? "#d97706" : OVERDUE_COLOR);

  return (
    <TasksPageShell icon={<InsightsOutlinedIcon />} title="تقارير المهام" subtitle="مؤشرات الإنجاز والالتزام بالمواعيد للمهام المرسلة خلال الفترة المحددة">
      <SectionCard sx={{ p: 1.5, mb: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4,minmax(0,1fr))" }, gap: 1.25, alignItems: "center" }}>
          <TextField type="date" size="small" label="من تاريخ" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} />
          <TextField type="date" size="small" label="إلى تاريخ" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} />
          <Autocomplete
            options={state.units}
            value={unit}
            onChange={(_, v) => setUnit(v)}
            getOptionLabel={(o) => o?.name || ""}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            renderInput={(params) => <TextField {...params} size="small" label="الوحدة وما يتبعها" InputLabelProps={{ shrink: true }} />}
          />
          <Stack direction="row" spacing={1}>
            <Button variant="contained" disableElevation onClick={load} disabled={state.loading} startIcon={state.loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />} sx={{ flex: 1 }}>عرض</Button>
            <Tooltip title="تصدير Excel">
              <span><Button variant="outlined" onClick={exportExcel} disabled={!rows.length} sx={{ minWidth: 44, px: 1 }}><FileDownloadOutlinedIcon /></Button></span>
            </Tooltip>
          </Stack>
        </Box>
      </SectionCard>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5,minmax(0,1fr))" }, gap: 1.5, mb: 2 }}>
        <Kpi label="إجمالي المهام" value={totals.total} />
        <Kpi label="نسبة الإنجاز" value={`${pct(totals.done, totals.total)}%`} color="#059669" />
        <Kpi label="الالتزام بالموعد" value={`${pct(totals.onTime, totals.done)}%`} color="#2563eb" />
        <Kpi label="قيد العمل حاليًا" value={totals.open} color="#d97706" />
        <Kpi label="المتأخرة حاليًا" value={totals.overdue} color={OVERDUE_COLOR} />
      </Box>

      <SectionCard sx={{ overflow: "hidden" }}>
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${p.border}` }}>
          <TextField size="small" fullWidth value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم الموظف أو المسمى الوظيفي أو الوحدة"
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
        </Box>
        <Box sx={{ overflow: "auto", maxHeight: "calc(100vh - 430px)", minHeight: 260 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1000 }}>
            <thead>
              <tr>
                {["الموظف", "الوحدة", "الإجمالي", "المكتملة", "نسبة الإنجاز", "الالتزام بالموعد", "قيد العمل", "المتأخرة", "المعتذر عنها", "لم تُفتح", "متوسط مدة التنفيذ"].map((h) => <th key={h} style={th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {state.loading ? (
                <tr><td colSpan={11} style={{ ...td, padding: 40, textAlign: "center" }}><CircularProgress size={26} /></td></tr>
              ) : !rows.length ? (
                <tr><td colSpan={11} style={{ ...td, padding: 36, textAlign: "center", color: p.muted }}>لا توجد مهام خلال هذه الفترة</td></tr>
              ) : rows.map((r) => {
                const rate = pct(r.done, r.total);
                return (
                  <tr key={r.userGuid}>
                    <td style={td}><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 12, color: p.muted }}>{r.jobTitle}</div></td>
                    <td style={{ ...td, color: p.muted, fontSize: 12.5 }}>{r.units || "—"}</td>
                    <td style={{ ...td, fontWeight: 600 }}>{r.total}</td>
                    <td style={td}>{r.done}</td>
                    <td style={td}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 64, height: 6, borderRadius: 9, bgcolor: p.hover, overflow: "hidden" }}>
                          <Box sx={{ width: `${rate}%`, height: "100%", bgcolor: rateColor(rate) }} />
                        </Box>
                        <span style={{ fontWeight: 600 }}>{rate}%</span>
                      </Stack>
                    </td>
                    <td style={td}>{r.done ? `${pct(r.doneOnTime, r.done)}%` : "—"}</td>
                    <td style={td}>{r.openNow}</td>
                    <td style={{ ...td, color: r.overdueNow ? p.tone(OVERDUE_COLOR).fg : p.text, fontWeight: r.overdueNow ? 700 : 400 }}>{r.overdueNow}</td>
                    <td style={td}>{r.rejected}</td>
                    <td style={td}>{r.notSeen}</td>
                    <td style={td}>{r.avgHours == null ? "—" : r.avgHours < 1 ? "أقل من ساعة" : `${r.avgHours} ساعة`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      </SectionCard>
    </TasksPageShell>
  );
};

// =========================================================
// صلاحيات إرسال المهام
// =========================================================

const SOURCE_TYPES = {
  Everyone: "جميع الموظفين",
  Managers: "مديرو الوحدات",
  OrgUnit: "أعضاء وحدة محددة",
  JobTitle: "مسمى وظيفي محدد",
  Branch: "موظفو فرع محدد",
  User: "موظف محدد"
};

const TARGET_TYPES = {
  MySubordinates: "جميع التابعين له في الهيكل",
  MyTeam: "فريقه المباشر (وحداته فقط)",
  MyManager: "مديره المباشر",
  MyManagerChain: "جميع المديرين الأعلى منه",
  MyUnit: "زملاؤه في الوحدة نفسها",
  MyBranch: "موظفو فرعه",
  Unit: "وحدة محددة",
  JobTitle: "مسمى وظيفي محدد",
  Branch: "فرع محدد",
  User: "موظف محدد",
  Everyone: "جميع الموظفين"
};

const SOURCE_NEEDS = { OrgUnit: "unit", JobTitle: "job", Branch: "branch", User: "user" };
const TARGET_NEEDS = { Unit: "unit", JobTitle: "job", Branch: "branch", User: "user" };
const NEED_LABEL = { unit: "الوحدة", job: "المسمى الوظيفي", branch: "الفرع", user: "الموظف" };

const EMPTY_RULE = {
  id: null, name: "", sourceType: "Everyone", sourceValue: null, sourceIncludeSubUnits: false,
  targetType: "MyManager", targetValue: null, targetIncludeSubUnits: false,
  allowBroadcast: false, isDeny: false, isActive: true, notes: ""
};

const ValuePicker = ({ kind, value, onChange, lookups }) => {
  const options = kind === "unit" ? lookups.units : kind === "job" ? lookups.jobTitles : kind === "branch" ? lookups.branches : lookups.users;
  const selected = options.find((o) => o.guid?.toLowerCase() === String(value || "").toLowerCase()) || null;
  return (
    <Autocomplete
      options={options}
      value={selected}
      onChange={(_, v) => onChange(v?.guid || null)}
      getOptionLabel={(o) => (o?.jobTitle ? `${o.name} — ${o.jobTitle}` : o?.name || "")}
      isOptionEqualToValue={(a, b) => a.guid === b.guid}
      renderInput={(params) => <TextField {...params} size="small" label={NEED_LABEL[kind]} InputLabelProps={{ shrink: true }} />}
    />
  );
};

const SwitchRow = ({ checked, onChange, title, hint, color }) => {
  const p = useTasksPalette();
  return (
    <FormControlLabel
      sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
      labelPlacement="start"
      control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} color={color} />}
      label={
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{title}</Typography>
          {hint ? <Typography sx={{ fontSize: 12, color: p.muted }}>{hint}</Typography> : null}
        </Box>
      }
    />
  );
};

const RuleDialog = ({ open, rule, onClose, lookups, onSaved }) => {
  const p = useTasksPalette();
  const [r, setR] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setR(rule || EMPTY_RULE); }, [open, rule]);
  const set = (patch) => setR((x) => ({ ...x, ...patch }));

  const save = async () => {
    if (!r.name.trim()) return showError(new Error("يرجى إدخال اسم القاعدة"));
    try {
      setSaving(true);
      await apiPost("/settings/rules", r);
      toast("تم حفظ القاعدة");
      onSaved();
      onClose();
    } catch (e) {
      showError(e);
    } finally {
      setSaving(false);
    }
  };

  const srcNeed = SOURCE_NEEDS[r.sourceType];
  const tgtNeed = TARGET_NEEDS[r.targetType];
  const box = { p: 1.75, borderRadius: 2.5, bgcolor: p.nested };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl", borderRadius: 3, bgcolor: p.card, backgroundImage: "none", ...p.containedSx } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.6, borderBottom: `1px solid ${p.border}` }}>
        <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{r.id ? "تعديل القاعدة" : "قاعدة جديدة"}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: "20px !important" }}>
        <Stack spacing={2}>
          <TextField label="اسم القاعدة" value={r.name} onChange={(e) => set({ name: e.target.value })} helperText="مثال: مديرو الفروع يرسلون إلى قسم الحسابات" InputLabelProps={{ shrink: true }} />
          <Box sx={box}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.25 }}>المُرسِل</Typography>
            <Stack spacing={1.25}>
              <TextField select size="small" label="من يحق له الإرسال" value={r.sourceType} onChange={(e) => set({ sourceType: e.target.value, sourceValue: null })} InputLabelProps={{ shrink: true }}>
                {Object.entries(SOURCE_TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
              {srcNeed ? <ValuePicker kind={srcNeed} value={r.sourceValue} onChange={(v) => set({ sourceValue: v })} lookups={lookups} /> : null}
              {r.sourceType === "OrgUnit" ? (
                <SwitchRow checked={r.sourceIncludeSubUnits} onChange={(v) => set({ sourceIncludeSubUnits: v })} title="تشمل الوحدات التابعة لها" />
              ) : null}
            </Stack>
          </Box>
          <Box sx={box}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1.25 }}>المستلمون</Typography>
            <Stack spacing={1.25}>
              <TextField select size="small" label="إلى من يُرسِل" value={r.targetType} onChange={(e) => set({ targetType: e.target.value, targetValue: null })} InputLabelProps={{ shrink: true }}>
                {Object.entries(TARGET_TYPES).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
              </TextField>
              {tgtNeed ? <ValuePicker kind={tgtNeed} value={r.targetValue} onChange={(v) => set({ targetValue: v })} lookups={lookups} /> : null}
              {r.targetType === "Unit" ? (
                <SwitchRow checked={r.targetIncludeSubUnits} onChange={(v) => set({ targetIncludeSubUnits: v })} title="تشمل الوحدات التابعة لها" />
              ) : null}
            </Stack>
          </Box>
          <Stack spacing={1.5} sx={{ px: 0.5 }}>
            <SwitchRow color="error" checked={r.isDeny} onChange={(v) => set({ isDeny: v, allowBroadcast: v ? false : r.allowBroadcast })}
              title="قاعدة منع" hint="استثناء يمنع الإرسال حتى لو سمحت به قاعدة أخرى" />
            {!r.isDeny ? (
              <SwitchRow checked={r.allowBroadcast} onChange={(v) => set({ allowBroadcast: v })} title="السماح بالإرسال إلى وحدة كاملة" hint="اختيار جميع أعضاء الوحدة دفعة واحدة" />
            ) : null}
            <SwitchRow checked={r.isActive} onChange={(v) => set({ isActive: v })} title="القاعدة مفعّلة" />
          </Stack>
          <TextField label="ملاحظات" value={r.notes || ""} onChange={(e) => set({ notes: e.target.value })} InputLabelProps={{ shrink: true }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.6, borderTop: `1px solid ${p.border}` }}>
        <Button onClick={onClose} color="inherit">إلغاء</Button>
        <Button variant="contained" disableElevation onClick={save} disabled={saving}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
};

export const TasksSettingsPage = () => {
  const p = useTasksPalette();
  const [state, setState] = useState({ loading: true, forbidden: "", rules: [], units: [], jobTitles: [], branches: [], users: [], canEdit: false });
  const [dialog, setDialog] = useState({ open: false, rule: null });
  const [previewUser, setPreviewUser] = useState(null);
  const [preview, setPreview] = useState({ loading: false, data: null });
  const [previewSearch, setPreviewSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const json = await apiGet("/settings");
      setState({ loading: false, forbidden: "", ...json });
    } catch (e) {
      if (e.status === 403) setState((s) => ({ ...s, loading: false, forbidden: e.message }));
      else {
        setState((s) => ({ ...s, loading: false }));
        showError(e);
      }
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runPreview = useCallback(async (user) => {
    setPreviewUser(user);
    setPreviewSearch("");
    if (!user) return setPreview({ loading: false, data: null });
    try {
      setPreview({ loading: true, data: null });
      setPreview({ loading: false, data: await apiGet("/settings/preview", { senderGuid: user.guid }) });
    } catch (e) {
      setPreview({ loading: false, data: null });
      showError(e);
    }
  }, []);

  const nameOf = useCallback((kind, guid) => {
    const list = kind === "unit" ? state.units : kind === "job" ? state.jobTitles : kind === "branch" ? state.branches : state.users;
    return list.find((o) => o.guid?.toLowerCase() === String(guid || "").toLowerCase())?.name || "—";
  }, [state]);

  const describe = (r) => {
    const src = SOURCE_NEEDS[r.sourceType]
      ? `${SOURCE_TYPES[r.sourceType]}: ${nameOf(SOURCE_NEEDS[r.sourceType], r.sourceValue)}${r.sourceIncludeSubUnits ? " (وما يتبعها)" : ""}`
      : SOURCE_TYPES[r.sourceType];
    const tgt = TARGET_NEEDS[r.targetType]
      ? `${TARGET_TYPES[r.targetType]}: ${nameOf(TARGET_NEEDS[r.targetType], r.targetValue)}${r.targetIncludeSubUnits ? " (وما يتبعها)" : ""}`
      : TARGET_TYPES[r.targetType];
    return { src, tgt };
  };

  const remove = async (r) => {
    if (!(await confirmAction(`حذف القاعدة «${r.name}»؟`, "لا يمكن التراجع عن هذا الإجراء.", true))) return;
    try {
      await apiPost("/settings/rules/delete", { id: r.id });
      toast("تم حذف القاعدة");
      load();
      if (previewUser) runPreview(previewUser);
    } catch (e) {
      showError(e);
    }
  };

  const previewList = useMemo(() => {
    const users = preview.data?.users || [];
    const q = previewSearch.trim().toLowerCase();
    return q ? users.filter((u) => [u.name, u.jobTitle, u.units, u.branch].some((v) => String(v || "").toLowerCase().includes(q))) : users;
  }, [preview.data, previewSearch]);

  if (state.loading) return <CenterLoader />;
  if (state.forbidden) return <NoAccess message={state.forbidden} />;

  const lookups = { units: state.units, jobTitles: state.jobTitles, branches: state.branches, users: state.users };
  const allow = p.tone("#059669");
  const deny = p.tone(OVERDUE_COLOR);

  return (
    <TasksPageShell
      icon={<RuleFolderOutlinedIcon />}
      title="صلاحيات إرسال المهام"
      subtitle="تُجمع قواعد السماح لتحديد من يمكن لكل موظف الإرسال إليه، ثم تُستبعد منها قواعد المنع"
      actions={state.canEdit ? <Button variant="contained" disableElevation startIcon={<AddIcon />} onClick={() => setDialog({ open: true, rule: null })}>قاعدة جديدة</Button> : null}
    >
      {!state.canEdit ? <Alert severity="info" sx={{ mb: 2 }}>صلاحيتك على هذه الشاشة للعرض فقط؛ يتطلب التعديل صلاحية «تعديل».</Alert> : null}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0,1.35fr) minmax(0,1fr)" }, gap: 2, alignItems: "start" }}>
        <SectionCard sx={{ overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${p.border}` }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>القواعد ({state.rules.length})</Typography>
          </Box>
          {!state.rules.length ? (
            <Box sx={{ p: 1.5 }}><EmptyState text="لا توجد قواعد" hint="لن يتمكن أي موظف من إرسال المهام قبل إضافة قاعدة واحدة على الأقل" /></Box>
          ) : state.rules.map((r) => {
            const { src, tgt } = describe(r);
            const t = r.isDeny ? deny : allow;
            return (
              <Box key={r.id} sx={{ px: 2, py: 1.75, borderBottom: `1px solid ${p.border}`, "&:last-of-type": { borderBottom: "none" }, opacity: r.isActive ? 1 : 0.55 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                  <Stack direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: t.bg, color: t.fg, display: "grid", placeItems: "center", flexShrink: 0 }}>
                      {r.isDeny ? <BlockIcon fontSize="small" /> : <CheckCircleOutlineIcon fontSize="small" />}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography sx={{ fontWeight: 600, fontSize: 14.5 }}>{r.name}</Typography>
                        {!r.isActive ? <SoftChip label="متوقفة" color="#6b7280" /> : null}
                        {r.allowBroadcast ? <SoftChip label="إرسال لوحدة كاملة" color="#059669" /> : null}
                      </Stack>
                      <Typography sx={{ fontSize: 13, color: p.muted, mt: 0.5, lineHeight: 1.8 }}>
                        <span style={{ color: p.text, fontWeight: 600 }}>{src}</span>
                        {r.isDeny ? " لا يحق لهم الإرسال إلى " : " يحق لهم الإرسال إلى "}
                        <span style={{ color: p.text, fontWeight: 600 }}>{tgt}</span>
                      </Typography>
                      {r.notes ? <Typography sx={{ fontSize: 12, color: p.muted, mt: 0.25 }}>{r.notes}</Typography> : null}
                    </Box>
                  </Stack>
                  {state.canEdit ? (
                    <Stack direction="row" sx={{ flexShrink: 0 }}>
                      <Tooltip title="تعديل"><IconButton size="small" onClick={() => setDialog({ open: true, rule: r })}><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="حذف"><IconButton size="small" color="error" onClick={() => remove(r)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                    </Stack>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </SectionCard>

        <SectionCard sx={{ p: 2, position: { lg: "sticky" }, top: 12 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <PersonSearchOutlinedIcon sx={{ color: p.primary }} />
            <Typography sx={{ fontWeight: 700, fontSize: 15 }}>معاينة الصلاحيات</Typography>
          </Stack>
          <Typography sx={{ fontSize: 13, color: p.muted, mb: 1.5 }}>اختر موظفًا لمعرفة من يمكنه إرسال المهام إليهم وفق القواعد الحالية.</Typography>
          <Autocomplete
            options={state.users}
            value={previewUser}
            onChange={(_, v) => runPreview(v)}
            getOptionLabel={(o) => (o?.jobTitle ? `${o.name} — ${o.jobTitle}` : o?.name || "")}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            renderInput={(params) => <TextField {...params} size="small" placeholder="اختر موظفًا" />}
          />
          {preview.loading ? <CenterLoader /> : preview.data ? (
            <Box sx={{ mt: 1.75 }}>
              <Stack direction="row" spacing={0.75} sx={{ mb: 1.25 }} flexWrap="wrap" useFlexGap>
                <SoftChip label={`يمكنه الإرسال إلى ${preview.data.users.length} موظف`} color="#059669" />
                <SoftChip label={preview.data.canBroadcast ? `الإرسال لوحدة كاملة: مسموح (${preview.data.unitCount} وحدة)` : "الإرسال لوحدة كاملة: غير مسموح"} color="#64748b" />
              </Stack>
              <TextField size="small" fullWidth value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} placeholder="ابحث في النتائج"
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} sx={{ mb: 1 }} />
              <Box sx={{ maxHeight: 420, overflow: "auto", borderRadius: 2, border: `1px solid ${p.border}` }}>
                {previewList.map((u) => (
                  <Box key={u.guid} sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${p.border}`, "&:last-of-type": { borderBottom: "none" } }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{u.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: p.muted }}>{[u.jobTitle, u.units || u.branch].filter(Boolean).join(" · ")}</Typography>
                  </Box>
                ))}
                {!previewList.length ? <Typography sx={{ color: p.muted, py: 3, textAlign: "center", fontSize: 13 }}>لا توجد نتائج</Typography> : null}
              </Box>
            </Box>
          ) : null}
        </SectionCard>
      </Box>

      <RuleDialog open={dialog.open} rule={dialog.rule} onClose={() => setDialog({ open: false, rule: null })} lookups={lookups}
        onSaved={() => { load(); if (previewUser) runPreview(previewUser); }} />
    </TasksPageShell>
  );
};

// =========================================================
// صفحة مهمة مستقلة (من الإشعارات)
// =========================================================

export const TaskViewPage = () => {
  const { taskGuid } = useParams();
  return (
    <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
      <SectionCard sx={{ maxWidth: 860, mx: "auto", overflow: "hidden", minHeight: "75vh", display: "flex", flexDirection: "column" }}>
        <TaskDetails taskGuid={taskGuid} />
      </SectionCard>
    </Box>
  );
};
