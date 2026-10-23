// حركة الخزينة / البنك — نفس شاشة CashBoxHistory في الديسكتوب على الويب تحت الحسابات العامة.
// الفلاتر: الخزينة/البنك، الفرع، مركز التكلفة، نوع المستند، المحصل. والرصيد التراكمي بيظهر لما تختار خزينة/بنك.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme
} from "@mui/material";
import { GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PrintIcon from "@mui/icons-material/Print";
import FilterableDataGrid from "../components/columnFilters/FilterableDataGrid";
import { workbookFromRows } from "../utils/excelExport";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const primary = "#057546";
const primaryDark = "#034d31";

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => isoDate(new Date());
const monthStart = () => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth(), 1));
};
const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const money = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

// نفس أعمدة الديسكتوب بالترتيب
const ALL_COLUMNS = [
  { field: "date", headerName: "التاريخ", width: 105, valueFormatter: ({ value }) => formatDate(value) },
  { field: "docType", headerName: "نوع المستند", width: 120 },
  { field: "docCode", headerName: "رقم المستند", width: 100 },
  { field: "maden", headerName: "مدين", width: 115, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "daen", headerName: "دائن", width: 115, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "balance", headerName: "الرصيد", width: 125, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "notes", headerName: "بيان", flex: 1, minWidth: 220 },
  { field: "studentName", headerName: "اسم الطالب", width: 190 },
  { field: "costCenter", headerName: "مركز تكلفة", width: 150 },
  { field: "branch", headerName: "الفرع", width: 150 },
  { field: "vendorName", headerName: "اسم المورد", width: 160 },
  { field: "vendorTax", headerName: "الرقم الضريبي", width: 130 },
  { field: "vendorTel", headerName: "رقم الهاتف", width: 120 },
  { field: "ref", headerName: "المرجع", width: 120 },
  { field: "collector", headerName: "المحصل", width: 170 },
  { field: "linkedType", headerName: "مرتبط مع", width: 130 },
  { field: "linkedCode", headerName: "رقم الفاتورة", width: 110 },
  { field: "payDate", headerName: "تاريخ الحوالة", width: 110, valueFormatter: ({ value }) => formatDate(value) }
];

// نماذج التصدير في الديسكتوب (الأعمدة المستبعدة بالترتيب)
const EXPORT_MODELS = [
  { label: "عام", exclude: [7, 10, 11, 12, 13, 14, 15, 16, 17] },
  { label: "مخصص تحصيل", exclude: [10, 11, 12] },
  { label: "مخصص مصروف", exclude: [7, 13, 14, 15, 16, 17] }
];

const Toolbar = () => (
  <GridToolbarContainer sx={{ px: 1, py: 0.5 }}>
    <GridToolbarColumnsButton />
    <GridToolbarDensitySelector />
  </GridToolbarContainer>
);

const Picker = ({ label, options, value, onChange, groupBy, width = 230 }) => (
  <Autocomplete
    size="small"
    options={options}
    value={value}
    onChange={(_, v) => onChange(v)}
    groupBy={groupBy}
    getOptionLabel={(o) => o?.name || ""}
    isOptionEqualToValue={(a, b) => a?.guid === b?.guid}
    sx={{ width }}
    renderInput={(params) => <TextField {...params} label={label} placeholder="الكل" />}
  />
);

export default function CashBoxHistory() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [fromDate, setFromDate] = useState(monthStart());
  const [toDate, setToDate] = useState(today());
  const [lookups, setLookups] = useState({ cashBoxes: [], branches: [], costCenters: [], docTypes: [], users: [] });
  const [account, setAccount] = useState(null);
  const [branch, setBranch] = useState(null);
  const [costCenter, setCostCenter] = useState(null);
  const [docType, setDocType] = useState(null);
  const [collector, setCollector] = useState(null);
  const [showVendor, setShowVendor] = useState(false);
  const [showLinked, setShowLinked] = useState(false);
  const [exportModel, setExportModel] = useState(0);

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loaded, setLoaded] = useState(null); // الفلاتر اللي اتعرض بيها آخر مرة
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/cash-box-history/lookups?userGuid=${encodeURIComponent(getUserGuid())}`, { cache: "no-store" });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.message || "تعذر تحميل القوائم");
        setLookups(result);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (fromDate > toDate) {
      setError("تاريخ من أكبر من تاريخ إلى");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/cash-box-history/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userGuid: getUserGuid(),
          fromDate,
          toDate,
          accountGuid: account?.guid || null,
          branchGuid: branch?.guid || null,
          costGuid: costCenter?.guid || null,
          typeGuid: docType?.guid || null,
          collectorGuid: collector?.guid || null
        })
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل حركة الخزينة / البنك");

      // الرصيد التراكمي بنفس ترتيب الديسكتوب (التاريخ ثم رقم القيد)
      const cols = result.columns || [];
      let balance = 0;
      setRows((result.rows || []).map((r, i) => {
        const row = { id: i };
        cols.forEach((c, j) => {
          row[c] = r[j];
        });
        balance += Number(row.maden || 0) - Number(row.daen || 0);
        row.balance = Math.round(balance * 100) / 100;
        return row;
      }));
      setTruncated(Boolean(result.truncated));
      setLoaded({ account, branch, costCenter, docType, collector, fromDate, toDate });
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, account, branch, costCenter, docType, collector]);

  // إظهار/إخفاء الأعمدة بنفس قواعد الديسكتوب
  const visibility = useMemo(() => {
    const v = {
      balance: Boolean(loaded?.account),
      branch: !loaded?.branch,
      costCenter: !loaded?.costCenter,
      docType: !loaded?.docType,
      vendorName: showVendor,
      vendorTax: showVendor,
      vendorTel: showVendor,
      ref: showLinked,
      collector: showLinked,
      linkedType: showLinked,
      linkedCode: showLinked,
      payDate: showLinked,
      studentName: showLinked,
      notes: !showLinked
    };
    return v;
  }, [loaded, showVendor, showLinked]);

  // تعديلات يدوية من زر Columns فوق قواعد الديسكتوب (بتترجع لما الفلاتر أو الاختيارات تتغير)
  const [manualVisibility, setManualVisibility] = useState(null);
  useEffect(() => setManualVisibility(null), [visibility]);

  const totals = useMemo(() => {
    const t = filtered.reduce((acc, r) => ({ maden: acc.maden + Number(r.maden || 0), daen: acc.daen + Number(r.daen || 0) }), { maden: 0, daen: 0 });
    return { ...t, diff: t.maden - t.daen, count: filtered.length };
  }, [filtered]);

  const exportExcel = () => {
    const exclude = EXPORT_MODELS[exportModel].exclude;
    const cols = ALL_COLUMNS.filter((_, i) => !exclude.includes(i));
    const data = [
      cols.map((c) => c.headerName),
      ...filtered.map((r) => cols.map((c) => (c.field === "date" || c.field === "payDate" ? formatDate(r[c.field]) : r[c.field] ?? "")))
    ];
    XLSX.writeFile(workbookFromRows(data, "حركة الخزينة"), `حركة الخزينة ${fromDate} إلى ${toDate}.xlsx`);
  };

  const print = () => {
    const cols = ALL_COLUMNS.filter((c) => visibility[c.field] !== false);
    const f = loaded || {};
    const html = `<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>حركة الخزينة / البنك</title>
      <style>body{font-family:Tahoma,Arial;margin:16px;color:#111}h2{margin:0 0 6px}table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #999;padding:3px 5px;text-align:center}th{background:#e8f3ee}.meta{font-size:12px;margin-bottom:8px;line-height:1.8}
      .tot{margin-top:10px;font-weight:bold;font-size:13px}@page{size:A4 landscape;margin:10mm}</style></head><body>
      <h2>حركة الخزينة / البنك</h2>
      <div class="meta">الفترة من <b>${esc(f.fromDate)}</b> إلى <b>${esc(f.toDate)}</b> — الخزينة/البنك: <b>${esc(f.account?.name || "الكل")}</b> — الفرع: <b>${esc(f.branch?.name || "الكل")}</b> — مركز التكلفة: <b>${esc(f.costCenter?.name || "الكل")}</b> — نوع المستند: <b>${esc(f.docType?.name || "الكل")}</b></div>
      <table><thead><tr>${cols.map((c) => `<th>${esc(c.headerName)}</th>`).join("")}</tr></thead><tbody>
      ${filtered
        .map((r) => `<tr>${cols.map((c) => `<td>${esc(c.valueFormatter ? c.valueFormatter({ value: r[c.field] }) : r[c.field])}</td>`).join("")}</tr>`)
        .join("")}
      </tbody></table>
      <div class="tot">إجمالي مدين: ${money(totals.maden)} — إجمالي دائن: ${money(totals.daen)} — الرصيد: ${money(totals.diff)} — العدد: ${totals.count}</div>
      <script>window.onload=()=>{window.print();}</script></body></html>`;
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  };

  const cashGroups = (o) => (Number(o.type) === 1 ? "البنوك" : "الخزائن");

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0 }}>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})` }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <AccountBalanceWalletRoundedIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 21 }}>حركة الخزينة / البنك</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>حركة الخزائن والبنوك في الفترة: مدين ودائن ورصيد</Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap alignItems="center">
          <TextField size="small" type="date" label="الفترة من" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 165 }} />
          <TextField size="small" type="date" label="الفترة إلى" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 165 }} />
          <Picker label="الخزينة/البنك" options={lookups.cashBoxes || []} value={account} onChange={setAccount} groupBy={cashGroups} width={260} />
          <Picker label="الفرع" options={lookups.branches || []} value={branch} onChange={setBranch} />
          <Picker label="مركز التكلفة" options={lookups.costCenters || []} value={costCenter} onChange={setCostCenter} />
          <Picker label="نوع المستند" options={lookups.docTypes || []} value={docType} onChange={setDocType} width={180} />
          <Picker label="المحصل" options={lookups.users || []} value={collector} onChange={setCollector} />
        </Stack>
        <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            onClick={load}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
          >
            عرض
          </Button>
          <FormControlLabel control={<Checkbox checked={showVendor} onChange={(e) => setShowVendor(e.target.checked)} />} label="إظهار بيانات الموردين" />
          <FormControlLabel control={<Checkbox checked={showLinked} onChange={(e) => setShowLinked(e.target.checked)} />} label="إظهار بيانات المستندات المرتبطة" />
          <Box sx={{ flex: 1 }} />
          <TextField select size="small" label="نموذج التصدير" value={exportModel} onChange={(e) => setExportModel(Number(e.target.value))} sx={{ width: 160 }}>
            {EXPORT_MODELS.map((m, i) => (
              <MenuItem key={m.label} value={i}>{m.label}</MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!filtered.length} sx={{ fontWeight: 900 }}>
            Excel
          </Button>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={print} disabled={!filtered.length} sx={{ fontWeight: 900 }}>
            طباعة
          </Button>
        </Stack>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>{error}</Alert> : null}
      {truncated ? <Alert severity="warning" sx={{ mb: 2, fontWeight: 600 }}>تم عرض أول 50,000 حركة فقط — ضيّق الفترة أو اختر خزينة/بنك.</Alert> : null}
      {loaded && !loaded.account && rows.length ? (
        <Alert severity="info" sx={{ mb: 2, fontWeight: 600 }}>الرصيد التراكمي يظهر عند اختيار خزينة أو بنك محدد.</Alert>
      ) : null}

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap>
        <Chip label={`العدد: ${totals.count.toLocaleString("en-US")}`} sx={{ fontWeight: 800 }} />
        <Chip label={`إجمالي مدين: ${money(totals.maden)}`} sx={{ fontWeight: 800 }} />
        <Chip label={`إجمالي دائن: ${money(totals.daen)}`} sx={{ fontWeight: 800 }} />
        <Chip label={`الرصيد: ${money(totals.diff)}`} color={totals.diff < 0 ? "error" : "success"} sx={{ fontWeight: 800 }} />
      </Stack>

      <Paper sx={{ borderRadius: 3, overflow: "hidden", height: "calc(100vh - 360px)", minHeight: 420 }}>
        <FilterableDataGrid
          rows={rows}
          columns={ALL_COLUMNS}
          loading={loading}
          density="compact"
          rowHeight={38}
          columnHeaderHeight={46}
          disableRowSelectionOnClick
          onFilteredRowsChange={setFiltered}
          columnVisibilityModel={manualVisibility || visibility}
          onColumnVisibilityModelChange={setManualVisibility}
          pageSizeOptions={[50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
          slots={{ toolbar: Toolbar }}
          localeText={{ noRowsLabel: rows.length ? "لا توجد نتائج مطابقة" : "اختر الفترة واضغط عرض" }}
          sx={{
            border: 0,
            direction: "rtl",
            "& .MuiDataGrid-columnHeaders": { bgcolor: isDark ? "rgba(5,117,70,.25)" : "rgba(5,117,70,.08)", fontWeight: 900 }
          }}
        />
      </Paper>
    </Box>
  );
}
