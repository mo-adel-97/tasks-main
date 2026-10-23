import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CloseIcon from "@mui/icons-material/Close";
import Swal from "sweetalert2";

// تغييرات تخصص سابقة (يدوي/من الديسكتوب قبل نظام الطلبات) بدون قيد فرق سعر — لكل حالة: قيد بالفرق أو ترك بدون قيد.

const fmt = (value) =>
  value === null || value === undefined || value === ""
    ? "—"
    : Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 });

const signed = (value) =>
  value === null || value === undefined ? "—" : `${Number(value) > 0 ? "+" : ""}${fmt(value)}`;

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const readJson = async (response) => {
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || result?.details || "حدث خطأ أثناء الاتصال بالخادم");
  return result;
};

const gridLocale = {
  noRowsLabel: "لا توجد حالات",
  noResultsOverlayLabel: "لا توجد نتائج",
  MuiTablePagination: { labelRowsPerPage: "عدد الصفوف:", labelDisplayedRows: ({ from, to, count }) => `${from}–${to} من ${count}` }
};

function DiffChip({ value }) {
  if (value === null || value === undefined)
    return <Chip size="small" color="info" variant="outlined" label="غير معروف" />;
  return (
    <Chip
      size="small"
      color={value > 0 ? "success" : "error"}
      label={<span style={{ direction: "ltr", display: "inline-block", fontWeight: 900 }}>{signed(value)}</span>}
    />
  );
}

function Info({ label, value, emphasis, ltr }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{label}</Typography>
      <Typography
        sx={{ fontSize: 14, fontWeight: emphasis ? 900 : 600, overflowWrap: "anywhere", direction: ltr ? "ltr" : undefined, textAlign: ltr ? "right" : undefined }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

function DecisionDialog({ row, submitting, onClose, onSubmit, onOpenStatement }) {
  const theme = useTheme();
  const [action, setAction] = useState("journal");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!row) return;
    setAction("journal");
    setAmount(row.diff === null || row.diff === undefined ? "" : String(row.diff));
    setNotes("");
  }, [row]);

  if (!row) return null;

  const value = Number(amount);
  const amountValid = amount !== "" && Number.isFinite(value) && value !== 0;
  const canSubmit = action === "ignore" || amountValid;

  return (
    <Dialog open onClose={submitting ? undefined : onClose} fullWidth maxWidth="md" dir="rtl">
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, fontWeight: 900 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 900, fontSize: 18 }}>{row.studentName}</Typography>
          <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
            {row.nationalId} {row.phone ? ` — ${row.phone}` : ""}
          </Typography>
        </Box>
        <Chip size="small" variant="outlined" label={row.trackOnly ? "تغيير مسار" : "تخصص مختلف"} />
        <IconButton onClick={onClose} disabled={submitting} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ display: "grid", gap: 1.5 }}>
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
            {row.oldDiplomName} <b style={{ color: theme.palette.primary.main }}>⟵ {row.newDiplomName}</b>
          </Typography>
          <Box sx={{ mt: 1.25, display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
            <Info label="فرع التسجيل" value={row.regBranchName} />
            <Info label="فرع الدراسة الحالي" value={row.studyBranchName} />
            <Info label="تاريخ التسجيل" value={fmtDate(row.registrationDate)} />
            <Info label="رقم استمارة التسجيل" value={row.regDocCode} />
          </Box>
        </Paper>

        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" } }}>
          {[
            ["المحمّل في كشف الحساب", fmt(row.charged)],
            ["سعر الدبلوم الجديد", fmt(row.newPrice)],
            ["الفرق المطلوب", signed(row.diff)],
            ["رصيد الطالب الحالي", signed(row.balance)],
            ["سعر سطر الدبلوم في الاستمارة", fmt(row.oldPaid)]
          ].map(([label, v], i) => (
            <Paper
              key={label}
              variant="outlined"
              sx={{
                p: 1.25,
                borderRadius: 2,
                bgcolor: i === 2 ? alpha(row.diff > 0 ? theme.palette.success.main : theme.palette.error.main, 0.08) : "background.paper"
              }}
            >
              <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{label}</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: 17, direction: "ltr", textAlign: "right" }}>{v}</Typography>
            </Paper>
          ))}
        </Box>

        <Alert severity="info" sx={{ py: 0.25 }}>
          المحمّل هو مبلغ قيد استمارة التسجيل في كشف حساب الطالب (بعد أي تعديل عليه)، وسعر الدبلوم الجديد هو السعر الأكثر تكرارًا
          لطلاب الفرع نفسه بالحالة الضريبية نفسها حول تاريخ تسجيله. راجِع كشف الحساب قبل اتخاذ الإجراء.
        </Alert>

        <Divider />

        <RadioGroup value={action} onChange={(e) => setAction(e.target.value)}>
          <FormControlLabel value="journal" control={<Radio />} label={<b>تسجيل قيد يومية بفرق السعر</b>} />
          <Collapse in={action === "journal"}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ pr: 4, pb: 1 }}>
              <TextField
                size="small"
                label="قيمة الفرق"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={amount !== "" && !amountValid}
                InputProps={{ endAdornment: <InputAdornment position="end">ريال</InputAdornment> }}
                sx={{ width: 200 }}
                inputProps={{ dir: "ltr" }}
              />
              <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                {amountValid
                  ? value > 0
                    ? `زيادة: مدين الطالب / دائن تسجيلات الطلاب بمبلغ ${fmt(value)} ريال`
                    : `خصم: مدين تسجيلات الطلاب / دائن الطالب بمبلغ ${fmt(Math.abs(value))} ريال`
                  : "موجب = زيادة على الطالب، سالب = خصم للطالب"}
              </Typography>
            </Stack>
          </Collapse>
          <FormControlLabel value="ignore" control={<Radio />} label={<b>ترك الحالة بدون قيد</b>} />
        </RadioGroup>

        <TextField
          size="small"
          label={action === "ignore" ? "سبب الترك" : "ملاحظات (اختياري)"}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          multiline
          minRows={2}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.25, gap: 1 }}>
        <Button startIcon={<ReceiptLongIcon />} onClick={() => onOpenStatement?.(row)} disabled={submitting}>
          كشف حساب الطالب
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} disabled={submitting}>
          رجوع
        </Button>
        <Button
          variant="contained"
          color={action === "ignore" ? "warning" : "primary"}
          disabled={!canSubmit || submitting}
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
          onClick={() => onSubmit({ action, priceDiff: action === "journal" ? value : null, notes })}
        >
          {action === "ignore" ? "ترك بدون قيد" : "تسجيل القيد"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LegacyDiplomChangesPanel({ apiBaseUrl, userGuid, onOpenStatement }) {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!userGuid) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ userGuid });
      const result = await readJson(
        await fetch(`${apiBaseUrl}/api/transfer-requests/diplom/legacy-changes?${params}`, { cache: "no-store" })
      );
      setRows(Array.isArray(result?.data) ? result.data : []);
      setLoaded(true);
    } catch (e) {
      setError(e.message || "تعذر تحميل الحالات");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, userGuid]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (kindFilter === "real" && r.trackOnly) return false;
      if (kindFilter === "track" && !r.trackOnly) return false;
      if (diffFilter === "up" && !(r.diff > 0)) return false;
      if (diffFilter === "down" && !(r.diff < 0)) return false;
      if (diffFilter === "unknown" && r.diff !== null && r.diff !== undefined) return false;
      if (!q) return true;
      return [r.studentName, r.nationalId, r.phone, r.oldDiplomName, r.newDiplomName, r.studyBranchName, r.regBranchName]
        .some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [rows, search, diffFilter, kindFilter]);

  const totals = useMemo(
    () => ({
      up: filtered.filter((r) => r.diff > 0).reduce((s, r) => s + r.diff, 0),
      down: filtered.filter((r) => r.diff < 0).reduce((s, r) => s + r.diff, 0)
    }),
    [filtered]
  );

  const submit = async (values) => {
    if (!selected) return;
    if (values.action === "journal") {
      const confirm = await Swal.fire({
        icon: "question",
        title: "تأكيد تسجيل القيد",
        text: `سيُسجَّل قيد يومية بمبلغ ${signed(values.priceDiff)} ريال على حساب ${selected.studentName}.`,
        showCancelButton: true,
        confirmButtonText: "تسجيل",
        cancelButtonText: "رجوع"
      });
      if (!confirm.isConfirmed) return;
    }
    setSubmitting(true);
    try {
      const result = await readJson(
        await fetch(`${apiBaseUrl}/api/transfer-requests/diplom/legacy-changes/decide`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userGuid,
            accountGuid: selected.accountGuid,
            regDocGuid: selected.regDocGuid,
            newDiplomGuid: selected.newDiplomGuid,
            action: values.action,
            priceDiff: values.priceDiff,
            notes: values.notes
          })
        })
      );
      const doneId = selected.id;
      setSelected(null);
      setRows((prev) => prev.filter((r) => r.id !== doneId));
      await Swal.fire({ icon: "success", title: "تم", text: result?.message || "تمت العملية بنجاح" });
    } catch (e) {
      await Swal.fire({ icon: "error", title: "تعذرت العملية", text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "",
        width: 84,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: ({ row }) => (
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="عرض الحالة واتخاذ الإجراء">
              <IconButton size="small" color="primary" onClick={() => setSelected(row)}>
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="كشف حساب الطالب">
              <IconButton size="small" onClick={() => onOpenStatement?.(row)}>
                <ReceiptLongIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        )
      },
      {
        field: "studentName",
        headerName: "الطالب",
        flex: 1.3,
        minWidth: 190,
        renderCell: ({ row }) => (
          <Box sx={{ minWidth: 0, lineHeight: 1.3 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 13.5 }} noWrap>{row.studentName}</Typography>
            <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>{row.nationalId}</Typography>
          </Box>
        )
      },
      { field: "studyBranchName", headerName: "فرع الدراسة", flex: 1, minWidth: 160 },
      {
        field: "registrationDate",
        headerName: "تاريخ التسجيل",
        width: 110,
        valueGetter: ({ row }) => (row.registrationDate ? new Date(row.registrationDate) : null),
        renderCell: ({ row }) => fmtDate(row.registrationDate)
      },
      {
        field: "change",
        headerName: "التغيير",
        flex: 1.6,
        minWidth: 240,
        valueGetter: ({ row }) => `${row.oldDiplomName} ← ${row.newDiplomName}`,
        renderCell: ({ row }) => (
          <Box sx={{ minWidth: 0, lineHeight: 1.3 }}>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>{row.oldDiplomName}</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 800, color: "primary.main" }} noWrap>⟵ {row.newDiplomName}</Typography>
          </Box>
        )
      },
      { field: "charged", headerName: "المحمّل في الكشف", width: 120, type: "number", renderCell: ({ value }) => fmt(value) },
      { field: "newPrice", headerName: "سعر الجديد", width: 100, type: "number", renderCell: ({ value }) => fmt(value) },
      { field: "diff", headerName: "الفرق", width: 110, type: "number", renderCell: ({ value }) => <DiffChip value={value} /> },
      {
        field: "balance",
        headerName: "الرصيد",
        width: 100,
        type: "number",
        renderCell: ({ value }) => <span style={{ direction: "ltr", fontWeight: 700 }}>{signed(value)}</span>
      },
      {
        field: "trackOnly",
        headerName: "النوع",
        width: 110,
        renderCell: ({ value }) => (
          <Chip size="small" variant="outlined" color={value ? "default" : "primary"} label={value ? "تغيير مسار" : "تخصص مختلف"} />
        )
      }
    ],
    [onOpenStatement]
  );

  if (loaded && !error && rows.length === 0) return null;

  const accent = theme.palette.warning.main;

  return (
    <Paper variant="outlined" sx={{ mb: 1.25, borderRadius: 2, borderColor: alpha(accent, 0.45), overflow: "hidden", bgcolor: "background.paper" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 1.5, py: 1, bgcolor: alpha(accent, theme.palette.mode === "dark" ? 0.16 : 0.08), cursor: "pointer" }}
        onClick={() => setOpen((v) => !v)}
      >
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <ManageSearchIcon sx={{ color: accent }} />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 15 }}>تغيير تخصص بدون قيد فرق سعر</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              طلاب تحوّلوا لتخصص جديد (من الطلبات أو يدويًا)، والمبلغ المحمّل في كشف حسابهم لا يطابق سعر التخصص الجديد وقت تسجيلهم، ولم يُسجَّل لهم قيد بالفرق
            </Typography>
          </Box>
          {loading ? <CircularProgress size={16} /> : <Chip size="small" color="warning" label={rows.length} sx={{ fontWeight: 900 }} />}
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="تحديث">
            <span>
              <IconButton
                size="small"
                disabled={loading}
                onClick={(e) => {
                  e.stopPropagation();
                  load();
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Stack>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ p: 1.25, display: "grid", gap: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction={{ xs: "column", lg: "row" }} spacing={1} alignItems={{ lg: "center" }}>
            <TextField
              size="small"
              placeholder="بحث بالاسم أو الهوية أو الدبلوم أو الفرع"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: { lg: 320 } }}
            />
            <ToggleButtonGroup size="small" exclusive value={diffFilter} onChange={(_, v) => v && setDiffFilter(v)}>
              <ToggleButton value="all">الكل</ToggleButton>
              <ToggleButton value="up">زيادة</ToggleButton>
              <ToggleButton value="down">خصم</ToggleButton>
              <ToggleButton value="unknown">سعر غير معروف</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup size="small" exclusive value={kindFilter} onChange={(_, v) => v && setKindFilter(v)}>
              <ToggleButton value="all">كل الأنواع</ToggleButton>
              <ToggleButton value="real">تخصص مختلف</ToggleButton>
              <ToggleButton value="track">تغيير مسار</ToggleButton>
            </ToggleButtonGroup>
            <Box sx={{ flex: 1 }} />
            <Stack direction="row" spacing={1}>
              <Chip size="small" color="success" variant="outlined" label={<span style={{ direction: "ltr", display: "inline-block" }}>زيادة {signed(totals.up)}</span>} />
              <Chip size="small" color="error" variant="outlined" label={<span style={{ direction: "ltr", display: "inline-block" }}>خصم {signed(totals.down)}</span>} />
            </Stack>
          </Stack>

          <Box sx={{ width: "100%", minWidth: 0 }}>
            <DataGrid
              rows={filtered}
              columns={columns}
              getRowId={(r) => r.id}
              loading={loading}
              autoHeight
              rowHeight={56}
              disableRowSelectionOnClick
              onRowDoubleClick={({ row }) => setSelected(row)}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              pageSizeOptions={[10, 25, 50, 100]}
              localeText={gridLocale}
              sx={{
                border: 0,
                fontFamily: "inherit",
                "& .MuiDataGrid-columnHeaders": { bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.14 : 0.06) },
                "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 900 },
                "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" },
                "& .MuiDataGrid-row:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) }
              }}
            />
          </Box>
        </Box>
      </Collapse>

      <DecisionDialog
        row={selected}
        submitting={submitting}
        onClose={() => setSelected(null)}
        onSubmit={submit}
        onOpenStatement={onOpenStatement}
      />
    </Paper>
  );
}
