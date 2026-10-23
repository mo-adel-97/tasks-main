// تقرير التسجيلات — نفس شاشة "تقرير التسجيلات" في الديسكتوب (RegReview) على الويب تحت المبيعات.
import React, { useCallback, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, Paper, Stack, TextField, Typography, useTheme } from "@mui/material";
import { GridToolbarColumnsButton, GridToolbarContainer, GridToolbarDensitySelector } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterableDataGrid from "../components/columnFilters/FilterableDataGrid";
import { workbookFromRows } from "../utils/excelExport";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const primary = "#057546";
const primaryDark = "#034d31";

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};
const monthStart = (offset = 0) => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth() + offset, 1));
};
const monthEnd = (offset = 0) => {
  const d = new Date();
  return isoDate(new Date(d.getFullYear(), d.getMonth() + offset + 1, 0));
};
const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const money = (v) => Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || "").trim();
  } catch {
    return "";
  }
};

const PRESETS = [
  { label: "اليوم", from: () => daysAgo(0), to: () => daysAgo(0) },
  { label: "أمس", from: () => daysAgo(1), to: () => daysAgo(1) },
  { label: "آخر 7 أيام", from: () => daysAgo(6), to: () => daysAgo(0) },
  { label: "الشهر الحالي", from: () => monthStart(0), to: () => daysAgo(0) },
  { label: "الشهر الماضي", from: () => monthStart(-1), to: () => monthEnd(-1) }
];

const COLUMNS = [
  { field: "regDate", headerName: "تاريخ التسجيل", width: 115, valueFormatter: ({ value }) => formatDate(value) },
  { field: "code", headerName: "رقم الاستمارة", width: 110 },
  { field: "regType", headerName: "نوع التسجيل", width: 115 },
  { field: "studentName", headerName: "اسم الطالب", flex: 1, minWidth: 200 },
  { field: "studentTel", headerName: "رقم الجوال", width: 120 },
  { field: "nationalId", headerName: "رقم الهوية", width: 120 },
  { field: "diplomName", headerName: "الدبلوم/الدورة", width: 220 },
  { field: "batch", headerName: "الدفعة", width: 120 },
  { field: "notes", headerName: "ملاحظات", width: 170 },
  { field: "net", headerName: "الصافي", width: 110, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "tax", headerName: "الضريبة", width: 100, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "total", headerName: "الإجمالي", width: 110, type: "number", valueFormatter: ({ value }) => money(value) },
  { field: "branch", headerName: "الفرع", width: 160 },
  { field: "seller", headerName: "مسئول التسجيل", width: 170 },
  { field: "platform", headerName: "منصة التعارف", width: 140 }
];

const Toolbar = () => (
  <GridToolbarContainer sx={{ px: 1, py: 0.5 }}>
    <GridToolbarColumnsButton />
    <GridToolbarDensitySelector />
  </GridToolbarContainer>
);

export default function RegistrationsReview() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const [fromDate, setFromDate] = useState(monthStart(0));
  const [toDate, setToDate] = useState(daysAgo(0));
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ userGuid: getUserGuid(), fromDate, toDate });
      const response = await fetch(`${API_BASE_URL}/api/registrations-review?${params}`, { cache: "no-store" });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || "تعذر تحميل تقرير التسجيلات");
      const cols = result?.columns || [];
      setRows((result?.rows || []).map((r, i) => {
        const row = { id: i };
        cols.forEach((c, j) => {
          row[c] = r[j];
        });
        return row;
      }));
      setInfo({ truncated: result?.truncated, maxRows: result?.maxRows });
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.code, r.studentName, r.studentTel, r.nationalId, r.diplomName, r.batch, r.branch, r.seller, r.platform, r.notes]
        .some((v) => String(v ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  // الإجماليات على اللي ظاهر بعد البحث وفلاتر الأعمدة
  const totals = useMemo(() => {
    const list = filtered;
    return list.reduce(
      (acc, r) => ({ count: acc.count + 1, net: acc.net + Number(r.net || 0), tax: acc.tax + Number(r.tax || 0), total: acc.total + Number(r.total || 0) }),
      { count: 0, net: 0, tax: 0, total: 0 }
    );
  }, [filtered]);

  const exportExcel = () => {
    const list = filtered;
    const data = [
      COLUMNS.map((c) => c.headerName),
      ...list.map((r) => COLUMNS.map((c) => (c.field === "regDate" ? formatDate(r.regDate) : r[c.field] ?? "")))
    ];
    XLSX.writeFile(workbookFromRows(data, "تقرير التسجيلات"), `تقرير التسجيلات ${fromDate} إلى ${toDate}.xlsx`);
  };

  return (
    <Box dir="rtl" sx={{ p: { xs: 1.5, md: 3 }, minWidth: 0 }}>
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3, color: "#fff", background: `linear-gradient(135deg,${primary},${primaryDark})` }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <AssignmentRoundedIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 21 }}>تقرير التسجيلات</Typography>
            <Typography sx={{ fontSize: 13, opacity: 0.9 }}>كل تسجيلات الفترة: الطالب والدبلوم/الدورة والدفعة والمبالغ والفرع ومسؤول التسجيل ومنصة التعارف</Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
          <TextField size="small" type="date" label="من" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
          <TextField size="small" type="date" label="إلى" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 170 }} />
          {PRESETS.map((p) => (
            <Chip key={p.label} label={p.label} clickable onClick={() => { setFromDate(p.from()); setToDate(p.to()); }} sx={{ fontWeight: 800 }} />
          ))}
          <Button
            variant="contained"
            onClick={load}
            disabled={loading || !fromDate || !toDate}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            sx={{ fontWeight: 900, bgcolor: primary, "&:hover": { bgcolor: primaryDark } }}
          >
            عرض
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!rows.length} sx={{ fontWeight: 900 }}>
            Excel
          </Button>
        </Stack>
      </Paper>

      {error ? <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>{error}</Alert> : null}
      {info?.truncated ? <Alert severity="warning" sx={{ mb: 2, fontWeight: 600 }}>تم عرض أول {Number(info.maxRows).toLocaleString("en-US")} تسجيل فقط — ضيّق الفترة.</Alert> : null}

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }} flexWrap="wrap" useFlexGap alignItems="center">
        <TextField
          size="small"
          placeholder="بحث سريع: الاسم، الجوال، الهوية، الاستمارة، الفرع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 340 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <Chip label={`عدد التسجيلات: ${totals.count.toLocaleString("en-US")}`} sx={{ fontWeight: 800 }} />
        <Chip label={`الصافي: ${money(totals.net)}`} sx={{ fontWeight: 800 }} />
        <Chip label={`الضريبة: ${money(totals.tax)}`} sx={{ fontWeight: 800 }} />
        <Chip label={`الإجمالي: ${money(totals.total)}`} color="success" sx={{ fontWeight: 800 }} />
      </Stack>

      <Paper sx={{ borderRadius: 3, overflow: "hidden", height: "calc(100vh - 330px)", minHeight: 420 }}>
        <FilterableDataGrid
          rows={searched}
          columns={COLUMNS}
          loading={loading}
          density="compact"
          rowHeight={40}
          columnHeaderHeight={46}
          disableRowSelectionOnClick
          onFilteredRowsChange={setFiltered}
          pageSizeOptions={[50, 100]}
          initialState={{ pagination: { paginationModel: { pageSize: 100 } }, columns: { columnVisibilityModel: { notes: false } } }}
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
