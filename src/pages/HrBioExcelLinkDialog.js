import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
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
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha
} from "@mui/material";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import Swal from "sweetalert2";

const GRID =
  "54px minmax(120px,.8fr) minmax(180px,1.2fr) 90px minmax(260px,1.7fr) minmax(120px,.8fr) 80px 120px";

const STATUS_META = {
  strong: ["مطابق قوي", "success"],
  likely: ["مطابق محتمل قوي", "success"],
  review: ["يحتاج مراجعة", "warning"],
  "employee-conflict": ["تعارض موظف", "warning"],
  "already-linked": ["مربوط بالفعل", "info"],
  "duplicate-code": ["رقم بصمة مكرر", "error"],
  unmatched: ["غير مطابق", "default"]
};

const PAGE_SIZES = [25, 50, 100];
const SAVE_CHUNK = 100;

const scoreOf = (selected, row) =>
  Number(selected?.score || row?.bestMatch?.score || 0);

const canApproveRow = (row, selected) =>
  Boolean(row?.canLink) &&
  Boolean(selected?.employeeGuid) &&
  row?.status !== "already-linked" &&
  row?.status !== "duplicate-code";

// One table row. Memoized so ticking a checkbox re-renders ONE row, not 400.
const ExcelRow = React.memo(function ExcelRow({
  row,
  selected,
  approved,
  disabled,
  onToggle,
  onSelect
}) {
  const [label, color] = STATUS_META[row.status] || [
    row.statusLabel || row.status || "غير محدد",
    "default"
  ];
  const score = scoreOf(selected, row);
  const suggestions = Array.isArray(row.suggestions) ? row.suggestions : [];
  const approvable = canApproveRow(row, selected);

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: GRID,
        gap: 0.7,
        alignItems: "center",
        px: 1,
        py: 0.75,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor:
          row.status === "duplicate-code"
            ? alpha(theme.palette.error.main, 0.08)
            : row.status === "already-linked"
              ? alpha(theme.palette.info.main, 0.08)
              : "transparent"
      })}
    >
      <Checkbox
        size="small"
        checked={Boolean(approved)}
        disabled={!approvable || disabled}
        onChange={(event) => onToggle(row.rowKey, event.target.checked)}
      />

      <Box>
        <Typography sx={{ fontSize: 12, fontWeight: 900 }}>
          {row.sheetName || "-"}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
          صف {row.excelRowNumber || "-"}
        </Typography>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 900,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {row.excelName || "-"}
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 12 }}>
          الهوية: {row.identityNumber || "-"}
        </Typography>
      </Box>

      <Chip
        size="small"
        icon={<FingerprintRoundedIcon />}
        label={row.fingerprintCode || "-"}
        variant="outlined"
        sx={{ fontWeight: 950 }}
      />

      {row.status === "already-linked" ? (
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 950 }}>
            {row.bestMatch?.employeeName || "-"}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12 }}>
            مربوط بنفس رقم البصمة
          </Typography>
        </Box>
      ) : (
        <TextField
          select
          size="small"
          fullWidth
          value={selected?.employeeGuid || ""}
          disabled={row.status === "duplicate-code" || disabled}
          SelectProps={{ native: true }}
          onChange={(event) => {
            const guid = event.target.value;
            onSelect(
              row.rowKey,
              suggestions.find((item) => item.employeeGuid === guid) || null
            );
          }}
        >
          <option value="">— لا يوجد مطابق —</option>
          {suggestions.map((item) => (
            <option key={item.employeeGuid} value={item.employeeGuid}>
              {`${item.employeeName || "-"} • ${item.employeeCode || "-"} (${Number(
                item.score || 0
              )}%)`}
            </option>
          ))}
        </TextField>
      )}

      <Typography sx={{ fontSize: 12, fontWeight: 850 }}>
        {selected?.branchName || row.bestMatch?.branchName || "-"}
      </Typography>

      <Chip
        size="small"
        label={`${score}%`}
        color={score >= 85 ? "success" : score >= 60 ? "warning" : "default"}
        variant="outlined"
        sx={{ fontWeight: 900 }}
      />

      <Tooltip
        title={
          Array.isArray(selected?.reasons) && selected.reasons.length
            ? selected.reasons.join(" • ")
            : row.statusLabel || ""
        }
      >
        <Chip
          size="small"
          color={color}
          label={row.statusLabel || label}
          sx={{ fontWeight: 850, maxWidth: 116 }}
        />
      </Tooltip>
    </Box>
  );
});

export default function HrBioExcelLinkDialog({
  open,
  onClose,
  apiBaseUrl,
  actor = {},
  onLinked
}) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [rows, setRows] = useState([]);
  const [selections, setSelections] = useState({});
  const [approved, setApproved] = useState({});

  const [sheetFilter, setSheetFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const busy = loading || saving;
  const actorRef = useRef(actor);
  actorRef.current = actor;

  // Typing never re-filters 400 rows on every key: wait until the user pauses.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const sheets = useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      const name = row.sheetName || "-";
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, total]) => ({ name, total }));
  }, [rows]);

  // Rows of the selected branch (sheet) only.
  const scopeRows = useMemo(
    () =>
      sheetFilter
        ? rows.filter((row) => (row.sheetName || "-") === sheetFilter)
        : rows,
    [rows, sheetFilter]
  );

  const stats = useMemo(() => {
    const counts = {
      total: scopeRows.length,
      strong: 0,
      likely: 0,
      review: 0,
      linked: 0,
      unmatched: 0,
      duplicate: 0
    };

    scopeRows.forEach((row) => {
      if (row.status === "strong") counts.strong += 1;
      else if (row.status === "likely") counts.likely += 1;
      else if (row.status === "review" || row.status === "employee-conflict")
        counts.review += 1;
      else if (row.status === "already-linked") counts.linked += 1;
      else if (row.status === "duplicate-code") counts.duplicate += 1;
      else counts.unmatched += 1;
    });

    return counts;
  }, [scopeRows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return scopeRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!term) return true;

      const selected = selections[row.rowKey];
      return [
        row.sheetName,
        row.excelName,
        row.identityNumber,
        row.fingerprintCode,
        selected?.employeeName,
        selected?.employeeCode
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [scopeRows, statusFilter, search, selections]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRows, safePage, pageSize]
  );

  const approvedLinks = useMemo(
    () =>
      rows
        .filter((row) => approved[row.rowKey])
        .map((row) => {
          const selected = selections[row.rowKey];
          if (!selected?.employeeGuid || !row.fingerprintCode) return null;

          return {
            employeeGuid: selected.employeeGuid,
            fingerprintCode: String(row.fingerprintCode),
            bioTimeEmployeeId:
              Number(row.bioTimeEmployeeId || 0) > 0
                ? Number(row.bioTimeEmployeeId)
                : null
          };
        })
        .filter(Boolean),
    [rows, approved, selections]
  );

  const previewFile = useCallback(
    async (chosen) => {
      if (!chosen) return;

      if (!String(chosen.name || "").toLowerCase().endsWith(".xlsx")) {
        await Swal.fire({
          icon: "warning",
          title: "ملف غير مدعوم",
          text: "اختر ملف Excel بصيغة XLSX"
        });
        return;
      }

      setLoading(true);

      try {
        const formData = new FormData();
        formData.append("file", chosen);

        const response = await fetch(
          `${apiBaseUrl}/api/hr/attendance/biotime/excel/preview`,
          { method: "POST", body: formData }
        );
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error
              ? `${result?.message || "تعذر قراءة ملف البصمة"}: ${result.error}`
              : result?.message || "تعذر قراءة ملف البصمة"
          );
        }

        const nextRows = Array.isArray(result?.data) ? result.data : [];
        const nextSelections = {};
        nextRows.forEach((row) => {
          if (row?.bestMatch?.employeeGuid) {
            nextSelections[row.rowKey] = row.bestMatch;
          }
        });

        setFile(chosen);
        setRows(nextRows);
        setSelections(nextSelections);
        setApproved({});
        setPage(1);
      } catch (error) {
        setRows([]);
        setSelections({});
        setApproved({});

        await Swal.fire({
          icon: "error",
          title: "تعذر مطابقة ملف البصمة",
          text: error?.message || "حدث خطأ أثناء قراءة ملف Excel"
        });
      } finally {
        setLoading(false);
      }
    },
    [apiBaseUrl]
  );

  // Stable callbacks so memoized rows do not re-render.
  const handleToggle = useCallback((rowKey, checked) => {
    setApproved((current) => ({ ...current, [rowKey]: checked }));
  }, []);

  const handleSelect = useCallback((rowKey, value) => {
    setSelections((current) => ({ ...current, [rowKey]: value }));
    setApproved((current) => ({ ...current, [rowKey]: false }));
  }, []);

  const approveStrong = useCallback(() => {
    setApproved((current) => {
      const next = { ...current };
      scopeRows.forEach((row) => {
        const selected = selections[row.rowKey];
        if (
          canApproveRow(row, selected) &&
          row.status !== "employee-conflict" &&
          scoreOf(selected, row) >= 85
        ) {
          next[row.rowKey] = true;
        }
      });
      return next;
    });
  }, [scopeRows, selections]);

  const clearApprovals = useCallback(() => {
    setApproved((current) => {
      const next = { ...current };
      scopeRows.forEach((row) => {
        delete next[row.rowKey];
      });
      return next;
    });
  }, [scopeRows]);

  const callAutoLink = useCallback(
    async (apply) => {
      const formData = new FormData();
      formData.append("file", file);

      const params = new URLSearchParams({ apply: String(apply) });
      if (sheetFilter) params.set("sheet", sheetFilter);

      const response = await fetch(
        `${apiBaseUrl}/api/hr/attendance/biotime/excel/auto-link?${params.toString()}`,
        { method: "POST", body: formData }
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.error
            ? `${result?.message || "تعذر الربط التلقائي"}: ${result.error}`
            : result?.message || "تعذر الربط التلقائي"
        );
      }

      return result;
    },
    [apiBaseUrl, file, sheetFilter]
  );

  const autoLinkByIdentity = useCallback(async () => {
    if (!file) return;

    setSaving(true);
    setSaveProgress("جاري فحص الهويات...");

    try {
      const preview = await callAutoLink(false);
      const ready = Number(preview?.readyToLink || 0);

      if (!ready) {
        await Swal.fire({
          icon: "info",
          title: "لا يوجد موظفون جاهزون للربط",
          text: "كل المطابقات بالهوية مربوطة بالفعل، أو تحتاج مراجعة يدوية."
        });
        return;
      }

      const skipped = Object.entries(preview?.counts || {})
        .filter(([status]) => status !== "ready")
        .reduce((sum, [, value]) => sum + Number(value || 0), 0);

      const confirm = await Swal.fire({
        icon: "question",
        title: sheetFilter ? `ربط تلقائي: ${sheetFilter}` : "ربط تلقائي بالهوية؟",
        html: `
          <div style="text-align:right;line-height:1.9">
            سيتم ربط <b>${ready}</b> موظف تلقائيًا (رقم الهوية مطابق تمامًا)${
              sheetFilter ? ` في فرع <b>${sheetFilter}</b> فقط` : ""
            }.<br/>
            <b>${skipped}</b> صف لن يُمس (بدون هوية، غير موجود، مربوط بالفعل، أو يحتاج مراجعة).
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "ربط الآن",
        cancelButtonText: "إلغاء"
      });

      if (!confirm.isConfirmed) return;

      setSaveProgress("جاري الربط...");
      const done = await callAutoLink(true);

      if (onLinked) onLinked();
      await previewFile(file);

      await Swal.fire({
        icon: Number(done?.failed || 0) ? "warning" : "success",
        title: "تم الربط التلقائي",
        text:
          `${done?.message || "تم الربط"}` +
          (Number(done?.failed || 0) ? ` — تعذر ربط ${done.failed} موظف` : "")
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر الربط التلقائي",
        text: error?.message || "حدث خطأ أثناء الربط التلقائي"
      });
    } finally {
      setSaving(false);
      setSaveProgress("");
    }
  }, [callAutoLink, file, onLinked, previewFile, sheetFilter]);

  const saveApproved = useCallback(async () => {
    if (!approvedLinks.length) return;

    const guids = approvedLinks.map((item) => item.employeeGuid);
    const codes = approvedLinks.map((item) => item.fingerprintCode);

    if (new Set(guids).size !== guids.length) {
      await Swal.fire({
        icon: "error",
        title: "يوجد تعارض في الاختيارات",
        text: "نفس موظف النظام مختار لأكثر من صف. عدّل الاختيارات قبل الحفظ."
      });
      return;
    }

    if (new Set(codes).size !== codes.length) {
      await Swal.fire({
        icon: "error",
        title: "يوجد تعارض في الاختيارات",
        text: "نفس رقم البصمة مختار أكثر من مرة. عدّل الاختيارات قبل الحفظ."
      });
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "اعتماد ربط ملف البصمة؟",
      html: `
        <div style="text-align:right;line-height:1.9">
          سيتم ربط <b>${approvedLinks.length}</b> موظف فقط.<br/>
          الصفوف غير المحدد أمامها اعتماد لن يتم تعديلها.
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "اعتماد الربط",
      cancelButtonText: "مراجعة أكثر"
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);

    let linkedTotal = 0;
    let failure = "";

    try {
      for (let start = 0; start < approvedLinks.length; start += SAVE_CHUNK) {
        const chunk = approvedLinks.slice(start, start + SAVE_CHUNK);
        setSaveProgress(
          `جاري حفظ الربط... ${Math.min(start + chunk.length, approvedLinks.length)} / ${approvedLinks.length}`
        );

        const response = await fetch(
          `${apiBaseUrl}/api/hr/attendance/biotime/excel/link`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ links: chunk, ...actorRef.current })
          }
        );
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          failure = result?.error
            ? `${result?.message || "تعذر حفظ روابط Excel"}: ${result.error}`
            : result?.message || "تعذر حفظ روابط Excel";
          break;
        }

        linkedTotal += Number(result?.data?.linkedCount || 0);
      }

      if (onLinked) onLinked();
      if (file) await previewFile(file);

      await Swal.fire({
        icon: failure ? "warning" : "success",
        title: failure ? "تم الربط جزئيًا" : "تم ربط ملف البصمة",
        text: failure
          ? `تم ربط ${linkedTotal} موظف. توقف الحفظ بسبب: ${failure}`
          : `تم ربط ${linkedTotal} موظف بنجاح`
      });
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "تعذر ربط ملف البصمة",
        text: error?.message || "حدث خطأ أثناء حفظ الروابط"
      });
    } finally {
      setSaving(false);
      setSaveProgress("");
    }
  }, [apiBaseUrl, approvedLinks, file, onLinked, previewFile]);

  const statCards = [
    ["الصفوف", stats.total],
    ["مطابق قوي", stats.strong],
    ["مطابق محتمل", stats.likely],
    ["يحتاج مراجعة", stats.review],
    ["مربوط بالفعل", stats.linked],
    ["غير مطابق", stats.unmatched],
    ["بصمة مكررة", stats.duplicate]
  ];

  return (
    <Dialog
      open={open}
      onClose={() => !busy && onClose()}
      fullWidth
      maxWidth="xl"
      dir="rtl"
      PaperProps={{ sx: { borderRadius: 3, minHeight: "82vh" } }}
    >
      <DialogTitle sx={{ fontWeight: 950, pb: 1 }}>
        مطابقة ملف Excel مع موظفي البصمة
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.2}>
          <Alert severity="info">
            ارفع ملف <strong>XLSX</strong> (كل شيت = فرع). اختر <strong>الفرع</strong>{" "}
            لتربط موظفيه فقط، وجرّب عليه قبل باقي الفروع. لا يتم ربط أي موظف إلا
            بعد <strong>اعتماد</strong> أو باستخدام <strong>الربط التلقائي بالهوية</strong>.
          </Alert>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={0.8}
            alignItems={{ md: "center" }}
          >
            <Button
              component="label"
              variant="contained"
              disabled={busy}
              startIcon={
                loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <UploadFileRoundedIcon />
                )
              }
              sx={{ fontWeight: 950, minHeight: 42 }}
            >
              {loading
                ? "جاري قراءة ومطابقة الملف..."
                : file
                  ? "رفع ملف آخر"
                  : "اختيار ملف Excel"}
              <input
                hidden
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) => {
                  const chosen = event.target.files?.[0];
                  event.target.value = "";
                  if (chosen) previewFile(chosen);
                }}
              />
            </Button>

            <Paper
              variant="outlined"
              sx={{
                px: 1.2,
                py: 0.8,
                borderRadius: 2,
                minHeight: 42,
                flex: 1,
                display: "flex",
                alignItems: "center"
              }}
            >
              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 850,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {file?.name || "لم يتم اختيار ملف حتى الآن"}
              </Typography>
            </Paper>
          </Stack>

          {loading && <LinearProgress />}

          {!!rows.length && (
            <>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={0.8}
                alignItems={{ md: "center" }}
              >
                <FormControl size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>الفرع (الشيت)</InputLabel>
                  <Select
                    label="الفرع (الشيت)"
                    value={sheetFilter}
                    disabled={busy}
                    onChange={(event) => {
                      setSheetFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="">كل الفروع ({rows.length})</MenuItem>
                    {sheets.map((sheet) => (
                      <MenuItem key={sheet.name} value={sheet.name}>
                        {sheet.name} ({sheet.total})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  fullWidth
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="بحث بالاسم أو رقم البصمة أو الهوية..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon />
                      </InputAdornment>
                    )
                  }}
                />

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>حالة المطابقة</InputLabel>
                  <Select
                    label="حالة المطابقة"
                    value={statusFilter}
                    onChange={(event) => {
                      setStatusFilter(event.target.value);
                      setPage(1);
                    }}
                  >
                    <MenuItem value="all">كل الحالات</MenuItem>
                    <MenuItem value="strong">مطابق قوي</MenuItem>
                    <MenuItem value="likely">مطابق محتمل قوي</MenuItem>
                    <MenuItem value="review">يحتاج مراجعة</MenuItem>
                    <MenuItem value="employee-conflict">تعارض موظف</MenuItem>
                    <MenuItem value="already-linked">مربوط بالفعل</MenuItem>
                    <MenuItem value="unmatched">غير مطابق</MenuItem>
                    <MenuItem value="duplicate-code">رقم بصمة مكرر</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gap: 0.7,
                  gridTemplateColumns: {
                    xs: "repeat(2,minmax(0,1fr))",
                    md: "repeat(4,minmax(0,1fr))",
                    xl: "repeat(7,minmax(0,1fr))"
                  }
                }}
              >
                {statCards.map(([label, value]) => (
                  <Paper
                    key={label}
                    variant="outlined"
                    sx={{ p: 0.9, borderRadius: 2, textAlign: "center" }}
                  >
                    <Typography color="text.secondary" sx={{ fontSize: 12 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                      {value}
                    </Typography>
                  </Paper>
                ))}
              </Box>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={0.8}
                alignItems={{ md: "center" }}
              >
                <Button
                  variant="outlined"
                  onClick={approveStrong}
                  disabled={busy}
                  sx={{ fontWeight: 900 }}
                >
                  {sheetFilter ? "تحديد المطابق القوي للفرع" : "تحديد المطابق القوي"}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={clearApprovals}
                  disabled={busy}
                  sx={{ fontWeight: 900 }}
                >
                  إلغاء التحديد
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={autoLinkByIdentity}
                  disabled={busy}
                  sx={{ fontWeight: 900 }}
                >
                  {sheetFilter
                    ? "ربط تلقائي بالهوية لهذا الفرع"
                    : "ربط تلقائي بالهوية (كل الفروع)"}
                </Button>
                <Box sx={{ flex: 1 }} />
                <Typography sx={{ fontSize: 12, fontWeight: 800 }}>
                  {filteredRows.length} صف — المحدد للربط: {approvedLinks.length}
                </Typography>
              </Stack>

              {saving && (
                <Paper variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                  <Typography sx={{ fontWeight: 900, mb: 0.6 }}>
                    {saveProgress || "جاري التنفيذ..."}
                  </Typography>
                  <LinearProgress />
                </Paper>
              )}

              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Box
                  sx={(theme) => ({
                    display: "grid",
                    gridTemplateColumns: GRID,
                    gap: 0.7,
                    alignItems: "center",
                    px: 1,
                    py: 0.9,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontSize: 12,
                    fontWeight: 950,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  })}
                >
                  <Box>اعتماد</Box>
                  <Box>فرع الشيت</Box>
                  <Box>اسم Excel</Box>
                  <Box>رقم البصمة</Box>
                  <Box>موظف النظام المقترح</Box>
                  <Box>فرع النظام</Box>
                  <Box>التشابه</Box>
                  <Box>الحالة</Box>
                </Box>

                <Box sx={{ maxHeight: "46vh", overflow: "auto" }}>
                  {pageRows.map((row) => (
                    <ExcelRow
                      key={row.rowKey}
                      row={row}
                      selected={selections[row.rowKey] || null}
                      approved={Boolean(approved[row.rowKey])}
                      disabled={busy}
                      onToggle={handleToggle}
                      onSelect={handleSelect}
                    />
                  ))}

                  {!pageRows.length && (
                    <Alert severity="info" sx={{ m: 1 }}>
                      لا توجد نتائج ضمن الفلتر الحالي.
                    </Alert>
                  )}
                </Box>
              </Paper>

              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
              >
                <Pagination
                  count={pageCount}
                  page={safePage}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                  size="small"
                  disabled={busy}
                />
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>صفوف بالصفحة</InputLabel>
                  <Select
                    label="صفوف بالصفحة"
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                  >
                    {PAGE_SIZES.map((size) => (
                      <MenuItem key={size} value={size}>
                        {size}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={busy}>
          إغلاق
        </Button>
        <Button
          variant="contained"
          onClick={saveApproved}
          disabled={busy || !approvedLinks.length}
          sx={{ fontWeight: 950 }}
        >
          {saving ? "جاري حفظ الربط..." : `ربط المحدد (${approvedLinks.length})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
