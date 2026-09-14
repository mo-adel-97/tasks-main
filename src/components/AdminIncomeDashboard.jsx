import * as uiLayout from './common/uiLayout';
import { navigationContentSx } from '../config/sidebarLayout';
import NavigationShell from './NavigationShell';
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  TextField,
  Alert,
  CircularProgress,
  Slide,
  Fade,
  Collapse,
} from "@mui/material";

import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";



const PRIMARY = "#80b49e";
const PRIMARY_DARK = "#6a9a87";
const BG = "#0b1220";
const PANEL = "#0f172a";
const PANEL2 = "#111c33";
const MUTED = "#94a3b8";

// ✅ Endpoint
const BILLS_API = "https://api1.sstli.com/api/Branches/bills/by-date";
// ✅ Polling interval
const POLL_MS = 2000;
// ✅ UI animation durations
const CHANGE_BANNER_MS = 2200;
const PREV_VALUE_MS = 2500;

/* =========================
   Helpers
========================= */
const formatSAR = (n) =>
  Number(n || 0).toLocaleString("ar-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const todayISO = () => new Date().toISOString().slice(0, 10);

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function billAmountFromJsonCintent(bill) {
  const json = safeJsonParse(bill?.jsonCintent);
  const payable = json?.invoiceTotals?.payableAmount;
  return Number(payable || 0);
}

function billCustomerName(bill) {
  const json = safeJsonParse(bill?.jsonCintent);
  return json?.customer?.registrationName || "—";
}

function billProgramName(bill) {
  const json = safeJsonParse(bill?.jsonCintent);
  const firstLine = Array.isArray(json?.invoiceLines) ? json.invoiceLines[0] : null;
  return firstLine?.itemName || "—";
}

function billIssueTime(bill) {
  const json = safeJsonParse(bill?.jsonCintent);
  const t = json?.issueTime;
  if (t) return String(t).slice(0, 5);

  if (bill?.ceeatedAt) return String(bill.ceeatedAt).slice(11, 16);
  return "";
}

function billIssueDateISO(bill) {
  const json = safeJsonParse(bill?.jsonCintent);
  const d = json?.issueDate;
  if (d) return String(d).slice(0, 10);
  if (bill?.ceeatedAt) return String(bill.ceeatedAt).slice(0, 10);
  return "";
}

function inRangeISO(dateISO, fromISO, toISO) {
  // inclusive range (YYYY-MM-DD)
  if (!dateISO) return true;
  return dateISO >= String(fromISO) && dateISO <= String(toISO);
}

// ✅ Unique key for “new bill detection”
function billKey(b) {
  return String(b?.billGuid || b?.guid || b?.id || b?.billCode || "");
}

/**
 * ✅ zakatType meaning (per your rules):
 * - "388" => فاتورة داخلة (INCOME)  +amount (GREEN, UP)
 * - "383" => فاتورة استرداد (REFUND) -amount (RED, DOWN)
 */
function billFlow(b) {
  const z = String(b?.zakatType ?? "");
  const isRefund = z === "383";
  const isIncome = z === "388" || (!z && true);

  const sign = isRefund ? -1 : 1;
//   const label = isRefund ? "استرداد" : "داخل";
  const color = isRefund ? "#FFB4AE" : "#9DFFB0";
  const bg = isRefund ? "rgba(244,67,54,0.14)" : "rgba(76,175,80,0.14)";
  const border = isRefund ? "rgba(244,67,54,0.35)" : "rgba(76,175,80,0.35)";
  const rowBg = isRefund ? "rgba(244,67,54,0.08)" : "rgba(76,175,80,0.08)";
  const icon = isRefund ? <TrendingDownRoundedIcon /> : <TrendingUpRoundedIcon />;

  return { z, isRefund, isIncome, sign, color, bg, border, rowBg, icon };
}

function sparkFromBillsSigned(bills, points = 10) {
  const arr = (bills || [])
    .slice(0, points)
    .map((b) => {
      const f = billFlow(b);
      return billAmountFromJsonCintent(b) * f.sign;
    })
    .reverse();

  if (!arr.length) return Array.from({ length: points }).map(() => 0);
  while (arr.length < points) arr.unshift(0);
  return arr;
}

/* =========================
   Animated Number (Motion Graphic-ish)
========================= */
function AnimatedMoney({ value }) {
  const [display, setDisplay] = useState(Number(value || 0));
  const prevRef = useRef(Number(value || 0));
  const rafRef = useRef(null);

  useEffect(() => {
    const from = prevRef.current;
    const to = Number(value || 0);
    if (from === to) return;

    const start = performance.now();
    const dur = 650;
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = easeOutCubic(t);
      const next = from + (to - from) * eased;
      setDisplay(next);

      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else {
        setDisplay(to);
        prevRef.current = to;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return (
    <Typography sx={{ color: "white", fontWeight: 950, fontSize: "1.35rem", mt: 0.3 }}>
      {formatSAR(display)}
    </Typography>
  );
}

/* =========================
   Mini Sparkline (SVG)
========================= */
function Sparkline({ data = [], height = 32 }) {
  const width = 110;
  const padding = 2;

  const d = useMemo(() => {
    if (!data.length) return "";
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const step = (width - padding * 2) / (data.length - 1 || 1);

    const points = data.map((v, i) => {
      const x = padding + i * step;
      const y = padding + (height - padding * 2) * (1 - (v - min) / range);
      return [x, y];
    });

    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" ");
  }, [data, height]);

  return (
    <svg width={width} height={height} style={{ opacity: 0.9 }}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/* =========================
   Stock-like Main Chart (Canvas)
========================= */
function StockChart({ points = [] }) {
  const ref = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let ro;
    let destroyed = false;

    const draw = () => {
      if (destroyed) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(128,180,158,0.12)");
      g.addColorStop(1, "rgba(17,28,51,0.00)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      if (!points.length) return;

      const pad = 18;
      const xs = points.map((p) => p.x);
      const ys = points.map((p) => p.y);

      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const rangeY = maxY - minY || 1;

      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const rangeX = maxX - minX || 1;

      const mapX = (x) => pad + ((x - minX) / rangeX) * (w - pad * 2);
      const mapY = (y) => pad + (1 - (y - minY) / rangeY) * (h - pad * 2);

      ctx.strokeStyle = "rgba(148,163,184,0.18)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      for (let i = 1; i <= 4; i++) {
        const yy = (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(w, yy);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(128,180,158,0.95)";
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = mapX(p.x);
        const y = mapY(p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.beginPath();
      points.forEach((p, i) => {
        const x = mapX(p.x);
        const y = mapY(p.y);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(mapX(points[points.length - 1].x), h - pad);
      ctx.lineTo(mapX(points[0].x), h - pad);
      ctx.closePath();

      const fill = ctx.createLinearGradient(0, 0, 0, h);
      fill.addColorStop(0, "rgba(128,180,158,0.22)");
      fill.addColorStop(1, "rgba(128,180,158,0.00)");
      ctx.fillStyle = fill;
      ctx.fill();

      const last = points[points.length - 1];
      const lx = mapX(last.x);
      const ly = mapY(last.y);

      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(lx, ly, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(128,180,158,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lx, ly, 7.5, 0, Math.PI * 2);
      ctx.stroke();
    };

    const schedule = () => {
      if (destroyed) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const parent = canvas.parentElement;
        const w = parent?.clientWidth || 900;
        canvas.width = w;
        canvas.height = 260;
        draw();
      });
    };

    schedule();

    ro = new ResizeObserver(() => schedule());
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const raf2 = requestAnimationFrame(() => draw());

    return () => {
      destroyed = true;
      try {
        ro?.disconnect();
      } catch {}
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(raf2);
    };
  }, [points]);

  return (
    <Box sx={{ width: "100%" }}>
      <canvas ref={ref} style={{ width: "100%", borderRadius: 16 }} />
    </Box>
  );
}

/* =========================
   Main Component
========================= */
export default function AdminIncomeDashboard() {
  
  // ✅ show "جاري التحديث" مرة واحدة بعد تطبيق الفترة
  const [showLoadingOnce, setShowLoadingOnce] = useState(false);

  // ✅ inputs (user changes)
  const [fromInput, setFromInput] = useState(() => todayISO());
  const [toInput, setToInput] = useState(() => todayISO());

  // ✅ applied range (actual fetching)
  const [fromDate, setFromDate] = useState(() => todayISO());
  const [toDate, setToDate] = useState(() => todayISO());

  // ✅ Live controls
  const [live, setLive] = useState(true);

  // ✅ Data
  const [bills, setBills] = useState([]);
  const [netTotal, setNetTotal] = useState(0);
  const [grossIn, setGrossIn] = useState(0);
  const [grossOut, setGrossOut] = useState(0);
  const [series, setSeries] = useState([]);

  // ✅ UI
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ✅ “motion” states
  const [prevTotalShown, setPrevTotalShown] = useState(null);
  const [showPrevTotal, setShowPrevTotal] = useState(false);

  const [banner, setBanner] = useState({
    open: false,
    amount: 0,
    label: "",
    type: "in", // "in" | "out"
  });

  // ✅ detect new bills
  const lastTopBillKeyRef = useRef("");
  const lastBillsCountRef = useRef(0);
  const prevTotalRef = useRef(0);
  const highlightKeyRef = useRef(""); // last new bill key for row highlight

  const buildUrl = useCallback((from, to) => {
    return `${BILLS_API}?fromDate=${encodeURIComponent(from)}&toDate=${encodeURIComponent(to)}`;
  }, []);

  const setMotionForChange = useCallback((newNetTotal, maybeNewBill) => {
    // show previous total under “قبل آخر تحديث”
    const prev = Number(prevTotalRef.current || 0);
    if (prev !== newNetTotal) {
      setPrevTotalShown(prev);
      setShowPrevTotal(true);
      setTimeout(() => setShowPrevTotal(false), PREV_VALUE_MS);
    }
    prevTotalRef.current = newNetTotal;

    // banner for new bill
    if (maybeNewBill) {
      const f = billFlow(maybeNewBill);
      const absAmt = Math.abs(billAmountFromJsonCintent(maybeNewBill) || 0);

      setBanner({
        open: true,
        amount: absAmt,
        label: `${billCustomerName(maybeNewBill)} — ${billProgramName(maybeNewBill)}`,
        type: f.isRefund ? "out" : "in",
      });

      setTimeout(() => setBanner((p) => ({ ...p, open: false })), CHANGE_BANNER_MS);

      // highlight row
      highlightKeyRef.current = billKey(maybeNewBill);
      setTimeout(() => {
        if (highlightKeyRef.current === billKey(maybeNewBill)) highlightKeyRef.current = "";
      }, 2600);
    }
  }, []);

  const computeTotalsAndSeries = useCallback((arr) => {
    // net / gross
    let net = 0;
    let gIn = 0;
    let gOut = 0;

    for (const b of arr) {
      const amt = billAmountFromJsonCintent(b);
      const f = billFlow(b);
      if (f.isRefund) gOut += amt;
      else gIn += amt;
      net += amt * f.sign;
    }

    // series (cumulative NET from last 40)
    const latest = arr.slice(0, 40).reverse();
    let cum = 0;
    const pts = latest.map((b, i) => {
      const amt = billAmountFromJsonCintent(b);
      const f = billFlow(b);
      cum += amt * f.sign;
      return { x: i, y: cum };
    });

    return { net, gIn, gOut, pts };
  }, []);

  const mergeBillsUnique = useCallback(
    (prev, incoming) => {
      const map = new Map();
      // keep prev
      for (const b of prev || []) {
        const k = billKey(b);
        if (k) map.set(k, b);
      }
      // upsert incoming (new data overrides)
      for (const b of incoming || []) {
        const k = billKey(b);
        if (k) map.set(k, b);
      }

      // filter by applied range (based on issueDate / ceeatedAt)
      const merged = Array.from(map.values()).filter((b) => {
        const d = billIssueDateISO(b);
        return inRangeISO(d, fromDate, toDate);
      });

      // sort latest first
      merged.sort((a, b) => {
        const da = new Date(a?.ceeatedAt || 0).getTime();
        const db = new Date(b?.ceeatedAt || 0).getTime();
        if (db !== da) return db - da;
        return Number(b?.id || 0) - Number(a?.id || 0);
      });

      return merged;
    },
    [fromDate, toDate]
  );

  const fetchBills = useCallback(
    async (signal) => {
      if (!fromDate || !toDate) return;

      const url = buildUrl(fromDate, toDate);
      setErrorMsg("");

      const res = await fetch(url, { signal });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${txt ? `— ${txt}` : ""}`.trim());
      }

      const data = await res.json();
      const incoming = Array.isArray(data) ? data : [];

      // ✅ IMPORTANT: endpoint بيرجع أحياناً "العنصر الجديد فقط" => MERGE
      const nextBills = mergeBillsUnique(bills, incoming);

      // detect new bill
      const top = nextBills[0];
      const topKey = top ? billKey(top) : "";
      const oldTop = lastTopBillKeyRef.current;

      const prevCount = lastBillsCountRef.current || 0;
      const newCount = nextBills.length;

      const isNew = !!topKey && !!oldTop && topKey !== oldTop && newCount >= prevCount;

      // update refs
      lastTopBillKeyRef.current = topKey || oldTop;
      lastBillsCountRef.current = newCount;

      // totals + series
      const { net, gIn, gOut, pts } = computeTotalsAndSeries(nextBills);

      // apply states
      setBills(nextBills);
      setNetTotal(net);
      setGrossIn(gIn);
      setGrossOut(gOut);
      setSeries(pts);
      setTick((p) => p + 1);

      // ✅ بعد أول تحميل للفترة، اخفي "جاري التحديث"
      setShowLoadingOnce(false);

      // motion
      if (isNew) setMotionForChange(net, top);
      else setMotionForChange(net, null);
    },
    [fromDate, toDate, buildUrl, bills, mergeBillsUnique, computeTotalsAndSeries, setMotionForChange]
  );

  // ✅ Polling loop on applied range
  useEffect(() => {
    if (!live) return;

    let mounted = true;
    const controller = new AbortController();

    const run = async () => {
      if (!mounted) return;
      try {
        setLoading(true);
        await fetchBills(controller.signal);
      } catch (e) {
        if (String(e?.name) === "AbortError") return;
        setErrorMsg(e?.message || "Failed to fetch bills");
        // ✅ لو أول تحميل فشل، اخفي الشيب برضو
        setShowLoadingOnce(false);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    const timer = setInterval(run, POLL_MS);

    return () => {
      mounted = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [fromDate, toDate, live, fetchBills]);

  // ✅ Apply range button
  const applyRange = () => {
    // ✅ show "جاري التحديث" مرة واحدة بعد التطبيق
    setShowLoadingOnce(true);

    // reset detection so “apply” doesn’t look like “new bill”
    lastTopBillKeyRef.current = "";
    lastBillsCountRef.current = 0;

    // also reset prev total reference
    prevTotalRef.current = 0;
    setPrevTotalShown(null);
    setShowPrevTotal(false);

    // ✅ reset local list (important لو الـ endpoint بيرجع عناصر جديدة فقط)
    setBills([]);
    setNetTotal(0);
    setGrossIn(0);
    setGrossOut(0);
    setSeries([]);

    setFromDate(fromInput);
    setToDate(toInput);
  };

  // ✅ Manual refresh (background only)
  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      await fetchBills(undefined);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to fetch bills");
    } finally {
      setLoading(false);
    }
  };

  // ✅ last operations table
  const lastTx = useMemo(() => {
    return (bills || []).slice(0, 8).map((b) => {
      const student = billCustomerName(b);
      const program = billProgramName(b);
      const absAmount = Math.abs(billAmountFromJsonCintent(b));
      const time = billIssueTime(b);
      const key = billKey(b);
      const flow = billFlow(b);

      return {
        key,
        id: b?.id ?? `${b?.billCode ?? ""}-${b?.billGuid ?? ""}`,
        student,
        program,
        amount: absAmount,
        signedAmount: absAmount * flow.sign,
        flow,
        method: "فاتورة",
        time,
      };
    });
  }, [bills]);

  const sparkNet = useMemo(() => sparkFromBillsSigned(bills, 10), [bills]);

  const trend = useMemo(() => {
    if (!series || series.length < 2) return { changePct: 0, trendUp: true };
    const a = series[series.length - 2]?.y || 0;
    const b = series[series.length - 1]?.y || 0;
    const pct = a === 0 ? (b !== 0 ? 100 : 0) : ((b - a) / Math.abs(a)) * 100;
    return { changePct: Number(pct.toFixed(2)), trendUp: pct >= 0 };
  }, [series]);

  const trendChip = (
    <Chip
      icon={trend.trendUp ? <TrendingUpRoundedIcon /> : <TrendingDownRoundedIcon />}
      label={`${trend.changePct >= 0 ? "+" : ""}${trend.changePct}%`}
      sx={{
        bgcolor: trend.trendUp ? "rgba(76,175,80,0.14)" : "rgba(244,67,54,0.14)",
        color: trend.trendUp ? "#9DFFB0" : "#FFB4AE",
        border: `1px solid ${trend.trendUp ? "rgba(76,175,80,0.35)" : "rgba(244,67,54,0.35)"}`,
        fontWeight: 900,
      }}
      size="small"
    />
  );

  const kpiCard = (title, value, icon, spark, isMoney = true, accent = "rgba(128,180,158,0.9)") => (
    <Card
      sx={{
        borderRadius: 3,
        background: `linear-gradient(135deg, ${PANEL} 0%, ${PANEL2} 100%)`,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: "rgba(128,180,158,0.18)",
                color: "#d8fff0",
                border: "1px solid rgba(128,180,158,0.35)",
              }}
            >
              {icon}
            </Avatar>

            <Box>
              <Typography sx={{ color: MUTED, fontWeight: 800, fontSize: "0.9rem" }}>{title}</Typography>

              {isMoney ? (
                <AnimatedMoney value={value} />
              ) : (
                <Typography sx={{ color: "white", fontWeight: 950, fontSize: "1.35rem", mt: 0.3 }}>
                  {Number(value || 0)}
                </Typography>
              )}
            </Box>
          </Stack>

          <Box sx={{ color: accent }}>
            <Sparkline data={spark} />
          </Box>
        </Stack>

        <Box
          sx={{
            position: "absolute",
            top: -40,
            right: -50,
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)",
            opacity: 0.7,
          }}
        />
      </CardContent>
    </Card>
  );

  const billsCount = bills?.length || 0;

  // ✅ Counts inside the selected period
const incomeBillsCount = useMemo(() => {
  return (bills || []).reduce((c, b) => c + (billFlow(b).isRefund ? 0 : 1), 0);
}, [bills]);

const refundBillsCount = useMemo(() => {
  return (bills || []).reduce((c, b) => c + (billFlow(b).isRefund ? 1 : 0), 0);
}, [bills]);

  // ✅ متوسط الفاتورة داخل الفترة (قيمة مطلقة)
  const avgAbsBill = billsCount
    ? bills.reduce((s, b) => s + Math.abs(billAmountFromJsonCintent(b)), 0) / billsCount
    : 0;

  const lastChartValue = series[series.length - 1]?.y || 0;

  const bannerStyle =
    banner.type === "out"
      ? {
          bg: "rgba(244,67,54,0.14)",
          border: "1px solid rgba(244,67,54,0.35)",
          color: "#ffd2d2",
          icon: <TrendingDownRoundedIcon />,
          title: "استرداد",
        }
      : {
          bg: "rgba(16,185,129,0.14)",
          border: "1px solid rgba(16,185,129,0.35)",
          color: "#d1fae5",
          icon: <TrendingUpRoundedIcon />,
          title: "فاتورة داخلة",
        };

  return (
    <NavigationShell variant="admin" ><>
      

      <Box
        sx={{
          minHeight: "100vh",
          p: 3,
          background: `radial-gradient(circle at 20% 10%, rgba(128,180,158,0.12) 0%, transparent 40%),
                             radial-gradient(circle at 80% 0%, rgba(59,130,246,0.10) 0%, transparent 35%),
                             linear-gradient(180deg, ${BG} 0%, #070b14 100%)`,
          ...navigationContentSx
        }}
      >
        {/* 🔥 NEW BILL / REFUND BANNER */}
        <Slide direction="down" in={banner.open} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: "fixed",
              top: 18,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 9999,
              px: 2,
              py: 1.2,
              borderRadius: 3,
              background: bannerStyle.bg,
              border: bannerStyle.border,
              boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
              color: bannerStyle.color,
              backdropFilter: "blur(10px)",
              maxWidth: 640,
              width: "calc(100% - 32px)",
            }}
          >
            <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                {bannerStyle.icon}
                <Typography sx={{ fontWeight: 950 }}>
                  {bannerStyle.title} {banner.type === "out" ? "—" : "+"} {formatSAR(banner.amount)}
                </Typography>
              </Stack>
              <Typography sx={{ color: "rgba(226,232,240,0.9)", fontWeight: 700, fontSize: "0.9rem" }}>
                {banner.label}
              </Typography>
            </Stack>
          </Box>
        </Slide>

        {/* Header */}
        <Card
          sx={{
            borderRadius: 3,
            mb: 2.5,
            background: `linear-gradient(135deg, ${PANEL} 0%, ${PANEL2} 100%)`,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 18px 45px rgba(0,0,0,0.28)",
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ md: "center" }}
              justifyContent="space-between"
            >
              <Box>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <MonetizationOnRoundedIcon sx={{ color: PRIMARY, fontSize: 30 }} />
                  <Typography sx={{ color: "white", fontWeight: 950, fontSize: "1.4rem" }}>
                    لوحة الدخل — Live Bills Income
                  </Typography>

                  <Chip
                    icon={<BoltRoundedIcon />}
                    label={live ? "LIVE" : "PAUSED"}
                    sx={{
                      ml: 1,
                      bgcolor: live ? "rgba(76,175,80,0.16)" : "rgba(148,163,184,0.14)",
                      color: live ? "#9DFFB0" : "#cbd5e1",
                      border: "1px solid rgba(255,255,255,0.18)",
                      fontWeight: 900,
                    }}
                    size="small"
                  />

                  {trendChip}

                  {/* ✅ تظهر مرة واحدة بعد تطبيق الفترة فقط */}
                  {loading && showLoadingOnce ? (
                    <Chip
                      icon={<CircularProgress size={14} />}
                      label="جاري التحديث"
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "#e2e8f0",
                        border: "1px solid rgba(255,255,255,0.10)",
                        fontWeight: 800,
                      }}
                    />
                  ) : null}
                </Stack>

                {/* Date range controls + APPLY */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.3}
                  sx={uiLayout.withUiSx({ mt: 2 }, uiLayout.filterBarSx)}
                  alignItems={{ sm: "center" }}
                >
                  <TextField
                    type="date"
                    label="من"
                    value={fromInput}
                    onChange={(e) => setFromInput(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={uiLayout.withUiSx({
                      width: 200,
                      bgcolor: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                      "& .MuiInputBase-input": { color: "white" },
                      "& .MuiInputLabel-root": { color: "rgba(226,232,240,0.9)" },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
                    }, uiLayout.formFieldSx)}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                  <TextField
                    type="date"
                    label="إلى"
                    value={toInput}
                    onChange={(e) => setToInput(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                    sx={uiLayout.withUiSx({
                      width: 200,
                      bgcolor: "rgba(255,255,255,0.06)",
                      borderRadius: 2,
                      "& .MuiInputBase-input": { color: "white" },
                      "& .MuiInputLabel-root": { color: "rgba(226,232,240,0.9)" },
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.12)" },
                    }, uiLayout.formFieldSx)}
                   inputProps={{ dir: "ltr", style: { direction: "ltr", unicodeBidi: "isolate" } }} />

                  <Button
                    onClick={applyRange}
                    variant="contained"
                    startIcon={<DoneAllRoundedIcon />}
                    sx={uiLayout.withUiSx({
                      bgcolor: "rgba(128,180,158,0.16)",
                      color: "#d8fff0",
                      border: "1px solid rgba(128,180,158,0.35)",
                      fontWeight: 950,
                      borderRadius: 2,
                      px: 2.2,
                      "&:hover": {
                        bgcolor: "rgba(128,180,158,0.22)",
                        borderColor: "rgba(128,180,158,0.55)",
                      },
                    }, uiLayout.buttonSx)}
                  >
                    تطبيق
                  </Button>

                  <Chip
                    label={`المطبّق: ${fromDate} → ${toDate}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "#e2e8f0",
                      border: "1px solid rgba(255,255,255,0.10)",
                      fontWeight: 800,
                      width: "fit-content",
                    }}
                  />

                  <Chip
                    label={`عدد الفواتير: ${billsCount}`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "#e2e8f0",
                      border: "1px solid rgba(255,255,255,0.10)",
                      fontWeight: 800,
                      width: "fit-content",
                    }}
                  />
                </Stack>

                {errorMsg ? (
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="error" sx={{ bgcolor: "rgba(244,67,54,0.14)", color: "#ffd2d2" }}>
                      {errorMsg}
                    </Alert>
                  </Box>
                ) : null}
              </Box>

              <Stack direction="row" spacing={1.2} alignItems="center">
                <Tooltip title={live ? "إيقاف التحديث" : "تشغيل التحديث"} arrow>
                  <Button
                    onClick={() => setLive((p) => !p)}
                    startIcon={<AutorenewRoundedIcon />}
                    variant="contained"
                    sx={uiLayout.withUiSx({
                      bgcolor: PRIMARY,
                      fontWeight: 900,
                      borderRadius: 2.2,
                      px: 2.2,
                      "&:hover": { bgcolor: PRIMARY_DARK },
                    }, uiLayout.buttonSx)}
                  >
                    {live ? "إيقاف" : "تشغيل"}
                  </Button>
                </Tooltip>

                <Tooltip title="تحديث يدوي" arrow>
                  <IconButton
                    onClick={handleManualRefresh}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "white",
                      borderRadius: 2,
                      "&:hover": { bgcolor: "rgba(255,255,255,0.10)" },
                    }}
                  >
                    <RefreshRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

      {/* KPI Grid */}
<Box
  sx={{
    display: "grid",
    gridTemplateColumns: "repeat(12, 1fr)",
    gap: 2,
    mb: 2.5,
  }}
>
  <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
    {kpiCard("صافي الدخل", netTotal, <PaidRoundedIcon />, sparkNet, true)}
  </Box>

  <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
    {kpiCard("إجمالي الداخل", grossIn, <TrendingUpRoundedIcon />, sparkNet, true, "#9DFFB0")}
  </Box>

  <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
    {kpiCard("إجمالي الاسترداد", grossOut, <TrendingDownRoundedIcon />, sparkNet, true, "#FFB4AE")}
  </Box>

  {/* ✅ عدد الفواتير داخل الفترة */}
  <Box sx={{ gridColumn: { xs: "span 12", md: "span 3" } }}>
    {kpiCard("عدد الفواتير داخل الفترة", billsCount, <QueryStatsRoundedIcon />, sparkNet, false)}
  </Box>

 {/* ✅ صف ثاني (3 كروت) */}
<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
  {kpiCard(
    "عدد فواتير الداخل",
    incomeBillsCount,
    <TrendingUpRoundedIcon />,
    sparkNet,
    false,
    "#9DFFB0"
  )}
</Box>

<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
  {kpiCard(
    "عدد فواتير الاسترداد",
    refundBillsCount,
    <TrendingDownRoundedIcon />,
    sparkNet,
    false,
    "#FFB4AE"
  )}
</Box>

<Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
  {kpiCard(
    "متوسط الفاتورة",
    avgAbsBill,
    <ReceiptLongRoundedIcon />,
    sparkNet,
    true
  )}
</Box>

</Box>


        {/* Main Chart + Transactions */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 2,
          }}
        >
          {/* Chart */}
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 8" } }}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${PANEL} 0%, ${PANEL2} 100%)`,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1.2} alignItems="center">
                    <Typography sx={{ color: "white", fontWeight: 950, fontSize: "1.05rem" }}>
                      Net Income Flow (Cumulative)
                    </Typography>
                    <Chip
                      label={`آخر ${clamp(series.length, 0, 40)} فاتورة`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "#e2e8f0",
                        border: "1px solid rgba(255,255,255,0.10)",
                        fontWeight: 800,
                      }}
                    />
                  </Stack>

                  <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ color: MUTED, fontWeight: 800 }}>
                      آخر قيمة:
                      <span style={{ color: "white", fontWeight: 950, marginInlineStart: 10 }}>
                        {formatSAR(lastChartValue)}
                      </span>
                    </Typography>

                    {/* ✅ show previous value for a short time */}
                    <Collapse in={showPrevTotal}>
                      <Fade in={showPrevTotal}>
                        <Typography
                          sx={{
                            color: "rgba(226,232,240,0.85)",
                            fontWeight: 800,
                            mt: 0.4,
                            fontSize: "0.85rem",
                          }}
                        >
                          قبل آخر تحديث:{" "}
                          <span style={{ color: "#e2e8f0", textDecoration: "line-through", opacity: 0.95 }}>
                            {formatSAR(prevTotalShown || 0)}
                          </span>
                        </Typography>
                      </Fade>
                    </Collapse>
                  </Box>
                </Stack>

                <Divider sx={{ my: 2, borderColor: "rgba(148,163,184,0.18)" }} />

                <StockChart points={series} />

                <Typography sx={{ color: MUTED, mt: 1.5, fontWeight: 600 }}>
                  * الرسم تراكمي (صافي) من آخر 40 فاتورة داخل الفترة — الداخل (+) والاسترداد (-).
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Transactions */}
          <Box sx={{ gridColumn: { xs: "span 12", lg: "span 4" } }}>
            <Card
              sx={{
                borderRadius: 3,
                background: `linear-gradient(135deg, ${PANEL} 0%, ${PANEL2} 100%)`,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
                overflow: "hidden",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ color: "white", fontWeight: 950, fontSize: "1.05rem" }}>
                    آخر الفواتير
                  </Typography>
                  <Chip
                    label={live ? "يتحدّث تلقائياً" : "متوقف"}
                    size="small"
                    sx={{
                      bgcolor: live ? "rgba(76,175,80,0.14)" : "rgba(148,163,184,0.14)",
                      color: live ? "#9DFFB0" : "#cbd5e1",
                      border: "1px solid rgba(255,255,255,0.10)",
                      fontWeight: 800,
                    }}
                  />
                </Stack>

                <Divider sx={{ my: 2, borderColor: "rgba(148,163,184,0.18)" }} />

                <TableContainer
                  component={Paper}
                  sx={uiLayout.withUiSx({
                    bgcolor: "transparent",
                    boxShadow: "none",
                    maxHeight: 360,
                    "&::-webkit-scrollbar": { width: 8 },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(128,180,158,0.35)",
                      borderRadius: 10,
                    },
                  }, uiLayout.tableContainerSx)}
                >
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            bgcolor: "rgba(255,255,255,0.06)",
                            color: "#e2e8f0",
                            fontWeight: 900,
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          الفاتورة
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            bgcolor: "rgba(255,255,255,0.06)",
                            color: "#e2e8f0",
                            fontWeight: 900,
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                          }}
                        >
                          المبلغ
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {lastTx.map((tx) => {
                        const isHighlight = tx.key && tx.key === highlightKeyRef.current;
                        const f = tx.flow;

                        return (
                          <TableRow
                            key={tx.id}
                            sx={{
                              "& td": { borderBottom: "1px solid rgba(255,255,255,0.06)" },
                              "&:hover": { backgroundColor: "rgba(255,255,255,0.04)" },
                              backgroundColor: isHighlight
                                ? f.isRefund
                                  ? "rgba(244,67,54,0.10)"
                                  : "rgba(16,185,129,0.10)"
                                : "transparent",
                              boxShadow: isHighlight
                                ? `inset 0 0 0 1px ${
                                    f.isRefund ? "rgba(244,67,54,0.25)" : "rgba(16,185,129,0.25)"
                                  }`
                                : "none",
                              transition: "background-color 350ms ease, box-shadow 350ms ease",
                            }}
                          >
                            <TableCell sx={{ color: "#e2e8f0" }}>
                              <Stack direction="row" spacing={1.2} alignItems="center">
                                <Avatar
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    bgcolor: isHighlight ? f.rowBg : "rgba(128,180,158,0.18)",
                                    color: "#d8fff0",
                                    border: isHighlight
                                      ? `1px solid ${
                                          f.isRefund ? "rgba(244,67,54,0.45)" : "rgba(16,185,129,0.45)"
                                        }`
                                      : "1px solid rgba(128,180,158,0.25)",
                                    fontWeight: 900,
                                    transition: "all 350ms ease",
                                  }}
                                >
                                  {String(tx.student).charAt(0)}
                                </Avatar>

                                <Box>
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography sx={{ fontWeight: 900, fontSize: "0.85rem" }}>
                                      {tx.student} — {tx.program}
                                    </Typography>

                                    <Chip
                                      size="small"
                                      icon={f.icon}
                                      label={f.label}
                                      sx={{
                                        height: 22,
                                        fontWeight: 900,
                                        bgcolor: f.bg,
                                        color: f.color,
                                        border: `1px solid ${f.border}`,
                                        "& .MuiChip-icon": { color: f.color },
                                      }}
                                    />
                                  </Stack>

                                  <Typography sx={{ color: MUTED, fontSize: "0.75rem", fontWeight: 700, mt: 0.2 }}>
                                    {tx.method} • {tx.time}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            <TableCell align="right" sx={{ color: "#e2e8f0", fontWeight: 950 }}>
                              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                <Typography sx={{ fontWeight: 950, color: f.color }}>
                                  {/* {f.isRefund ? "− " : "+ "} */}
                                  {formatSAR(tx.amount)}
                                </Typography>

                                <Chip
                                  size="small"
                                  label={f.isRefund ? "خصم" : "مضاف"}
                                  sx={{
                                    height: 20,
                                    fontWeight: 900,
                                    bgcolor: f.bg,
                                    color: f.color,
                                    border: "1px solid rgba(255,255,255,0.10)",
                                  }}
                                />
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}

                      {!lastTx.length ? (
                        <TableRow>
                          <TableCell colSpan={2} sx={{ color: MUTED, textAlign: "center", py: 4 }}>
                            لا توجد فواتير داخل الفترة المختارة.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Divider sx={{ my: 2, borderColor: "rgba(148,163,184,0.18)" }} />

                <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                  <Typography sx={{ color: MUTED, fontWeight: 700 }}>تحديثات: {tick}</Typography>

                  <Button
                    variant="outlined"
                    startIcon={<MonetizationOnRoundedIcon />}
                    sx={uiLayout.withUiSx({
                      borderColor: "rgba(128,180,158,0.45)",
                      color: "#d8fff0",
                      fontWeight: 900,
                      borderRadius: 2,
                      "&:hover": {
                        borderColor: "rgba(128,180,158,0.75)",
                        backgroundColor: "rgba(128,180,158,0.08)",
                      },
                    }, uiLayout.buttonSx)}
                  >
                    تقرير الدخل
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </></NavigationShell>
  );
}
