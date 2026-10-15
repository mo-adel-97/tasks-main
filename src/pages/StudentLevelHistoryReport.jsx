import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Badge,
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
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme
} from "@mui/material";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import ManageHistoryIcon from "@mui/icons-material/ManageHistory";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import CloseIcon from "@mui/icons-material/Close";

/*
  تقرير "سجل تغييرات ملفات الطلاب" (قائمة التقارير):
  كل تغيير في مسؤول الاتصال / الحالة الدراسية / حالة السداد / الفرع بتاريخه ومين عمله.
  المصدر: StudentLevelHistory (بيتسجل تلقائي من 2026-10-11).
  الفلاتر زي متابعة السداد: الفترة + الفرع (فروع المستخدم) + الدفعة، وفلاتر متقدمة على النتايج.
*/

const API_BASE_URL = process.env.REACT_APP_API_URL || "https://api4.sstli.com";
const API = `${API_BASE_URL}/api/student-level-history`;

const primaryColor = "#057546";
const primaryDark = "#034d31";
const accentColor = "#ae1e21";

const KINDS = {
  trainer: { label: "مسؤول الاتصال", color: "#1f4e79" },
  status: { label: "الحالة الدراسية", color: primaryColor },
  pay: { label: "حالة السداد", color: "#b26a00" },
  branch: { label: "الفرع", color: "#6a3d9a" }
};

const EMPTY_FILTERS = { kind: [], diplomName: [], batchName: [], trainer: [], changedBy: [] };

const getUserGuid = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return String(user?.guid || user?.Guid || user?.userGuid || user?.UserGuid || "").trim();
  } catch {
    return "";
  }
};

const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value || "");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
};

// لما المستخدم مش معروف: من أنهي برنامج اتعمل التغيير.
// - .Net SqlClient / EntityFramework = برنامج الديسكتوب (واسم الجهاز)
// - EFCore = سيرفرات الويب الخارجية (api1/api3 — شاشات المدرب والمشرف) ومش بتبعت اسم المستخدم
// - Core Microsoft SqlClient = موقع الويب قبل تفعيل تسجيل المستخدم
const sourceLabel = (source) => {
  const s = String(source || "");
  if (!s || /baseline/i.test(s)) return "";
  if (/entityframework|\.net sqlclient data provider/i.test(s)) return `ديسكتوب (${s.split("@").pop().trim()})`;
  if (/efcore/i.test(s)) return "ويب — شاشات المدرب/المشرف (المستخدم غير مسجل)";
  if (/microsoft sqlclient/i.test(s)) return "ويب (قبل تسجيل اسم المستخدم)";
  return s;
};

const changedByOf = (r) => r.changedByUser || sourceLabel(r.source) || "غير معروف";

const MultiValueFilter = ({ label, options, value, onChange, getLabel = (o) => o }) => {
  const allSelected = options.length > 0 && value.length === options.length;
  return (
    <Paper elevation={0} sx={{ p: 0.9, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
        <Typography sx={{ fontWeight: 900 }}>{label}</Typography>
        <Stack direction="row" spacing={0.5}>
          <Button size="small" startIcon={<DoneAllIcon />} onClick={() => onChange(allSelected ? [] : options)} sx={{ minWidth: 0, fontWeight: 800 }}>
            {allSelected ? "إلغاء الكل" : "تحديد الكل"}
          </Button>
          {value.length > 0 && (
            <Button size="small" color="error" onClick={() => onChange([])} sx={{ minWidth: 0, fontWeight: 800 }}>مسح</Button>
          )}
        </Stack>
      </Stack>
      <Autocomplete
        multiple
        disableCloseOnSelect
        options={options}
        value={value}
        getOptionLabel={getLabel}
        onChange={(_, v) => onChange(v)}
        limitTags={2}
        noOptionsText="لا توجد نتائج"
        renderOption={(props, option, state) => (
          <li {...props} key={option}>
            <Checkbox checked={state.selected} sx={{ mr: 1, "&.Mui-checked": { color: primaryColor } }} />
            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700 }}>{getLabel(option)}</Typography>
          </li>
        )}
        renderTags={(tags, getTagProps) =>
          tags.map((option, index) => <Chip {...getTagProps({ index })} key={option} label={getLabel(option)} size="small" sx={{ fontWeight: 700 }} />)
        }
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder="ابحث وحدد أكثر من قيمة"
            InputLabelProps={{ shrink: true }}
            helperText={value.length ? `تم اختيار ${value.length} من ${options.length}` : `الكل ظاهر (${options.length})`}
            sx={{ "& .MuiFormHelperText-root": { textAlign: "right" } }}
          />
        )}
      />
    </Paper>
  );
};

const uniqueSorted = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));

const StudentLevelHistoryReport = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const userGuid = useMemo(() => getUserGuid(), []);
  const today = new Date();

  const [boot, setBoot] = useState({ loading: true, allowed: false, error: "", branches: [], batches: [], trackingSince: null });
  const [fromDate, setFromDate] = useState(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [toDate, setToDate] = useState(isoDate(today));
  const [branch, setBranch] = useState(null);
  const [batch, setBatch] = useState(null);
  const [rows, setRows] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const deferredFilter = useDeferredValue(filter);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState(EMPTY_FILTERS);

  useEffect(() => {
    if (!userGuid) {
      setBoot((b) => ({ ...b, loading: false }));
      return;
    }
    fetch(`${API}/bootstrap?userGuid=${encodeURIComponent(userGuid)}`, { cache: "no-store" })
      .then(async (r) => {
        const json = await r.json().catch(() => null);
        if (r.status === 403) return setBoot((b) => ({ ...b, loading: false, allowed: false, error: json?.message || "" }));
        if (!r.ok) throw new Error(json?.message || "تعذر تحميل التقرير");
        const branches = json?.branches || [];
        // فرع واحد بس = بيتحدد لوحده ومايتغيرش (زي متابعة السداد)
        if (branches.length === 1) setBranch(branches[0]);
        setBoot({ loading: false, allowed: true, error: "", branches, batches: json?.batches || [], trackingSince: json?.trackingSince || null });
      })
      .catch((e) => setBoot((b) => ({ ...b, loading: false, allowed: false, error: e.message })));
  }, [userGuid]);

  const load = useCallback(async () => {
    if (!fromDate || !toDate) return;
    try {
      setLoading(true);
      const params = new URLSearchParams({ userGuid, fromDate, toDate });
      if (branch?.guid) params.set("branchGuid", branch.guid);
      if (batch?.guid) params.set("batchGuid", batch.guid);
      const response = await fetch(`${API}?${params}`, { cache: "no-store" });
      const json = await response.json().catch(() => null);
      if (!response.ok) throw new Error(json?.message || "تعذر تحميل سجل التغييرات");
      setRows(Array.isArray(json?.data) ? json.data : []);
      setTruncated(Boolean(json?.truncated));
    } catch (e) {
      Swal.fire({ icon: "error", title: "خطأ", text: e.message, confirmButtonText: "حسنًا" });
    } finally {
      setLoading(false);
    }
  }, [userGuid, fromDate, toDate, branch, batch]);

  useEffect(() => {
    if (boot.allowed) load();
    // التحميل الأول بس — بعد كده بزرار "عرض".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boot.allowed]);

  const filterOptions = useMemo(() => ({
    kind: Object.keys(KINDS).filter((k) => rows.some((r) => r.kind === k)),
    diplomName: uniqueSorted(rows.map((r) => r.diplomName)),
    batchName: uniqueSorted(rows.map((r) => r.batchName)),
    trainer: uniqueSorted(rows.filter((r) => r.kind === "trainer").flatMap((r) => [r.oldValue, r.newValue])),
    changedBy: uniqueSorted(rows.map(changedByOf))
  }), [rows]);

  const activeFilterCount = Object.values(columnFilters).filter((v) => v.length).length;

  const visible = useMemo(() => {
    const f = columnFilters;
    const q = deferredFilter.trim().toLowerCase();
    return rows.filter((r) => {
      if (f.kind.length && !f.kind.includes(r.kind)) return false;
      if (f.diplomName.length && !f.diplomName.includes(r.diplomName)) return false;
      if (f.batchName.length && !f.batchName.includes(r.batchName)) return false;
      // مسؤول الاتصال: تغييرات مسؤول الاتصال اللي هو فيها (قديم أو جديد)
      if (f.trainer.length && !(r.kind === "trainer" && (f.trainer.includes(r.oldValue) || f.trainer.includes(r.newValue)))) return false;
      if (f.changedBy.length && !f.changedBy.includes(changedByOf(r))) return false;
      if (!q) return true;
      return [r.studentName, r.nationalId, r.diplomName, r.batchName, r.branchName, r.oldValue, r.newValue, changedByOf(r)].some((v) =>
        String(v || "").toLowerCase().includes(q)
      );
    });
  }, [rows, deferredFilter, columnFilters]);

  const counts = useMemo(() => {
    const c = { trainer: 0, status: 0, pay: 0, branch: 0 };
    visible.forEach((r) => {
      if (c[r.kind] !== undefined) c[r.kind] += 1;
    });
    return c;
  }, [visible]);

  const exportExcel = () => {
    if (!visible.length) return;
    const data = [
      ["التاريخ والوقت", "الطالب", "رقم الهوية", "الدبلوم/الدورة", "الدفعة", "الفرع", "نوع التغيير", "من", "إلى", "بواسطة", "الحركة"],
      ...visible.map((r) => [
        formatDateTime(r.changedAt),
        r.studentName,
        r.nationalId,
        r.diplomName,
        r.batchName,
        r.branchName,
        KINDS[r.kind]?.label || r.kind,
        r.oldValue || "—",
        r.newValue || "—",
        changedByOf(r),
        r.actionNotes
      ])
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet["!cols"] = [18, 30, 14, 28, 14, 24, 16, 24, 24, 30, 24].map((wch) => ({ wch }));
    const book = XLSX.utils.book_new();
    book.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(book, sheet, "سجل التغييرات");
    XLSX.writeFile(book, `StudentChanges_${fromDate}_${toDate}.xlsx`);
  };

  if (boot.loading) {
    return <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress sx={{ color: primaryColor }} /></Stack>;
  }

  if (!boot.allowed) {
    return (
      <Box sx={{ p: 3, direction: "rtl" }}>
        <Alert severity="warning" sx={{ fontWeight: 900 }}>{boot.error || "ليس لديك صلاحية على تقرير سجل تغييرات ملفات الطلاب"}</Alert>
      </Box>
    );
  }

  const border = isDark ? "rgba(255,255,255,.12)" : "#e6eeea";
  const th = { position: "sticky", top: 0, zIndex: 1, background: primaryColor, color: "#fff", padding: "8px 8px", fontWeight: 900, whiteSpace: "nowrap", textAlign: "right" };
  const td = { padding: "7px 8px", borderBottom: `1px solid ${border}`, textAlign: "right", verticalAlign: "top" };
  const muted = isDark ? "#9fb3a9" : "#6b7d74";
  const setColumnFilter = (key, values) => setColumnFilters((c) => ({ ...c, [key]: values }));

  return (
    <Box sx={{ direction: "rtl", p: { xs: 1, md: 2 } }}>
      <Paper elevation={0} sx={{ p: { xs: 1.2, md: 2 }, mb: 1.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 1.5 }}>
          <ManageHistoryIcon sx={{ color: primaryColor, fontSize: 34 }} />
          <Box>
            <Typography sx={{ fontWeight: 950, fontSize: "1.2rem", color: primaryColor }}>سجل تغييرات ملفات الطلاب</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: "text.secondary" }}>
              مسؤول الاتصال · الحالة الدراسية · حالة السداد · الفرع — بتاريخ كل تغيير ومين عمله
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(4,minmax(0,1fr))" },
            gap: 0.75,
            alignItems: "end",
            "& .MuiFormControl-root, & .MuiAutocomplete-root": { width: "100%", minWidth: "0 !important" }
          }}
        >
          <TextField type="date" size="small" label="من تاريخ" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} />
          <TextField type="date" size="small" label="إلى تاريخ" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} inputProps={{ dir: "ltr" }} />
          <Autocomplete
            options={boot.branches}
            value={branch}
            disabled={boot.branches.length === 1}
            onChange={(_, v) => setBranch(v)}
            getOptionLabel={(o) => o?.name || ""}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            renderInput={(params) => <TextField {...params} size="small" label="الفرع" placeholder="كل الفروع" InputLabelProps={{ shrink: true }} />}
          />
          <Autocomplete
            options={boot.batches}
            value={batch}
            onChange={(_, v) => setBatch(v)}
            getOptionLabel={(o) => o?.name || ""}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            renderInput={(params) => <TextField {...params} size="small" label="الدفعة (اختياري)" InputLabelProps={{ shrink: true }} />}
          />
        </Box>

        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.7} sx={{ mt: 0.85, "& .MuiButton-root": { fontWeight: 900, minWidth: 110 } }}>
          <Button
            variant={isDark ? "outlined" : "contained"}
            onClick={load}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
            sx={isDark ? { borderColor: primaryColor } : { backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}
          >
            عرض
          </Button>
          <Badge badgeContent={activeFilterCount} color="error" overlap="rectangular">
            <Button variant="outlined" startIcon={<FilterAltIcon />} onClick={() => setFilterDialogOpen(true)} disabled={!rows.length}>
              الفلاتر المتقدمة
            </Button>
          </Badge>
          <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportExcel} disabled={!visible.length}>
            تصدير Excel
          </Button>
        </Stack>

        {boot.trackingSince ? (
          <Typography sx={{ mt: 1, fontSize: 12, color: "text.secondary", fontWeight: 700 }}>
            التسجيل شغال من {formatDateTime(boot.trackingSince)} — أي تغيير قبل كده مش متسجل.
          </Typography>
        ) : (
          <Alert severity="info" sx={{ mt: 1, fontWeight: 700 }}>
            التسجيل شغال من 11/10/2026 — لسه مفيش تغييرات متسجلة.
          </Alert>
        )}
      </Paper>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.2 }}>
        <Chip label={`الإجمالي: ${visible.length}`} sx={{ fontWeight: 900 }} />
        {Object.entries(KINDS).map(([key, k]) => (
          <Chip key={key} label={`${k.label}: ${counts[key]}`} variant="outlined" sx={{ fontWeight: 800, color: k.color, borderColor: k.color }} />
        ))}
        {truncated ? <Chip color="warning" label="النتايج كتير — ضيّق الفترة أو اختار فرع/دفعة" sx={{ fontWeight: 800 }} /> : null}
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
        <Box sx={{ p: 1.2 }}>
          <TextField
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="بحث سريع بالاسم أو الهوية أو أي قيمة..."
            size="small"
            fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
        </Box>
        <Box sx={{ overflow: "auto", maxHeight: "calc(100vh - 360px)", minHeight: 280 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 1100, fontSize: 13 }}>
            <thead>
              <tr>
                <th style={th}>التاريخ والوقت</th>
                <th style={th}>الطالب</th>
                <th style={th}>الدبلوم / الدورة</th>
                <th style={th}>الفرع</th>
                <th style={th}>نوع التغيير</th>
                <th style={th}>التغيير</th>
                <th style={th}>بواسطة</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center" }}><CircularProgress size={28} sx={{ color: primaryColor }} /></td></tr>
              ) : !visible.length ? (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: muted, fontWeight: 700 }}>مفيش تغييرات في الفترة دي</td></tr>
              ) : (
                visible.map((r, i) => {
                  const k = KINDS[r.kind] || { label: r.kind, color: "#555" };
                  return (
                    <tr key={`${r.id}-${r.kind}`} style={{ background: i % 2 ? "rgba(5,117,70,.05)" : undefined }}>
                      <td style={{ ...td, whiteSpace: "nowrap", direction: "ltr", textAlign: "right" }}>{formatDateTime(r.changedAt)}</td>
                      <td style={td}>
                        <div style={{ fontWeight: 800 }}>{r.studentName}</div>
                        <div style={{ fontSize: 11, color: muted, direction: "ltr", textAlign: "right" }}>{r.nationalId}</div>
                      </td>
                      <td style={td}>
                        <div>{r.diplomName}</div>
                        {r.batchName ? <div style={{ fontSize: 11, color: muted }}>دفعة {r.batchName}</div> : null}
                      </td>
                      <td style={td}>{r.branchName}</td>
                      <td style={td}>
                        <span style={{ display: "inline-block", padding: "1px 10px", borderRadius: 99, border: `1px solid ${k.color}`, color: k.color, fontWeight: 800, fontSize: 12, whiteSpace: "nowrap" }}>{k.label}</span>
                      </td>
                      <td style={td}>
                        <span style={{ color: accentColor, textDecoration: r.oldValue ? "line-through" : "none", opacity: 0.85 }}>{r.oldValue || "—"}</span>
                        <ArrowBackIcon sx={{ fontSize: 15, mx: 0.8, verticalAlign: "middle", color: "#8a9b92" }} />
                        <span style={{ color: primaryColor, fontWeight: 900 }}>{r.newValue || "—"}</span>
                      </td>
                      <td style={td}>
                        {r.changedByUser ? (
                          <div style={{ fontWeight: 700 }}>{r.changedByUser}</div>
                        ) : (
                          <div style={{ fontWeight: 700, color: muted }}>{sourceLabel(r.source) || "غير معروف"}</div>
                        )}
                        {r.actionNotes ? <div style={{ fontSize: 11, color: muted }}>{r.actionNotes}</div> : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Box>
      </Paper>

      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 4, direction: "rtl" } }}>
        <DialogTitle sx={{ color: "#fff", background: `linear-gradient(135deg,${primaryColor},${primaryDark})`, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterAltIcon />
            <Typography sx={{ fontWeight: 900 }}>الفلاتر المتقدمة</Typography>
          </Stack>
          <IconButton onClick={() => setFilterDialogOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" }, gap: 1.3 }}>
            <MultiValueFilter label="نوع التغيير" options={filterOptions.kind} value={columnFilters.kind} onChange={(v) => setColumnFilter("kind", v)} getLabel={(k) => KINDS[k]?.label || k} />
            <MultiValueFilter label="الدبلوم / الدورة" options={filterOptions.diplomName} value={columnFilters.diplomName} onChange={(v) => setColumnFilter("diplomName", v)} />
            <MultiValueFilter label="الدفعة" options={filterOptions.batchName} value={columnFilters.batchName} onChange={(v) => setColumnFilter("batchName", v)} />
            <MultiValueFilter label="مسؤول الاتصال (قديم أو جديد)" options={filterOptions.trainer} value={columnFilters.trainer} onChange={(v) => setColumnFilter("trainer", v)} />
            <MultiValueFilter label="بواسطة" options={filterOptions.changedBy} value={columnFilters.changedBy} onChange={(v) => setColumnFilter("changedBy", v)} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button color="error" startIcon={<RestartAltIcon />} onClick={() => setColumnFilters(EMPTY_FILTERS)} disabled={!activeFilterCount} sx={{ fontWeight: 900 }}>
            مسح الفلاتر
          </Button>
          <Button variant="contained" onClick={() => setFilterDialogOpen(false)} sx={{ fontWeight: 900, backgroundColor: primaryColor, "&:hover": { backgroundColor: primaryDark } }}>
            تطبيق ({visible.length})
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentLevelHistoryReport;
