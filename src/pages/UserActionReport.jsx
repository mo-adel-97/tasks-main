// نشاط المستخدمين: مين عمل إيه وإمتى ومن أنهي جهاز.
// - الجريد بفلاتر في رأس كل عمود (نفس متابعة السداد والخريجين) + بحث سريع، وvirtualization للسرعة.
// - الجهاز الحقيقي للويب (نوع الجهاز · النظام · المتصفح) + IP + معرّف ثابت للجهاز، بدل جهاز السيرفر.
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@mui/material";
import { GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CloseIcon from "@mui/icons-material/Close";
import DevicesIcon from "@mui/icons-material/Devices";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import FilterableDataGrid from "../components/columnFilters/FilterableDataGrid";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { getClientFingerprint, getClientFingerprintParts, getDeviceId } from "../security/apiAuth";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const primary = "#057546";
const primaryDark = "#034d31";

const SOURCE = {
  Web: { label: "الويب", color: "#2563eb" },
  WebServer: { label: "الويب (قبل تسجيل الجهاز)", color: "#64748b" },
  Desktop: { label: "برنامج الديسكتوب", color: "#057546" },
  Other: { label: "أخرى", color: "#9ca3af" }
};

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};

const formatAt = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || "").trim();
  } catch {
    return "";
  }
};

const browserOf = (device) => {
  const m = String(device || "").match(/(Edge|Chrome|Firefox|Opera|Safari|Samsung Internet)/);
  return m ? m[1] : "";
};

const PRESETS = [
  { label: "اليوم", from: 0, to: 0 },
  { label: "أمس", from: 1, to: 1 },
  { label: "آخر 7 أيام", from: 6, to: 0 },
  { label: "آخر 30 يوم", from: 29, to: 0 }
];

const Toolbar = () => (
  <GridToolbarContainer sx={{ px: 1, py: 0.5 }}>
    <GridToolbarColumnsButton />
    <GridToolbarDensitySelector />
  </GridToolbarContainer>
);

// تفاصيل الحركة + الوصول للجهاز
const DetailsDialog = ({ row, onClose, onFilterDevice, onFilterUser }) => {
  if (!row) return null;
  const Info = ({ label, children, ltr }) => (
    <Stack direction="row" spacing={1} sx={{ py: 0.7, borderBottom: "1px dashed", borderColor: "divider" }}>
      <Typography sx={{ minWidth: 130, color: "text.secondary", fontSize: 13, fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, wordBreak: "break-word", direction: ltr ? "ltr" : "rtl", textAlign: "right", flex: 1 }}>{children || "—"}</Typography>
    </Stack>
  );
  const source = SOURCE[row.source] || SOURCE.Other;
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl", borderRadius: 3 } }}>
      <DialogTitle sx={{ color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})`, fontWeight: 900, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        تفاصيل الحركة
        <IconButton onClick={onClose} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Info label="التاريخ والوقت" ltr>{row.atText}</Info>
        <Info label="المستخدم">{row.user}</Info>
        <Info label="فرع المستخدم">{row.branch}</Info>
        <Info label="الشاشة / المستند">{row.screen}</Info>
        <Info label="الإجراء">{row.action}</Info>
        <Info label="رقم المستند" ltr>{row.code}</Info>
        <Info label="السبب">{row.reason}</Info>
        <Typography sx={{ fontWeight: 900, color: primary, mt: 2, mb: 0.5 }}>الجهاز</Typography>
        <Info label="المصدر"><Chip size="small" label={source.label} sx={{ color: "#fff", bgcolor: source.color, fontWeight: 800 }} /></Info>
        <Info label="الجهاز">{row.device}</Info>
        <Info label="عنوان IP" ltr>{row.ip}</Info>
        <Info label="معرّف الجهاز" ltr>{row.deviceId}</Info>
        <Info label="بصمة الجهاز" ltr>{row.fingerprint}</Info>
        {row.idChanged ? (
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ my: 1, fontWeight: 600 }}>
            نفس بصمة الجهاز ونفس المتصفح ظهروا بأكتر من معرّف في الفترة دي ({row.idCount} معرّفات) — غالبًا حد مسح بيانات المتصفح أو استخدم التصفح الخفي.
          </Alert>
        ) : null}
        <Info label="صفحة الويب" ltr>{row.page}</Info>
        <Info label="البرنامج" ltr>{row.program}</Info>
        <Info label="بيانات المتصفح" ltr>{row.agent}</Info>
        {row.source === "WebServer" ? (
          <Alert severity="info" sx={{ mt: 1.5, fontWeight: 600 }}>
            الحركة دي اتسجلت قبل تفعيل تسجيل جهاز المستخدم في الويب، فاسم الجهاز كان بيطلع جهاز السيرفر. الحركات الجديدة بتتسجل بالجهاز الحقيقي.
          </Alert>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5, gap: 1, flexWrap: "wrap" }}>
        <Button startIcon={<PersonSearchIcon />} onClick={() => onFilterUser(row.user)} sx={{ fontWeight: 800 }}>كل حركات المستخدم</Button>
        {row.fingerprint || row.deviceId || (row.ip && row.source !== "WebServer") ? (
          <Button variant="contained" startIcon={<DevicesIcon />} onClick={() => onFilterDevice(row)} sx={{ fontWeight: 800, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}>
            كل حركات نفس الجهاز
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
};

export default function UserActionReport() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [fromDate, setFromDate] = useState(daysAgo(0));
  const [toDate, setToDate] = useState(daysAgo(0));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [info, setInfo] = useState(null);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [details, setDetails] = useState(null);
  const [thisDevice, setThisDevice] = useState(null);

  const load = useCallback(async (from = fromDate, to = toDate) => {
    if (!from || !to) return;
    if (to < from) {
      Swal.fire({ icon: "warning", title: "تنبيه", text: "تاريخ النهاية لازم يكون بعد تاريخ البداية", confirmButtonText: "حسناً", confirmButtonColor: primary });
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/user-action-report/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userGuid: getUserGuid(), fromDate: from, toDate: to })
      });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.message || "تعذر تحميل نشاط المستخدمين");
      const columns = json.data.columns;
      const index = Object.fromEntries(columns.map((c, i) => [c, i]));
      const mapped = json.data.rows.map((r) => {
        const row = {};
        columns.forEach((c) => {
          row[c] = r[index[c]] ?? "";
        });
        row.atText = formatAt(row.at);
        row.sourceLabel = (SOURCE[row.source] || SOURCE.Other).label;
        row.deviceIdShort = row.deviceId ? String(row.deviceId).slice(0, 8) : "";
        row.fingerprintShort = row.fingerprint ? String(row.fingerprint).slice(0, 8) : "";
        return row;
      });
      // نفس البصمة + نفس المتصفح بأكتر من معرّف = المعرّف اتمسح واتعمل جديد.
      const ids = new Map();
      mapped.forEach((r) => {
        if (!r.fingerprint || !r.deviceId) return;
        const key = `${r.fingerprint}|${browserOf(r.device)}`;
        if (!ids.has(key)) ids.set(key, new Set());
        ids.get(key).add(r.deviceId);
      });
      mapped.forEach((r) => {
        const set = r.fingerprint && r.deviceId ? ids.get(`${r.fingerprint}|${browserOf(r.device)}`) : null;
        r.idCount = set ? set.size : 0;
        r.idChanged = r.idCount > 1;
        r.flag = r.idChanged ? "اتغيّر المعرّف" : "";
      });
      setRows(mapped);
      setInfo({ truncated: json.data.truncated, maxRows: json.data.maxRows, from, to });
    } catch (e) {
      setRows([]);
      Swal.fire({ icon: "error", title: "خطأ", text: e.message, confirmButtonText: "حسناً", confirmButtonColor: primary });
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const applyPreset = (preset) => {
    const from = daysAgo(preset.from);
    const to = daysAgo(preset.to);
    setFromDate(from);
    setToDate(to);
    load(from, to);
  };

  // البحث السريع قبل فلاتر الأعمدة
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.user, r.screen, r.action, r.code, r.reason, r.device, r.ip, r.deviceId, r.fingerprint, r.branch, r.page, r.atText].join(" ").toLowerCase().includes(q)
    );
  }, [rows, search]);

  // الصفوف بعد البحث وفلاتر الأعمدة (الجريد بيرجّعها).
  const stats = useMemo(() => {
    const list = filtered;
    return {
      total: list.length,
      users: new Set(list.map((r) => r.user).filter(Boolean)).size,
      devices: new Set(list.map((r) => r.fingerprint || r.deviceId || (r.source === "Desktop" ? r.device : "")).filter(Boolean)).size,
      flagged: new Set(list.filter((r) => r.idChanged).map((r) => r.fingerprint)).size,
      web: list.filter((r) => r.source === "Web" || r.source === "WebServer").length,
      desktop: list.filter((r) => r.source === "Desktop").length
    };
  }, [filtered]);

  const columns = useMemo(
    () => [
      { field: "atText", headerName: "التاريخ والوقت", width: 165, sortable: false },
      { field: "user", headerName: "المستخدم", width: 170 },
      { field: "branch", headerName: "فرع المستخدم", width: 150 },
      { field: "screen", headerName: "الشاشة / المستند", width: 190 },
      { field: "action", headerName: "الإجراء", width: 110 },
      { field: "code", headerName: "رقم المستند", width: 110 },
      { field: "reason", headerName: "السبب", width: 180 },
      {
        field: "sourceLabel",
        headerName: "المصدر",
        width: 150,
        renderCell: ({ row }) => {
          const s = SOURCE[row.source] || SOURCE.Other;
          return <Chip size="small" label={s.label} sx={{ color: "#fff", bgcolor: s.color, fontWeight: 800, maxWidth: "100%" }} />;
        }
      },
      { field: "device", headerName: "الجهاز", width: 260 },
      { field: "ip", headerName: "عنوان IP", width: 130 },
      { field: "deviceIdShort", headerName: "معرّف الجهاز", width: 110 },
      { field: "fingerprintShort", headerName: "بصمة الجهاز", width: 110 },
      {
        field: "flag",
        headerName: "تنبيه",
        width: 130,
        renderCell: ({ row }) =>
          row.idChanged ? (
            <Tooltip title="نفس البصمة ونفس المتصفح بأكتر من معرّف — غالبًا اتمسحت بيانات المتصفح">
              <Chip size="small" icon={<WarningAmberIcon />} label="اتغيّر المعرّف" color="warning" sx={{ fontWeight: 800 }} />
            </Tooltip>
          ) : null
      },
      { field: "page", headerName: "صفحة الويب", width: 190 },
      { field: "program", headerName: "البرنامج", width: 220 }
    ],
    []
  );

  const exportExcel = () => {
    const list = filtered;
    if (!list.length) return;
    const header = ["التاريخ والوقت", "المستخدم", "فرع المستخدم", "الشاشة / المستند", "الإجراء", "رقم المستند", "السبب", "المصدر", "الجهاز", "عنوان IP", "معرّف الجهاز", "صفحة الويب", "البرنامج", "بيانات المتصفح"];
    const data = list.map((r) => [r.atText, r.user, r.branch, r.screen, r.action, r.code, r.reason, r.sourceLabel, r.device, r.ip, r.deviceId, r.page, r.program, r.agent]);
    const sheet = XLSX.utils.aoa_to_sheet([header, ...data]);
    sheet["!views"] = [{ RTL: true }];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "نشاط المستخدمين");
    XLSX.writeFile(book, `UserActions_${info?.from || fromDate}_${info?.to || toDate}.xlsx`);
  };

  const filterDevice = (row) => {
    setSearch(row.fingerprint || row.deviceId || row.ip || row.device);
    setDetails(null);
  };

  const filterUser = (user) => {
    setSearch(user || "");
    setDetails(null);
  };

  return (
    <Box sx={{ direction: "rtl", p: { xs: 1, md: 2 }, display: "flex", flexDirection: "column", height: { md: "calc(100vh - 24px)" }, minHeight: 0 }}>
      <Paper elevation={0} sx={{ p: { xs: 1.2, md: 1.8 }, mb: 1.2, borderRadius: 3, border: "1px solid", borderColor: "divider", flexShrink: 0 }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ xs: "stretch", lg: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <ManageHistoryIcon sx={{ color: primary, fontSize: 34 }} />
            <Box>
              <Typography sx={{ fontWeight: 950, fontSize: "1.2rem", color: isDark ? "#9BE0C1" : primary }}>نشاط المستخدمين</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary" }}>
                مين عمل إيه وإمتى ومن أنهي جهاز — اضغط على أي سطر لتفاصيل الجهاز
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} flexWrap="wrap" useFlexGap>
            <TextField type="date" size="small" label="من" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} sx={{ width: { xs: "100%", sm: 160 } }} />
            <TextField type="date" size="small" label="إلى" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} sx={{ width: { xs: "100%", sm: 160 } }} />
            <Button
              variant="contained"
              onClick={() => load()}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
              sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
            >
              عرض
            </Button>
            <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!rows.length} sx={{ fontWeight: 900 }}>
              Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<FingerprintIcon />}
              onClick={() => setThisDevice({ deviceId: getDeviceId(), fingerprint: getClientFingerprint(), parts: getClientFingerprintParts() })}
              sx={{ fontWeight: 900 }}
            >
              بيانات هذا الجهاز
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ mt: 1.2 }} flexWrap="wrap" useFlexGap>
          {PRESETS.map((p) => (
            <Chip key={p.label} label={p.label} onClick={() => applyPreset(p)} variant="outlined" sx={{ fontWeight: 800 }} disabled={loading} />
          ))}
        </Stack>
      </Paper>

      {info?.truncated ? (
        <Alert severity="warning" sx={{ mb: 1, fontWeight: 700, flexShrink: 0 }}>
          الفترة فيها أكتر من {info.maxRows.toLocaleString("en-US")} حركة — اتعرض أحدث {info.maxRows.toLocaleString("en-US")}. ضيّق الفترة لو محتاج الأقدم.
        </Alert>
      ) : null}

      <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between" sx={{ mb: 1, flexShrink: 0 }}>
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <Chip label={`الحركات: ${stats.total.toLocaleString("en-US")}`} sx={{ fontWeight: 900 }} />
          <Chip label={`المستخدمين: ${stats.users}`} variant="outlined" sx={{ fontWeight: 800 }} />
          <Chip label={`الأجهزة: ${stats.devices}`} variant="outlined" sx={{ fontWeight: 800 }} />
          {stats.flagged ? (
            <Chip icon={<WarningAmberIcon />} label={`أجهزة اتغيّر معرّفها: ${stats.flagged}`} color="warning" sx={{ fontWeight: 800 }} onClick={() => setSearch("")} />
          ) : null}
          <Chip label={`الويب: ${stats.web.toLocaleString("en-US")}`} variant="outlined" sx={{ fontWeight: 800, color: SOURCE.Web.color, borderColor: SOURCE.Web.color }} />
          <Chip label={`الديسكتوب: ${stats.desktop.toLocaleString("en-US")}`} variant="outlined" sx={{ fontWeight: 800, color: SOURCE.Desktop.color, borderColor: SOURCE.Desktop.color }} />
        </Stack>
        <TextField
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث سريع: مستخدم، مستند، جهاز، IP..."
          sx={{ width: { xs: "100%", md: 340 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            endAdornment: search ? (
              <InputAdornment position="end">
                <Tooltip title="مسح"><IconButton size="small" onClick={() => setSearch("")}><CloseIcon fontSize="small" /></IconButton></Tooltip>
              </InputAdornment>
            ) : null
          }}
        />
      </Stack>

      <Paper elevation={0} sx={{ flex: 1, minHeight: 420, borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden", display: "flex" }}>
        <FilterableDataGrid
          rows={searched}
          columns={columns}
          loading={loading}
          density="compact"
          rowHeight={40}
          columnHeaderHeight={46}
          disableRowSelectionOnClick
          onRowClick={({ row }) => setDetails(row)}
          onFilteredRowsChange={setFiltered}
          initialState={{ columns: { columnVisibilityModel: { program: false, page: false } } }}
          pageSizeOptions={[50, 100, 200]}
          slots={{ toolbar: Toolbar }}
          localeText={{ noRowsLabel: rows.length ? "لا توجد نتائج مطابقة" : "اختر الفترة واضغط عرض" }}
          sx={{
            border: 0,
            direction: "rtl",
            "& .MuiDataGrid-row": { cursor: "pointer" },
            "& .MuiDataGrid-columnHeaders": { bgcolor: isDark ? "rgba(5,117,70,.25)" : "rgba(5,117,70,.08)", fontWeight: 900 }
          }}
        />
      </Paper>

      <DetailsDialog row={details} onClose={() => setDetails(null)} onFilterDevice={filterDevice} onFilterUser={filterUser} />

      <Dialog open={Boolean(thisDevice)} onClose={() => setThisDevice(null)} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl", borderRadius: 3 } }}>
        <DialogTitle sx={{ color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})`, fontWeight: 900, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          بيانات هذا الجهاز
          <IconButton onClick={() => setThisDevice(null)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 1.5, fontWeight: 600 }}>
            دي بصمة ومعرّف الجهاز اللي انت قاعد عليه دلوقتي. اضغط "كل حركات الجهاز ده" لعرض كل اللي اتعمل منه في الفترة المختارة وبأي حسابات.
          </Alert>
          {[
            ["بصمة الجهاز", thisDevice?.fingerprint],
            ["معرّف الجهاز", thisDevice?.deviceId],
            ["كارت الشاشة", thisDevice?.parts?.gpu],
            ["أنوية المعالج", thisDevice?.parts?.cores],
            ["الرامات (تقريبي)", thisDevice?.parts?.memory ? `${thisDevice.parts.memory} GB` : ""],
            ["الشاشة", thisDevice?.parts?.screen],
            ["المنطقة الزمنية", thisDevice?.parts?.timezone]
          ].map(([label, value]) => (
            <Stack key={label} direction="row" spacing={1} sx={{ py: 0.7, borderBottom: "1px dashed", borderColor: "divider" }}>
              <Typography sx={{ minWidth: 130, color: "text.secondary", fontSize: 13, fontWeight: 700 }}>{label}</Typography>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, direction: "ltr", textAlign: "right", flex: 1, wordBreak: "break-all" }}>{value || "—"}</Typography>
            </Stack>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            variant="contained"
            startIcon={<DevicesIcon />}
            disabled={!thisDevice?.fingerprint && !thisDevice?.deviceId}
            onClick={() => {
              setSearch(thisDevice.fingerprint || thisDevice.deviceId);
              setThisDevice(null);
              if (!rows.length) load();
            }}
            sx={{ fontWeight: 800, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
          >
            كل حركات الجهاز ده
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
