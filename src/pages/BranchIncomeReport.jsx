// الدخل ونسب الفروع (شاشة الإدارة):
// - الدخل من تقرير المبيعات بكل أنواع المستندات (قسط شهري، دفعة مقدمة، سداد رسوم، وغيرها).
// - نسبة الفرع من سداد القسط الشهري فقط على إجمالي طلاب الدبلومات في الفرع؛ من سدد أقل من 250 لا يدخل في النسبة ولا العمولة.
// - مشرف الفرع واحد لكل فرع، نسبته نسبة الفرع وعمولته 0.5% من 45% فأكثر، ومكافأة 250 (76%–85%) أو 500 (86% فأكثر).
// - الطلاب غير الموزعين على مسؤول اتصال لكل فرع مع حالتهم وسجلهم.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from "@mui/material";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import RefreshIcon from "@mui/icons-material/Refresh";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HistoryIcon from "@mui/icons-material/History";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { toPng } from "html-to-image";
import Swal from "sweetalert2";
import { API_BASE_URL, getUserGuid, readJson, useTasksPalette } from "./tasks/tasksCommon";
import { TasksPageShell, SectionCard, NoAccess, CenterLoader } from "./tasks/TasksUi";

const API = `${API_BASE_URL}/api/branch-income`;

const readPref = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};
const writePref = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* المتصفح يمنع التخزين */ }
};
// excludedBatches: ["*:batchGuid", "branchGuid:batchGuid", ...]
const calcParams = ({ excludedBatches, zeroBalance, onlyAssigned }) => ({
  zeroBalance: String(zeroBalance !== false),
  onlyAssigned: String(Boolean(onlyAssigned)),
  exclude: (excludedBatches || []).join(",")
});

// ---------- أدوات ----------
const pad2 = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtDate = (s) => (s ? String(s).slice(0, 10).split("-").reverse().join("/") : "");
const fmtDateTime = (s) => {
  if (!s) return "";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const int = (v) => Number(v || 0).toLocaleString("en-US");

const PRESETS = [
  { key: "month", label: "هذا الشهر", range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; } },
  { key: "lastMonth", label: "الشهر الماضي", range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), iso(new Date(t.getFullYear(), t.getMonth(), 0))]; } },
  {
    key: "cycle",
    label: "دورة العمولة (15 – 14)",
    range: () => {
      const t = new Date();
      const start = t.getDate() >= 15 ? new Date(t.getFullYear(), t.getMonth(), 15) : new Date(t.getFullYear(), t.getMonth() - 1, 15);
      return [iso(start), iso(t)];
    }
  },
  { key: "year", label: "منذ بداية السنة", range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), 0, 1)), iso(t)]; } }
];

// ألوان النسبة (نفس درجات صفحة السداد والتحصيل)
const tierColor = (p) =>
  p < 45 ? "#dc2626" : p <= 50 ? "#ea580c" : p <= 55 ? "#16a34a" : p <= 75 ? "#2563eb" : p <= 85 ? "#7c3aed" : "#c2410c";
// عمولة مشرف الفرع: 0.5% من 45% فأكثر، ومكافأة بنفس قواعد المدربين (250 من 76% إلى 85%، 500 من 86%)
const tierLabel = (p) => (p < 45 ? "بدون عمولة" : p <= 75 ? "0.5%" : p <= 85 ? "0.5% + 250" : "0.5% + 500");

// ---------- حقول التصدير ----------
const SUMMARY_FIELDS = [
  { key: "period", label: "الفترة", get: (d) => `من ${fmtDate(d.fromDate)} إلى ${fmtDate(d.toDate)}` },
  { key: "income", label: "إجمالي دخل المعهد", get: (d) => d.totals.income, num: true },
  { key: "monthPay", label: "القسط الشهري", get: (d) => d.totals.monthPay, num: true },
  { key: "startPay", label: "الدفعات المقدمة", get: (d) => d.totals.startPay, num: true },
  { key: "feesPay", label: "سداد الرسوم", get: (d) => d.totals.feesPay, num: true },
  { key: "otherPay", label: "مستندات أخرى", get: (d) => d.totals.otherPay, num: true },
  { key: "tax", label: "الضريبة", get: (d) => d.totals.tax, num: true },
  { key: "net", label: "الدخل بدون الضريبة", get: (d) => d.totals.net, num: true },
  { key: "rate", label: "نسبة المعهد", get: (d) => `${d.totals.rate}%` },
  { key: "active", label: "الطلاب المستمرون", get: (d) => d.totals.activeStudents, num: true },
  { key: "excluded", label: "المستبعدون من الاحتساب", get: (d) => d.totals.activeStudents - d.totals.students, num: true },
  { key: "excludedDeprived", label: "حرمان", get: (d) => d.totals.excludedDeprived, num: true },
  { key: "excludedZero", label: "أرصدة صفرية", get: (d) => d.totals.excludedZero, num: true },
  { key: "excludedDeferred", label: "تأجيل", get: (d) => d.totals.excludedDeferred, num: true },
  { key: "excludedBalance", label: "رصيدهم صفر أو دائن", get: (d) => d.totals.excludedBalance, num: true },
  { key: "students", label: "المستحقون للاحتساب", get: (d) => d.totals.students, num: true },
  { key: "paidStudents", label: "المسددون (القسط الشهري)", get: (d) => d.totals.paidStudents, num: true },
  { key: "unassigned", label: "غير الموزعين على مسؤول اتصال", get: (d) => d.totals.unassignedStudents, num: true },
  { key: "commissions", label: "عمولات مشرفي الفروع", get: (d) => d.totals.commissions, num: true }
];

const BRANCH_FIELDS = [
  { key: "rank", label: "الترتيب", get: (b) => b.rank ?? "—" },
  { key: "name", label: "الفرع", get: (b) => b.name },
  { key: "fullName", label: "اسم الفرع الكامل", get: (b) => b.fullName },
  { key: "supervisor", label: "مشرف الفرع", get: (b) => b.supervisorName || "—" },
  { key: "rate", label: "نسبة الفرع", get: (b) => `${b.rate}%` },
  { key: "active", label: "المستمرون", get: (b) => b.activeStudents, num: true },
  { key: "excludedDeprived", label: "حرمان", get: (b) => b.excludedDeprived, num: true },
  { key: "excludedZero", label: "أرصدة صفرية", get: (b) => b.excludedZero, num: true },
  { key: "excludedDeferred", label: "تأجيل", get: (b) => b.excludedDeferred, num: true },
  { key: "excludedBalance", label: "رصيد صفر أو دائن", get: (b) => b.excludedBalance, num: true },
  { key: "excludedBatches", label: "دفعات مستبعدة", get: (b) => b.excludedBatches, num: true },
  { key: "students", label: "المستحقون", get: (b) => b.students, num: true },
  { key: "paidStudents", label: "المسددون", get: (b) => b.paidStudents, num: true },
  { key: "unpaid", label: "غير المسددين", get: (b) => b.unpaidStudents, num: true },
  { key: "lowPaid", label: "سددوا أقل من 250", get: (b) => b.lowPaidStudents, num: true },
  { key: "unassigned", label: "غير الموزعين", get: (b) => b.unassignedStudents, num: true },
  { key: "collected", label: "تحصيل القسط الشهري المحتسب", get: (b) => b.collectedForRate, num: true },
  { key: "income", label: "دخل الفرع", get: (b) => b.income, num: true },
  { key: "monthPay", label: "القسط الشهري (المبيعات)", get: (b) => b.monthPay, num: true },
  { key: "startPay", label: "الدفعات المقدمة", get: (b) => b.startPay, num: true },
  { key: "feesPay", label: "سداد الرسوم", get: (b) => b.feesPay, num: true },
  { key: "net", label: "دخل الفرع بدون الضريبة", get: (b) => b.net, num: true },
  { key: "share", label: "حصة الفرع من الدخل", get: (b) => `${b.shareOfIncome}%` },
  { key: "commissionRate", label: "شريحة العمولة", get: (b) => tierLabel(b.rate) },
  { key: "bonus", label: "مكافأة المشرف", get: (b) => b.bonus, num: true },
  { key: "commission", label: "عمولة المشرف", get: (b) => b.commission, num: true }
];

const DEFAULT_PICK = {
  summary: ["period", "income", "rate", "commissions"],
  branches: ["rank", "name", "supervisor", "rate", "income", "commission"]
};

// ---------- مكونات صغيرة ----------
const Kpi = ({ label, value, hint, color }) => {
  const p = useTasksPalette();
  const t = p.tone(color || "#057546");
  return (
    <SectionCard sx={{ p: 2, flex: "1 1 200px", minWidth: 190, borderTop: `3px solid ${t.fg}` }}>
      <Typography sx={{ fontSize: 12.5, color: p.muted, fontWeight: 600 }}>{label}</Typography>
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: p.text, mt: 0.5, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
      {hint ? <Typography sx={{ fontSize: 12, color: p.muted, mt: 0.25, lineHeight: 1.6 }}>{hint}</Typography> : null}
    </SectionCard>
  );
};

const RateBar = ({ value }) => {
  const color = tierColor(value);
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 140 }}>
      <Typography sx={{ fontWeight: 800, color, width: 42, fontVariantNumeric: "tabular-nums" }}>{value}%</Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min(100, value)}
        sx={{ flex: 1, minWidth: 80, height: 8, borderRadius: 4, bgcolor: `${color}22`, "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 } }}
      />
    </Stack>
  );
};

const Medal = ({ rank }) => {
  if (!rank) return <Typography sx={{ color: "text.secondary" }}>—</Typography>;
  const colors = { 1: "#d4a017", 2: "#9ca3af", 3: "#b45309" };
  return colors[rank] ? (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <EmojiEventsIcon sx={{ color: colors[rank], fontSize: 20 }} />
      <Typography sx={{ fontWeight: 800 }}>{rank}</Typography>
    </Stack>
  ) : (
    <Typography sx={{ fontWeight: 700, pr: 0.5 }}>{rank}</Typography>
  );
};

const headSx = { fontWeight: 800, whiteSpace: "nowrap", fontSize: 13 };
const numSx = { fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };

// ---------- الصفحة ----------
export default function BranchIncomeReport() {
  const p = useTasksPalette();
  const userGuid = getUserGuid();
  const [[fromDate, toDate], setRange] = useState(PRESETS[0].range());
  const [preset, setPreset] = useState("month");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [studentsView, setStudentsView] = useState(null); // { branch, kind: "unassigned" | "excluded" }
  const [batchesOpen, setBatchesOpen] = useState(false);
  // طريقة الاحتساب العادلة: تُحفظ في المتصفح لتبقى ثابتة بين الزيارات.
  const [excludedBatches, setExcludedBatches] = useState(() => readPref("bi.excludedBatches", []));
  const [zeroBalance, setZeroBalance] = useState(() => readPref("bi.zeroBalance", true));
  const [onlyAssigned, setOnlyAssigned] = useState(() => readPref("bi.onlyAssigned", false));
  const calcRef = useRef({ excludedBatches, zeroBalance, onlyAssigned });
  calcRef.current = { excludedBatches, zeroBalance, onlyAssigned };
  const setCalc = (key, value, setter) => {
    setter(value);
    writePref(`bi.${key}`, value);
    calcRef.current = { ...calcRef.current, [key]: value };
    load(fromDate, toDate);
  };

  const load = useCallback(async (from, to, refresh = false) => {
    if (!from || !to) return;
    if (from > to) {
      setError("تاريخ البداية يجب ألا يتجاوز تاريخ النهاية.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ userGuid, fromDate: from, toDate: to, ...calcParams(calcRef.current), refresh: String(refresh) });
      setData(await readJson(await fetch(`${API}/report?${q}`, { cache: "no-store" })));
    } catch (e) {
      if (e.status === 403) setForbidden(true);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userGuid]);

  useEffect(() => {
    load(fromDate, toDate);
    // التحميل الأول فقط؛ بعده بزر "عرض"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPreset = (key) => {
    const found = PRESETS.find((x) => x.key === key);
    if (!found) return;
    const r = found.range();
    setPreset(key);
    setRange(r);
    load(r[0], r[1]);
  };

  const branches = data?.branches || [];
  const maxIncome = Math.max(1, ...branches.map((b) => b.income));

  if (forbidden) return <NoAccess message="ليس لديك صلاحية على شاشة الدخل ونسب الفروع." />;

  const t = data?.totals;

  return (
    <TasksPageShell
      icon={<LeaderboardIcon />}
      title="الدخل ونسب الفروع"
      subtitle="دخل المعهد والفروع في الفترة، ونسب الفروع وترتيبها، ونسب مشرفي الفروع وعمولاتهم"
      actions={
        <>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => load(fromDate, toDate, true)} disabled={loading}>
            تحديث
          </Button>
          <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={() => setExportOpen(true)} disabled={!data || loading}>
            تصدير
          </Button>
        </>
      }
    >
      <SectionCard sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ xs: "stretch", md: "center" }} flexWrap="wrap" useFlexGap>
          <TextField
            type="date" size="small" label="من تاريخ" value={fromDate} InputLabelProps={{ shrink: true }}
            onChange={(e) => { setPreset(""); setRange([e.target.value, toDate]); }}
          />
          <TextField
            type="date" size="small" label="إلى تاريخ" value={toDate} InputLabelProps={{ shrink: true }}
            onChange={(e) => { setPreset(""); setRange([fromDate, e.target.value]); }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={() => load(fromDate, toDate)} disabled={loading}>
            عرض
          </Button>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {PRESETS.map((x) => (
              <Chip
                key={x.key} label={x.label} clickable onClick={() => applyPreset(x.key)}
                color={preset === x.key ? "primary" : "default"} variant={preset === x.key ? "filled" : "outlined"}
              />
            ))}
          </Stack>
        </Stack>
      </SectionCard>

      {/* طريقة الاحتساب العادلة */}
      <SectionCard sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} justifyContent="space-between">
          <Box>
            <Typography sx={{ fontWeight: 800, color: p.text }}>طريقة احتساب نسبة الفرع</Typography>
            <Typography sx={{ fontSize: 12.5, color: p.muted, mt: 0.25, lineHeight: 1.8 }}>
              المستحقون = الطلاب المستمرون في دبلومات الفرع حسب الملف التدريبي وحالة سدادهم في النظام «مستحق السداد» (نفس متابعة السداد).
              يُستبعد من حالته في النظام حرمان أو أرصدة صفرية أو تأجيل أو غير محددة، ثم حسب اختيارك: من ليس عليه شيء في كشف الحساب، والدفعات المستبعدة.
              النسبة والعمولة على كل المستحقين، موزعين أو غير موزعين، إلا إذا اخترت الحساب على ما وزّعه المشرف.
            </Typography>
          </Box>
          <ToggleButtonGroup
            size="small" exclusive value={onlyAssigned ? "assigned" : "all"}
            onChange={(_, v) => v && setCalc("onlyAssigned", v === "assigned", setOnlyAssigned)}
          >
            <ToggleButton value="all" sx={{ whiteSpace: "nowrap" }}>كل المستحقين</ToggleButton>
            <ToggleButton value="assigned" sx={{ whiteSpace: "nowrap" }}>ما وزّعه المشرف فقط</ToggleButton>
          </ToggleButtonGroup>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <FormControlLabel
              control={<Checkbox checked={zeroBalance} onChange={(e) => setCalc("zeroBalance", e.target.checked, setZeroBalance)} />}
              label="رصيده في كشف الحساب صفر أو دائن"
            />
            <Button variant="outlined" size="small" onClick={() => setBatchesOpen(true)}>
              الدفعات المستبعدة ({excludedBatches.length})
            </Button>
          </Stack>
        </Stack>
      </SectionCard>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {loading && !data ? <CenterLoader /> : null}
      {loading && data ? <LinearProgress sx={{ mb: 1.5, borderRadius: 1 }} /> : null}

      {data ? (
        <>
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1.5} sx={{ mb: 1.5 }}>
            <Kpi
              label="إجمالي دخل المعهد" value={money(t.income)} color="#057546"
              hint={`قسط شهري ${money(t.monthPay)} · دفعات مقدمة ${money(t.startPay)} · رسوم ${money(t.feesPay)}${t.otherPay ? ` · أخرى ${money(t.otherPay)}` : ""}`}
            />
            <Kpi label="الدخل بدون الضريبة" value={money(t.net)} hint={`الضريبة ${money(t.tax)} · ${int(t.bills)} فاتورة`} color="#7c3aed" />
            <Kpi
              label="نسبة المعهد" value={`${t.rate}%`} color={tierColor(t.rate)}
              hint={`${int(t.paidStudents)} مسدد للقسط الشهري من ${int(t.students)} مستحق`}
            />
            <Kpi
              label="المستحقون للاحتساب" value={int(t.students)} color="#2563eb"
              hint={`من ${int(t.activeStudents)} مستمر · استُبعد ${int(t.excludedDeprived)} حرمان، ${int(t.excludedZero)} أرصدة صفرية، ${int(t.excludedDeferred)} تأجيل، ${int(t.excludedBalance)} رصيدهم صفر أو دائن، ${int(t.excludedBatches)} من دفعات مستبعدة${t.excludedUnassigned ? `، ${int(t.excludedUnassigned)} غير موزعين` : ""}`}
            />
            <Kpi label="غير الموزعين على مسؤول اتصال" value={int(t.unassignedStudents)} hint="اضغط على العدد في جدول الفروع لعرض الطلاب وسجلهم" color="#ea580c" />
            <Kpi label="عمولات مشرفي الفروع" value={money(t.commissions)} hint={`${int(branches.filter((b) => b.commission > 0).length)} مشرف مستحق`} color="#c2410c" />
          </Stack>

          <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2, fontSize: 13 }}>
            الدخل من تقرير المبيعات بكل أنواع المستندات. نسبة الفرع = المسددون للقسط الشهري ÷ المستحقين.
            الطالب مسدد إذا بلغ مجموع أقساطه الشهرية في الفترة {int(data.minMonthPay)} ريال فأكثر، ومن سدد أقل ({int(t.lowPaidStudents)} طالب) لا يدخل في النسبة ولا العمولة.
            عمولة مشرف الفرع 0.5% من تحصيل القسط الشهري المحتسب للفرع إذا بلغت نسبة الفرع 45% فأكثر، ومكافأة 250 ريالًا من 76% إلى 85% و500 ريال من 86% فأكثر. الحالة حسب آخر يوم في الفترة.
          </Alert>

          <SectionCard sx={{ overflow: "hidden" }}>
            <TableContainer sx={{ maxHeight: 680 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>#</TableCell>
                    <TableCell sx={headSx}>الفرع ومشرفه</TableCell>
                    <TableCell sx={headSx}>نسبة الفرع</TableCell>
                    <TableCell sx={headSx}>المستحقون</TableCell>
                    <TableCell sx={headSx}>المستبعدون</TableCell>
                    <TableCell sx={headSx}>المسددون</TableCell>
                    <TableCell sx={headSx}>غير الموزعين</TableCell>
                    <TableCell sx={headSx}>تحصيل القسط المحتسب</TableCell>
                    <TableCell sx={headSx}>دخل الفرع</TableCell>
                    <TableCell sx={headSx}>الشريحة</TableCell>
                    <TableCell sx={headSx}>عمولة المشرف</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branches.map((b) => (
                    <TableRow key={b.branchGuid} hover>
                      <TableCell><Medal rank={b.rank} /></TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{b.name}</Typography>
                        <Typography sx={{ fontSize: 12, color: p.muted }}>{b.supervisorName || "لا يوجد مشرف مسجل"}</Typography>
                      </TableCell>
                      <TableCell>{b.students ? <RateBar value={b.rate} /> : <Typography sx={{ color: p.muted, fontSize: 13 }}>لا طلاب</Typography>}</TableCell>
                      <TableCell sx={numSx}>
                        <Typography sx={{ ...numSx, fontWeight: 700 }}>{int(b.students)}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: p.muted }}>من {int(b.activeStudents)} مستمر</Typography>
                      </TableCell>
                      <TableCell>
                        {b.activeStudents - b.students ? (
                          <Tooltip title={`حرمان ${b.excludedDeprived} · أرصدة صفرية ${b.excludedZero} · تأجيل ${b.excludedDeferred} · رصيد صفر أو دائن ${b.excludedBalance} · دفعات مستبعدة ${b.excludedBatches}${b.excludedUnassigned ? ` · غير موزعين ${b.excludedUnassigned}` : ""}`}>
                            <Button size="small" variant="text" onClick={() => setStudentsView({ branch: b, kind: "excluded" })} sx={{ fontWeight: 800, ...numSx }}>
                              {int(b.activeStudents - b.students)}
                            </Button>
                          </Tooltip>
                        ) : (
                          <Typography sx={{ color: p.muted }}>0</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={numSx}>
                        {int(b.paidStudents)}
                        {b.lowPaidStudents ? <Typography sx={{ fontSize: 11.5, color: "#ea580c" }}>{b.lowPaidStudents} سددوا أقل من 250</Typography> : null}
                      </TableCell>
                      <TableCell>
                        {b.unassignedStudents ? (
                          <Button
                            size="small" variant="text" color="warning" startIcon={<PersonOffOutlinedIcon />}
                            onClick={() => setStudentsView({ branch: b, kind: "unassigned" })} sx={{ fontWeight: 800, ...numSx }}
                          >
                            {int(b.unassignedStudents)}
                          </Button>
                        ) : (
                          <Typography sx={{ color: p.muted }}>0</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={numSx}>{money(b.collectedForRate)}</TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Typography sx={{ ...numSx, fontWeight: 700 }}>{money(b.income)}</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.75}>
                          <Box sx={{ height: 5, borderRadius: 3, bgcolor: p.primary, opacity: 0.55, width: `${Math.max(3, (b.income / maxIncome) * 100)}px` }} />
                          <Typography sx={{ fontSize: 11.5, color: p.muted }}>{b.shareOfIncome}%</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {b.students ? (
                          <Chip size="small" label={tierLabel(b.rate)} sx={{ fontWeight: 700, color: tierColor(b.rate), bgcolor: `${tierColor(b.rate)}1a` }} />
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ ...numSx, fontWeight: 800 }}>
                        {money(b.commission)}
                        {b.bonus ? <Typography sx={{ fontSize: 11.5, color: p.muted, fontWeight: 400 }}>منها مكافأة {money(b.bonus)}</Typography> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SectionCard>

          <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} data={data} />
          <StudentsDialog
            view={studentsView}
            onClose={() => setStudentsView(null)}
            userGuid={userGuid}
            fromDate={data.fromDate}
            toDate={data.toDate}
            calc={{ excludedBatches, zeroBalance, onlyAssigned }}
          />
          <BatchesDialog
            open={batchesOpen}
            onClose={() => setBatchesOpen(false)}
            userGuid={userGuid}
            toDate={data.toDate}
            branches={branches}
            value={excludedBatches}
            onSave={(next) => {
              setExcludedBatches(next);
              writePref("bi.excludedBatches", next);
              calcRef.current = { ...calcRef.current, excludedBatches: next };
              setBatchesOpen(false);
              load(fromDate, toDate);
            }}
          />
        </>
      ) : null}
    </TasksPageShell>
  );
}

// ---------- غير الموزعين وسجلهم ----------
const PAY_STATE = {
  paid: { label: "سدد القسط", color: "#16a34a" },
  low: { label: "سدد أقل من 250", color: "#ea580c" },
  none: { label: "لم يسدد", color: "#dc2626" }
};

function StudentsDialog({ view, onClose, userGuid, fromDate, toDate, calc }) {
  const p = useTasksPalette();
  const branch = view?.branch;
  const kind = view?.kind || "unassigned";
  const isExcluded = kind === "excluded";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [payFilter, setPayFilter] = useState("all");
  const [historyFor, setHistoryFor] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!view) return;
    setRows([]);
    setSearch("");
    setPayFilter("all");
    setHistoryFor(null);
    setLoading(true);
    const q = new URLSearchParams({ userGuid, branchGuid: view.branch.branchGuid, fromDate, toDate, kind: view.kind, ...calcParams(calc) });
    fetch(`${API}/students?${q}`, { cache: "no-store" })
      .then(readJson)
      .then((json) => setRows(json.data || []))
      .catch((e) => Swal.fire({ icon: "error", title: "خطأ", text: e.message, confirmButtonText: "حسنًا", target: document.body }))
      .finally(() => setLoading(false));
    // calc يتغير مرجعه كل رسم؛ الحوار يُفتح من جديد بعد أي تغيير في طريقة الاحتساب
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, userGuid, fromDate, toDate]);

  const openHistory = async (row) => {
    setHistoryFor(row);
    setHistory([]);
    setHistoryLoading(true);
    try {
      const q = new URLSearchParams({ userGuid, studentLevelGuid: row.studentLevelGuid });
      const json = await readJson(await fetch(`${API}/student-history?${q}`, { cache: "no-store" }));
      setHistory(json.data || []);
    } catch (e) {
      Swal.fire({ icon: "error", title: "خطأ", text: e.message, confirmButtonText: "حسنًا", target: document.body });
    } finally {
      setHistoryLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim();
    return rows.filter(
      (r) =>
        (payFilter === "all" || r.paymentState === payFilter) &&
        (!term || r.studentName.includes(term) || r.nationalId.includes(term) || r.phone.includes(term) || (r.lastTrainer || "").includes(term))
    );
  }, [rows, search, payFilter]);

  const counts = useMemo(() => {
    const c = { paid: 0, low: 0, none: 0, removed: 0 };
    rows.forEach((r) => { c[r.paymentState] += 1; if (r.removedAt) c.removed += 1; });
    return c;
  }, [rows]);

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(isExcluded ? "المستبعدون" : "غير الموزعين", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
    ws.columns = [
      { header: "الطالب", key: "a", width: 30 }, { header: "الهوية", key: "b", width: 14 }, { header: "الجوال", key: "c", width: 14 },
      { header: "الدبلوم", key: "d", width: 32 }, { header: "الدفعة", key: "e", width: 12 }, { header: isExcluded ? "سبب الاستبعاد" : "مسؤول الاتصال الحالي", key: "f", width: 18 },
      { header: "القسط في الفترة", key: "g", width: 14 }, { header: "حالة السداد", key: "h", width: 16 },
      { header: "آخر مسؤول اتصال", key: "i", width: 28 }, { header: "أُزيل في", key: "j", width: 18 }, { header: "بواسطة", key: "k", width: 34 }, { header: "مصدر الاستبعاد", key: "l", width: 24 }
    ];
    filtered.forEach((r) => ws.addRow({
      a: r.studentName, b: r.nationalId, c: r.phone, d: r.diplomName, e: r.batchName, f: isExcluded ? r.excludedReason : (r.currentTrainer || ""), g: r.monthPaid,
      h: PAY_STATE[r.paymentState].label, i: r.lastTrainer || "", j: fmtDateTime(r.removedAt), k: r.removedBy || "", l: r.excludedSource || ""
    }));
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF057546" } };
    saveAs(new Blob([await wb.xlsx.writeBuffer()]), `${isExcluded ? "المستبعدون" : "غير الموزعين"} - ${branch.name} - ${toDate}.xlsx`);
  };

  return (
    <Dialog open={Boolean(view)} onClose={onClose} fullWidth maxWidth="lg" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
        {historyFor ? (
          <IconButton size="small" onClick={() => setHistoryFor(null)} aria-label="رجوع"><ArrowForwardIcon /></IconButton>
        ) : null}
        {historyFor
          ? `سجل ملف ${historyFor.studentName}`
          : `${isExcluded ? "المستبعدون من النسبة" : "الطلاب غير الموزعين"} · ${branch?.name || ""}`}
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 420 }}>
        {historyFor ? (
          <>
            <Typography sx={{ fontSize: 13, color: p.muted, mb: 1.5 }}>
              {historyFor.diplomName} · دفعة {historyFor.batchName} · الهوية {historyFor.nationalId}. السجل التفصيلي يبدأ من 11/10/2026، وما قبله يظهر كحالة أولى.
            </Typography>
            {historyLoading ? <CenterLoader /> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={headSx}>من</TableCell>
                    <TableCell sx={headSx}>إلى</TableCell>
                    <TableCell sx={headSx}>مسؤول الاتصال</TableCell>
                    <TableCell sx={headSx}>الحالة</TableCell>
                    <TableCell sx={headSx}>الفرع</TableCell>
                    <TableCell sx={headSx}>التغيير بواسطة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell sx={numSx}>{h.isBaseline ? "قبل بداية السجل" : fmtDateTime(h.validFrom)}</TableCell>
                      <TableCell sx={numSx}>{h.validTo ? fmtDateTime(h.validTo) : <Chip size="small" label="الحالية" color="primary" variant="outlined" />}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: h.trainerName ? p.text : "#ea580c" }}>{h.trainerName || "بدون مسؤول اتصال"}</TableCell>
                      <TableCell>{h.caseName || "—"}</TableCell>
                      <TableCell>{h.branchName || "—"}</TableCell>
                      <TableCell>{h.isBaseline ? "—" : h.changedBy || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </>
        ) : (
          <>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} sx={{ mb: 1.5 }}>
              <TextField
                size="small" placeholder="بحث بالاسم أو الهوية أو الجوال أو آخر مسؤول" value={search} onChange={(e) => setSearch(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                sx={{ minWidth: 320 }}
              />
              <ToggleButtonGroup size="small" exclusive value={payFilter} onChange={(_, v) => v && setPayFilter(v)}>
                <ToggleButton value="all">الكل ({int(rows.length)})</ToggleButton>
                <ToggleButton value="paid">سدد ({int(counts.paid)})</ToggleButton>
                <ToggleButton value="low">أقل من 250 ({int(counts.low)})</ToggleButton>
                <ToggleButton value="none">لم يسدد ({int(counts.none)})</ToggleButton>
              </ToggleButtonGroup>
              <Box sx={{ flex: 1 }} />
              <Button size="small" variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!filtered.length}>
                Excel
              </Button>
            </Stack>
            <Typography sx={{ fontSize: 12.5, color: p.muted, mb: 1 }}>
              {isExcluded
                ? "طلاب مستمرون في الفرع لا يدخلون في النسبة: حالة سدادهم في النظام ليست «مستحق السداد»، أو ليس عليهم شيء في كشف الحساب، أو في دفعة مستبعدة."
                : `${int(counts.removed)} منهم كان لهم مسؤول اتصال وأُزيل، والباقون بلا مسؤول منذ بداية السجل. الحالة حسب آخر يوم في الفترة.`}
            </Typography>
            {loading ? <CenterLoader /> : (
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headSx}>الطالب</TableCell>
                      <TableCell sx={headSx}>الدبلوم والدفعة</TableCell>
                      <TableCell sx={headSx}>{isExcluded ? "سبب الاستبعاد" : "الحالة"}</TableCell>
                      <TableCell sx={headSx}>القسط في الفترة</TableCell>
                      <TableCell sx={headSx}>آخر مسؤول اتصال</TableCell>
                      <TableCell sx={headSx}>أُزيل في / بواسطة</TableCell>
                      <TableCell sx={headSx}>السجل</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.studentLevelGuid} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>{r.studentName}</Typography>
                          <Typography sx={{ fontSize: 12, color: p.muted, ...numSx }}>{r.nationalId} · {r.phone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: 13 }}>{r.diplomName}</Typography>
                          <Typography sx={{ fontSize: 12, color: p.muted }}>دفعة {r.batchName}</Typography>
                        </TableCell>
                        <TableCell>
                          {isExcluded ? (
                            <>
                              <Chip size="small" label={r.excludedReason} sx={{ fontWeight: 700, color: "#7c3aed", bgcolor: "#7c3aed1a" }} />
                              {r.excludedSource ? <Typography sx={{ fontSize: 11.5, color: p.muted, mt: 0.25 }}>{r.excludedSource}</Typography> : null}
                            </>
                          ) : "مستمر"}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ ...numSx, fontWeight: 700 }}>{money(r.monthPaid)}</Typography>
                          <Typography sx={{ fontSize: 11.5, color: PAY_STATE[r.paymentState].color, fontWeight: 700 }}>{PAY_STATE[r.paymentState].label}</Typography>
                        </TableCell>
                        <TableCell>{r.lastTrainer || <Typography sx={{ fontSize: 13, color: p.muted }}>—</Typography>}</TableCell>
                        <TableCell>
                          {r.removedAt ? (
                            <>
                              <Typography sx={{ fontSize: 13, ...numSx }}>{fmtDateTime(r.removedAt)}</Typography>
                              <Typography sx={{ fontSize: 12, color: p.muted }}>{r.removedBy || "—"}</Typography>
                            </>
                          ) : <Typography sx={{ fontSize: 13, color: p.muted }}>—</Typography>}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="سجل الملف">
                            <IconButton size="small" onClick={() => openHistory(r)}><HistoryIcon fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- الدفعات المستبعدة ----------
function BatchesDialog({ open, onClose, userGuid, toDate, branches, value, onSave }) {
  const p = useTasksPalette();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState([]);
  const [expanded, setExpanded] = useState("");
  const branchName = useMemo(() => Object.fromEntries(branches.map((b) => [b.branchGuid, b.name])), [branches]);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setLoading(true);
    const q = new URLSearchParams({ userGuid, toDate });
    fetch(`${API}/batches?${q}`, { cache: "no-store" })
      .then(readJson)
      .then((json) => setBatches(json.data || []))
      .catch((e) => Swal.fire({ icon: "error", title: "خطأ", text: e.message, confirmButtonText: "حسنًا", target: document.body }))
      .finally(() => setLoading(false));
  }, [open, userGuid, toDate, value]);

  const has = (key) => draft.includes(key);
  const toggle = (key) => setDraft((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));
  const toggleAll = (batchGuid) =>
    setDraft((cur) => {
      const allKey = `*:${batchGuid}`;
      const rest = cur.filter((k) => !k.endsWith(`:${batchGuid}`));
      return cur.includes(allKey) ? rest : [...rest, allKey];
    });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800 }}>الدفعات المستبعدة من نسبة الفرع</DialogTitle>
      <DialogContent dividers>
        <Typography sx={{ fontSize: 13, color: p.muted, mb: 1.5 }}>
          استبعد الدفعات الجديدة أو أي دفعة لا يصح احتسابها، من كل الفروع أو من فروع محددة. الأعداد للطلاب المستمرين في كل دفعة.
        </Typography>
        {loading ? <CenterLoader /> : batches.map((ba) => {
          const all = has(`*:${ba.batchGuid}`);
          const some = !all && draft.some((k) => k.endsWith(`:${ba.batchGuid}`));
          return (
            <Box key={ba.batchGuid} sx={{ py: 0.75, borderBottom: `1px solid ${p.border}` }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <FormControlLabel
                  control={<Checkbox checked={all} indeterminate={some} onChange={() => toggleAll(ba.batchGuid)} />}
                  label={
                    <Typography sx={{ fontWeight: 700 }}>
                      دفعة {ba.batchName} <Typography component="span" sx={{ fontSize: 12.5, color: p.muted }}>· {int(ba.students)} طالب في {ba.branches.length} فرع</Typography>
                    </Typography>
                  }
                />
                <Button size="small" onClick={() => setExpanded(expanded === ba.batchGuid ? "" : ba.batchGuid)}>
                  {expanded === ba.batchGuid ? "إخفاء الفروع" : "فروع محددة"}
                </Button>
              </Stack>
              {expanded === ba.batchGuid ? (
                <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ pr: 4, pb: 0.5 }}>
                  {ba.branches.map((br) => {
                    const on = all || has(`${br.branchGuid}:${ba.batchGuid}`);
                    return (
                      <Chip
                        key={br.branchGuid}
                        label={`${branchName[br.branchGuid] || "فرع"} (${int(br.students)})`}
                        clickable={!all}
                        onClick={all ? undefined : () => toggle(`${br.branchGuid}:${ba.batchGuid}`)}
                        color={on ? "error" : "default"}
                        variant={on ? "filled" : "outlined"}
                      />
                    );
                  })}
                </Stack>
              ) : null}
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDraft([])}>إلغاء كل الاستبعاد</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>رجوع</Button>
        <Button variant="contained" onClick={() => onSave(draft)}>تطبيق وإعادة الحساب</Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------- التصدير ----------
function ExportDialog({ open, onClose, data }) {
  const [format, setFormat] = useState("excel");
  const [sections, setSections] = useState({ summary: true, branches: true });
  const [pick, setPick] = useState(DEFAULT_PICK);
  const [labels, setLabels] = useState({}); // تعديل أسماء البنود والأعمدة: { "branches.rate": "..." }
  const [excluded, setExcluded] = useState([]); // فروع مستبعدة من التصدير
  const [title, setTitle] = useState("الدخل ونسب الفروع");
  const [subtitle, setSubtitle] = useState("");
  const [footer, setFooter] = useState("المعهد السعودي المتخصص العالي للتدريب");
  const [editLabels, setEditLabels] = useState(false);
  const [busy, setBusy] = useState(false);
  const imageRef = useRef(null);

  const period = `من ${fmtDate(data.fromDate)} إلى ${fmtDate(data.toDate)}`;
  useEffect(() => { if (open) setSubtitle(`الفترة ${period}`); }, [open, period]);

  const label = (section, f) => labels[`${section}.${f.key}`] ?? f.label;
  const chosen = (section, fields) => fields.filter((f) => pick[section].includes(f.key));
  const toggleField = (section, key) =>
    setPick((cur) => ({ ...cur, [section]: cur[section].includes(key) ? cur[section].filter((k) => k !== key) : [...cur[section], key] }));

  const exportBranches = data.branches.filter((b) => !excluded.includes(b.branchGuid));
  const groups = [
    { key: "summary", title: "ملخص المعهد", fields: SUMMARY_FIELDS },
    { key: "branches", title: "الفروع ومشرفوها", fields: BRANCH_FIELDS }
  ];
  const canExport = groups.some((g) => sections[g.key] && pick[g.key].length);
  const fileBase = `${title || "الدخل ونسب الفروع"} ${data.fromDate} إلى ${data.toDate}`;

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const header = (ws) => {
      ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF057546" } };
    };
    if (sections.summary && pick.summary.length) {
      const ws = wb.addWorksheet("ملخص المعهد", { views: [{ rightToLeft: true }] });
      ws.columns = [{ header: title || "البند", key: "k", width: 34 }, { header: subtitle || "القيمة", key: "v", width: 30 }];
      chosen("summary", SUMMARY_FIELDS).forEach((f) => ws.addRow({ k: label("summary", f), v: f.get(data) }));
      ws.getColumn(2).numFmt = "#,##0.##";
      header(ws);
    }
    if (sections.branches && pick.branches.length) {
      const cols = chosen("branches", BRANCH_FIELDS);
      const ws = wb.addWorksheet("الفروع", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
      ws.columns = cols.map((c) => ({ header: label("branches", c), key: c.key, width: Math.max(14, label("branches", c).length + 4) }));
      exportBranches.forEach((b) => ws.addRow(Object.fromEntries(cols.map((c) => [c.key, c.get(b)]))));
      cols.forEach((c, i) => { if (c.num) ws.getColumn(i + 1).numFmt = "#,##0.##"; });
      header(ws);
    }
    saveAs(new Blob([await wb.xlsx.writeBuffer()]), `${fileBase}.xlsx`);
  };

  const exportImage = async () => {
    if (!imageRef.current) return;
    const url = await toPng(imageRef.current, { pixelRatio: 2, backgroundColor: "#ffffff", cacheBust: true });
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileBase}.png`;
    a.click();
  };

  const run = async () => {
    setBusy(true);
    try {
      if (format === "excel") await exportExcel();
      else await exportImage();
      onClose();
    } catch (e) {
      Swal.fire({ icon: "error", title: "تعذّر التصدير", text: e.message, confirmButtonText: "حسنًا", target: document.body });
    } finally {
      setBusy(false);
    }
  };

  const cell = { border: "1px solid #dfe7e2", padding: "8px 10px", fontSize: 14, textAlign: "right", whiteSpace: "nowrap" };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ fontWeight: 800 }}>تصدير الدخل ونسب الفروع</DialogTitle>
      <DialogContent dividers>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 700 }}>الصيغة:</Typography>
          <ToggleButtonGroup size="small" exclusive value={format} onChange={(_, v) => v && setFormat(v)}>
            <ToggleButton value="excel">Excel</ToggleButton>
            <ToggleButton value="image">صورة</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack spacing={1.5} sx={{ mb: 2 }}>
          <TextField size="small" label="العنوان" value={title} onChange={(e) => setTitle(e.target.value)} />
          <TextField size="small" label="الوصف تحت العنوان" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          {format === "image" ? <TextField size="small" label="النص الجانبي في الصورة" value={footer} onChange={(e) => setFooter(e.target.value)} /> : null}
        </Stack>

        {groups.map((g) => (
          <Box key={g.key} sx={{ mb: 2, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, opacity: sections[g.key] ? 1 : 0.6 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <FormControlLabel
                control={<Checkbox checked={sections[g.key]} onChange={(e) => setSections((s) => ({ ...s, [g.key]: e.target.checked }))} />}
                label={<Typography sx={{ fontWeight: 800 }}>{g.title}</Typography>}
              />
              <Stack direction="row" spacing={1}>
                <Button size="small" disabled={!sections[g.key]} onClick={() => setPick((c) => ({ ...c, [g.key]: g.fields.map((f) => f.key) }))}>الكل</Button>
                <Button size="small" disabled={!sections[g.key]} onClick={() => setPick((c) => ({ ...c, [g.key]: [] }))}>لا شيء</Button>
              </Stack>
            </Stack>
            <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 0.5 }}>
              {g.fields.map((f) => (
                <Chip
                  key={f.key}
                  label={label(g.key, f)}
                  disabled={!sections[g.key]}
                  clickable
                  onClick={() => toggleField(g.key, f.key)}
                  color={pick[g.key].includes(f.key) ? "primary" : "default"}
                  variant={pick[g.key].includes(f.key) ? "filled" : "outlined"}
                />
              ))}
            </Stack>
          </Box>
        ))}

        <Box sx={{ mb: 2, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, opacity: sections.branches ? 1 : 0.6 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 800 }}>الفروع في التصدير ({exportBranches.length} من {data.branches.length})</Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" onClick={() => setExcluded([])}>الكل</Button>
              <Button size="small" onClick={() => setExcluded(data.branches.map((b) => b.branchGuid))}>لا شيء</Button>
            </Stack>
          </Stack>
          <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.75} sx={{ mt: 0.5 }}>
            {data.branches.map((b) => {
              const on = !excluded.includes(b.branchGuid);
              return (
                <Chip
                  key={b.branchGuid} label={b.name} clickable
                  onClick={() => setExcluded((cur) => (on ? [...cur, b.branchGuid] : cur.filter((g) => g !== b.branchGuid)))}
                  color={on ? "primary" : "default"} variant={on ? "filled" : "outlined"}
                />
              );
            })}
          </Stack>
        </Box>

        <Box sx={{ mb: 2, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <FormControlLabel
            control={<Checkbox checked={editLabels} onChange={(e) => setEditLabels(e.target.checked)} />}
            label={<Typography sx={{ fontWeight: 800 }}>تعديل أسماء البنود والأعمدة المختارة</Typography>}
          />
          {editLabels ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mt: 1 }}>
              {groups.flatMap((g) =>
                sections[g.key]
                  ? chosen(g.key, g.fields).map((f) => (
                      <TextField
                        key={`${g.key}.${f.key}`} size="small" label={f.label}
                        value={label(g.key, f)}
                        onChange={(e) => setLabels((cur) => ({ ...cur, [`${g.key}.${f.key}`]: e.target.value }))}
                      />
                    ))
                  : []
              )}
            </Box>
          ) : null}
        </Box>

        {format === "image" ? (
          <>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>معاينة الصورة</Typography>
            <Box sx={{ maxHeight: 420, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#fff" }}>
              <div ref={imageRef} dir="rtl" style={{ background: "#fff", color: "#14261d", padding: 28, fontFamily: "Cairo, Tahoma, sans-serif", width: "max-content", minWidth: 760 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24, borderBottom: "3px solid #057546", paddingBottom: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>{title}</div>
                    {subtitle ? <div style={{ fontSize: 14, color: "#5b6b62", marginTop: 4 }}>{subtitle}</div> : null}
                  </div>
                  {footer ? <div style={{ fontSize: 13, color: "#5b6b62" }}>{footer}</div> : null}
                </div>
                {sections.summary && pick.summary.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
                    {chosen("summary", SUMMARY_FIELDS).map((f) => {
                      const v = f.get(data);
                      return (
                        <div key={f.key} style={{ border: "1px solid #dfe7e2", borderTop: "3px solid #057546", borderRadius: 8, padding: "10px 14px", minWidth: 160 }}>
                          <div style={{ fontSize: 12.5, color: "#5b6b62" }}>{label("summary", f)}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{f.num ? money(v) : v}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {sections.branches && pick.branches.length ? (
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr>{chosen("branches", BRANCH_FIELDS).map((c) => <th key={c.key} style={{ ...cell, background: "#057546", color: "#fff", fontWeight: 700 }}>{label("branches", c)}</th>)}</tr>
                    </thead>
                    <tbody>
                      {exportBranches.map((b, i) => (
                        <tr key={b.branchGuid} style={{ background: i % 2 ? "#f6faf8" : "#fff" }}>
                          {chosen("branches", BRANCH_FIELDS).map((c) => {
                            const v = c.get(b);
                            return <td key={c.key} style={{ ...cell, color: c.key === "rate" ? tierColor(b.rate) : undefined, fontWeight: c.key === "rate" ? 800 : 400 }}>{c.num ? money(v) : v}</td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            </Box>
          </>
        ) : null}
        <Divider sx={{ mt: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="contained" onClick={run} disabled={busy || !canExport} startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <FileDownloadIcon />}>
          تصدير {format === "excel" ? "Excel" : "صورة"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
