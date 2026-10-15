import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";

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

const num = (value) => Number(value || 0);

// Sync ALL employees for a period, one day at a time (same endpoint the old
// single-day button used, so a range of one day behaves exactly as before).
export default function HrBioTimeSyncDialog({
  open,
  onClose,
  apiBaseUrl,
  actor = {},
  defaultDate,
  onFinished
}) {
  const [fromDate, setFromDate] = useState(defaultDate);
  const [toDate, setToDate] = useState(defaultDate);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [results, setResults] = useState([]);
  const [finished, setFinished] = useState(false);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState("");

  const cancelRef = useRef(false);
  const mountedRef = useRef(true);
  const actorRef = useRef(actor);
  actorRef.current = actor;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelRef.current = true;
    };
  }, []);

  // Every time the dialog opens it starts from the day selected on the page.
  useEffect(() => {
    if (open) {
      setFromDate(defaultDate);
      setToDate(defaultDate);
      setResults([]);
      setFinished(false);
      setStopped(false);
      setError("");
      setProgress({ done: 0, total: 0, current: "" });
    }
  }, [open, defaultDate]);

  const days = useMemo(() => enumerateDays(fromDate, toDate), [fromDate, toDate]);

  const applyPreset = (key) => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - DAY_MS);

    const map = {
      selected: [defaultDate, defaultDate],
      today: [toDateValue(today), toDateValue(today)],
      yesterdayToday: [toDateValue(yesterday), toDateValue(today)],
      last7: [toDateValue(new Date(today.getTime() - 6 * DAY_MS)), toDateValue(today)],
      month: [toDateValue(new Date(today.getFullYear(), today.getMonth(), 1)), toDateValue(today)],
      prevMonth: [
        toDateValue(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        toDateValue(new Date(today.getFullYear(), today.getMonth(), 0))
      ]
    };

    const [from, to] = map[key];
    setFromDate(from);
    setToDate(to);
  };

  const pullOneDay = useCallback(
    async (day) => {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), DAY_REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/hr/attendance/biotime/sync?date=${encodeURIComponent(day)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(actorRef.current),
            signal: controller.signal
          }
        );

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error
              ? `${result?.message || "تعذر مزامنة BioTime"}: ${result.error}`
              : result?.message ||
                  (response.status === 524 || response.status === 504
                    ? `انتهى الوقت المسموح على السيرفر (HTTP ${response.status}) — السيرفر يحتاج تحديث للنسخة الأسرع`
                    : `تعذر مزامنة BioTime (HTTP ${response.status})`)
          );
        }

        return { day, ok: true, data: result?.data || {} };
      } finally {
        window.clearTimeout(timer);
      }
    },
    [apiBaseUrl]
  );

  const start = useCallback(async () => {
    setError("");
    setResults([]);
    setFinished(false);
    setStopped(false);

    if (!days.length) {
      setError("راجع الفترة: تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية.");
      return;
    }

    if (days.length > MAX_DAYS) {
      setError(`الحد الأقصى ${MAX_DAYS} يومًا في المرة الواحدة.`);
      return;
    }

    cancelRef.current = false;
    setRunning(true);

    const collected = [];

    try {
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
                  : secondError?.message || firstError?.message || "فشل المزامنة"
            };
          }
        }

        collected.push(result);
        if (mountedRef.current) setResults([...collected]);
      }

      if (mountedRef.current) {
        setProgress({ done: collected.length, total: days.length, current: "" });
        setStopped(cancelRef.current && collected.length < days.length);
        setFinished(true);
      }
    } finally {
      if (mountedRef.current) setRunning(false);

      const okResults = collected.filter((item) => item.ok);
      if (okResults.length && onFinished) {
        const last = okResults[okResults.length - 1].data;
        onFinished({
          days: okResults.length,
          received: okResults.reduce((sum, item) => sum + num(item.data.received), 0),
          inserted: okResults.reduce((sum, item) => sum + num(item.data.inserted), 0),
          unmapped: okResults.reduce((sum, item) => sum + num(item.data.unmapped), 0),
          linkedEmployees: num(last.linkedEmployees),
          employeesWithPunches: num(last.employeesWithPunches)
        });
      }
    }
  }, [days, onFinished, pullOneDay]);

  const stop = () => {
    cancelRef.current = true;
  };

  const okResults = results.filter((item) => item.ok);
  const failed = results.filter((item) => !item.ok);

  const sum = (key) => okResults.reduce((total, item) => total + num(item.data[key]), 0);
  const last = okResults.length ? okResults[okResults.length - 1].data : {};

  const cards = [
    ["الأيام التي تمت", `${okResults.length} من ${days.length}`],
    ["البصمات المستلمة", sum("received")],
    ["الجديدة", sum("inserted")],
    ["حضور تم تحديثه (موظف/يوم)", sum("attendanceUpdated")],
    ["بصمات غير مربوطة", sum("unmapped")],
    ["موظفون مربوطون", num(last.linkedEmployees)]
  ];

  return (
    <Dialog
      open={open}
      onClose={() => !running && onClose()}
      maxWidth="md"
      fullWidth
      dir="rtl"
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 950 }}>مزامنة BioTime</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Alert severity="info" sx={{ fontWeight: 700 }}>
            يسحب بصمات <b>كل الموظفين</b> من BioTime للفترة المحددة ويحسب الحضور. اختر
            يومًا واحدًا (من = إلى) أو أكثر، مثلًا <b>أمس واليوم</b>. السحب مرة أخرى لا
            يكرر أي بصمة.
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
            <Typography sx={{ fontSize: 13, opacity: 0.75 }}>
              {days.length
                ? `${days.length} يوم${days.length > 31 ? " — سيستغرق عدة دقائق" : ""}`
                : "فترة غير صحيحة"}
            </Typography>
          </Stack>

          <ToggleButtonGroup size="small" exclusive disabled={running} sx={{ flexWrap: "wrap" }}>
            <ToggleButton value="selected" onClick={() => applyPreset("selected")}>
              اليوم المختار
            </ToggleButton>
            <ToggleButton value="today" onClick={() => applyPreset("today")}>
              اليوم
            </ToggleButton>
            <ToggleButton value="yesterdayToday" onClick={() => applyPreset("yesterdayToday")}>
              أمس واليوم
            </ToggleButton>
            <ToggleButton value="last7" onClick={() => applyPreset("last7")}>
              آخر 7 أيام
            </ToggleButton>
            <ToggleButton value="month" onClick={() => applyPreset("month")}>
              هذا الشهر
            </ToggleButton>
            <ToggleButton value="prevMonth" onClick={() => applyPreset("prevMonth")}>
              الشهر الماضي
            </ToggleButton>
          </ToggleButtonGroup>

          {error && <Alert severity="error">{error}</Alert>}

          {running && (
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 900, mb: 0.8 }}>
                جاري المزامنة… {progress.done} / {progress.total}
                {progress.current ? ` — ${progress.current}` : ""}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress.total ? (progress.done / progress.total) * 100 : 0}
              />
            </Paper>
          )}

          {finished && (
            <>
              <Alert severity={failed.length || stopped ? "warning" : "success"}>
                {stopped
                  ? `تم إيقاف المزامنة بعد ${okResults.length} يوم.`
                  : failed.length
                    ? `تمت مزامنة ${okResults.length} يوم وتعذّرت ${failed.length}.`
                    : "تمت المزامنة بنجاح."}
                {failed.length > 0 && (
                  <>
                    {" "}
                    الأيام التي تعذّرت: {failed.map((item) => item.day).join("، ")} — أعد المحاولة
                    لها.
                    <Box component="span" sx={{ display: "block", mt: 0.5, fontSize: 12, opacity: 0.9 }}>
                      السبب: {failed[0].error}
                    </Box>
                  </>
                )}
              </Alert>

              <Box
                sx={{
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "repeat(2,minmax(0,1fr))", md: "repeat(3,minmax(0,1fr))" }
                }}
              >
                {cards.map(([label, value]) => (
                  <Paper key={label} variant="outlined" sx={{ p: 1.2, borderRadius: 2 }}>
                    <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 950 }}>{value}</Typography>
                  </Paper>
                ))}
              </Box>

              {sum("unmapped") > 0 && (
                <Alert severity="info">
                  البصمات غير المربوطة تخص موظفين لم يُربطوا بالبصمة بعد؛ تظهر لهم بصماتهم في
                  الحضور بعد ربطهم.
                </Alert>
              )}
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
          {running ? "جاري المزامنة..." : days.length > 1 ? `مزامنة ${days.length} يوم` : "مزامنة"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
