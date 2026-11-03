// مقدم التسجيل — الحد الأدنى للدفعة المقدمة لتسجيل الدبلوم لكل فرع (RegSetting.AmountPay)، تحت الإعدادات العامة.
// وكمان مقدم خاص لكل دبلوم داخل الفرع (RegDownPaymentDiploma)؛ الدبلوم اللي مالوش قيمة ياخد مقدم الفرع.
// طلب الالتحاق بيقرأ القيم دي، والسيرفر بيرفض أي دفعة أقل منها.
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
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme
} from "@mui/material";
import LocalAtmRoundedIcon from "@mui/icons-material/LocalAtmRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Swal from "sweetalert2";
import { SSTLI_API_URL } from "../config/apiUrls";

const API_BASE_URL = SSTLI_API_URL;
const primary = "#057546";
const primaryDark = "#034d31";

const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

// ===================== مقدم الدبلومات داخل الفرع =====================
function DiplomaDialog({ branch, canEdit, onClose }) {
  const [rows, setRows] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [allBranches, setAllBranches] = useState(false);

  useEffect(() => {
    if (!branch) return;
    setLoading(true);
    setSearch("");
    setAllBranches(false);
    const params = new URLSearchParams({ userGuid: getUserGuid(), branchGuid: branch.branchGuid });
    fetch(`${API_BASE_URL}/api/reg-down-payment/diplomas?${params}`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok) throw new Error(json?.message || "تعذر تحميل الدبلومات");
        return json;
      })
      .then((json) => {
        const items = json?.items || [];
        setRows(items);
        const initial = {};
        items.forEach((d) => {
          initial[d.diplomGuid] = d.amount === null || d.amount === undefined ? "" : String(Number(d.amount));
        });
        setValues(initial);
      })
      .catch((e) => Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" }))
      .finally(() => setLoading(false));
  }, [branch]);

  const visible = useMemo(() => {
    const q = search.trim();
    return q ? rows.filter((d) => String(d.diplomName || "").includes(q) || String(d.code || "").includes(q)) : rows;
  }, [rows, search]);

  // الدبلومات اللي قيمتها اتغيرت عن المحفوظ
  const changed = rows.filter((d) => {
    const before = d.amount === null || d.amount === undefined ? "" : String(Number(d.amount));
    return (values[d.diplomGuid] ?? "") !== before;
  });

  const save = async () => {
    const toSave = allBranches ? rows.filter((d) => (values[d.diplomGuid] ?? "") !== "") : changed;
    if (!toSave.length) {
      await Swal.fire({ icon: "info", title: "لا توجد تغييرات", confirmButtonText: "حسنًا" });
      return;
    }
    const invalid = toSave.find((d) => {
      const v = values[d.diplomGuid];
      return v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0);
    });
    if (invalid) {
      await Swal.fire({ icon: "warning", title: "قيمة غير صحيحة", text: `راجع قيمة ${invalid.diplomName}`, confirmButtonText: "حسنًا" });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد حفظ مقدم الدبلومات",
      text: allBranches
        ? `سيتم تطبيق مقدم ${toSave.length} دبلوم على كل الفروع. هل تريد المتابعة؟`
        : `سيتم حفظ مقدم ${toSave.length} دبلوم في ${branch.branchName}. هل تريد المتابعة؟`,
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primary,
      reverseButtons: true
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment/diplomas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userGuid: getUserGuid(),
          allBranches,
          branchGuids: allBranches ? [] : [branch.branchGuid],
          items: toSave.map((d) => ({
            diplomGuid: d.diplomGuid,
            amount: values[d.diplomGuid] === "" ? null : Number(values[d.diplomGuid])
          }))
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `تعذر الحفظ (خطأ ${response.status})`);
      await Swal.fire({ icon: "success", title: "تم الحفظ", text: result?.message, confirmButtonText: "حسنًا", confirmButtonColor: primary });
      onClose(true);
    } catch (e) {
      await Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" });
    } finally {
      setSaving(false);
    }
  };

  const branchAmount = Number(branch?.amountPay) || 0;

  return (
    <Dialog open={Boolean(branch)} onClose={() => !saving && onClose(false)} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl", borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        مقدم الدبلومات — {branch?.branchName}
        <Box sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", mt: 0.5 }}>
          الدبلوم اللي تسيبه فاضي ياخد مقدم الفرع ({money(branchAmount)} ريال). ولو الطالب سجّل أكثر من دبلوم، الحد الأدنى = أكبر قيمة بينهم.
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          size="small"
          fullWidth
          placeholder="بحث باسم الدبلوم أو الكود..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 1.5 }}
        />
        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress sx={{ color: primary }} /></Box>
        ) : (
          <TableContainer sx={{ maxHeight: "55vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 900 } }}>
                  <TableCell>الدبلوم</TableCell>
                  <TableCell align="center">الحد الأدنى المطبق</TableCell>
                  <TableCell align="center" sx={{ width: 190 }}>مقدم خاص بالدبلوم</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((d) => {
                  const v = values[d.diplomGuid] ?? "";
                  const effective = v === "" ? branchAmount : Number(v);
                  return (
                    <TableRow key={d.diplomGuid} hover>
                      <TableCell sx={{ fontWeight: 800 }}>
                        {d.diplomName}
                        {d.code ? <Box component="span" sx={{ color: "text.secondary", fontSize: 12, mx: 1 }}>({d.code})</Box> : null}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={`${money(effective)} ريال${v === "" ? " (مقدم الفرع)" : ""}`}
                          color={v === "" ? "default" : "primary"}
                          sx={{ fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          placeholder="مقدم الفرع"
                          value={v}
                          onChange={(e) => setValues((prev) => ({ ...prev, [d.diplomGuid]: e.target.value }))}
                          disabled={!canEdit || saving}
                          inputProps={{ min: 0, step: 50, "aria-label": `مقدم ${d.diplomName}` }}
                          InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
                          sx={{ width: 170 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!visible.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: "text.secondary" }}>لا توجد دبلومات</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1, flexWrap: "wrap" }}>
        <FormControlLabel
          control={<Checkbox checked={allBranches} onChange={(e) => setAllBranches(e.target.checked)} disabled={!canEdit || saving} />}
          label="طبّق القيم المكتوبة على كل الفروع"
          sx={{ ml: "auto", "& .MuiFormControlLabel-label": { fontWeight: 800 } }}
        />
        <Button onClick={() => onClose(false)} disabled={saving} sx={{ fontWeight: 800, color: "#6b7280" }}>إغلاق</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={!canEdit || saving || loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
          sx={{ fontWeight: 900, color: "#fff", bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
        >
          حفظ{!allBranches && changed.length ? ` (${changed.length})` : ""}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ===================== إعدادات الدفعات (دبلوم / تأهيلي / تطويري) =====================
const REG_TYPES = [
  { value: 0, label: "دبلوم", unit: "التخصص" },
  { value: 1, label: "تأهيلي", unit: "الدورة" },
  { value: 2, label: "تطويري", unit: "الدورة" }
];

// نطاق الإعداد: نوع الدراسة × الفرع. الأدق يكسب، و"حسب العام" = يورث من النطاق الأعم.
const STUDY_MODES = [
  { value: "all", label: "حضوري وعن بعد" },
  { value: "0", label: "حضوري" },
  { value: "1", label: "عن بعد" }
];

const stateOf = (closed) => (closed === true ? "closed" : closed === false ? "open" : "inherit");
const closedOf = (state) => (state === "closed" ? true : state === "open" ? false : null);
const numOrEmpty = (v) => (v === null || v === undefined ? "" : String(Number(v)));

function StatusSelect({ value, inheritedClosed, onChange, disabled, ariaLabel }) {
  const color = value === "closed" ? "#ae1e21" : value === "open" ? primary : "text.secondary";
  return (
    <Select
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      inputProps={{ "aria-label": ariaLabel }}
      sx={{ width: 175, fontWeight: 800, color, "& .MuiSelect-select": { py: 0.7 } }}
    >
      <MenuItem value="inherit">حسب العام ({inheritedClosed ? "موقوف" : "مفتوح"})</MenuItem>
      <MenuItem value="open" sx={{ color: primary, fontWeight: 800 }}>مفتوح</MenuItem>
      <MenuItem value="closed" sx={{ color: "#ae1e21", fontWeight: 800 }}>موقوف</MenuItem>
    </Select>
  );
}

function BatchRulesDialog({ batch, regType, canEdit, onClose }) {
  const typeInfo = REG_TYPES[regType];
  const [mode, setMode] = useState("all");
  const [branch, setBranch] = useState("");
  const [data, setData] = useState(null);
  const [rules, setRules] = useState({});
  const [batchState, setBatchState] = useState("inherit");
  const [batchMinPay, setBatchMinPay] = useState("");
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [savedAny, setSavedAny] = useState(false);

  useEffect(() => {
    if (!batch) return;
    setMode("all");
    setBranch("");
    setSearch("");
    setSavedAny(false);
  }, [batch]);

  const load = useCallback(() => {
    if (!batch) return;
    setLoading(true);
    const params = new URLSearchParams({ userGuid: getUserGuid(), regType: String(regType) });
    if (mode !== "all") params.set("studyMode", mode);
    if (branch) params.set("branchGuid", branch);
    fetch(`${API_BASE_URL}/api/reg-down-payment/batches/${batch.batchGuid}/rules?${params}`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (!r.ok) throw new Error(json?.message || "تعذر تحميل إعدادات الدفعة");
        return json;
      })
      .then((json) => {
        setData(json);
        setBatchState(stateOf(json?.batchIsClosed));
        setBatchMinPay(numOrEmpty(json?.batchMinPay));
        const initial = {};
        (json?.items || []).forEach((d) => {
          initial[d.diplomGuid] = { state: stateOf(d.isClosed), minPay: numOrEmpty(d.minPay) };
        });
        setRules(initial);
        setDirty(false);
      })
      .catch((e) => Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" }))
      .finally(() => setLoading(false));
  }, [batch, regType, mode, branch]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => data?.items || [], [data]);
  const branches = data?.branches || [];
  const branchName = (guid) => branches.find((b) => b.branchGuid === guid)?.branchName || "فرع";
  const modeLabel = (m) => STUDY_MODES.find((x) => x.value === m)?.label || "";
  const scopeLabel = `${modeLabel(mode)} — ${branch ? branchName(branch) : "كل الفروع"}`;

  // تغيير النطاق مع تعديلات مش محفوظة
  const changeScope = async (nextMode, nextBranch) => {
    if (dirty) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "تعديلات غير محفوظة",
        text: "سيتم تجاهل التعديلات على النطاق الحالي. هل تريد المتابعة؟",
        showCancelButton: true,
        confirmButtonText: "متابعة",
        cancelButtonText: "إلغاء",
        confirmButtonColor: "#ae1e21",
        reverseButtons: true
      });
      if (!ok.isConfirmed) return;
    }
    setMode(nextMode);
    setBranch(nextBranch);
  };

  const visible = useMemo(() => {
    const q = search.trim();
    return q ? rows.filter((d) => String(d.diplomName || "").includes(q) || String(d.code || "").includes(q)) : rows;
  }, [rows, search]);

  // القيم الفعلية في النطاق ده (بعد الوراثة)
  const batchInheritedClosed = Boolean(data?.inheritedBatchClosed);
  const batchEffectiveClosed = batchState === "inherit" ? batchInheritedClosed : batchState === "closed";
  const batchEffectivePay = batchMinPay !== "" ? Number(batchMinPay) : data?.inheritedBatchMinPay ?? null;
  const fallbackPayLabel = regType === 0 ? "مقدم الفرع" : "بدون حد";

  const rowInheritedClosed = (d) => (d.inheritedClosed === null || d.inheritedClosed === undefined ? batchEffectiveClosed : d.inheritedClosed);
  const rowEffectiveClosed = (d) => {
    const s = rules[d.diplomGuid]?.state || "inherit";
    return s === "inherit" ? rowInheritedClosed(d) : s === "closed";
  };
  const rowInheritedPay = (d) => (d.inheritedMinPay === null || d.inheritedMinPay === undefined ? batchEffectivePay : d.inheritedMinPay);

  const effectiveClosedCount = rows.filter(rowEffectiveClosed).length;

  const setRule = (guid, patch) => {
    setDirty(true);
    setRules((prev) => ({ ...prev, [guid]: { ...(prev[guid] || { state: "inherit", minPay: "" }), ...patch } }));
  };

  const setAllStates = (state) => {
    setDirty(true);
    setRules((prev) => {
      const next = { ...prev };
      rows.forEach((d) => {
        next[d.diplomGuid] = { ...(next[d.diplomGuid] || { minPay: "" }), state };
      });
      return next;
    });
  };

  const save = async () => {
    const bad = [batchMinPay, ...Object.values(rules).map((r) => r.minPay)].find(
      (v) => v !== "" && v !== undefined && (!Number.isFinite(Number(v)) || Number(v) < 0)
    );
    if (bad !== undefined) {
      await Swal.fire({ icon: "warning", title: "قيمة غير صحيحة", text: "راجع قيم المقدم (صفر أو أكثر)", confirmButtonText: "حسنًا" });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد حفظ إعدادات الدفعة",
      html: `دفعة <b>${batch.batchName}</b><br/>النطاق: <b>${scopeLabel}</b><br/>${effectiveClosedCount} من ${rows.length} ${typeInfo.unit} موقوف في هذا النطاق بعد الحفظ.`,
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primary,
      reverseButtons: true
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment/batches/${batch.batchGuid}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userGuid: getUserGuid(),
          regType,
          studyMode: mode === "all" ? null : Number(mode),
          branchGuid: branch || null,
          batchIsClosed: closedOf(batchState),
          batchMinPay: batchMinPay === "" ? null : Number(batchMinPay),
          items: rows.map((d) => {
            const r = rules[d.diplomGuid] || {};
            return {
              diplomGuid: d.diplomGuid,
              isClosed: closedOf(r.state),
              minPay: r.minPay === "" || r.minPay === undefined ? null : Number(r.minPay)
            };
          })
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `تعذر الحفظ (خطأ ${response.status})`);
      setSavedAny(true);
      await Swal.fire({ icon: "success", title: "تم الحفظ", text: `${result?.message} (${scopeLabel})`, confirmButtonText: "حسنًا", confirmButtonColor: primary });
      load();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" });
    } finally {
      setSaving(false);
    }
  };

  const close = async () => {
    if (saving) return;
    if (dirty) {
      const ok = await Swal.fire({
        icon: "warning",
        title: "تعديلات غير محفوظة",
        text: "هل تريد الإغلاق بدون حفظ؟",
        showCancelButton: true,
        confirmButtonText: "إغلاق",
        cancelButtonText: "رجوع",
        confirmButtonColor: "#ae1e21",
        reverseButtons: true
      });
      if (!ok.isConfirmed) return;
    }
    onClose(savedAny);
  };

  const scopes = data?.scopes || [];

  return (
    <Dialog open={Boolean(batch)} onClose={close} fullWidth maxWidth="md" PaperProps={{ sx: { direction: "rtl", borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        إعدادات الدفعة — {typeInfo.label}: {batch?.batchName}
        <Box sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", mt: 0.5 }}>
          اختر النطاق (نوع الدراسة والفرع) ثم حدد الإيقاف والمقدم. الأدق يكسب: إعداد {typeInfo.unit} قبل إعداد الدفعة كلها، ونوع الدراسة المحدد قبل "حضوري وعن بعد"، والفرع المحدد قبل "كل الفروع". "حسب العام" = يأخذ قيمة النطاق الأعم.
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {/* النطاق */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }} sx={{ mb: 1.2 }}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={mode}
            onChange={(_, v) => v && v !== mode && changeScope(v, branch)}
            disabled={loading || saving}
            sx={{ "& .MuiToggleButton-root": { fontWeight: 900, px: 2 }, "& .Mui-selected": { bgcolor: `${primary} !important`, color: "#fff !important" } }}
          >
            {STUDY_MODES.map((m) => (
              <ToggleButton key={m.value} value={m.value}>{m.label}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>الفرع</InputLabel>
            <Select
              label="الفرع"
              value={branch}
              displayEmpty
              onChange={(e) => e.target.value !== branch && changeScope(mode, e.target.value)}
              disabled={loading || saving}
              renderValue={(v) => (v ? branchName(v) : "كل الفروع")}
              sx={{ fontWeight: 800 }}
            >
              <MenuItem value="" sx={{ fontWeight: 800 }}>كل الفروع</MenuItem>
              {branches.map((b) => (
                <MenuItem key={b.branchGuid} value={b.branchGuid}>{b.branchName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {scopes.length ? (
          <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mb: 1.2 }}>
            <Box sx={{ fontSize: 12.5, fontWeight: 800, color: "text.secondary" }}>نطاقات عليها إعدادات خاصة:</Box>
            {scopes.map((s) => {
              const m = s.studyMode === null || s.studyMode === undefined ? "all" : String(s.studyMode);
              const b = s.branchGuid || "";
              const parts = [];
              if (s.batchClosed === true) parts.push("الدفعة موقوفة");
              if (s.batchClosed === false) parts.push("الدفعة مفتوحة");
              if (s.closed) parts.push(`${s.closed} موقوف`);
              if (s.opened) parts.push(`${s.opened} مفتوح`);
              if (s.specialPay) parts.push(`${s.specialPay} مقدم`);
              return (
                <Chip
                  key={`${m}-${b}`}
                  size="small"
                  clickable
                  color={m === mode && b === branch ? "primary" : "default"}
                  onClick={() => (m !== mode || b !== branch) && changeScope(m, b)}
                  label={`${modeLabel(m)} — ${b ? branchName(b) : "كل الفروع"}: ${parts.join("، ") || "—"}`}
                  sx={{ fontWeight: 800 }}
                />
              );
            })}
          </Stack>
        ) : null}

        <Alert severity="info" sx={{ mb: 1.5, fontWeight: 700, py: 0.3 }}>
          تعدّل الآن: <b>{scopeLabel}</b> — {effectiveClosedCount} من {rows.length} {typeInfo.unit} موقوف في هذا النطاق.
        </Alert>

        {/* الدفعة كلها في النطاق ده */}
        <Paper variant="outlined" sx={{ p: 1.2, mb: 1.5, borderRadius: 2, bgcolor: batchEffectiveClosed ? "rgba(174,30,33,.05)" : undefined }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems={{ sm: "center" }}>
            <Box sx={{ fontWeight: 900, minWidth: 120 }}>الدفعة كلها</Box>
            <StatusSelect
              value={batchState}
              inheritedClosed={batchInheritedClosed}
              onChange={(v) => {
                setDirty(true);
                setBatchState(v);
              }}
              disabled={!canEdit || saving || loading}
              ariaLabel="حالة الدفعة كلها"
            />
            <TextField
              size="small"
              type="number"
              label="مقدم الدفعة كلها"
              placeholder={data?.inheritedBatchMinPay !== null && data?.inheritedBatchMinPay !== undefined ? `حسب العام (${money(data.inheritedBatchMinPay)})` : fallbackPayLabel}
              value={batchMinPay}
              onChange={(e) => {
                setDirty(true);
                setBatchMinPay(e.target.value);
              }}
              disabled={!canEdit || saving || loading}
              inputProps={{ min: 0, step: 50 }}
              InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
              InputLabelProps={{ shrink: true }}
              sx={{ width: { xs: "100%", sm: 220 } }}
            />
          </Stack>
        </Paper>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mb: 1.2 }}>
          <Box sx={{ fontSize: 13, fontWeight: 800, color: "text.secondary" }}>كل {regType === 0 ? "التخصصات" : "الدورات"}:</Box>
          <Button size="small" variant="outlined" color="success" onClick={() => setAllStates("open")} disabled={!canEdit || saving || loading || !rows.length} sx={{ fontWeight: 900 }}>
            فتح الكل
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => setAllStates("closed")} disabled={!canEdit || saving || loading || !rows.length} sx={{ fontWeight: 900 }}>
            إيقاف الكل
          </Button>
          <Button size="small" variant="text" onClick={() => setAllStates("inherit")} disabled={!canEdit || saving || loading || !rows.length} sx={{ fontWeight: 900, color: "#6b7280" }}>
            حسب العام
          </Button>
          <Box sx={{ flex: 1 }} />
          <TextField
            size="small"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
            sx={{ width: { xs: "100%", sm: 220 } }}
          />
        </Stack>

        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress sx={{ color: primary }} /></Box>
        ) : (
          <TableContainer sx={{ maxHeight: "45vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 900 } }}>
                  <TableCell>{typeInfo.unit}</TableCell>
                  <TableCell align="center" sx={{ width: 190 }}>التسجيل</TableCell>
                  <TableCell align="center" sx={{ width: 190 }}>مقدم خاص</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((d) => {
                  const r = rules[d.diplomGuid] || { state: "inherit", minPay: "" };
                  const closed = rowEffectiveClosed(d);
                  const inheritedPay = rowInheritedPay(d);
                  return (
                    <TableRow key={d.diplomGuid} hover sx={{ bgcolor: closed ? "rgba(174,30,33,.06)" : undefined }}>
                      <TableCell sx={{ fontWeight: 800 }}>
                        {d.diplomName}
                        {d.code ? <Box component="span" sx={{ color: "text.secondary", fontSize: 12, mx: 1 }}>({d.code})</Box> : null}
                      </TableCell>
                      <TableCell align="center">
                        <StatusSelect
                          value={r.state}
                          inheritedClosed={rowInheritedClosed(d)}
                          onChange={(v) => setRule(d.diplomGuid, { state: v })}
                          disabled={!canEdit || saving}
                          ariaLabel={`حالة ${d.diplomName}`}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          placeholder={inheritedPay !== null && inheritedPay !== undefined ? `حسب العام (${money(inheritedPay)})` : fallbackPayLabel}
                          value={r.minPay ?? ""}
                          onChange={(e) => setRule(d.diplomGuid, { minPay: e.target.value })}
                          disabled={!canEdit || saving || closed}
                          inputProps={{ min: 0, step: 50, "aria-label": `مقدم ${d.diplomName}` }}
                          InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
                          sx={{ width: 175 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!visible.length ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4, color: "text.secondary" }}>لا توجد بيانات</TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={close} disabled={saving} sx={{ fontWeight: 800, color: "#6b7280" }}>إغلاق</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={!canEdit || saving || loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
          sx={{ fontWeight: 900, color: "#fff", bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
        >
          حفظ ({modeLabel(mode)} — {branch ? branchName(branch) : "كل الفروع"})
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BatchesSection({ regType }) {
  const typeInfo = REG_TYPES[regType];
  const [items, setItems] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [openBatch, setOpenBatch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ userGuid: getUserGuid(), regType: String(regType) });
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment/batches?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `تعذر تحميل الدفعات (خطأ ${response.status})`);
      setItems(result?.items || []);
      setCanEdit(Boolean(result?.canEdit));
    } catch (e) {
      setItems([]);
      Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" });
    } finally {
      setLoading(false);
    }
  }, [regType]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRegOn = async (batch) => {
    const next = !batch.isRegOn;
    const confirm = await Swal.fire({
      icon: next ? "question" : "warning",
      title: next ? "فتح التسجيل على الدفعة" : "إيقاف التسجيل على الدفعة كلها",
      text: next
        ? `سيُفتح التسجيل على دفعة ${batch.batchName} (${typeInfo.label}).`
        : `لن يستطيع أحد التسجيل على دفعة ${batch.batchName} (${typeInfo.label}) من الويب أو البرنامج المكتبي.`,
      showCancelButton: true,
      confirmButtonText: next ? "فتح" : "إيقاف",
      cancelButtonText: "إلغاء",
      confirmButtonColor: next ? primary : "#ae1e21",
      reverseButtons: true
    });
    if (!confirm.isConfirmed) return;

    setBusy(batch.batchGuid);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment/batches/${batch.batchGuid}/reg-on`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid: getUserGuid(), regType, isRegOn: next })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `تعذر التعديل (خطأ ${response.status})`);
      await load();
    } catch (e) {
      Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" });
    } finally {
      setBusy("");
    }
  };

  return (
    <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.5 }}>
        <EventNoteRoundedIcon sx={{ color: primary }} />
        <Typography sx={{ fontWeight: 900, fontSize: 16, flex: 1 }}>دفعات {typeInfo.label}</Typography>
        <Button variant="text" startIcon={<RefreshRoundedIcon />} onClick={load} disabled={loading} sx={{ fontWeight: 800 }}>
          تحديث
        </Button>
      </Stack>
      {loading ? (
        <Box sx={{ py: 5, textAlign: "center" }}><CircularProgress sx={{ color: primary }} /></Box>
      ) : (
        <TableContainer sx={{ maxHeight: 420 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 900 } }}>
                <TableCell>الدفعة</TableCell>
                <TableCell align="center">التسجيل على الدفعة</TableCell>
                <TableCell align="center">مقدم الدفعة</TableCell>
                <TableCell align="center">{regType === 0 ? "تخصصات موقوفة" : "دورات موقوفة"}</TableCell>
                <TableCell align="center">مقدم خاص</TableCell>
                <TableCell align="center">حضوري / عن بعد / فرع</TableCell>
                <TableCell align="center" sx={{ width: 170 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((b) => (
                <TableRow key={b.batchGuid} hover sx={{ opacity: b.isRegOn ? 1 : 0.7 }}>
                  <TableCell sx={{ fontWeight: 900 }}>
                    {b.batchName}
                    {b.code ? <Box component="span" sx={{ color: "text.secondary", fontSize: 12, mx: 1 }}>({b.code})</Box> : null}
                  </TableCell>
                  <TableCell align="center">
                    <FormControlLabel
                      control={<Switch color="success" checked={b.isRegOn} onChange={() => toggleRegOn(b)} disabled={!canEdit || busy === b.batchGuid} />}
                      label={b.isRegOn ? "مفتوح" : "موقوف"}
                      sx={{ m: 0, "& .MuiFormControlLabel-label": { fontWeight: 800, color: b.isRegOn ? primary : "#ae1e21" } }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {b.batchMinPay !== null && b.batchMinPay !== undefined ? (
                      <Chip size="small" color="primary" label={`${money(b.batchMinPay)} ريال`} sx={{ fontWeight: 800 }} />
                    ) : (
                      <Box component="span" sx={{ color: "text.secondary", fontSize: 13 }}>{regType === 0 ? "مقدم الفرع" : "بدون حد"}</Box>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {b.closedCount ? <Chip size="small" color="error" variant="outlined" label={b.closedCount} sx={{ fontWeight: 900 }} /> : "—"}
                  </TableCell>
                  <TableCell align="center">
                    {b.specialPayCount ? <Chip size="small" color="primary" variant="outlined" label={b.specialPayCount} sx={{ fontWeight: 900 }} /> : "—"}
                  </TableCell>
                  <TableCell align="center">
                    {b.scopedCount ? (
                      <Chip size="small" color="warning" variant="outlined" label={`${b.scopedCount} إعداد خاص`} sx={{ fontWeight: 900 }} />
                    ) : "—"}
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" startIcon={<TuneRoundedIcon />} onClick={() => setOpenBatch(b)} sx={{ fontWeight: 900, whiteSpace: "nowrap" }}>
                      إعدادات الدفعة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>لا توجد دفعات</TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <BatchRulesDialog
        batch={openBatch}
        regType={regType}
        canEdit={canEdit}
        onClose={(saved) => {
          setOpenBatch(null);
          if (saved) load();
        }}
      />
    </Paper>
  );
}

export default function RegDownPayment() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [items, setItems] = useState([]);
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState([]);
  const [amount, setAmount] = useState("");
  const [rowAmounts, setRowAmounts] = useState({});
  const [diplomaBranch, setDiplomaBranch] = useState(null);
  const [tab, setTab] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ userGuid: getUserGuid() });
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          result?.message ||
            (response.status === 404
              ? "خدمة مقدم التسجيل غير متاحة على الخادم بعد (404) — تأكد من رفع ملفات الباك إند وإعادة تشغيل api4"
              : `تعذر تحميل مقدم التسجيل (خطأ ${response.status})`)
        );
      }
      setItems(result?.items || []);
      setCanEdit(Boolean(result?.canEdit));
      setRowAmounts({});
      setSelected([]);
    } catch (e) {
      setError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ملخص القيم الحالية: كل قيمة وعدد الفروع اللي عليها
  const summary = useMemo(() => {
    const map = new Map();
    items.filter((i) => i.isUse).forEach((i) => map.set(Number(i.amountPay), (map.get(Number(i.amountPay)) || 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const allSelected = items.length > 0 && selected.length === items.length;

  const save = async ({ value, all, ids, label }) => {
    const numeric = Number(value);
    if (value === "" || !Number.isFinite(numeric) || numeric < 0) {
      await Swal.fire({ icon: "warning", title: "قيمة غير صحيحة", text: "أدخل قيمة المقدم بالريال (صفر أو أكثر)", confirmButtonText: "حسنًا" });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "تأكيد حفظ مقدم التسجيل",
      text: `سيصبح الحد الأدنى للدفعة المقدمة ${money(numeric)} ريال ${label}. هل تريد المتابعة؟`,
      showCancelButton: true,
      confirmButtonText: "حفظ",
      cancelButtonText: "إلغاء",
      confirmButtonColor: primary,
      reverseButtons: true
    });
    if (!confirm.isConfirmed) return;

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reg-down-payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid: getUserGuid(), amount: numeric, all, ids })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || `تعذر حفظ مقدم التسجيل (خطأ ${response.status})`);
      await Swal.fire({ icon: "success", title: "تم الحفظ", text: result?.message, confirmButtonText: "حسنًا", confirmButtonColor: primary });
      setAmount("");
      await load();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "حدث خطأ", text: e.message, confirmButtonText: "حسنًا" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0 }}>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})` }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <LocalAtmRoundedIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 21 }}>إعدادات التسجيل</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>
              فتح وإيقاف التسجيل على الدفعات والتخصصات، والحد الأدنى للدفعة المقدمة في طلب الالتحاق
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>{error}</Alert> : null}
      {!loading && !error && !canEdit ? (
        <Alert severity="info" sx={{ mb: 2, fontWeight: 600 }}>لديك صلاحية العرض فقط — التعديل يحتاج صلاحية تعديل على إعدادات التسجيل.</Alert>
      ) : null}

      <Paper sx={{ mb: 2, borderRadius: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ "& .MuiTab-root": { fontWeight: 900, fontSize: 15 } }}>
          {REG_TYPES.map((t) => (
            <Tab key={t.value} value={t.value} label={t.label} />
          ))}
        </Tabs>
      </Paper>

      <BatchesSection key={tab} regType={tab} />

      {tab === 0 && (
      <>
      <Box sx={{ fontWeight: 900, fontSize: 16, mb: 1, px: 0.5 }}>مقدم الفروع (الافتراضي)</Box>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            type="number"
            label="قيمة المقدم"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!canEdit || saving}
            inputProps={{ min: 0, step: 50 }}
            InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
            sx={{ width: { xs: "100%", md: 200 } }}
          />
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <DoneAllRoundedIcon />}
            disabled={!canEdit || saving || !items.length}
            onClick={() => save({ value: amount, all: true, ids: [], label: "لكل الفروع" })}
            sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
          >
            تطبيق على كل الفروع
          </Button>
          <Button
            variant="outlined"
            startIcon={<SaveRoundedIcon />}
            disabled={!canEdit || saving || selected.length === 0}
            onClick={() => save({ value: amount, all: false, ids: selected, label: `للفروع المحددة (${selected.length})` })}
            sx={{ fontWeight: 900 }}
          >
            تطبيق على المحدد ({selected.length})
          </Button>
          <Button variant="text" startIcon={<RefreshRoundedIcon />} onClick={load} disabled={loading || saving} sx={{ fontWeight: 800 }}>
            تحديث
          </Button>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
            {summary.map(([value, count]) => (
              <Chip key={value} label={`${money(value)} ريال: ${count} فرع`} sx={{ fontWeight: 800 }} color={value > 0 ? "success" : "default"} variant="outlined" />
            ))}
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: "center" }}>
            <CircularProgress sx={{ color: primary }} />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: "calc(100vh - 360px)", minHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ "& th": { fontWeight: 900, bgcolor: isDark ? "rgba(5,117,70,.25)" : "#eef8f3" } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selected.length > 0 && !allSelected}
                      onChange={() => setSelected(allSelected ? [] : items.map((i) => i.id))}
                      disabled={!canEdit}
                      inputProps={{ "aria-label": "تحديد الكل" }}
                    />
                  </TableCell>
                  <TableCell>الفرع</TableCell>
                  <TableCell>دفتر التسجيل</TableCell>
                  <TableCell align="center">الحالة</TableCell>
                  <TableCell align="center">المقدم الحالي</TableCell>
                  <TableCell align="center" sx={{ width: 260 }}>تعديل هذا الفرع</TableCell>
                  <TableCell align="center" sx={{ width: 150 }}>الدبلومات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => {
                  const rowValue = rowAmounts[item.id] ?? "";
                  return (
                    <TableRow key={item.id} hover selected={selected.includes(item.id)} sx={{ opacity: item.isUse ? 1 : 0.55 }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onChange={() => toggle(item.id)}
                          disabled={!canEdit}
                          inputProps={{ "aria-label": `تحديد ${item.branchName}` }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{item.branchName || "—"}</TableCell>
                      <TableCell>{item.docName}</TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={item.isUse ? "نشط" : "موقوف"} color={item.isUse ? "success" : "default"} variant="outlined" sx={{ fontWeight: 800 }} />
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={Number(item.amountPay) > 0 ? `${money(item.amountPay)} ريال` : "غير محدد"}
                          sx={{ fontWeight: 900, minWidth: 110 }}
                          color={Number(item.amountPay) > 0 ? "primary" : "default"}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.8} justifyContent="center">
                          <TextField
                            size="small"
                            type="number"
                            placeholder={String(Number(item.amountPay) || 0)}
                            value={rowValue}
                            onChange={(e) => setRowAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            disabled={!canEdit || saving}
                            inputProps={{ min: 0, step: 50, "aria-label": `مقدم ${item.branchName}` }}
                            sx={{ width: 120 }}
                          />
                          <Button
                            size="small"
                            variant="contained"
                            disabled={!canEdit || saving || rowValue === ""}
                            onClick={() => save({ value: rowValue, all: false, ids: [item.id], label: `لفرع ${item.branchName}` })}
                            sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
                          >
                            حفظ
                          </Button>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<SchoolRoundedIcon />}
                          disabled={!item.branchGuid}
                          onClick={() => setDiplomaBranch(item)}
                          sx={{ fontWeight: 900, whiteSpace: "nowrap" }}
                        >
                          مقدم الدبلومات
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!items.length ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                      لا توجد دفاتر تسجيل دبلوم
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      </>
      )}

      <DiplomaDialog branch={diplomaBranch} canEdit={canEdit} onClose={() => setDiplomaBranch(null)} />
    </Box>
  );
}
