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
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
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
  Typography
} from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import HrBioEmployeeDetailDialog, { fmtClock, fmtDateTimeText } from "./HrBioEmployeeDetailDialog";
import { excelBlobFromCsv } from "../utils/excelExport";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_DAYS = 93;
const DAY_REQUEST_TIMEOUT_MS = 170000;

const pad = (value) => String(value).padStart(2, "0");

// Local date (not UTC) so the day never shifts around midnight.
const toDateValue = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateValue = (value) => new Date(`${value}T00:00:00`);

const enumerateDays = (from, to) => {
  const start = parseDateValue(from);
  const end = parseDateValue(to);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return [];
  }

  const days = [];
  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    days.push(toDateValue(new Date(time)));
  }
  return days;
};

const ATTENDANCE_META = {
  attended: { label: "حضر", color: "success" },
  "no-punches": { label: "لم يبصم", color: "error" },
  "not-linked": { label: "غير مربوط", color: "default" }
};

const LEVEL_ICON = {
  ok: <CheckCircleRoundedIcon color="success" fontSize="small" />,
  warning: <WarningAmberRoundedIcon color="warning" fontSize="small" />,
  info: <InfoOutlinedIcon color="info" fontSize="small" />
};

const presets = () => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return {
    today: [toDateValue(today), toDateValue(today)],
    last7: [toDateValue(new Date(today.getTime() - 6 * DAY_MS)), toDateValue(today)],
    last30: [toDateValue(new Date(today.getTime() - 29 * DAY_MS)), toDateValue(today)],
    month: [toDateValue(monthStart), toDateValue(today)],
    prevMonth: [toDateValue(prevMonthStart), toDateValue(prevMonthEnd)]
  };
};

export default function HrBioTimePeriodDialog({
  open,
  onClose,
  apiBaseUrl,
  branches = [],
  actor = {},
  onFinished
}) {
  const initial = presets();

  const [fromDate, setFromDate] = useState(initial.today[0]);
  const [toDate, setToDate] = useState(initial.today[1]);
  const [branchGuid, setBranchGuid] = useState("");
  const [reportOnly, setReportOnly] = useState(false);

  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | pulling | reporting | done
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [pullResults, setPullResults] = useState([]);
  const [report, setReport] = useState(null);
  const [reportRange, setReportRange] = useState({ from: "", to: "" });
  const [error, setError] = useState("");

  const [tableFilter, setTableFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [detailEmployee, setDetailEmployee] = useState(null);

  const cancelRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelRef.current = true;
    };
  }, []);

  const days = useMemo(() => enumerateDays(fromDate, toDate), [fromDate, toDate]);

  const applyPreset = (key) => {
    const [from, to] = presets()[key];
    setFromDate(from);
    setToDate(to);
  };

  const pullOneDay = useCallback(
    async (day) => {
      const controller = new AbortController();
      const timer = window.setTimeout(
        () => controller.abort(),
        DAY_REQUEST_TIMEOUT_MS
      );

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/hr/attendance/biotime/sync?date=${encodeURIComponent(day)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actor),
            signal: controller.signal
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error
              ? `${result?.message || "تعذر السحب"}: ${result.error}`
              : result?.message ||
                  (response.status === 524 || response.status === 504
                    ? `انتهى الوقت المسموح على السيرفر (HTTP ${response.status}) — السيرفر يحتاج تحديث للنسخة الأسرع`
                    : `تعذر السحب (HTTP ${response.status})`)
          );
        }

        const data = result?.data || {};
        return {
          day,
          ok: true,
          received: Number(data.received || 0),
          inserted: Number(data.inserted || 0),
          unmapped: Number(data.unmapped || 0)
        };
      } finally {
        window.clearTimeout(timer);
      }
    },
    [apiBaseUrl, actor]
  );

  const loadReport = useCallback(async () => {
    const params = new URLSearchParams({
      branchGuid,
      fromDate,
      toDate,
      verify: "true"
    });

    const response = await fetch(
      `${apiBaseUrl}/api/hr/attendance/report/branch?${params.toString()}`,
      { cache: "no-store" }
    );

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(
        result?.error
          ? `${result?.message || "تعذر إنشاء تقرير الفرع"}: ${result.error}`
          : result?.message || "تعذر إنشاء تقرير الفرع"
      );
    }

    return result;
  }, [apiBaseUrl, branchGuid, fromDate, toDate]);

  const start = useCallback(async () => {
    setError("");
    setReport(null);
    setPullResults([]);
    setTableFilter("all");
    setSearch("");

    if (!days.length) {
      setError("راجع الفترة: تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.");
      return;
    }

    if (days.length > MAX_DAYS) {
      setError(`الحد الأقصى ${MAX_DAYS} يومًا في المرة الواحدة.`);
      return;
    }

    if (reportOnly && !branchGuid) {
      setError("اختر الفرع لعرض التقرير.");
      return;
    }

    cancelRef.current = false;
    setRunning(true);

    try {
      if (!reportOnly) {
        setPhase("pulling");
        const results = [];

        for (let index = 0; index < days.length; index += 1) {
          if (cancelRef.current || !mountedRef.current) break;

          const day = days[index];
          setProgress({ done: index, total: days.length, current: day });

          let result;
          try {
            result = await pullOneDay(day);
          } catch (firstError) {
            // One quiet retry: a single slow request must not spoil the period.
            try {
              result = await pullOneDay(day);
            } catch (secondError) {
              result = {
                day,
                ok: false,
                error:
                  secondError?.name === "AbortError"
                    ? "انتهت مهلة الطلب"
                    : secondError?.message || firstError?.message || "فشل السحب"
              };
            }
          }

          results.push(result);
          if (mountedRef.current) setPullResults([...results]);
        }

        if (mountedRef.current) {
          setProgress({ done: results.length, total: days.length, current: "" });
        }
      }

      if (cancelRef.current || !mountedRef.current) {
        setPhase("idle");
        return;
      }

      if (branchGuid) {
        setPhase("reporting");
        const result = await loadReport();
        if (mountedRef.current) {
          setReport(result);
          setReportRange({ from: fromDate, to: toDate });
        }
      }

      if (mountedRef.current) setPhase("done");
      if (onFinished) onFinished();
    } catch (runError) {
      if (mountedRef.current) {
        setError(runError?.message || "حدث خطأ غير متوقع");
        setPhase("idle");
      }
    } finally {
      if (mountedRef.current) setRunning(false);
    }
  }, [branchGuid, days, fromDate, loadReport, onFinished, pullOneDay, reportOnly, toDate]);

  const stop = () => {
    cancelRef.current = true;
  };

  const failedDays = pullResults.filter((item) => !item.ok);
  const pulledDays = pullResults.filter((item) => item.ok);
  const totalReceived = pulledDays.reduce((sum, item) => sum + item.received, 0);
  const totalInserted = pulledDays.reduce((sum, item) => sum + item.inserted, 0);

  const allRows = useMemo(
    () => (Array.isArray(report?.data) ? report.data : []),
    [report]
  );

  const counts = useMemo(
    () => ({
      all: allRows.length,
      attended: allRows.filter((row) => row.attendance === "attended").length,
      "no-punches": allRows.filter((row) => row.attendance === "no-punches").length,
      "not-linked": allRows.filter((row) => row.attendance === "not-linked").length,
      mismatch: allRows.filter((row) => row.check === "mismatch").length
    }),
    [allRows]
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return allRows.filter((row) => {
      if (tableFilter === "mismatch") {
        if (row.check !== "mismatch") return false;
      } else if (tableFilter !== "all" && row.attendance !== tableFilter) {
        return false;
      }

      if (!term) return true;

      return [row.name, row.employeeCode, row.bioTimeCode]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [allRows, tableFilter, search]);

  const exportCsv = () => {
    if (!allRows.length) return;

    const headers = [
      "الموظف",
      "كود الموظف",
      "كود البصمة",
      "الحالة",
      "أيام البصمة",
      "أيام الفترة",
      "أول بصمة",
      "آخر بصمة",
      "بصمات النظام",
      "بصمات BioTime",
      "أيام التأخير",
      "بصمة غير مكتملة",
      "دقائق التأخير",
      "دقائق العمل",
      "دقائق الإضافي",
      "مطابقة BioTime"
    ];

    const values = allRows.map((row) => [
      row.name,
      row.employeeCode,
      row.bioTimeCode || "",
      row.attendanceLabel,
      row.daysWithPunches,
      row.daysInPeriod,
      row.firstPunch || "",
      row.lastPunch || "",
      row.storedPunches,
      row.bioTimePunches ?? "",
      row.lateDays,
      row.incompleteDays,
      row.lateMinutes,
      row.workedMinutes,
      row.overtimeMinutes,
      row.checkLabel
    ]);

    const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv =
      "﻿" +
      [headers, ...values]
        .map((line) => line.map(escape).join(","))
        .join("\r\n");

    const blob = excelBlobFromCsv([csv]);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `تقرير-${report?.branch?.name || "الفرع"}-${reportRange.from}-${reportRange.to}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const totals = report?.totals;
  const singleDay = reportRange.from && reportRange.from === reportRange.to;

  return (
    <Dialog
      open={open}
      onClose={() => !running && onClose()}
      maxWidth="xl"
      fullWidth
      dir="rtl"
      PaperProps={{ sx: { borderRadius: 3, minHeight: { xs: "80vh", md: "70vh" } } }}
    >
      <DialogTitle sx={{ fontWeight: 950 }}>
        سحب بصمات فترة وتقرير حضور فرع
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Alert severity="info" sx={{ fontWeight: 700 }}>
            البصمات مصدرها برنامج <b>BioTime</b> (الأجهزة ترسل إليه ونحن نسحب منه). هذه
            الشاشة تسحب الفترة لكل الفروع، ثم تعرض تقرير الفرع الذي تختاره: من
            <b> حضر</b> ومن <b>لم يبصم</b> ومن <b>غير مربوط</b>. اضغط على أي موظف لترى
            تفاصيله يومًا بيوم. سحب الفترة مرة أخرى لا يكرر أي بصمة.
          </Alert>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            <TextField
              label="من"
              type="date"
              size="small"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={running}
            />
            <TextField
              label="إلى"
              type="date"
              size="small"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={running}
            />

            <FormControl size="small" sx={{ minWidth: 220 }} disabled={running}>
              <InputLabel>الفرع</InputLabel>
              <Select
                label="الفرع"
                value={branchGuid}
                onChange={(event) => setBranchGuid(event.target.value)}
              >
                <MenuItem value="">بدون تقرير (سحب فقط)</MenuItem>
                {branches.map((item) => (
                  <MenuItem key={item?.guid} value={item?.guid || ""}>
                    {item?.name || "غير محدد"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <ToggleButtonGroup size="small" exclusive disabled={running}>
              <ToggleButton value="today" onClick={() => applyPreset("today")}>
                اليوم
              </ToggleButton>
              <ToggleButton value="last7" onClick={() => applyPreset("last7")}>
                آخر 7 أيام
              </ToggleButton>
              <ToggleButton value="last30" onClick={() => applyPreset("last30")}>
                آخر 30 يوم
              </ToggleButton>
              <ToggleButton value="month" onClick={() => applyPreset("month")}>
                هذا الشهر
              </ToggleButton>
              <ToggleButton value="prevMonth" onClick={() => applyPreset("prevMonth")}>
                الشهر الماضي
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOnly}
                  onChange={(event) => setReportOnly(event.target.checked)}
                  disabled={running}
                />
              }
              label="عرض التقرير فقط بدون سحب جديد"
            />
            <Typography sx={{ fontSize: 12, opacity: 0.75 }}>
              {days.length
                ? `${days.length} يوم${days.length > 31 && !reportOnly ? " — السحب سيستغرق عدة دقائق" : ""}`
                : "فترة غير صحيحة"}
            </Typography>
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {phase === "pulling" && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900, mb: 0.8 }}>
                جاري سحب البصمات… {progress.done} / {progress.total}
                {progress.current ? ` — ${progress.current}` : ""}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress.total ? (progress.done / progress.total) * 100 : 0}
              />
            </Paper>
          )}

          {phase === "reporting" && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography sx={{ fontWeight: 900 }}>
                  جاري تجهيز تقرير الفرع ومطابقته مع BioTime…
                </Typography>
              </Stack>
            </Paper>
          )}

          {!!pullResults.length && phase !== "pulling" && (
            <Alert severity={failedDays.length ? "warning" : "success"}>
              تم سحب {pulledDays.length} يوم من {pullResults.length}: استلمنا{" "}
              <b>{totalReceived}</b> بصمة، الجديد منها <b>{totalInserted}</b>.
              {failedDays.length > 0 && (
                <>
                  {" "}
                  تعذر سحب: {failedDays.map((item) => item.day).join("، ")} — أعد
                  المحاولة لهذه الأيام.
                  <Box component="span" sx={{ display: "block", mt: 0.5, fontSize: 12, opacity: 0.9 }}>
                    السبب: {failedDays[0].error}
                  </Box>
                </>
              )}
            </Alert>
          )}

          {report && totals && (
            <>
              <Typography sx={{ fontWeight: 950, fontSize: 18 }}>
                {report.branch?.name} —{" "}
                {singleDay
                  ? `يوم ${report.fromDate}`
                  : `من ${report.fromDate} إلى ${report.toDate} (${totals.daysInPeriod} يوم)`}
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: {
                    xs: "repeat(2,minmax(0,1fr))",
                    md: "repeat(5,minmax(0,1fr))"
                  }
                }}
              >
                {[
                  ["إجمالي الموظفين", totals.employees, "inherit"],
                  ["حضر", totals.attended, "success.main"],
                  ["لم يبصم", totals.noPunches, totals.noPunches ? "error.main" : "inherit"],
                  ["غير مربوط", totals.notLinked, totals.notLinked ? "warning.main" : "inherit"],
                  [
                    "بصمات النظام / BioTime",
                    `${totals.storedPunches} / ${totals.bioTimePunches ?? "-"}`,
                    totals.mismatches ? "warning.main" : "inherit"
                  ]
                ].map(([label, value, color]) => (
                  <Paper key={label} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: 22, fontWeight: 950, color }}>{value}</Typography>
                  </Paper>
                ))}
              </Box>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 950, mb: 1 }}>
                  هل كل شيء سليم؟ (فحص البيانات)
                </Typography>
                <Stack spacing={0.9}>
                  {(report.checks || []).map((check) => (
                    <Stack key={check.key} direction="row" spacing={1} alignItems="flex-start">
                      <Box sx={{ pt: 0.2 }}>{LEVEL_ICON[check.level] || LEVEL_ICON.info}</Box>
                      <Box>
                        <Typography sx={{ fontWeight: 900 }}>{check.label}</Typography>
                        <Typography sx={{ opacity: 0.85, fontSize: 14 }}>{check.detail}</Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
                <TextField
                  size="small"
                  placeholder="بحث بالاسم أو الكود"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  sx={{ minWidth: 240 }}
                />
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={tableFilter}
                  onChange={(event, value) => value && setTableFilter(value)}
                >
                  <ToggleButton value="all">الكل ({counts.all})</ToggleButton>
                  <ToggleButton value="attended">حضر ({counts.attended})</ToggleButton>
                  <ToggleButton value="no-punches">لم يبصم ({counts["no-punches"]})</ToggleButton>
                  <ToggleButton value="not-linked">غير مربوط ({counts["not-linked"]})</ToggleButton>
                  <ToggleButton value="mismatch">فرق مع BioTime ({counts.mismatch})</ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ flex: 1 }} />
                <Button variant="outlined" onClick={exportCsv}>
                  Excel
                </Button>
              </Stack>

              <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
                اضغط على اسم أي موظف لعرض تفاصيله يومًا بيوم.
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 460 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>الموظف</TableCell>
                      <TableCell>كود البصمة</TableCell>
                      <TableCell>الحالة</TableCell>
                      {!singleDay && <TableCell align="center">أيام البصمة</TableCell>}
                      <TableCell align="center">أول بصمة</TableCell>
                      <TableCell align="center">آخر بصمة</TableCell>
                      <TableCell align="center">بصمات النظام / BioTime</TableCell>
                      <TableCell align="center">أيام التأخير</TableCell>
                      <TableCell align="center">بصمة واحدة فقط</TableCell>
                      <TableCell>مطابقة BioTime</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visibleRows.map((row) => {
                      const meta = ATTENDANCE_META[row.attendance] || ATTENDANCE_META["not-linked"];
                      return (
                        <TableRow
                          key={row.employeeGuid}
                          hover
                          sx={{ cursor: "pointer" }}
                          onClick={() =>
                            setDetailEmployee({ employeeGuid: row.employeeGuid, name: row.name })
                          }
                        >
                          <TableCell sx={{ fontWeight: 800 }}>{row.name}</TableCell>
                          <TableCell>{row.bioTimeCode || "-"}</TableCell>
                          <TableCell>
                            <Chip size="small" color={meta.color} label={meta.label} sx={{ fontWeight: 800 }} />
                          </TableCell>
                          {!singleDay && (
                            <TableCell align="center">
                              {row.linked ? `${row.daysWithPunches} / ${row.daysInPeriod}` : "-"}
                            </TableCell>
                          )}
                          <TableCell align="center">
                            {singleDay ? fmtClock(row.firstPunch) : fmtDateTimeText(row.firstPunch)}
                          </TableCell>
                          <TableCell align="center">
                            {row.storedPunches > 1
                              ? singleDay
                                ? fmtClock(row.lastPunch)
                                : fmtDateTimeText(row.lastPunch)
                              : "-"}
                          </TableCell>
                          <TableCell align="center">
                            {row.linked ? `${row.storedPunches} / ${row.bioTimePunches ?? "-"}` : "-"}
                          </TableCell>
                          <TableCell align="center">{row.linked ? row.lateDays : "-"}</TableCell>
                          <TableCell align="center">{row.linked ? row.incompleteDays : "-"}</TableCell>
                          <TableCell>
                            {row.check === "mismatch" ? (
                              <Chip size="small" color="warning" label={row.checkLabel} sx={{ fontWeight: 800 }} />
                            ) : row.check === "ok" ? (
                              <CheckCircleRoundedIcon color="success" fontSize="small" />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}

                    {!visibleRows.length && (
                      <TableRow>
                        <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                          لا توجد نتائج
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        {running ? (
          <Button color="warning" onClick={stop}>
            إيقاف
          </Button>
        ) : (
          <Button onClick={onClose}>إغلاق</Button>
        )}

        <Button
          variant="contained"
          onClick={start}
          disabled={running || !days.length}
          startIcon={running ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ fontWeight: 900 }}
        >
          {running
            ? "جاري التنفيذ..."
            : reportOnly
              ? "عرض التقرير"
              : branchGuid
                ? "سحب وعرض تقرير الفرع"
                : "سحب الفترة"}
        </Button>
      </DialogActions>

      <HrBioEmployeeDetailDialog
        open={Boolean(detailEmployee)}
        onClose={() => setDetailEmployee(null)}
        apiBaseUrl={apiBaseUrl}
        employee={detailEmployee}
        fromDate={reportRange.from || fromDate}
        toDate={reportRange.to || toDate}
      />
    </Dialog>
  );
}
