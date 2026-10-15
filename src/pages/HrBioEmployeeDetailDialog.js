import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";

const pad = (value) => String(value).padStart(2, "0");

// "2026-09-15T13:08:05" -> "1:08 م"  (read from the text: no timezone shifts)
export const fmtClock = (value) => {
  const match = String(value || "").match(/(\d{2}):(\d{2})/);
  if (!match) return "-";
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? "م" : "ص";
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${match[2]} ${suffix}`;
};

export const fmtDateTimeText = (value) => {
  const text = String(value || "");
  const match = text.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return match ? `${match[1]} ${fmtClock(match[2])}` : text || "-";
};

const fmtMinutes = (minutes) => {
  const value = Number(minutes || 0);
  if (!value) return "-";
  return `${Math.floor(value / 60)}:${pad(value % 60)}`;
};

const dayStatus = (day) => {
  const punches = Number(day.punchCount || 0);

  switch (day.status) {
    case "Present":
      return { label: "حاضر", color: "success" };
    case "Late":
      return { label: "متأخر", color: "warning" };
    case "Incomplete":
      return { label: "بصمة واحدة فقط", color: "warning" };
    case "Absent":
      return { label: "غائب", color: "error" };
    case "Off":
      return { label: "إجازة أسبوعية", color: "default" };
    case "Leave":
      return { label: "إجازة", color: "info" };
    case "Holiday":
      return { label: "عطلة", color: "info" };
    case "Permission":
      return { label: "إذن يوم كامل", color: "info" };
    case "Future":
      return { label: "لم يأتِ بعد", color: "default" };
    case "NoSchedule":
      return punches > 0
        ? { label: "بصم (بدون وردية)", color: "success" }
        : { label: "لا بصمة", color: "default" };
    default:
      return punches > 0
        ? { label: "بصم", color: "success" }
        : { label: "لا بصمة", color: "default" };
  }
};

const SEVERITY = { ok: "success", warning: "warning", info: "info" };

export default function HrBioEmployeeDetailDialog({
  open,
  onClose,
  apiBaseUrl,
  employee,
  fromDate,
  toDate
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    if (!open || !employee?.employeeGuid) return undefined;

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setDetail(null);

    const params = new URLSearchParams({
      employeeGuid: employee.employeeGuid,
      fromDate,
      toDate
    });

    fetch(
      `${apiBaseUrl}/api/hr/attendance/report/employee-detail?${params.toString()}`,
      { cache: "no-store", signal: controller.signal }
    )
      .then(async (response) => {
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error
              ? `${result?.message || "تعذر تحميل التفاصيل"}: ${result.error}`
              : result?.message || "تعذر تحميل التفاصيل"
          );
        }

        setDetail(result);
      })
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") {
          setError(requestError?.message || "تعذر تحميل التفاصيل");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, employee, fromDate, toDate, apiBaseUrl]);

  const summary = detail?.summary;
  const days = Array.isArray(detail?.data) ? detail.data : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth dir="rtl">
      <DialogTitle sx={{ fontWeight: 950 }}>
        {employee?.name || "تفاصيل الموظف"}
        <Typography component="div" sx={{ fontSize: 13, opacity: 0.75, fontWeight: 700 }}>
          من {fromDate} إلى {toDate}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
            <CircularProgress size={20} />
            <Typography sx={{ fontWeight: 800 }}>
              جاري تحميل التفاصيل ومطابقتها مع BioTime…
            </Typography>
          </Stack>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {detail && (
          <Stack spacing={1.4}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Chip label={`الفرع: ${detail.employee?.branchName || "-"}`} />
              <Chip label={`كود الموظف: ${detail.employee?.code || "-"}`} />
              <Chip
                color={detail.employee?.linked ? "success" : "warning"}
                label={
                  detail.employee?.linked
                    ? `مربوط — كود البصمة ${detail.employee?.bioTimeCode || "-"}`
                    : "غير مربوط بالبصمة"
                }
              />
            </Stack>

            <Stack spacing={0.8}>
              {(detail.diagnosis || []).map((item, index) => (
                <Alert key={index} severity={SEVERITY[item.level] || "info"}>
                  {item.text}
                </Alert>
              ))}
            </Stack>

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
                [
                  "أيام بصم فيها",
                  `${summary?.daysWithPunches ?? 0} من ${summary?.daysInPeriod ?? 0}`
                ],
                [
                  "بصمات النظام / BioTime",
                  `${summary?.storedPunches ?? 0} / ${summary?.bioTimePunches ?? "-"}`
                ],
                ["أيام التأخير", summary?.lateDays ?? 0],
                ["دقائق التأخير", fmtMinutes(summary?.lateMinutes)],
                ["آخر بصمة على BioTime", fmtDateTimeText(summary?.bioTimeLastPunch)]
              ].map(([label, value]) => (
                <Paper key={label} variant="outlined" sx={{ p: 1.1, borderRadius: 2 }}>
                  <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 800 }}>
                    {label}
                  </Typography>
                  <Typography sx={{ fontSize: 17, fontWeight: 950 }}>{value}</Typography>
                </Paper>
              ))}
            </Box>

            {detail.employee?.linked && (
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>اليوم</TableCell>
                      <TableCell align="center">الحضور</TableCell>
                      <TableCell align="center">الانصراف</TableCell>
                      <TableCell align="center">ساعات العمل</TableCell>
                      <TableCell align="center">التأخير (د)</TableCell>
                      <TableCell>الحالة</TableCell>
                      <TableCell>كل البصمات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {days.map((day) => {
                      const meta = dayStatus(day);
                      return (
                        <TableRow key={day.attendanceDate} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{day.attendanceDate}</TableCell>
                          <TableCell>{day.dayName}</TableCell>
                          <TableCell align="center">{fmtClock(day.checkInAt)}</TableCell>
                          <TableCell align="center">{fmtClock(day.checkOutAt)}</TableCell>
                          <TableCell align="center">{fmtMinutes(day.workedMinutes)}</TableCell>
                          <TableCell align="center">{Number(day.lateMinutes || 0) || "-"}</TableCell>
                          <TableCell>
                            <Chip size="small" color={meta.color} label={meta.label} sx={{ fontWeight: 800 }} />
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                              {(day.punches || []).map((punch, index) => (
                                <Chip
                                  key={index}
                                  size="small"
                                  variant="outlined"
                                  label={`${fmtClock(punch.time)}${punch.terminal ? ` • ${punch.terminal}` : ""}`}
                                />
                              ))}
                              {!(day.punches || []).length && "-"}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose}>إغلاق</Button>
      </DialogActions>
    </Dialog>
  );
}
