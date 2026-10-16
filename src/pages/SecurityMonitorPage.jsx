// مراقبة الأمان — لمدير النظام فقط (يوزر sa) + كلمة مرور خاصة بالشاشة.
// الحماية الحقيقية في السيرفر (api/security-monitor): الهوية من التوكن، وكلمة المرور hash في الإعدادات،
// والجلسة مؤقتة ومربوطة بنفس الجهاز (IP). مفيش أي بيانات بتتعرض قبل كلمة المرور.
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
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@mui/material";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import FilterableDataGrid from "../components/columnFilters/FilterableDataGrid";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const primary = "#057546";
const primaryDark = "#034d31";

// جلسة الشاشة في الذاكرة بس (مش localStorage): تحديث الصفحة = كلمة المرور تاني.
let monitorSession = "";

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
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const num = (v) => Number(v || 0).toLocaleString("en-US");

const call = async (path, { method = "GET", body } = {}) => {
  const res = await fetch(`${API_BASE_URL}/api/security-monitor/${path}`, {
    method,
    cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Monitor-Session": monitorSession },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.message || "تعذر الاتصال بالخادم");
    error.status = res.status;
    throw error;
  }
  return data;
};

const REASONS = [
  [/Password did not match/i, "كلمة المرور خاطئة"],
  [/Could not find a login/i, "اسم المستخدم غير موجود"],
  [/account is disabled/i, "المستخدم معطّل"],
  [/locked out/i, "المستخدم مقفول"],
  [/password has expired/i, "كلمة المرور منتهية"],
  [/Failed to open the explicitly specified database/i, "قاعدة البيانات المطلوبة غير متاحة"]
];
const reasonText = (r) => {
  if (!r) return "";
  const hit = REASONS.find(([re]) => re.test(r));
  return hit ? hit[1] : r;
};

const KINDS = {
  visit: { label: "فتح شاشة", color: "#2563eb" },
  "denied-page": { label: "محاولة فتح شاشة غير مسموحة", color: "#d97706" },
  "denied-api": { label: "عملية رفضها الخادم", color: "#dc2626" },
  "unauth-api": { label: "طلب بدون جلسة صالحة", color: "#64748b" },
  "token-blocked": { label: "طلب مرفوض: توكن غير صالح", color: "#b91c1c" },
  "token-would-block": { label: "طلب سيُرفض عند تفعيل التحقق الكامل", color: "#a16207" },
  action: { label: "حركة على مستند", color: primary },
  "monitor-ok": { label: "دخول شاشة المراقبة", color: "#7c3aed" },
  "monitor-fail": { label: "كلمة مرور خاطئة لشاشة المراقبة", color: "#dc2626" },
  "monitor-locked": { label: "محاولة أثناء قفل شاشة المراقبة", color: "#dc2626" },
  "monitor-denied": { label: "محاولة فتح شاشة المراقبة بدون صلاحية", color: "#dc2626" }
};
const KindChip = ({ kind }) => {
  const k = KINDS[kind] || { label: kind, color: "#9ca3af" };
  return <Chip size="small" label={k.label} sx={{ color: "#fff", bgcolor: k.color, fontWeight: 800, maxWidth: "100%" }} />;
};

const LEVELS = {
  high: { label: "خطير", color: "#dc2626" },
  medium: { label: "متوسط", color: "#d97706" },
  low: { label: "عادي", color: "#64748b" }
};

const OriginChip = ({ origin }) =>
  origin === "local" ? (
    <Chip size="small" label="من خادم قاعدة البيانات نفسه" sx={{ bgcolor: "#e0e7ff", color: "#3730a3", fontWeight: 800 }} />
  ) : origin === "internal" ? (
    <Chip size="small" label="من جهة معروفة لدينا" sx={{ bgcolor: "#dcfce7", color: "#166534", fontWeight: 800 }} />
  ) : (
    <Chip size="small" label="خارجي — غير معروف" sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 800 }} />
  );

const gridSx = (isDark) => ({
  border: 0,
  direction: "rtl",
  "& .MuiDataGrid-columnHeaders": { bgcolor: isDark ? "rgba(5,117,70,.25)" : "rgba(5,117,70,.08)", fontWeight: 900 },
  "& .MuiDataGrid-cell": { alignItems: "center" }
});

const Grid = ({ rows, columns, loading, height = 560, empty = "لا توجد بيانات", hidden, small }) => {
  const theme = useTheme();
  return (
    <Box sx={{ height, width: "100%" }}>
      <FilterableDataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        density="compact"
        rowHeight={42}
        columnHeaderHeight={46}
        disableRowSelectionOnClick
        disableVirtualization={Boolean(small)}
        pageSizeOptions={[50, 100, 200]}
        initialState={{ pagination: { paginationModel: { pageSize: 100 } }, columns: { columnVisibilityModel: hidden || {} } }}
        localeText={{ noRowsLabel: empty }}
        sx={gridSx(theme.palette.mode === "dark")}
      />
    </Box>
  );
};

const StatCard = ({ title, value, sub, color = primary, onClick }) => (
  <Paper
    onClick={onClick}
    sx={{ p: 2, borderRadius: 3, flex: "1 1 190px", minWidth: 170, borderTop: `4px solid ${color}`, cursor: onClick ? "pointer" : "default" }}
  >
    <Typography sx={{ fontSize: 13, fontWeight: 800, color: "text.secondary" }}>{title}</Typography>
    <Typography sx={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1.3 }}>{value}</Typography>
    {sub ? <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>{sub}</Typography> : null}
  </Paper>
);

const DateRange = ({ from, to, setFrom, setTo, onLoad, loading, children }) => (
  <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} sx={{ mb: 1.5 }} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
    <TextField size="small" type="date" label="من" value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
    <TextField size="small" type="date" label="إلى" value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
    {children}
    <Button variant="contained" onClick={onLoad} disabled={loading} startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />} sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}>
      عرض
    </Button>
  </Stack>
);

// ===================== شاشة كلمة المرور =====================

const PasswordGate = ({ gate, onUnlocked }) => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await call("unlock", { method: "POST", body: { password } });
      monitorSession = data.token;
      setPassword("");
      onUnlocked(data.expiresAt);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper component="form" onSubmit={submit} sx={{ p: 4, borderRadius: 4, width: "100%", maxWidth: 420, textAlign: "center" }}>
        <Box sx={{ width: 72, height: 72, borderRadius: "50%", mx: "auto", mb: 2, display: "grid", placeItems: "center", color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})` }}>
          <LockRoundedIcon sx={{ fontSize: 36 }} />
        </Box>
        <Typography sx={{ fontWeight: 900, fontSize: 22, mb: 0.5 }}>مراقبة الأمان</Typography>
        <Typography sx={{ color: "text.secondary", fontSize: 14, mb: 2.5 }}>هذه الشاشة محمية بكلمة مرور خاصة. أدخلها للمتابعة.</Typography>
        {!gate.configured ? (
          <Alert severity="warning" sx={{ textAlign: "right", fontWeight: 600 }}>لم يتم ضبط كلمة مرور الشاشة بعد في إعدادات الخادم.</Alert>
        ) : (
          <>
            {gate.lockedUntil ? (
              <Alert severity="error" sx={{ mb: 2, textAlign: "right", fontWeight: 600 }}>
                الشاشة مقفلة بسبب محاولات خاطئة متكررة حتى {formatAt(gate.lockedUntil)}.
              </Alert>
            ) : null}
            <TextField
              fullWidth
              autoFocus
              type={show ? "text" : "password"}
              label="كلمة مرور الشاشة"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              inputProps={{ "aria-label": "كلمة مرور الشاشة", dir: "ltr" }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShow((v) => !v)} edge="end" aria-label={show ? "إخفاء" : "إظهار"}>
                      {show ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {error ? <Alert severity="error" sx={{ mt: 1.5, textAlign: "right", fontWeight: 600 }}>{error}</Alert> : null}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={busy || !password}
              startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <LockOpenRoundedIcon />}
              sx={{ mt: 2, py: 1.2, fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
            >
              دخول
            </Button>
            <Typography sx={{ mt: 1.5, fontSize: 12, color: "text.secondary" }}>
              تُسجَّل كل محاولة دخول، وتُقفل الشاشة 30 دقيقة بعد 5 محاولات خاطئة.
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

// ===================== التبويبات =====================

const Bars = ({ series, hours }) => {
  const max = Math.max(1, ...series.map((s) => s.count));
  if (!series.length) return <Typography sx={{ color: "text.secondary", fontSize: 13, py: 3, textAlign: "center" }}>لا توجد محاولات في هذه الفترة</Typography>;
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: "2px", height: 140, direction: "ltr", px: 1 }}>
      {series.map((s) => {
        const d = new Date(s.at);
        const label = hours > 72 ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : `${pad(d.getHours())}:00 ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
        return (
          <Tooltip key={s.at} title={`${label} — ${num(s.count)} محاولة`}>
            <Box sx={{ flex: 1, minWidth: 3, height: `${Math.max(2, (s.count / max) * 100)}%`, bgcolor: "#dc2626", opacity: 0.85, borderRadius: "3px 3px 0 0" }} />
          </Tooltip>
        );
      })}
    </Box>
  );
};

const Warnings = ({ warnings }) =>
  warnings?.length ? (
    <Stack spacing={1} sx={{ mb: 2 }}>
      {warnings.map((w, i) => (
        <Alert key={i} severity={w.level === "high" ? "error" : "warning"} icon={<WarningAmberIcon />} sx={{ fontWeight: 600 }}>
          {w.text}
        </Alert>
      ))}
    </Stack>
  ) : (
    <Alert severity="success" sx={{ mb: 2, fontWeight: 700 }}>لا توجد ملاحظات أمنية على إعدادات السيرفر.</Alert>
  );

const OverviewTab = ({ onError, goTab }) => {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, s] = await Promise.all([call(`overview?hours=${hours}`), call("server-status")]);
      setData(o);
      setStatus(s);
    } catch (e) {
      onError(e);
    } finally {
      setLoading(false);
    }
  }, [hours, onError]);

  useEffect(() => {
    load();
  }, [load]);

  const topRows = useMemo(() => (data?.topIps || []).map((r, i) => ({ id: i, ...r })), [data]);

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} alignItems="center" flexWrap="wrap" useFlexGap>
        {[
          [24, "آخر 24 ساعة"],
          [24 * 7, "آخر 7 أيام"],
          [24 * 30, "آخر 30 يومًا"]
        ].map(([h, label]) => (
          <Chip key={h} label={label} clickable color={hours === h ? "primary" : "default"} variant={hours === h ? "filled" : "outlined"} onClick={() => setHours(h)} sx={{ fontWeight: 800 }} />
        ))}
        <IconButton onClick={load} disabled={loading} aria-label="تحديث">{loading ? <CircularProgress size={20} /> : <RefreshIcon />}</IconButton>
        {data?.collector?.xe ? <Typography sx={{ fontSize: 12, color: "text.secondary" }}>آخر تجميع: {formatAt(data.collector.xe)}</Typography> : null}
      </Stack>

      {status ? <Warnings warnings={status.warnings} /> : null}

      {data ? (
        <>
          <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
            <StatCard title="محاولات دخول فاشلة على قاعدة البيانات" value={num(data.sql?.total)} sub={`من ${num(data.sql?.ips)} عنوان IP — ${num(data.sql?.logins)} اسم مستخدم`} color="#dc2626" onClick={() => goTab(1)} />
            <StatCard title="المستخدمون النشطون الآن" value={num(data.online)} sub="خلال آخر 15 دقيقة" color="#2563eb" onClick={() => goTab(4)} />
            <StatCard title="فتح الشاشات" value={num(data.web?.visits)} sub={`${num(data.web?.users)} مستخدم`} color="#0891b2" onClick={() => goTab(4)} />
            <StatCard title="محاولات غير مسموحة" value={num(data.web?.denied)} sub={`طلبات بدون جلسة صالحة: ${num(data.web?.unauth)}`} color="#d97706" onClick={() => goTab(4)} />
            <StatCard title="حركات على المستندات" value={num(data.actions)} color={primary} onClick={() => goTab(4)} />
            <StatCard title="تغييرات السيرفر" value={num(data.changes?.changes)} sub={`منها ${num(data.changes?.security)} تغيير أمني`} color="#7c3aed" onClick={() => goTab(3)} />
            <StatCard title="طلبات ستُرفض عند تفعيل التحقق الكامل" value={num(data.web?.tokenWouldBlock)} sub="راجعها قبل التحويل إلى Enforce" color="#a16207" onClick={() => goTab(4)} />
            <StatCard title="محاولات دخول شاشة المراقبة" value={num(data.web?.monitorFail)} sub="خاطئة أو بدون صلاحية" color="#be123c" onClick={() => goTab(4)} />
          </Stack>

          <Paper sx={{ p: 2, borderRadius: 3, mb: 2 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>محاولات الدخول الفاشلة على قاعدة البيانات عبر الوقت</Typography>
            <Bars series={data.series || []} hours={data.hours} />
          </Paper>

          <Paper sx={{ p: 2, borderRadius: 3 }}>
            <Typography sx={{ fontWeight: 900, mb: 1 }}>أكثر العناوين محاولةً للدخول</Typography>
            <Grid
              rows={topRows}
              height={460}
              columns={[
                { field: "ip", headerName: "عنوان IP", width: 150 },
                { field: "origin", headerName: "المصدر", width: 170, renderCell: ({ value }) => <OriginChip origin={value} /> },
                { field: "count", headerName: "عدد المحاولات", width: 120, valueFormatter: ({ value }) => num(value) },
                { field: "logins", headerName: "أسماء المستخدمين التي جرّبها", flex: 1, minWidth: 220 },
                { field: "hosts", headerName: "الجهاز / البرنامج", width: 220 },
                { field: "users", headerName: "مستخدمونا الذين عملوا من نفس العنوان", flex: 1, minWidth: 240 },
                { field: "lastAt", headerName: "آخر محاولة", width: 150, valueFormatter: ({ value }) => formatAt(value) }
              ]}
            />
          </Paper>
        </>
      ) : loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box>
      ) : null}
    </Box>
  );
};

const SqlFailuresTab = ({ onError }) => {
  const [from, setFrom] = useState(daysAgo(0));
  const [to, setTo] = useState(daysAgo(0));
  const [origin, setOrigin] = useState("all");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(`sql-failures?from=${from}&to=${to}`);
      setRows((data.rows || []).map((r, i) => ({ id: i, ...r, reasonText: reasonText(r.reason) })));
    } catch (e) {
      onError(e);
    } finally {
      setLoading(false);
    }
  }, [from, to, onError]);

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => (origin === "all" ? rows : rows.filter((r) => r.origin === origin)), [rows, origin]);
  const total = useMemo(() => shown.reduce((s, r) => s + Number(r.count || 0), 0), [shown]);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 1.5, fontWeight: 600 }}>
        كل محاولة دخول فاشلة على خادم قاعدة البيانات: من أي عنوان، وبأي اسم مستخدم، ومن أي جهاز وبرنامج. «من جهة معروفة لدينا» تعني أن مستخدمينا أو برامجنا عملوا من نفس العنوان.
      </Alert>
      <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onLoad={load} loading={loading}>
        <TextField select size="small" label="المصدر" value={origin} onChange={(e) => setOrigin(e.target.value)} sx={{ width: 200 }}>
          <MenuItem value="all">الكل</MenuItem>
          <MenuItem value="internal">من جهة معروفة لدينا</MenuItem>
          <MenuItem value="external">خارجي — غير معروف</MenuItem>
          <MenuItem value="local">من خادم قاعدة البيانات نفسه</MenuItem>
        </TextField>
      </DateRange>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Chip label={`السجلات: ${num(shown.length)}`} sx={{ fontWeight: 800 }} />
        <Chip label={`إجمالي المحاولات: ${num(total)}`} color="error" sx={{ fontWeight: 800 }} />
      </Stack>
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Grid
          rows={shown}
          loading={loading}
          columns={[
            { field: "lastAt", headerName: "آخر محاولة", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "ip", headerName: "عنوان IP", width: 150 },
            { field: "origin", headerName: "المصدر", width: 170, renderCell: ({ value }) => <OriginChip origin={value} /> },
            { field: "login", headerName: "اسم المستخدم", width: 130 },
            { field: "host", headerName: "اسم الجهاز", width: 160 },
            { field: "app", headerName: "البرنامج", width: 200 },
            { field: "reasonText", headerName: "السبب", width: 170 },
            { field: "count", headerName: "العدد", width: 90, valueFormatter: ({ value }) => num(value) },
            { field: "users", headerName: "مستخدمونا من نفس العنوان", flex: 1, minWidth: 240 },
            { field: "knownHosts", headerName: "أجهزة اتصلت بنجاح من نفس العنوان", width: 260 },
            { field: "firstAt", headerName: "أول محاولة", width: 145, valueFormatter: ({ value }) => formatAt(value) }
          ]}
          hidden={{ knownHosts: false }}
        />
      </Paper>
    </Box>
  );
};

const SqlClientsTab = ({ onError }) => {
  const [data, setData] = useState({ live: [], history: [] });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await call("sql-clients");
      setData({
        live: (d.live || []).map((r, i) => ({ id: i, ...r })),
        history: (d.history || []).map((r, i) => ({ id: i, ...r }))
      });
    } catch (e) {
      onError(e);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const [blockOptions, setBlockOptions] = useState(null);
  const [notice, setNotice] = useState("");

  const base = [
    { field: "block", headerName: "", width: 50, sortable: false, renderCell: ({ row }) => <BlockRowButton options={clientBlockOptions(row)} onBlock={setBlockOptions} /> },
    { field: "ip", headerName: "عنوان IP", width: 150 },
    { field: "host", headerName: "اسم الجهاز", width: 170 },
    { field: "app", headerName: "البرنامج", flex: 1, minWidth: 220 },
    { field: "login", headerName: "مستخدم قاعدة البيانات", width: 150 },
    { field: "db", headerName: "قاعدة البيانات", width: 120 }
  ];

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 900 }}>المتصلون الآن</Typography>
        <IconButton onClick={load} disabled={loading} aria-label="تحديث">{loading ? <CircularProgress size={20} /> : <RefreshIcon />}</IconButton>
      </Stack>
      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 2.5 }}>
        <Grid
          rows={data.live}
          loading={loading}
          height={300}
          columns={[
            ...base,
            { field: "sessions", headerName: "عدد الاتصالات", width: 110 },
            { field: "pid", headerName: "رقم العملية", width: 100 },
            { field: "firstLogin", headerName: "أول دخول", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "users", headerName: "مستخدمونا من نفس العنوان", width: 240 }
          ]}
        />
      </Paper>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>كل الأجهزة والبرامج التي اتصلت بقاعدة البيانات</Typography>
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Grid
          rows={data.history}
          loading={loading}
          height={460}
          columns={[
            ...base,
            { field: "deskUsers", headerName: "مستخدمو برنامج الديسكتوب على هذا الجهاز", width: 260 },
            { field: "maxSessions", headerName: "أقصى اتصالات", width: 110 },
            { field: "firstSeen", headerName: "أول ظهور", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "lastSeen", headerName: "آخر ظهور", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "users", headerName: "مستخدمونا من نفس العنوان", width: 240 }
          ]}
        />
      </Paper>
      {notice ? <Alert severity="success" onClose={() => setNotice("")} sx={{ mt: 2, fontWeight: 700 }}>{notice}</Alert> : null}
      <BlockDialog options={blockOptions} onError={onError} onClose={(ok) => { setBlockOptions(null); if (ok) setNotice("تم الحظر — تابعه من تبويب «التحكم والحظر»"); }} />
    </Box>
  );
};

const ServerChangesTab = ({ onError }) => {
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(daysAgo(0));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await call(`server-changes?from=${from}&to=${to}`);
      setRows((data.rows || []).map((r) => ({ ...r, levelText: LEVELS[r.level]?.label || r.level })));
    } catch (e) {
      onError(e);
    } finally {
      setLoading(false);
    }
  }, [from, to, onError]);

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 1.5, fontWeight: 600 }}>
        من سجل الخادم الداخلي: إنشاء وحذف وتعديل الجداول والإجراءات، وإضافة المستخدمين والصلاحيات، وتغيير كلمات المرور، والنسخ الاحتياطي والاسترجاع — ومن أي جهاز وبأي برنامج.
      </Alert>
      <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onLoad={load} loading={loading} />
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Grid
          rows={rows}
          loading={loading}
          columns={[
            { field: "at", headerName: "الوقت", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            {
              field: "levelText",
              headerName: "الأهمية",
              width: 95,
              renderCell: ({ row }) => <Chip size="small" label={row.levelText} sx={{ color: "#fff", bgcolor: LEVELS[row.level]?.color || "#64748b", fontWeight: 800 }} />
            },
            { field: "event", headerName: "العملية", width: 230 },
            { field: "objectTypeName", headerName: "النوع", width: 110 },
            { field: "objectName", headerName: "الاسم", width: 200 },
            { field: "db", headerName: "قاعدة البيانات", width: 120 },
            { field: "login", headerName: "بواسطة", width: 110 },
            { field: "host", headerName: "الجهاز", width: 150 },
            { field: "app", headerName: "البرنامج", width: 200 },
            { field: "targetLogin", headerName: "المستخدم المستهدف", width: 140 },
            { field: "role", headerName: "الدور", width: 110 },
            { field: "text", headerName: "التفاصيل", flex: 1, minWidth: 200 }
          ]}
        />
      </Paper>
    </Box>
  );
};

const ActivityTab = ({ onError }) => {
  const [from, setFrom] = useState(daysAgo(0));
  const [to, setTo] = useState(daysAgo(0));
  const [user, setUser] = useState("");
  const [kinds, setKinds] = useState({ visits: true, denied: true, actions: true, monitor: true });
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockOptions, setBlockOptions] = useState(null);
  const [notice, setNotice] = useState("");
  const knownUsers = useRef(new Map());

  const load = useCallback(
    async (userGuid = user) => {
      setLoading(true);
      try {
        const data = await call("activity", { method: "POST", body: { from, to, user: userGuid || null, ...kinds } });
        const cols = data.columns || [];
        setRows((data.rows || []).map((r, i) => {
          const row = { id: i };
          cols.forEach((c, j) => {
            row[c] = r[j];
          });
          row.kindText = KINDS[row.kind]?.label || row.kind;
          return row;
        }));
        (data.users || []).forEach((u) => knownUsers.current.set(u.userGuid, u.user));
        setUsers((data.users || []).map((u, i) => ({ id: u.userGuid || i, ...u })));
        setTruncated(Boolean(data.truncated));
      } catch (e) {
        onError(e);
      } finally {
        setLoading(false);
      }
    },
    [from, to, user, kinds, onError]
  );

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pickUser = (guid) => {
    setUser(guid);
    load(guid);
  };

  const userOptions = useMemo(
    () => [...knownUsers.current.entries()].filter(([g]) => g).sort((a, b) => String(a[1]).localeCompare(String(b[1]), "ar")),
    [users] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 1.5, fontWeight: 600 }}>
        كل ما فعله المستخدمون: الشاشات التي فتحوها، والشاشات والعمليات التي حاولوا الوصول إليها دون صلاحية، والحركات على المستندات — مع الجهاز والعنوان.
      </Alert>
      <DateRange from={from} to={to} setFrom={setFrom} setTo={setTo} onLoad={() => load()} loading={loading}>
        <TextField select size="small" label="المستخدم" value={user} onChange={(e) => setUser(e.target.value)} sx={{ width: 240 }}>
          <MenuItem value="">كل المستخدمين</MenuItem>
          {userOptions.map(([g, name]) => (
            <MenuItem key={g} value={g}>{name || g}</MenuItem>
          ))}
        </TextField>
        {[
          ["visits", "فتح الشاشات"],
          ["denied", "المحاولات غير المسموحة"],
          ["actions", "الحركات"],
          ["monitor", "شاشة المراقبة"]
        ].map(([key, label]) => (
          <FormControlLabel
            key={key}
            control={<Checkbox size="small" checked={kinds[key]} onChange={(e) => setKinds((k) => ({ ...k, [key]: e.target.checked }))} />}
            label={<Typography sx={{ fontSize: 13, fontWeight: 700 }}>{label}</Typography>}
          />
        ))}
      </DateRange>

      <Typography sx={{ fontWeight: 900, mb: 1 }}>ملخص المستخدمين في الفترة (اضغط على مستخدم لعرض نشاطه فقط)</Typography>
      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
        <Box sx={{ height: 280 }}>
          <FilterableDataGrid
            rows={users}
            loading={loading}
            density="compact"
            rowHeight={40}
            columnHeaderHeight={44}
            onRowClick={({ row }) => pickUser(row.userGuid)}
            pageSizeOptions={[50, 100]}
            localeText={{ noRowsLabel: "لا توجد بيانات" }}
            sx={{ ...gridSx(false), "& .MuiDataGrid-row": { cursor: "pointer" } }}
            columns={[
              { field: "user", headerName: "المستخدم", flex: 1, minWidth: 200 },
              { field: "branch", headerName: "الفرع", width: 150 },
              { field: "screens", headerName: "شاشات مختلفة", width: 110 },
              { field: "visits", headerName: "مرات فتح الشاشات", width: 130 },
              {
                field: "denied",
                headerName: "محاولات غير مسموحة",
                width: 140,
                renderCell: ({ value }) => (value ? <Chip size="small" color="warning" label={value} sx={{ fontWeight: 900 }} /> : 0)
              },
              { field: "actions", headerName: "الحركات", width: 90 },
              { field: "devices", headerName: "الأجهزة", width: 80 },
              { field: "ips", headerName: "العناوين", width: 80 },
              { field: "lastAt", headerName: "آخر نشاط", width: 145, valueFormatter: ({ value }) => formatAt(value) }
            ]}
          />
        </Box>
      </Paper>

      <Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip label={`السجلات: ${num(rows.length)}`} sx={{ fontWeight: 800 }} />
        {user ? <Chip label={`المستخدم: ${knownUsers.current.get(user) || user}`} onDelete={() => pickUser("")} color="primary" sx={{ fontWeight: 800 }} /> : null}
        {truncated ? <Chip color="warning" label="تم عرض أحدث 20,000 سجل فقط — ضيّق الفترة" sx={{ fontWeight: 800 }} /> : null}
      </Stack>
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Grid
          rows={rows}
          loading={loading}
          columns={[
            { field: "block", headerName: "", width: 50, sortable: false, renderCell: ({ row }) => <BlockRowButton options={activityBlockOptions(row)} onBlock={setBlockOptions} /> },
            { field: "at", headerName: "الوقت", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "kindText", headerName: "النوع", width: 230, renderCell: ({ row }) => <KindChip kind={row.kind} /> },
            { field: "user", headerName: "المستخدم", width: 190 },
            { field: "branch", headerName: "الفرع", width: 130 },
            { field: "screen", headerName: "الشاشة", width: 200 },
            { field: "detail", headerName: "التفاصيل", flex: 1, minWidth: 180 },
            { field: "code", headerName: "رقم المستند", width: 100 },
            { field: "ip", headerName: "عنوان IP", width: 140 },
            { field: "device", headerName: "الجهاز", width: 230 },
            { field: "fingerprint", headerName: "بصمة الجهاز", width: 120 },
            { field: "deviceId", headerName: "معرّف الجهاز", width: 120 },
            { field: "path", headerName: "رابط الصفحة (تقني)", width: 230 }
          ]}
          hidden={{ fingerprint: false, deviceId: false, path: false }}
        />
      </Paper>
      {notice ? <Alert severity="success" onClose={() => setNotice("")} sx={{ mt: 2, fontWeight: 700 }}>{notice}</Alert> : null}
      <BlockDialog options={blockOptions} onError={onError} onClose={(ok) => { setBlockOptions(null); if (ok) setNotice("تم الحظر — تابعه من تبويب «التحكم والحظر»"); }} />
    </Box>
  );
};

const ServerStatusTab = ({ onError }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await call("server-status"));
    } catch (e) {
      onError(e);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) return loading ? <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box> : null;

  return (
    <Box>
      <Warnings warnings={data.warnings} />
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Chip label={`الإصدار: ${data.version}`} sx={{ fontWeight: 800 }} />
        <Chip label={data.edition} sx={{ fontWeight: 800 }} />
        <Chip label={data.xeRunning ? "تتبع محاولات الدخول: يعمل" : "تتبع محاولات الدخول: متوقف"} color={data.xeRunning ? "success" : "error"} sx={{ fontWeight: 800 }} />
        <Chip label={`آخر تجميع: ${formatAt(data.lastCollect) || "—"}`} sx={{ fontWeight: 800 }} />
        <Chip label={`وضع التوكن في api4: ${data.tokenMode}`} sx={{ fontWeight: 800 }} />
        <IconButton onClick={load} disabled={loading} aria-label="تحديث">{loading ? <CircularProgress size={20} /> : <RefreshIcon />}</IconButton>
      </Stack>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>مستخدمو الدخول على خادم قاعدة البيانات</Typography>
      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
        <Grid
          height={360}
          rows={(data.logins || []).map((l, i) => ({ id: i, ...l }))}
          columns={[
            { field: "name", headerName: "المستخدم", width: 150 },
            {
              field: "disabled",
              headerName: "الحالة",
              width: 100,
              renderCell: ({ value }) => <Chip size="small" label={value ? "معطّل" : "مفعّل"} color={value ? "default" : "success"} sx={{ fontWeight: 800 }} />
            },
            {
              field: "weak",
              headerName: "كلمة المرور",
              width: 130,
              renderCell: ({ value }) =>
                value === true ? <Chip size="small" color="error" label="شائعة / ضعيفة" sx={{ fontWeight: 800 }} />
                  : value === false ? <Chip size="small" label="سليمة" sx={{ fontWeight: 800 }} />
                  : <Chip size="small" variant="outlined" label="قيد الفحص" sx={{ fontWeight: 800 }} />
            },
            { field: "roles", headerName: "أدوار السيرفر", width: 160 },
            { field: "passwordSet", headerName: "آخر تغيير لكلمة المرور", width: 170, valueFormatter: ({ value }) => (String(value || "").startsWith("1900") ? "غير معروف" : formatAt(value)) },
            { field: "locked", headerName: "مقفول", width: 80, valueFormatter: ({ value }) => (Number(value) === 1 ? "نعم" : "لا") },
            { field: "badCount", headerName: "محاولات خاطئة", width: 110 },
            { field: "policy", headerName: "سياسة كلمات المرور", width: 140, valueFormatter: ({ value }) => (value ? "مفعّلة" : "غير مفعّلة") }
          ]}
        />
      </Paper>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>النسخ الاحتياطية</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Chip label={data.backupEnabled ? "النسخ الدوري: مفعّل" : "النسخ الدوري: غير مفعّل"} color={data.backupEnabled ? "success" : "default"} sx={{ fontWeight: 800 }} />
        {(data.backupLast || []).map((b) => (
          <Chip key={b.db} variant="outlined" label={`${b.db}: آخر كاملة ${formatAt(b.lastFull) || "—"} — آخر نسخة ${formatAt(b.lastOk) || "—"}`} sx={{ fontWeight: 800 }} />
        ))}
      </Stack>
      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 2 }}>
        <Grid
          small
          height={320}
          empty="لم تُعمل أي نسخة احتياطية بعد"
          rows={data.backups || []}
          columns={[
            { field: "startedAt", headerName: "البداية", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "db", headerName: "قاعدة البيانات", width: 120 },
            { field: "kind", headerName: "النوع", width: 90, valueFormatter: ({ value }) => (value === "F" ? "كاملة" : "فرق") },
            {
              field: "status",
              headerName: "الحالة",
              width: 140,
              renderCell: ({ value }) => {
                const s = { ok: ["تمت ونُقلت", "success"], running: ["جارية", "info"], copying: ["جاري النقل", "info"], "copy-failed": ["تمت — فشل النقل", "warning"], failed: ["فشلت", "error"] }[value] || [value, "default"];
                return <Chip size="small" label={s[0]} color={s[1]} sx={{ fontWeight: 800 }} />;
              }
            },
            { field: "sizeMb", headerName: "الحجم (MB)", width: 100 },
            { field: "finishedAt", headerName: "الانتهاء", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "localPath", headerName: "مكانها على سيرفر البرامج", flex: 1, minWidth: 260 },
            { field: "error", headerName: "الخطأ", width: 220 }
          ]}
        />
      </Paper>
      <Typography sx={{ fontWeight: 900, mb: 1 }}>إعدادات حساسة</Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {(data.config || []).map((c) => (
          <Chip key={c.name} label={`${c.name}: ${Number(c.value) === 1 ? "مفعّل" : "متوقف"}`} variant="outlined" sx={{ fontWeight: 800, direction: "ltr" }} />
        ))}
      </Stack>
    </Box>
  );
};

// ===================== الصفحة =====================

// ===================== التحكم والحظر =====================

const BLOCK_KINDS = {
  ip: "عنوان IP — الويب",
  device: "معرّف جهاز — الويب",
  fingerprint: "بصمة جهاز — الويب",
  user: "مستخدم — الويب",
  sqlip: "عنوان IP — قاعدة البيانات",
  sqlhost: "اسم جهاز — قاعدة البيانات"
};

const short = (v) => (String(v || "").length > 14 ? `${String(v).slice(0, 12)}…` : String(v || ""));

// خيارات الحظر السريع من صف في الجداول
const activityBlockOptions = (row) =>
  [
    row.userGuid && { kind: "user", value: row.userGuid, label: `المستخدم: ${row.user || row.userGuid}` },
    row.fingerprint && { kind: "fingerprint", value: row.fingerprint, label: `بصمة الجهاز: ${short(row.fingerprint)} (حتى لو مسح بيانات المتصفح)` },
    row.deviceId && { kind: "device", value: row.deviceId, label: `معرّف الجهاز: ${short(row.deviceId)}` },
    row.ip && { kind: "ip", value: row.ip, label: `عنوان IP: ${row.ip} (كل الأجهزة على نفس الشبكة)` }
  ].filter(Boolean);

const clientBlockOptions = (row) =>
  [
    row.host && { kind: "sqlhost", value: row.host, label: `منع الجهاز ${row.host} من الاتصال بقاعدة البيانات` },
    row.ip && { kind: "sqlip", value: row.ip, label: `منع العنوان ${row.ip} من الاتصال بقاعدة البيانات` },
    row.ip && { kind: "ip", value: row.ip, label: `منع العنوان ${row.ip} من استخدام الويب` }
  ].filter(Boolean);

const ConfirmField = ({ value, onChange }) => (
  <TextField
    fullWidth
    size="small"
    type="password"
    label="كلمة مرور الشاشة للتأكيد"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    autoComplete="off"
    inputProps={{ dir: "ltr", "aria-label": "كلمة مرور الشاشة للتأكيد" }}
    sx={{ mt: 2 }}
  />
);

// نافذة عامة لأي عملية بتحتاج تأكيد بكلمة مرور الشاشة
const ActionDialog = ({ open, title, danger, submitLabel = "تنفيذ", canSubmit = true, onClose, onSubmit, onError, children }) => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
    }
  }, [open]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await onSubmit(password);
      onClose(true);
    } catch (e) {
      if (e?.status === 423 && /انتهت جلسة/.test(e.message)) {
        onError(e);
        onClose(false);
      } else setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { direction: "rtl", borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: danger ? "linear-gradient(135deg,#b91c1c,#7f1d1d)" : `linear-gradient(135deg,${primary},${primaryDark})` }}>
        {title}
      </DialogTitle>
      <DialogContent dividers>
        {children}
        <ConfirmField value={password} onChange={setPassword} />
        {error ? <Alert severity="error" sx={{ mt: 1.5, fontWeight: 600 }}>{error}</Alert> : null}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={() => onClose(false)} disabled={busy}>إلغاء</Button>
        <Button
          variant="contained"
          color={danger ? "error" : "primary"}
          disabled={busy || !password || !canSubmit}
          onClick={submit}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ fontWeight: 900 }}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// حظر: options = خيارات جاهزة من صف، أو فاضية = إدخال يدوي
const BlockDialog = ({ options, onClose, onError }) => {
  const manual = Array.isArray(options) && options.length === 0;
  const [pick, setPick] = useState(0);
  const [kind, setKind] = useState("ip");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    setPick(0);
    setKind("ip");
    setValue("");
    setReason("");
  }, [options]);

  const chosen = manual ? { kind, value: value.trim() } : options?.[pick];

  return (
    <ActionDialog
      open={Boolean(options)}
      danger
      title="حظر"
      submitLabel="حظر"
      canSubmit={Boolean(chosen?.value)}
      onClose={(done) => onClose(done)}
      onError={onError}
      onSubmit={(password) => call("blocks", { method: "POST", body: { kind: chosen.kind, value: chosen.value, reason, password } })}
    >
      {manual ? (
        <Stack spacing={1.5}>
          <TextField select size="small" label="نوع الحظر" value={kind} onChange={(e) => setKind(e.target.value)}>
            {Object.entries(BLOCK_KINDS).map(([k, label]) => (
              <MenuItem key={k} value={k}>{label}</MenuItem>
            ))}
          </TextField>
          <TextField size="small" label={kind === "user" ? "معرّف المستخدم (GUID)" : "القيمة"} value={value} onChange={(e) => setValue(e.target.value)} inputProps={{ dir: "ltr" }} />
        </Stack>
      ) : (
        <TextField select fullWidth size="small" label="ماذا تريد أن تحظر؟" value={pick} onChange={(e) => setPick(Number(e.target.value))}>
          {(options || []).map((o, i) => (
            <MenuItem key={`${o.kind}-${o.value}`} value={i}>{o.label}</MenuItem>
          ))}
        </TextField>
      )}
      <TextField fullWidth size="small" label="السبب (اختياري)" value={reason} onChange={(e) => setReason(e.target.value)} sx={{ mt: 1.5 }} />
      <Alert severity="info" sx={{ mt: 1.5, fontWeight: 600 }}>
        حظر الويب: يُرفض كل طلب من الجهاز أو المستخدم فورًا (خلال 30 ثانية) وتظهر له رسالة الحظر. حظر قاعدة البيانات: يمنع الجهاز من الاتصال بقاعدة البيانات حتى لو كان يعرف كلمة المرور.
      </Alert>
    </ActionDialog>
  );
};

const BlockRowButton = ({ options, onBlock }) =>
  options.length ? (
    <Tooltip title="حظر">
      <IconButton
        size="small"
        color="error"
        aria-label="حظر"
        onClick={(e) => {
          e.stopPropagation();
          onBlock(options);
        }}
      >
        <BlockRoundedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  ) : null;

const ControlTab = ({ onError }) => {
  const [blocks, setBlocks] = useState({ rows: [], triggerInstalled: false, me: {} });
  const [logins, setLogins] = useState({ logins: [], databases: [], dbRoles: [] });
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [blockOptions, setBlockOptions] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [loginAction, setLoginAction] = useState(null); // { login, mode: toggle | password | roles }
  const [newPassword, setNewPassword] = useState("");
  const [roleForm, setRoleForm] = useState({ db: "", role: "db_datareader", action: "grant" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, l] = await Promise.all([call("blocks"), call("sql-logins")]);
      setBlocks(b);
      setLogins(l);
    } catch (e) {
      onError(e);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    load();
  }, [load]);

  const done = (message) => (ok) => {
    if (ok) {
      setNotice(message);
      load();
    }
  };

  const blockRows = useMemo(
    () => (blocks.rows || []).map((r) => ({ ...r, kindText: BLOCK_KINDS[r.kind] || r.kind, valueText: r.userName ? `${r.userName} (${r.value})` : r.value })),
    [blocks]
  );

  const loginRows = useMemo(
    () =>
      (logins.logins || []).map((l) => ({
        id: l.name,
        ...l,
        dbText: (l.databases || []).map((d) => `${d.db}: ${d.roles || "بدون أدوار"}`).join(" | ")
      })),
    [logins]
  );

  const act = loginAction?.login;

  return (
    <Box>
      {notice ? <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2, fontWeight: 700 }}>{notice}</Alert> : null}

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
        <Typography sx={{ fontWeight: 900, flex: 1 }}>الأجهزة والعناوين والمستخدمون المحظورون</Typography>
        <Button variant="contained" color="error" startIcon={<BlockRoundedIcon />} onClick={() => setBlockOptions([])} sx={{ fontWeight: 900 }}>
          حظر يدوي
        </Button>
        <IconButton onClick={load} disabled={loading} aria-label="تحديث">{loading ? <CircularProgress size={20} /> : <RefreshIcon />}</IconButton>
      </Stack>
      {!blocks.triggerInstalled ? (
        <Alert severity="warning" sx={{ mb: 1.5, fontWeight: 600 }}>
          حظر الاتصال بقاعدة البيانات (عنوان أو اسم جهاز) يُحفظ لكنه لا يُطبَّق حتى يتم تركيب أداة الحظر على خادم قاعدة البيانات. حظر الويب يعمل مباشرة.
        </Alert>
      ) : null}
      <Typography sx={{ fontSize: 12.5, color: "text.secondary", mb: 1 }}>
        جهازك الحالي: {blocks.me?.ip || "—"} — لا يمكن حظر الجهاز أو العنوان الذي تستخدمه الآن، ولا حظر مدير النظام أو سيرفر البرامج.
      </Typography>
      <Paper sx={{ borderRadius: 3, overflow: "hidden", mb: 3 }}>
        <Grid
          small
          height={320}
          rows={blockRows}
          loading={loading}
          empty="لا يوجد حظر"
          columns={[
            { field: "kindText", headerName: "النوع", width: 190 },
            { field: "valueText", headerName: "المحظور", flex: 1, minWidth: 220 },
            { field: "reason", headerName: "السبب", width: 180 },
            {
              field: "active",
              headerName: "الحالة",
              width: 100,
              renderCell: ({ value }) => <Chip size="small" label={value ? "محظور" : "تم فكه"} color={value ? "error" : "default"} sx={{ fontWeight: 800 }} />
            },
            { field: "hits", headerName: "محاولات بعد الحظر", width: 130 },
            { field: "lastHitAt", headerName: "آخر محاولة", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            { field: "createdAt", headerName: "تاريخ الحظر", width: 145, valueFormatter: ({ value }) => formatAt(value) },
            {
              field: "actions",
              headerName: "",
              width: 110,
              sortable: false,
              renderCell: ({ row }) =>
                row.active ? (
                  <Button size="small" startIcon={<LockOpenRoundedIcon />} onClick={() => setRemoving(row)} sx={{ fontWeight: 800 }}>
                    فك الحظر
                  </Button>
                ) : null
            }
          ]}
        />
      </Paper>

      <Typography sx={{ fontWeight: 900, mb: 1 }}>مستخدمو الدخول على خادم قاعدة البيانات</Typography>
      <Alert severity="info" sx={{ mb: 1.5, fontWeight: 600 }}>
        كلمات المرور لا يمكن عرضها — الخادم يحفظها مشفّرة تشفيرًا لا يُعكس. يمكنك تعيين كلمة مرور جديدة. المستخدم sa (الذي تتصل به البرامج) لا يمكن تعطيله أو تغيير كلمة مروره من هنا حتى لا يتوقف النظام.
      </Alert>
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Grid
          small
          height={420}
          rows={loginRows}
          loading={loading}
          columns={[
            { field: "name", headerName: "المستخدم", width: 140 },
            {
              field: "disabled",
              headerName: "الحالة",
              width: 95,
              renderCell: ({ value }) => <Chip size="small" label={value ? "معطّل" : "مفعّل"} color={value ? "default" : "success"} sx={{ fontWeight: 800 }} />
            },
            {
              field: "weak",
              headerName: "كلمة المرور",
              width: 120,
              renderCell: ({ value }) =>
                value === true ? <Chip size="small" color="error" label="شائعة / ضعيفة" sx={{ fontWeight: 800 }} />
                  : value === false ? <Chip size="small" label="سليمة" sx={{ fontWeight: 800 }} />
                  : <Chip size="small" variant="outlined" label="قيد الفحص" sx={{ fontWeight: 800 }} />
            },
            { field: "roles", headerName: "أدوار السيرفر", width: 120 },
            { field: "dbText", headerName: "قواعد البيانات والصلاحيات", flex: 1, minWidth: 280 },
            { field: "sessions", headerName: "متصل الآن", width: 90 },
            { field: "passwordSet", headerName: "آخر تغيير لكلمة المرور", width: 160, valueFormatter: ({ value }) => (String(value || "").startsWith("1900") ? "غير معروف" : formatAt(value)) },
            {
              field: "actions",
              headerName: "إجراءات",
              width: 300,
              sortable: false,
              renderCell: ({ row }) => (
                <Stack direction="row" spacing={0.5}>
                  <Button size="small" color={row.disabled ? "success" : "error"} disabled={row.protectedLogin && !row.disabled} onClick={() => setLoginAction({ login: row, mode: "toggle" })} sx={{ fontWeight: 800, minWidth: 0 }}>
                    {row.disabled ? "تفعيل" : "تعطيل"}
                  </Button>
                  <Button size="small" disabled={row.protectedLogin} onClick={() => { setNewPassword(""); setLoginAction({ login: row, mode: "password" }); }} sx={{ fontWeight: 800, minWidth: 0 }}>
                    كلمة المرور
                  </Button>
                  <Button size="small" onClick={() => { setRoleForm({ db: logins.databases?.[0] || "", role: "db_datareader", action: "grant" }); setLoginAction({ login: row, mode: "roles" }); }} sx={{ fontWeight: 800, minWidth: 0 }}>
                    الصلاحيات
                  </Button>
                </Stack>
              )
            }
          ]}
        />
      </Paper>

      <BlockDialog options={blockOptions} onError={onError} onClose={(ok) => { setBlockOptions(null); done("تم الحظر")(ok); }} />

      <ActionDialog
        open={Boolean(removing)}
        title="فك الحظر"
        submitLabel="فك الحظر"
        onError={onError}
        onClose={(ok) => { setRemoving(null); done("تم فك الحظر")(ok); }}
        onSubmit={(password) => call(`blocks/${removing.id}/remove`, { method: "POST", body: { password } })}
      >
        <Typography sx={{ fontWeight: 700 }}>{removing ? `${removing.kindText}: ${removing.valueText}` : ""}</Typography>
      </ActionDialog>

      <ActionDialog
        open={loginAction?.mode === "toggle"}
        danger={!act?.disabled}
        title={act?.disabled ? `تفعيل المستخدم ${act?.name}` : `تعطيل المستخدم ${act?.name}`}
        submitLabel={act?.disabled ? "تفعيل" : "تعطيل"}
        onError={onError}
        onClose={(ok) => { setLoginAction(null); done("تم تنفيذ العملية")(ok); }}
        onSubmit={(password) => call("sql-logins/action", { method: "POST", body: { login: act.name, action: act.disabled ? "enable" : "disable", password } })}
      >
        <Typography>
          {act?.disabled
            ? "سيتمكن هذا المستخدم من الدخول على خادم قاعدة البيانات مرة أخرى."
            : "لن يتمكن هذا المستخدم من الدخول على خادم قاعدة البيانات، وأي برنامج يستخدمه سيتوقف عن الاتصال."}
        </Typography>
      </ActionDialog>

      <ActionDialog
        open={loginAction?.mode === "password"}
        title={`تغيير كلمة مرور ${act?.name || ""}`}
        submitLabel="تغيير"
        canSubmit={newPassword.length >= 10}
        onError={onError}
        onClose={(ok) => { setLoginAction(null); setNewPassword(""); done("تم تغيير كلمة المرور")(ok); }}
        onSubmit={(password) => call("sql-logins/action", { method: "POST", body: { login: act.name, action: "password", newPassword, password } })}
      >
        <TextField fullWidth size="small" label="كلمة المرور الجديدة (10 أحرف على الأقل)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" inputProps={{ dir: "ltr" }} />
        <Alert severity="warning" sx={{ mt: 1.5, fontWeight: 600 }}>أي برنامج يتصل بهذا المستخدم يجب تحديث كلمة المرور في إعداداته وإلا سيتوقف.</Alert>
      </ActionDialog>

      <ActionDialog
        open={loginAction?.mode === "roles"}
        danger={roleForm.role === "db_owner" && roleForm.action === "grant"}
        title={`صلاحيات ${act?.name || ""} على قواعد البيانات`}
        submitLabel={roleForm.action === "grant" ? "منح" : "سحب"}
        canSubmit={Boolean(roleForm.db && roleForm.role)}
        onError={onError}
        onClose={(ok) => { setLoginAction(null); done("تم تعديل الصلاحية")(ok); }}
        onSubmit={(password) => call("sql-logins/action", { method: "POST", body: { login: act.name, action: roleForm.action, database: roleForm.db, role: roleForm.role, password } })}
      >
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5 }}>
          الحالي: {(act?.databases || []).map((d) => `${d.db}: ${d.roles || "بدون أدوار"}`).join(" | ") || "غير مربوط بأي قاعدة بيانات"}
        </Typography>
        <Stack spacing={1.5}>
          <TextField select size="small" label="العملية" value={roleForm.action} onChange={(e) => setRoleForm((f) => ({ ...f, action: e.target.value }))}>
            <MenuItem value="grant">منح صلاحية</MenuItem>
            <MenuItem value="revoke">سحب صلاحية</MenuItem>
          </TextField>
          <TextField select size="small" label="قاعدة البيانات" value={roleForm.db} onChange={(e) => setRoleForm((f) => ({ ...f, db: e.target.value }))}>
            {(logins.databases || []).map((d) => (
              <MenuItem key={d} value={d}>{d}</MenuItem>
            ))}
          </TextField>
          <TextField select size="small" label="الصلاحية" value={roleForm.role} onChange={(e) => setRoleForm((f) => ({ ...f, role: e.target.value }))}>
            <MenuItem value="db_datareader">قراءة فقط (db_datareader)</MenuItem>
            <MenuItem value="db_datawriter">كتابة (db_datawriter)</MenuItem>
            <MenuItem value="db_ddladmin">تعديل الجداول (db_ddladmin)</MenuItem>
            <MenuItem value="db_owner">تحكم كامل (db_owner)</MenuItem>
          </TextField>
        </Stack>
      </ActionDialog>
    </Box>
  );
};

const TABS = ["نظرة عامة", "محاولات دخول قاعدة البيانات", "اتصالات قاعدة البيانات", "تغييرات السيرفر", "نشاط المستخدمين", "حالة السيرفر", "التحكم والحظر"];

export default function SecurityMonitorPage() {
  const [phase, setPhase] = useState("checking"); // checking | denied | gate | open | error
  const [gate, setGate] = useState({ configured: true, lockedUntil: null });
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState(0);
  const [expiresAt, setExpiresAt] = useState(null);
  const [left, setLeft] = useState("");

  const checkGate = useCallback(async () => {
    setPhase("checking");
    try {
      const g = await call("gate");
      setGate(g);
      setPhase(g.unlocked && monitorSession ? "open" : "gate");
    } catch (e) {
      setMessage(e.message);
      setPhase(e.status === 403 ? "denied" : "error");
    }
  }, []);

  useEffect(() => {
    checkGate();
  }, [checkGate]);

  // انتهاء الجلسة: رجوع لكلمة المرور
  const onError = useCallback(
    (e) => {
      if (e?.status === 423) {
        monitorSession = "";
        checkGate();
        return;
      }
      if (e?.status === 403) {
        setMessage(e.message);
        setPhase("denied");
        return;
      }
      setMessage(e?.message || "تعذر الاتصال بالخادم");
    },
    [checkGate]
  );

  useEffect(() => {
    if (phase !== "open" || !expiresAt) return undefined;
    const tick = () => {
      const ms = new Date(expiresAt).getTime() - Date.now();
      if (ms <= 0) {
        monitorSession = "";
        checkGate();
        return;
      }
      setLeft(`${Math.floor(ms / 60000)}:${pad(Math.floor((ms % 60000) / 1000))}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, expiresAt, checkGate]);

  const lock = async () => {
    try {
      await call("lock", { method: "POST" });
    } catch {
      // الجلسة هتتمسح من الذاكرة على أي حال
    }
    monitorSession = "";
    checkGate();
  };

  if (phase === "checking") return <Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>;
  if (phase === "denied")
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }} dir="rtl">
        <Alert severity="error" sx={{ fontWeight: 700 }}>{message || "هذه الشاشة مخصصة لمدير النظام فقط"}</Alert>
      </Box>
    );
  if (phase === "error")
    return (
      <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }} dir="rtl">
        <Alert severity="error" action={<Button onClick={checkGate}>إعادة المحاولة</Button>} sx={{ fontWeight: 700 }}>{message}</Alert>
      </Box>
    );
  if (phase === "gate")
    return (
      <Box dir="rtl">
        <PasswordGate
          gate={gate}
          onUnlocked={(exp) => {
            setExpiresAt(exp);
            setMessage("");
            setPhase("open");
          }}
        />
      </Box>
    );

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0 }}>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})` }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
          <SecurityRoundedIcon sx={{ fontSize: 34 }} />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 22 }}>مراقبة الأمان</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>محاولات الدخول على الخادم، والعمليات المشبوهة، ونشاط المستخدمين في النظام</Typography>
          </Box>
          {left ? <Chip label={`تُقفل تلقائيًا بعد ${left}`} sx={{ bgcolor: "rgba(255,255,255,.18)", color: "#fff", fontWeight: 800 }} /> : null}
          <Button onClick={lock} startIcon={<LockRoundedIcon />} sx={{ color: "#fff", border: "1px solid rgba(255,255,255,.5)", fontWeight: 900 }}>
            قفل الشاشة
          </Button>
        </Stack>
      </Paper>

      {message ? <Alert severity="error" onClose={() => setMessage("")} sx={{ mb: 2, fontWeight: 600 }}>{message}</Alert> : null}

      <Paper sx={{ borderRadius: 3, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ "& .MuiTab-root": { fontWeight: 800 } }}>
          {TABS.map((t) => (
            <Tab key={t} label={t} />
          ))}
        </Tabs>
      </Paper>

      {tab === 0 ? <OverviewTab onError={onError} goTab={setTab} /> : null}
      {tab === 1 ? <SqlFailuresTab onError={onError} /> : null}
      {tab === 2 ? <SqlClientsTab onError={onError} /> : null}
      {tab === 3 ? <ServerChangesTab onError={onError} /> : null}
      {tab === 4 ? <ActivityTab onError={onError} /> : null}
      {tab === 5 ? <ServerStatusTab onError={onError} /> : null}
      {tab === 6 ? <ControlTab onError={onError} /> : null}
    </Box>
  );
}
