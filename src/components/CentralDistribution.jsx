// التوزيع المركزي لمسؤولي الاتصال (متابعة السداد).
// مشرف الفرع بيحدد المسؤولين بس، وصاحب صلاحية "توزيع مسئولي الاتصال المركزي" بيوزع لكل فرع لوحده
// بنفس شروط التوزيع الحالية + كل فئة التزام بالسداد بتتوزع على المسؤولين بالتساوي (من جديد كل مرة).
// من المعاينة قبل التنفيذ: استثناء دفعات/تخصصات (مسؤولهم بيتشال)، تثبيت طلاب على مسؤولهم لحد تاريخ،
// ونقل طلاب من مسؤول لمسؤول.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HubIcon from "@mui/icons-material/Hub";
import PreviewIcon from "@mui/icons-material/Preview";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PushPinIcon from "@mui/icons-material/PushPin";
import RefreshIcon from "@mui/icons-material/Refresh";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Swal from "sweetalert2";

const GREEN = "#057546";
const GREEN_DARK = "#034d31";
const EMPTY_GUID = "00000000-0000-0000-0000-000000000000";

// ألوان فئات الالتزام (فاتح / غامق)
const CATEGORY_TONES = {
  committed: ["#15803d", "#86efac"],
  partial: ["#0f766e", "#5eead4"],
  weak: ["#b45309", "#fcd34d"],
  none: ["#b91c1c", "#fca5a5"],
  new: ["#1d4ed8", "#93c5fd"],
  paidoff: ["#6b21a8", "#d8b4fe"]
};

const fmt = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const sameGuid = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();

async function requestJson(url, options) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message || "تعذر الاتصال بالخادم");
  return json;
}

const postJson = (url, body) =>
  requestJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function useCentralDistribution({ apiBase, userGuid }) {
  const [state, setState] = useState({ canCentral: false, enabled: false });

  useEffect(() => {
    if (!userGuid) return undefined;
    let alive = true;
    requestJson(`${apiBase}/api/payment-follow/central/me?userGuid=${encodeURIComponent(userGuid)}`)
      .then((json) => alive && setState({ canCentral: Boolean(json?.canCentral), enabled: Boolean(json?.enabled) }))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [apiBase, userGuid]);

  return state;
}

function CategoryChip({ category, count, dark }) {
  const tone = CATEGORY_TONES[category.key] || ["#475569", "#cbd5e1"];
  const color = dark ? tone[1] : tone[0];
  return (
    <Chip
      size="small"
      label={count === undefined ? category.label : `${category.label}: ${count}`}
      sx={{ fontFamily: "Cairo", fontWeight: 800, color, bgcolor: `${color}1f`, border: `1px solid ${color}55` }}
    />
  );
}

export function CentralDistributionDialog({ open, onClose, apiBase, userGuid, onExecuted }) {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const [branches, setBranches] = useState([]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  // خيارات المعاينة
  const [excludedBatches, setExcludedBatches] = useState([]);
  const [excludedDiploms, setExcludedDiploms] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [selected, setSelected] = useState({});
  const [filters, setFilters] = useState({ q: "", current: "", planned: "", category: "", batch: "" });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [moveTarget, setMoveTarget] = useState("");
  const [pinUntil, setPinUntil] = useState("");

  const loadBranches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const json = await requestJson(`${apiBase}/api/payment-follow/central/branches?userGuid=${encodeURIComponent(userGuid)}`);
      setBranches(Array.isArray(json?.data) ? json.data : []);
      setPeriodLabel(json?.periodLabel || "");
      if (json?.enabled === false) setError("التوزيع متوقف حاليًا من إعدادات الخادم");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiBase, userGuid]);

  const resetPreviewState = () => {
    setPreview(null);
    setExcludedBatches([]);
    setExcludedDiploms([]);
    setOverrides({});
    setSelected({});
    setFilters({ q: "", current: "", planned: "", category: "", batch: "" });
    setPage(0);
    setMoveTarget("");
    setPinUntil("");
  };

  useEffect(() => {
    if (open) {
      setBranch(null);
      resetPreviewState();
      loadBranches();
    }
  }, [open, loadBranches]);

  const requestBody = (row, extra = {}) => ({
    userGuid,
    branchGuid: row.guid,
    branchName: row.name,
    excludedBatches,
    excludedDiploms,
    overrides,
    ...extra
  });

  const runPreview = async (row, extra = {}) => {
    setBusy(true);
    try {
      const json = await postJson(`${apiBase}/api/payment-follow/central/preview`, requestBody(row, extra));
      setPreview(json?.data || null);
      setSelected({});
      return true;
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذر تجهيز المعاينة", text: e.message, confirmButtonText: "حسنًا" });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openPreview = async (row) => {
    resetPreviewState();
    setBranch(row);
    const okPreview = await runPreview(row, { excludedBatches: [], excludedDiploms: [], overrides: {} });
    if (!okPreview) setBranch(null);
  };

  // ---------- مشتقات المعاينة ----------
  const trainers = useMemo(() => preview?.trainers || [], [preview]);
  const categoryByKey = useMemo(() => Object.fromEntries((preview?.categories || []).map((c) => [c.key, c])), [preview]);

  const students = useMemo(
    () => (preview?.students || []).map((s) => ({ ...s, effectiveTrainer: overrides[s.id] || s.trainerGuid, pendingOverride: Boolean(overrides[s.id]) || s.overridden })),
    [preview, overrides]
  );

  const matrix = useMemo(() => {
    const result = {};
    trainers.forEach((t) => {
      result[t.guid] = { total: 0 };
    });
    students.forEach((s) => {
      const key = trainers.find((t) => sameGuid(t.guid, s.effectiveTrainer))?.guid;
      if (!key) return;
      result[key][s.category] = (result[key][s.category] || 0) + 1;
      result[key].total += 1;
    });
    return result;
  }, [students, trainers]);

  const currentTrainers = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      if (s.currentTrainerGuid && !sameGuid(s.currentTrainerGuid, EMPTY_GUID)) map.set(String(s.currentTrainerGuid).toLowerCase(), s.currentTrainerName || "—");
    });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "ar"));
  }, [students]);

  const batches = useMemo(() => [...new Set(students.map((s) => s.batch || ""))].sort(), [students]);

  const visible = useMemo(() => {
    const q = filters.q.trim();
    return students.filter((s) =>
      (!q || (s.name || "").includes(q) || (s.nationalId || "").includes(q)) &&
      (!filters.current || (filters.current === "none" ? sameGuid(s.currentTrainerGuid, EMPTY_GUID) || !s.currentTrainerGuid : sameGuid(s.currentTrainerGuid, filters.current))) &&
      (!filters.planned || sameGuid(s.effectiveTrainer, filters.planned)) &&
      (!filters.category || s.category === filters.category) &&
      (!filters.batch || (s.batch || "") === filters.batch)
    );
  }, [students, filters]);

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);
  const pageRows = visible.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const setFilter = (key) => (e) => {
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));
    setPage(0);
  };

  // ---------- الإجراءات ----------
  const setOverride = (id, trainerGuid) => {
    const original = preview?.students?.find((s) => s.id === id)?.trainerGuid;
    setOverrides((prev) => {
      const next = { ...prev };
      if (sameGuid(original, trainerGuid) && !preview?.students?.find((s) => s.id === id)?.overridden) delete next[id];
      else next[id] = trainerGuid;
      return next;
    });
  };

  const moveSelected = () => {
    if (!moveTarget || !selectedIds.length) return;
    setOverrides((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        next[id] = moveTarget;
      });
      return next;
    });
    setSelected({});
  };

  const applyExclusions = () => runPreview(branch);

  // الاستثناء بيتطبق على المعاينة فورًا
  const changeExcludedBatches = (names) => {
    setExcludedBatches(names);
    runPreview(branch, { excludedBatches: names });
  };
  const changeExcludedDiploms = (names) => {
    setExcludedDiploms(names);
    runPreview(branch, { excludedDiploms: names });
  };

  const pinSelected = async () => {
    if (!pinUntil || !selectedIds.length) return;
    setBusy(true);
    try {
      const json = await postJson(`${apiBase}/api/payment-follow/central/pins`, { userGuid, branchGuid: branch.guid, studentLevelGuids: selectedIds, until: pinUntil });
      setOverrides((prev) => {
        const next = { ...prev };
        selectedIds.forEach((id) => delete next[id]);
        return next;
      });
      setBusy(false);
      await Swal.fire({ icon: "success", title: "تم التثبيت", text: json?.message, confirmButtonText: "حسنًا" });
      await runPreview(branch, { overrides: Object.fromEntries(Object.entries(overrides).filter(([id]) => !selectedIds.includes(id))) });
    } catch (e) {
      setBusy(false);
      await Swal.fire({ icon: "error", title: "تعذر التثبيت", text: e.message, confirmButtonText: "حسنًا" });
    }
  };

  const unpin = async (ids) => {
    if (!ids.length) return;
    setBusy(true);
    try {
      await postJson(`${apiBase}/api/payment-follow/central/pins/remove`, { userGuid, branchGuid: branch.guid, studentLevelGuids: ids });
      setBusy(false);
      await runPreview(branch);
    } catch (e) {
      setBusy(false);
      await Swal.fire({ icon: "error", title: "تعذر إلغاء التثبيت", text: e.message, confirmButtonText: "حسنًا" });
    }
  };

  const execute = async () => {
    if (!branch || !preview) return;
    const overrideCount = Object.keys(overrides).length;
    const confirm = await Swal.fire({
      icon: "question",
      title: branch.executed ? "إعادة التوزيع المركزي" : "تنفيذ التوزيع المركزي",
      html: `سيتم توزيع <b>${students.length}</b> طالب في <b>${branch.name}</b> على <b>${trainers.length}</b> من مسؤولي الاتصال` +
        (overrideCount ? `، منهم <b>${overrideCount}</b> بتعديل يدوي` : "") + ".<br/>" +
        (preview.excludedCount ? `سيُزال مسؤول الاتصال عن <b>${preview.excludedCount}</b> طالب مستثنى.<br/>` : "") +
        (preview.paidOffCount ? `سيُزال مسؤول الاتصال عن <b>${preview.paidOffCount}</b> طالب مسدد بالكامل.<br/>` : "") +
        (preview.pinnedCount ? `<b>${preview.pinnedCount}</b> طالب مثبّت سيبقى مع مسؤوله.<br/>` : "") +
        (branch.executed
          ? "<b style='color:#b91c1c'>تم توزيع هذا الفرع بالفعل هذا الشهر، وسيُستبدل التوزيع السابق بالتوزيع الجديد.</b>"
          : "لا يمكن تنفيذ توزيع الفرع مرة أخرى خلال الشهر إلا بإعادة التوزيع."),
      showCancelButton: true,
      confirmButtonText: "تنفيذ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: GREEN
    });
    if (!confirm.isConfirmed) return;
    setBusy(true);
    try {
      const json = await postJson(`${apiBase}/api/payment-follow/central/execute`, requestBody(branch, { redistribute: Boolean(branch.executed) }));
      setBusy(false);
      await Swal.fire({ icon: "success", title: "تم التوزيع", text: json?.message, confirmButtonText: "حسنًا" });
      const done = branch;
      setBranch(null);
      resetPreviewState();
      await loadBranches();
      onExecuted?.(done);
    } catch (e) {
      // انقطاع الاتصال (Failed to fetch) مش معناه إن التنفيذ فشل: نسأل السيرفر عن حالة الفرع
      if (e instanceof TypeError) {
        const json = await requestJson(`${apiBase}/api/payment-follow/central/branches?userGuid=${encodeURIComponent(userGuid)}`).catch(() => null);
        const row = (json?.data || []).find((x) => sameGuid(x.guid, branch.guid));
        setBusy(false);
        // توزيع جديد: الحالة بتقول اتنفذ ولا لأ. إعادة التوزيع: الفرع كان متوزع أصلًا فمانقدرش نعرف من الحالة.
        const doneNow = !branch.executed && row?.executed;
        await Swal.fire({
          icon: doneNow ? "success" : "warning",
          title: "انقطع الاتصال أثناء الانتظار",
          text: doneNow
            ? "توزيع هذا الفرع تم تنفيذه بنجاح على الخادم."
            : "قد يكون التنفيذ اكتمل أو ما زال جاريًا على الخادم. انتظر دقيقة ثم تحقق من الطلاب في متابعة السداد أو من حالة الفرع قبل إعادة المحاولة.",
          confirmButtonText: "حسنًا"
        });
        const done = branch;
        setBranch(null);
        resetPreviewState();
        await loadBranches();
        if (doneNow) onExecuted?.(done);
        return;
      }
      setBusy(false);
      await Swal.fire({ icon: "error", title: "تعذر تنفيذ التوزيع", text: e.message, confirmButtonText: "حسنًا" });
    }
  };

  const headSx = { "& th": { fontFamily: "Cairo", fontWeight: 900, whiteSpace: "nowrap", bgcolor: dark ? "rgba(103,201,157,.12)" : "rgba(5,117,70,.07)" } };
  const cellSx = { fontFamily: "Cairo" };
  const boxSx = { p: 1.5, mb: 2, borderRadius: 3, border: `1px solid ${dark ? "rgba(103,201,157,.25)" : "rgba(5,117,70,.15)"}`, bgcolor: dark ? "rgba(103,201,157,.05)" : "#f8fcfa" };
  const titleSx = { fontFamily: "Cairo", fontWeight: 900, color: dark ? "#8fe0b8" : GREEN_DARK };
  const facetLabel = (f) => `${f.name || "بدون"} (${f.count})`;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: 4, direction: "rtl", overflow: "hidden" } }}>
      <DialogTitle sx={{ p: 2, color: "#fff", background: `linear-gradient(135deg,${GREEN} 0%,${GREEN_DARK} 100%)`, borderBottom: "4px solid #d7a51f", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <HubIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography sx={{ fontFamily: "Cairo", fontWeight: 900 }}>التوزيع المركزي لمسؤولي الاتصال</Typography>
            <Typography sx={{ fontFamily: "Cairo", fontSize: "0.8rem", color: "rgba(255,255,255,.85)" }}>
              {branch ? `معاينة التوزيع قبل التنفيذ — ${branch.name}` : `الشهر ${periodLabel || ""} — اختر الفرع للمعاينة والتوزيع`}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose} disabled={busy} sx={{ color: "#fff" }} aria-label="إغلاق"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.2, minHeight: 360, position: "relative" }}>
        {error ? <Alert severity="warning" sx={{ mb: 2, fontFamily: "Cairo", fontWeight: 700 }}>{error}</Alert> : null}

        {!branch ? (
          <>
            <Paper elevation={0} sx={boxSx}>
              <Typography sx={titleSx}>قواعد التوزيع المركزي</Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.85rem", mt: 0.5, lineHeight: 1.9, color: "text.secondary" }}>
                يتم التوزيع من جديد على مسؤولي الاتصال الذين حددهم مشرف كل فرع، وبنفس شروط التوزيع الحالية (طلاب الدبلوم، الأساسي 100% والمتعاون 50%).
                ويُقسَّم الطلاب حسب الالتزام بالسداد في آخر 3 أشهر (أو منذ بداية الطالب إن كانت أحدث)، وتُوزَّع كل فئة على المسؤولين بالتساوي.
                والمسددون بالكامل لا يدخلون التوزيع ويُزال عنهم مسؤول الاتصال.
                ومن المعاينة يمكنك استثناء دفعات أو تخصصات، وتثبيت طلاب على مسؤولهم حتى تاريخ معين، ونقل طلاب بين المسؤولين قبل التنفيذ.
              </Typography>
            </Paper>

            {loading ? (
              <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(5,117,70,.12)"}` }}>
                <Table size="small">
                  <TableHead sx={headSx}>
                    <TableRow>
                      <TableCell>الفرع</TableCell>
                      <TableCell align="center">أساسي</TableCell>
                      <TableCell align="center">متعاون</TableCell>
                      <TableCell>آخر تحديد</TableCell>
                      <TableCell align="center">الحالة</TableCell>
                      <TableCell align="center">إجراء</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {branches.map((row) => {
                      const ready = row.trainerCount > 0;
                      return (
                        <TableRow key={row.guid} hover>
                          <TableCell sx={{ ...cellSx, fontWeight: 800 }}>{row.name}</TableCell>
                          <TableCell align="center" sx={cellSx}>{row.primaryCount || "—"}</TableCell>
                          <TableCell align="center" sx={cellSx}>{row.collaboratorCount || "—"}</TableCell>
                          <TableCell sx={{ ...cellSx, fontSize: "0.8rem", color: "text.secondary" }}>
                            {row.updatedBy ? `${row.updatedBy} — ${fmt(row.updatedAt)}` : "—"}
                          </TableCell>
                          <TableCell align="center">
                            {row.executed ? (
                              <Chip size="small" icon={<TaskAltIcon />} label="تم التوزيع هذا الشهر" color="success" variant="outlined" sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
                            ) : row.trainerCount > 0 ? (
                              <Chip size="small" label="جاهز للتوزيع" color="info" variant="outlined" sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
                            ) : (
                              <Chip size="small" label="لم يحدد المشرف المسؤولين" variant="outlined" sx={{ fontFamily: "Cairo", fontWeight: 700 }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Button size="small" variant="contained" startIcon={<PreviewIcon />} disabled={!ready || busy} onClick={() => openPreview(row)} sx={{ fontFamily: "Cairo", fontWeight: 900, bgcolor: GREEN, "&:hover": { bgcolor: GREEN_DARK } }}>
                              {row.executed ? "معاينة وإعادة التوزيع" : "معاينة"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        ) : !preview ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress />
            <Typography sx={{ fontFamily: "Cairo", mt: 1.5, color: "text.secondary" }}>جارٍ حساب الالتزام بالسداد وتجهيز معاينة التوزيع...</Typography>
          </Box>
        ) : (
          <>
            {busy ? (
              <Box sx={{ position: "absolute", inset: 0, zIndex: 5, display: "grid", placeItems: "center", bgcolor: dark ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.55)" }}>
                <CircularProgress />
              </Box>
            ) : null}

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip label={`الشهر: ${preview.periodLabel}`} sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
              <Chip label={`سيتم توزيعهم: ${students.length}`} color="primary" sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
              <Chip label={`مسؤولو الاتصال: ${trainers.length}`} color="success" sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
              {preview.pinnedCount ? <Chip icon={<PushPinIcon />} label={`مثبّتون: ${preview.pinnedCount}`} color="secondary" sx={{ fontFamily: "Cairo", fontWeight: 800 }} /> : null}
              {preview.excludedCount ? <Chip label={`مستثنون (سيُزال مسؤولهم): ${preview.excludedCount}`} color="error" sx={{ fontFamily: "Cairo", fontWeight: 800 }} /> : null}
              {preview.paidOffCount ? <Chip label={`مسددون بالكامل (خارج التوزيع وسيُزال مسؤولهم): ${preview.paidOffCount}`} color="error" variant="outlined" sx={{ fontFamily: "Cairo", fontWeight: 800 }} /> : null}
              {Object.keys(overrides).length ? <Chip icon={<SwapHorizIcon />} label={`تعديل يدوي: ${Object.keys(overrides).length}`} color="warning" sx={{ fontFamily: "Cairo", fontWeight: 800 }} /> : null}
              {preview.fixedAssignmentCount > 0 ? <Chip label={`مثبتون من ملف الإكسيل: ${preview.fixedAssignmentCount}`} color="warning" variant="outlined" sx={{ fontFamily: "Cairo", fontWeight: 800 }} /> : null}
            </Stack>

            {/* الاستثناء من التوزيع */}
            <Paper elevation={0} sx={boxSx}>
              <Typography sx={titleSx}>استثناء من التوزيع</Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.8rem", color: "text.secondary", mb: 1 }}>
                الطلاب المستثنون لا يدخلون التوزيع، ويُزال عنهم مسؤول الاتصال عند التنفيذ. تتحدث المعاينة تلقائيًا عند الاختيار.
              </Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={preview.facets?.batches || []}
                  getOptionLabel={facetLabel}
                  value={(preview.facets?.batches || []).filter((f) => excludedBatches.includes(f.name))}
                  onChange={(_, value) => changeExcludedBatches(value.map((f) => f.name))}
                  isOptionEqualToValue={(a, b) => a.name === b.name}
                  renderInput={(params) => <TextField {...params} label="الدفعات المستثناة" />}
                  sx={{ flex: 1, minWidth: 260 }}
                />
                <Autocomplete
                  multiple
                  size="small"
                  options={preview.facets?.diploms || []}
                  getOptionLabel={facetLabel}
                  value={(preview.facets?.diploms || []).filter((f) => excludedDiploms.includes(f.name))}
                  onChange={(_, value) => changeExcludedDiploms(value.map((f) => f.name))}
                  isOptionEqualToValue={(a, b) => a.name === b.name}
                  renderInput={(params) => <TextField {...params} label="التخصصات المستثناة" />}
                  sx={{ flex: 1, minWidth: 260 }}
                />
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={applyExclusions} disabled={busy} sx={{ fontFamily: "Cairo", fontWeight: 900, whiteSpace: "nowrap" }}>
                  تحديث المعاينة
                </Button>
              </Stack>
            </Paper>

            {/* التوزيع حسب الفئات */}
            <Typography sx={{ ...titleSx, mb: 1 }}>التوزيع حسب الالتزام بالسداد</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 1.2 }}>
              {preview.categories.map((c) => <CategoryChip key={c.key} category={c} count={c.totalStudents} dark={dark} />)}
            </Stack>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(5,117,70,.12)"}`, mb: 2 }}>
              <Table size="small">
                <TableHead sx={headSx}>
                  <TableRow>
                    <TableCell>مسؤول الاتصال</TableCell>
                    <TableCell align="center">النوع</TableCell>
                    {preview.categories.map((c) => <TableCell key={c.key} align="center">{c.label}</TableCell>)}
                    <TableCell align="center">الإجمالي</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainers.map((t) => (
                    <TableRow key={t.guid} hover>
                      <TableCell sx={{ ...cellSx, fontWeight: 800 }}>{t.name}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={t.roleLabel} color={t.role === "primary" ? "success" : "warning"} variant="outlined" sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
                      </TableCell>
                      {preview.categories.map((c) => <TableCell key={c.key} align="center" sx={cellSx}>{matrix[t.guid]?.[c.key] || 0}</TableCell>)}
                      <TableCell align="center" sx={{ ...cellSx, fontWeight: 900 }}>{matrix[t.guid]?.total || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* الطلاب: تعديل يدوي + تثبيت */}
            <Paper elevation={0} sx={boxSx}>
              <Typography sx={titleSx}>طلاب التوزيع — تعديل يدوي وتثبيت</Typography>
              <Typography sx={{ fontFamily: "Cairo", fontSize: "0.8rem", color: "text.secondary", mb: 1.2 }}>
                غيّر مسؤول الاتصال لأي طالب، أو حدد طلابًا (بالفلاتر أو يدويًا) لنقلهم لمسؤول آخر أو لتثبيتهم على مسؤولهم الحالي حتى تاريخ معين.
              </Typography>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={1} sx={{ mb: 1.2 }} useFlexGap flexWrap="wrap">
                <TextField size="small" label="بحث بالاسم أو الهوية" value={filters.q} onChange={setFilter("q")} sx={{ minWidth: 200 }} />
                <TextField select size="small" label="المسؤول الحالي" value={filters.current} onChange={setFilter("current")} sx={{ minWidth: 180 }}>
                  <MenuItem value="">الكل</MenuItem>
                  <MenuItem value="none">بدون مسؤول</MenuItem>
                  {currentTrainers.map(([guid, name]) => <MenuItem key={guid} value={guid}>{name}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="المسؤول بعد التوزيع" value={filters.planned} onChange={setFilter("planned")} sx={{ minWidth: 180 }}>
                  <MenuItem value="">الكل</MenuItem>
                  {trainers.map((t) => <MenuItem key={t.guid} value={t.guid}>{t.name}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="فئة الالتزام" value={filters.category} onChange={setFilter("category")} sx={{ minWidth: 160 }}>
                  <MenuItem value="">الكل</MenuItem>
                  {preview.categories.map((c) => <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>)}
                </TextField>
                <TextField select size="small" label="الدفعة" value={filters.batch} onChange={setFilter("batch")} sx={{ minWidth: 140 }}>
                  <MenuItem value="">الكل</MenuItem>
                  {batches.map((b) => <MenuItem key={b} value={b}>{b || "بدون"}</MenuItem>)}
                </TextField>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }} sx={{ mb: 1.2 }} useFlexGap flexWrap="wrap">
                <Chip label={`الظاهر: ${visible.length}`} sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
                <Chip label={`المحدد: ${selectedIds.length}`} color={selectedIds.length ? "secondary" : "default"} sx={{ fontFamily: "Cairo", fontWeight: 800 }} />
                <Button size="small" onClick={() => setSelected(Object.fromEntries(visible.map((s) => [s.id, true])))} disabled={!visible.length} sx={{ fontFamily: "Cairo", fontWeight: 900 }}>تحديد كل الظاهرين</Button>
                <Button size="small" color="error" onClick={() => setSelected({})} disabled={!selectedIds.length} sx={{ fontFamily: "Cairo", fontWeight: 900 }}>إلغاء التحديد</Button>
                <Box sx={{ flex: 1 }} />
                <TextField select size="small" label="نقل المحددين إلى" value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)} sx={{ minWidth: 190 }}>
                  {trainers.map((t) => <MenuItem key={t.guid} value={t.guid}>{t.name}</MenuItem>)}
                </TextField>
                <Button size="small" variant="outlined" color="warning" startIcon={<SwapHorizIcon />} onClick={moveSelected} disabled={!moveTarget || !selectedIds.length} sx={{ fontFamily: "Cairo", fontWeight: 900 }}>نقل</Button>
                <TextField type="date" size="small" label="تثبيت حتى" value={pinUntil} onChange={(e) => setPinUntil(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }} />
                <Button size="small" variant="outlined" color="secondary" startIcon={<PushPinIcon />} onClick={pinSelected} disabled={!pinUntil || !selectedIds.length || busy} sx={{ fontFamily: "Cairo", fontWeight: 900 }}>
                  تثبيت على المسؤول الحالي
                </Button>
              </Stack>

              <TableContainer sx={{ maxHeight: 440, borderRadius: 2, border: `1px solid ${dark ? "rgba(255,255,255,.1)" : "rgba(5,117,70,.12)"}` }}>
                <Table size="small" stickyHeader>
                  <TableHead sx={headSx}>
                    <TableRow>
                      <TableCell padding="checkbox" />
                      <TableCell>الطالب</TableCell>
                      <TableCell>التخصص</TableCell>
                      <TableCell>الدفعة</TableCell>
                      <TableCell align="center">الالتزام</TableCell>
                      <TableCell>المسؤول الحالي</TableCell>
                      <TableCell>المسؤول بعد التوزيع</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pageRows.map((s) => (
                      <TableRow key={s.id} hover selected={Boolean(selected[s.id])}>
                        <TableCell padding="checkbox">
                          <Checkbox size="small" checked={Boolean(selected[s.id])} onChange={(e) => setSelected((prev) => ({ ...prev, [s.id]: e.target.checked }))} inputProps={{ "aria-label": `تحديد ${s.name}` }} />
                        </TableCell>
                        <TableCell sx={cellSx}>
                          <Typography sx={{ fontFamily: "Cairo", fontWeight: 800, fontSize: 13.5 }}>{s.name}</Typography>
                          <Typography sx={{ fontFamily: "Cairo", fontSize: 12, color: "text.secondary" }}>{s.nationalId}</Typography>
                        </TableCell>
                        <TableCell sx={{ ...cellSx, fontSize: 13 }}>{s.diploma}</TableCell>
                        <TableCell sx={{ ...cellSx, fontSize: 13 }}>{s.batch}</TableCell>
                        <TableCell align="center">{categoryByKey[s.category] ? <CategoryChip category={categoryByKey[s.category]} dark={dark} /> : null}</TableCell>
                        <TableCell sx={{ ...cellSx, fontSize: 13 }}>{s.currentTrainerName || "—"}</TableCell>
                        <TableCell sx={cellSx}>
                          <Stack direction="row" spacing={0.6} alignItems="center">
                            <Select size="small" value={trainers.some((t) => sameGuid(t.guid, s.effectiveTrainer)) ? trainers.find((t) => sameGuid(t.guid, s.effectiveTrainer)).guid : ""} onChange={(e) => setOverride(s.id, e.target.value)} sx={{ minWidth: 170, fontFamily: "Cairo", fontSize: 13 }}>
                              {trainers.map((t) => <MenuItem key={t.guid} value={t.guid}>{t.name}</MenuItem>)}
                            </Select>
                            {s.pendingOverride ? (
                              <Tooltip title="تعديل يدوي" arrow><SwapHorizIcon fontSize="small" color="warning" /></Tooltip>
                            ) : null}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={visible.length}
                page={Math.min(page, Math.max(0, Math.ceil(visible.length / rowsPerPage) - 1))}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[25, 50, 100]}
                labelRowsPerPage="عدد الصفوف:"
                labelDisplayedRows={({ from, to, count }) => `${from}–${to} من ${count}`}
              />
            </Paper>

            {/* المثبتون */}
            {preview.pinned?.length ? (
              <Paper elevation={0} sx={boxSx}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                  <PushPinIcon fontSize="small" color="secondary" />
                  <Typography sx={{ ...titleSx, flex: 1 }}>الطلاب المثبّتون (خارج التوزيع ويبقون مع مسؤولهم)</Typography>
                  <Button size="small" color="error" onClick={() => unpin(preview.pinned.map((p) => p.id))} disabled={busy} sx={{ fontFamily: "Cairo", fontWeight: 900 }}>إلغاء تثبيت الكل</Button>
                </Stack>
                <TableContainer sx={{ maxHeight: 260 }}>
                  <Table size="small" stickyHeader>
                    <TableHead sx={headSx}>
                      <TableRow>
                        <TableCell>الطالب</TableCell>
                        <TableCell>التخصص</TableCell>
                        <TableCell>مسؤول الاتصال</TableCell>
                        <TableCell>مثبّت حتى</TableCell>
                        <TableCell align="center">إجراء</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.pinned.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={cellSx}>{p.name} <Typography component="span" sx={{ fontSize: 12, color: "text.secondary" }}>({p.nationalId})</Typography></TableCell>
                          <TableCell sx={{ ...cellSx, fontSize: 13 }}>{p.diploma}</TableCell>
                          <TableCell sx={{ ...cellSx, fontSize: 13 }}>{p.trainerName || "—"}</TableCell>
                          <TableCell sx={{ ...cellSx, fontSize: 13 }}>{p.until}{p.pinnedBy ? ` — ${p.pinnedBy}` : ""}</TableCell>
                          <TableCell align="center">
                            <Button size="small" color="error" onClick={() => unpin([p.id])} disabled={busy} sx={{ fontFamily: "Cairo", fontWeight: 800 }}>إلغاء التثبيت</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : null}

            {preview.fixedAssignments?.length ? (
              <Alert severity="info" sx={{ fontFamily: "Cairo" }}>
                مثبتون من ملف الإكسيل (خارج قواعد التوزيع): {preview.fixedAssignments.map((f) => `${f.trainerName} (${f.studentCount})`).join("، ")}
              </Alert>
            ) : null}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 1.6, gap: 1 }}>
        {branch ? (
          <>
            <Button variant="outlined" color="inherit" startIcon={<ArrowForwardIcon />} disabled={busy} onClick={() => { setBranch(null); resetPreviewState(); }} sx={{ fontFamily: "Cairo", fontWeight: 800 }}>
              رجوع للفروع
            </Button>
            <Button variant="contained" startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <TaskAltIcon />} disabled={busy || !preview} onClick={execute} sx={{ fontFamily: "Cairo", fontWeight: 900, background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})` }}>
              {branch.executed ? "إعادة التوزيع" : "تنفيذ التوزيع"}
            </Button>
          </>
        ) : (
          <Button variant="outlined" color="inherit" onClick={onClose} sx={{ fontFamily: "Cairo", fontWeight: 800 }}>إغلاق</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
