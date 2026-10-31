// بورصة الدخل: لوحة لحظية للفلوس الداخلة من طلبات السداد (وقت إنشاء الطلب، مش الفاتورة).
// قسط شهري (الاستقبال / متابعة الخريجين)، دفعة مقدمة (طلب التحاق)، رسوم، رسوم اختبار.
// لايف: فحص خفيف كل 5 ثواني (آخر طلب/عدد/مؤكد)، ولو فيه جديد الشاشة كلها بتتحدث والطلب الجديد بينوّر.
// وتحديث كامل كل دقيقة للمقارنات المرتبطة بالوقت.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VerifiedIcon from "@mui/icons-material/Verified";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { SSTLI_API_URL } from "../config/apiUrls";

const API_BASE_URL = SSTLI_API_URL;
const CHECK_MS = 5000;
const FULL_REFRESH_MS = 60000;
const GREEN = "#057546";
const GREEN_DARK = "#034d31";

// ألوان الرسوم (فاتح / غامق): سلسلة واحدة + مقارنة رمادية + حالة صعود/هبوط بأيقونة وإشارة
const TOKENS = {
  light: { series: "#2a78d6", compare: "#9a9890", grid: "#e7e6e1", up: "#0a8a0a", down: "#d03b3b", muted: "#52514e" },
  dark: { series: "#3987e5", compare: "#7d7b74", grid: "#2e2e2b", up: "#2fbf2f", down: "#e66767", muted: "#c3c2b7" }
};

const money = (v) => Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
const pct = (now, before) => (before > 0 ? ((now - before) / before) * 100 : now > 0 ? null : 0);
const pad = (n) => String(n).padStart(2, "0");
const timeText = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const todayIso = () => {
  // توقيت السعودية
  const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const getUserGuid = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.guid || u.Guid || u.userGuid || u.UserGuid || "";
  } catch {
    return "";
  }
};

function Delta({ now, before, tokens, suffix = "عن أمس", size = 13 }) {
  const value = pct(now, before);
  if (value === null) return <Typography component="span" sx={{ fontSize: size, fontWeight: 800, color: tokens.up }}>جديد</Typography>;
  const up = value >= 0;
  const color = value === 0 ? tokens.muted : up ? tokens.up : tokens.down;
  return (
    <Stack direction="row" alignItems="center" spacing={0.2} component="span" sx={{ display: "inline-flex", color }}>
      {value === 0 ? null : up ? <ArrowDropUpIcon sx={{ fontSize: size + 9 }} /> : <ArrowDropDownIcon sx={{ fontSize: size + 9 }} />}
      <Typography component="span" sx={{ fontSize: size, fontWeight: 900, direction: "ltr" }}>
        {value > 0 ? "+" : ""}{value.toFixed(1)}%
      </Typography>
      {suffix ? <Typography component="span" sx={{ fontSize: size - 1.5, fontWeight: 600, color: tokens.muted, mr: 0.6 }}>{suffix}</Typography> : null}
    </Stack>
  );
}

function Kpi({ icon, label, value, hint, accent, card }) {
  return (
    <Paper elevation={0} sx={{ ...card, p: 2, height: "100%", position: "relative", overflow: "hidden" }}>
      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "grid", placeItems: "center", color: "#fff", background: `linear-gradient(135deg,${accent},${alpha(accent, 0.7)})` }}>{icon}</Box>
        <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: "text.secondary" }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontWeight: 900, fontSize: 26, lineHeight: 1.2, direction: "ltr", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
      <Box sx={{ mt: 0.6, minHeight: 22 }}>{hint}</Box>
    </Paper>
  );
}

function Sparkline({ data, color }) {
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <Box sx={{ width: 120, height: 34 }}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 4, bottom: 4, left: 2, right: 2 }}>
          <YAxis hide domain={[0, "dataMax"]} />
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export default function IncomeLive() {
  const theme = useTheme();
  const dark = theme.palette.mode === "dark";
  const tokens = dark ? TOKENS.dark : TOKENS.light;
  const userGuid = getUserGuid();

  const [date, setDate] = useState(todayIso());
  const [branch, setBranch] = useState("");
  const [auto, setAuto] = useState(true);
  const [data, setData] = useState(null);
  const [branchList, setBranchList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [fresh, setFresh] = useState({});
  const seenIds = useRef(null);
  const version = useRef("");

  const load = useCallback(async (silent = false) => {
    if (!userGuid) return;
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ userGuid, date });
      if (branch) params.set("branchGuid", branch);
      const response = await fetch(`${API_BASE_URL}/api/income-live/snapshot?${params}`, { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.message || "تعذر تحميل بورصة الدخل");
      // الطلبات الجديدة من آخر تحديث بتنوّر
      const ids = new Set((json.feed || []).map((x) => x.id));
      if (seenIds.current) {
        const added = {};
        (json.feed || []).forEach((x) => {
          if (!seenIds.current.has(x.id)) added[x.id] = true;
        });
        if (Object.keys(added).length) {
          setFresh(added);
          setTimeout(() => setFresh({}), 6000);
        }
      }
      seenIds.current = ids;
      setData(json);
      if (!branch) setBranchList((json.branches || []).map((b) => ({ guid: b.guid, name: b.name })));
      setUpdatedAt(new Date());
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [userGuid, date, branch]);

  useEffect(() => {
    seenIds.current = null;
    version.current = "";
    load();
  }, [load]);

  // فحص التحديثات كل 5 ثواني
  const checkVersion = useCallback(async () => {
    try {
      const params = new URLSearchParams({ userGuid });
      if (branch) params.set("branchGuid", branch);
      const response = await fetch(`${API_BASE_URL}/api/income-live/version?${params}`, { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.version) return;
      if (version.current && version.current !== json.version) load(true);
      version.current = json.version;
    } catch {
      // الفحص الجاي هيحاول تاني
    }
  }, [userGuid, branch, load]);

  useEffect(() => {
    if (!auto || !data?.isToday) return undefined;
    checkVersion();
    const check = setInterval(checkVersion, CHECK_MS);
    const full = setInterval(() => load(true), FULL_REFRESH_MS);
    return () => {
      clearInterval(check);
      clearInterval(full);
    };
  }, [auto, data?.isToday, checkVersion, load]);

  const card = {
    borderRadius: 3,
    border: `1px solid ${dark ? alpha("#67C99D", 0.2) : alpha(GREEN, 0.12)}`,
    bgcolor: "background.paper",
    boxShadow: dark ? "none" : "0 6px 22px rgba(3,77,49,.06)"
  };
  const titleSx = { fontWeight: 900, fontSize: 16, color: dark ? "#8fe0b8" : GREEN_DARK };

  // حركة اليوم التراكمية ساعة بساعة مقابل أمس
  const intraday = useMemo(() => {
    if (!data) return [];
    const nowHour = data.isToday ? new Date(data.now).getHours() : 23;
    let t = 0;
    let y = 0;
    return data.hourly.map((h) => {
      t += h.today;
      y += h.yesterday;
      return { hour: `${pad(h.hour)}:00`, today: h.hour <= nowHour ? t : null, yesterday: y, inHour: h.today };
    });
  }, [data]);

  const typesMax = useMemo(() => Math.max(1, ...(data?.types || []).map((t) => t.total)), [data]);
  const daily = useMemo(() => (data?.daily || []).map((d) => ({ ...d, label: d.date.slice(5).replace("-", "/") })), [data]);
  const t = data?.totals;
  const ticker = (data?.feed || []).slice(0, 25);

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, fontFamily: "Cairo", minWidth: 0 }}>
      <style>{`
        @keyframes incomeTicker { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes incomePulse { 0% { box-shadow: 0 0 0 0 rgba(47,191,47,.7); } 70% { box-shadow: 0 0 0 9px rgba(47,191,47,0); } 100% { box-shadow: 0 0 0 0 rgba(47,191,47,0); } }
        @keyframes incomeFlash { from { background: ${alpha(tokens.up, 0.28)}; } to { background: transparent; } }
      `}</style>

      {/* الرأس */}
      <Paper elevation={0} sx={{ p: { xs: 2, md: 2.4 }, mb: 1.5, borderRadius: 3.5, color: "#fff", background: `linear-gradient(135deg,${GREEN} 0%,${GREEN_DARK} 60%,#02281a 100%)` }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <Stack direction="row" spacing={1.4} alignItems="center" sx={{ flex: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, md: 24 } }}>بورصة الدخل</Typography>
              <Typography sx={{ fontSize: 13, opacity: 0.85 }}>الفلوس الداخلة لحظة بلحظة من طلبات السداد — قسط شهري، دفعة مقدمة، رسوم</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {data?.isToday ? (
              <Chip
                size="small"
                icon={<Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: auto ? "#2fbf2f" : "#9ca3af", animation: auto ? "incomePulse 1.6s infinite" : "none", ml: "6px !important" }} />}
                label={auto ? `مباشر — ${updatedAt ? updatedAt.toLocaleTimeString("en-GB") : ""}` : "التحديث التلقائي متوقف"}
                sx={{ color: "#fff", bgcolor: "rgba(255,255,255,.14)", fontWeight: 800 }}
              />
            ) : null}
            <Tooltip title="تحديث لحظي: فحص كل 5 ثوانٍ"><Switch checked={auto} onChange={(e) => setAuto(e.target.checked)} color="success" size="small" /></Tooltip>
            <TextField
              type="date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value || todayIso())}
              inputProps={{ max: todayIso(), "aria-label": "اليوم" }}
              sx={{ bgcolor: "rgba(255,255,255,.95)", borderRadius: 1.5, "& input": { color: "#0b0b0b", py: 0.9 } }}
            />
            <TextField
              select
              size="small"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              SelectProps={{ displayEmpty: true }}
              inputProps={{ "aria-label": "الفرع" }}
              sx={{ minWidth: 220, bgcolor: "rgba(255,255,255,.95)", borderRadius: 1.5, "& .MuiSelect-select": { color: "#0b0b0b", py: 0.9 } }}
            >
              <MenuItem value="">كل الفروع</MenuItem>
              {branchList.map((b) => <MenuItem key={b.guid} value={b.guid}>{b.name}</MenuItem>)}
            </TextField>
            <IconButton onClick={() => load()} sx={{ color: "#fff" }} aria-label="تحديث">{loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}</IconButton>
          </Stack>
        </Stack>
      </Paper>

      {/* شريط آخر الطلبات */}
      {ticker.length ? (
        <Paper elevation={0} sx={{ ...card, mb: 1.5, py: 0.9, overflow: "hidden", direction: "ltr" }}>
          <Box sx={{ display: "flex", width: "max-content", animation: `incomeTicker ${Math.max(30, ticker.length * 4)}s linear infinite`, "&:hover": { animationPlayState: "paused" } }}>
            {[...ticker, ...ticker].map((x, i) => (
              <Stack key={`${x.id}-${i}`} direction="row" spacing={0.8} alignItems="center" sx={{ px: 2.2, borderLeft: `1px solid ${tokens.grid}`, whiteSpace: "nowrap", direction: "rtl" }}>
                <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{x.branch.replace(/^فرع\s+/, "")}</Typography>
                <ArrowDropUpIcon sx={{ color: tokens.up }} />
                <Typography sx={{ fontWeight: 900, fontSize: 13, color: tokens.up, direction: "ltr" }}>{money(x.total)}</Typography>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{x.typeLabel} · {timeText(x.at)}</Typography>
              </Stack>
            ))}
          </Box>
        </Paper>
      ) : null}

      {error ? <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert> : null}
      {!data ? (
        <Box sx={{ py: 10, textAlign: "center" }}><CircularProgress /></Box>
      ) : (
        <>
          {/* المؤشرات */}
          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <Kpi card={card} accent={GREEN} icon={<TrendingUpIcon fontSize="small" />} label={data.isToday ? "دخل اليوم حتى الآن" : `دخل يوم ${data.date}`}
                value={`${money(t.total)} ر.س`}
                hint={<Stack direction="row" spacing={1} alignItems="center"><Delta now={t.total} before={t.compareTotal} tokens={tokens} suffix={data.isToday ? "عن أمس لنفس الساعة" : "عن اليوم السابق"} /><Typography sx={{ fontSize: 12, color: "text.secondary", direction: "ltr" }}>({money(t.compareTotal)})</Typography></Stack>} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Kpi card={card} accent="#1565c0" icon={<ReceiptLongIcon fontSize="small" />} label="عدد طلبات السداد" value={money(t.count)}
                hint={<Stack direction="row" spacing={1} alignItems="center"><Delta now={t.count} before={t.compareCount} tokens={tokens} suffix="" /><Typography sx={{ fontSize: 12, color: "text.secondary" }}>متوسط الطلب {money(t.count ? t.total / t.count : 0)} ر.س</Typography></Stack>} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Kpi card={card} accent="#6b21a8" icon={<VerifiedIcon fontSize="small" />} label="مؤكد / بانتظار التأكيد" value={`${money(t.confirmed)} / ${money(t.pending)}`}
                hint={<Typography sx={{ fontSize: 12.5, color: "text.secondary" }}><GroupsIcon sx={{ fontSize: 15, verticalAlign: "middle", ml: 0.4 }} />{money(t.students)} طالب سدد{t.bestHour !== null ? ` · ذروة الساعة ${pad(t.bestHour)}:00` : ""}</Typography>} />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <Kpi card={card} accent="#b45309" icon={<CalendarMonthIcon fontSize="small" />} label="الشهر حتى الآن" value={`${money(t.monthToDate)} ر.س`}
                hint={<Stack direction="row" spacing={1} alignItems="center"><Delta now={t.monthToDate} before={t.previousMonthToDate} tokens={tokens} suffix="عن نفس الفترة من الشهر الماضي" /></Stack>} />
            </Grid>
          </Grid>

          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            {/* حركة اليوم */}
            <Grid item xs={12} lg={8}>
              <Paper elevation={0} sx={{ ...card, p: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
                  <Typography sx={{ ...titleSx, flex: 1 }}>حركة الدخل خلال اليوم (تراكمي)</Typography>
                  <Stack direction="row" spacing={0.6} alignItems="center"><Box sx={{ width: 18, height: 3, borderRadius: 2, bgcolor: tokens.series }} /><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{data.isToday ? "اليوم" : data.date}</Typography></Stack>
                  <Stack direction="row" spacing={0.6} alignItems="center"><Box sx={{ width: 18, height: 0, borderTop: `2px dashed ${tokens.compare}` }} /><Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "text.secondary" }}>اليوم السابق</Typography></Stack>
                </Stack>
                <Box sx={{ height: 300, direction: "ltr" }}>
                  <ResponsiveContainer>
                    <LineChart data={intraday} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid stroke={tokens.grid} vertical={false} />
                      <XAxis dataKey="hour" tick={{ fontSize: 11, fill: tokens.muted }} tickLine={false} axisLine={{ stroke: tokens.grid }} interval={2} />
                      <YAxis tick={{ fontSize: 11, fill: tokens.muted }} tickLine={false} axisLine={false} width={64} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                      <ChartTooltip
                        cursor={{ stroke: tokens.muted, strokeDasharray: "3 3" }}
                        contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${tokens.grid}`, borderRadius: 10, fontFamily: "Cairo", direction: "rtl" }}
                        formatter={(value, name) => [value === null ? "—" : `${money(value)} ر.س`, name === "today" ? (data.isToday ? "اليوم" : data.date) : "اليوم السابق"]}
                        labelFormatter={(l) => `حتى ${l}`}
                      />
                      <Line type="monotone" dataKey="yesterday" stroke={tokens.compare} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />
                      <Line type="monotone" dataKey="today" stroke={tokens.series} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>

            {/* الأنواع */}
            <Grid item xs={12} lg={4}>
              <Paper elevation={0} sx={{ ...card, p: 2, height: "100%" }}>
                <Typography sx={{ ...titleSx, mb: 1.5 }}>الدخل حسب نوع الطلب</Typography>
                {(data.types || []).filter((x) => x.total > 0 || x.compareTotal > 0).map((x) => (
                  <Box key={x.key} sx={{ mb: 1.6 }}>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography sx={{ fontWeight: 800, fontSize: 14, flex: 1 }}>{x.label}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: 14, direction: "ltr" }}>{money(x.total)}</Typography>
                    </Stack>
                    <Box sx={{ height: 10, borderRadius: 5, bgcolor: alpha(tokens.series, 0.12), overflow: "hidden", my: 0.5 }}>
                      <Box sx={{ height: "100%", width: `${(x.total / typesMax) * 100}%`, bgcolor: tokens.series, borderRadius: 5, transition: "width .6s" }} />
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{x.count} طلب · {t.total ? Math.round((x.total / t.total) * 100) : 0}% من الدخل</Typography>
                      <Box sx={{ flex: 1 }} />
                      <Delta now={x.total} before={x.compareTotal} tokens={tokens} suffix="" size={12} />
                    </Stack>
                  </Box>
                ))}
                {!(data.types || []).some((x) => x.total > 0) ? <Typography color="text.secondary">لا توجد طلبات سداد في هذا اليوم بعد.</Typography> : null}
              </Paper>
            </Grid>
          </Grid>

          {/* لوحة الفروع */}
          <Paper elevation={0} sx={{ ...card, p: 2, mb: 1.5 }}>
            <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ ...titleSx, flex: 1 }}>لوحة الفروع</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>التغير مقارنة باليوم السابق {data.isToday ? "لنفس الساعة" : ""} · الخط: آخر 14 يوم</Typography>
            </Stack>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 900, whiteSpace: "nowrap", color: "text.secondary", borderColor: tokens.grid } }}>
                    <TableCell>#</TableCell>
                    <TableCell>الفرع</TableCell>
                    <TableCell align="left">الدخل</TableCell>
                    <TableCell align="center">التغير</TableCell>
                    <TableCell align="center">الطلبات</TableCell>
                    <TableCell align="center">آخر 14 يوم</TableCell>
                    <TableCell align="center">آخر طلب</TableCell>
                    <TableCell align="left">الحصة</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data.branches || []).map((b, i) => (
                    <TableRow key={b.guid} hover sx={{ "& td": { borderColor: tokens.grid } }}>
                      <TableCell sx={{ color: "text.secondary", fontWeight: 800 }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{b.name}</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 900, direction: "ltr", fontVariantNumeric: "tabular-nums" }}>{money(b.total)}</TableCell>
                      <TableCell align="center"><Delta now={b.total} before={b.compareTotal} tokens={tokens} suffix="" /></TableCell>
                      <TableCell align="center" sx={{ fontVariantNumeric: "tabular-nums" }}>{b.count}</TableCell>
                      <TableCell align="center"><Box sx={{ display: "inline-block" }}><Sparkline data={b.last14} color={tokens.series} /></Box></TableCell>
                      <TableCell align="center" sx={{ color: "text.secondary" }}>{timeText(b.lastAt)}</TableCell>
                      <TableCell align="left" sx={{ minWidth: 110 }}>
                        <Stack direction="row" spacing={0.8} alignItems="center">
                          <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: alpha(tokens.series, 0.12), overflow: "hidden" }}>
                            <Box sx={{ height: "100%", width: `${t.total ? (b.total / t.total) * 100 : 0}%`, bgcolor: tokens.series }} />
                          </Box>
                          <Typography sx={{ fontSize: 12, color: "text.secondary", minWidth: 34, direction: "ltr" }}>{t.total ? Math.round((b.total / t.total) * 100) : 0}%</Typography>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Grid container spacing={1.5}>
            {/* آخر الطلبات */}
            <Grid item xs={12} lg={7}>
              <Paper elevation={0} sx={{ ...card, p: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                  <Typography sx={{ ...titleSx, flex: 1 }}>آخر طلبات السداد</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>آخر {data.feed.length} طلب</Typography>
                </Stack>
                <TableContainer sx={{ maxHeight: 460 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 900, whiteSpace: "nowrap", bgcolor: "background.paper", color: "text.secondary", borderColor: tokens.grid } }}>
                        <TableCell>الوقت</TableCell>
                        <TableCell>الفرع</TableCell>
                        <TableCell>النوع</TableCell>
                        <TableCell>الطالب</TableCell>
                        <TableCell align="left">المبلغ</TableCell>
                        <TableCell align="center">الحالة</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.feed.map((x) => (
                        <TableRow key={x.id} hover sx={{ "& td": { borderColor: tokens.grid }, animation: fresh[x.id] ? "incomeFlash 6s ease-out" : "none" }}>
                          <TableCell sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>{timeText(x.at)}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{x.branch.replace(/^فرع\s+/, "")}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}>{x.typeLabel}</TableCell>
                          <TableCell sx={{ fontSize: 13 }}><Tooltip title={`بواسطة: ${x.user || "—"} · ${x.code}`} arrow><span>{x.student || "—"}</span></Tooltip></TableCell>
                          <TableCell align="left" sx={{ fontWeight: 900, color: tokens.up, direction: "ltr" }}>+{money(x.total)}</TableCell>
                          <TableCell align="center">
                            <Chip size="small" variant="outlined" label={x.confirmed ? "مؤكد" : "بانتظار التأكيد"} icon={x.confirmed ? <VerifiedIcon /> : undefined} color={x.confirmed ? "success" : "default"} sx={{ fontWeight: 800 }} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {!data.feed.length ? <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>لا توجد طلبات سداد في هذا اليوم بعد.</Typography> : null}
              </Paper>
            </Grid>

            {/* آخر 14 يوم */}
            <Grid item xs={12} lg={5}>
              <Paper elevation={0} sx={{ ...card, p: 2, height: "100%" }}>
                <Typography sx={{ ...titleSx, mb: 1 }}>الدخل اليومي — آخر 14 يوم</Typography>
                <Box sx={{ height: 300, direction: "ltr" }}>
                  <ResponsiveContainer>
                    <BarChart data={daily} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                      <CartesianGrid stroke={tokens.grid} vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: tokens.muted }} tickLine={false} axisLine={{ stroke: tokens.grid }} />
                      <YAxis tick={{ fontSize: 11, fill: tokens.muted }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                      <ChartTooltip
                        cursor={{ fill: alpha(tokens.series, 0.08) }}
                        contentStyle={{ background: theme.palette.background.paper, border: `1px solid ${tokens.grid}`, borderRadius: 10, fontFamily: "Cairo", direction: "rtl" }}
                        formatter={(value) => [`${money(value)} ر.س`, "الدخل"]}
                        labelFormatter={(l, rows) => rows?.[0]?.payload?.date || l}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false}>
                        {daily.map((d) => <Cell key={d.date} fill={d.date === data.date ? tokens.series : alpha(tokens.series, 0.45)} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
