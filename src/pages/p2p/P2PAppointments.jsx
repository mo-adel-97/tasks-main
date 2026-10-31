// مواعيد إدارة التعاقدات: الموظف بيسجل مواعيده المستقبلية ويختار التذكيرات (بتوصله في جرس الإشعارات)،
// والإدارة بتشوف مواعيد الفريق كله (عرض فقط).
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import P2PToneChip from "./P2PToneChip";
import { GREEN, GREEN_DARK, confirmBox, dayName, p2pApi, toast, useUi } from "./p2pShared";

export const REMINDER_OPTIONS = [
  { value: 0, label: "وقت الموعد" },
  { value: 15, label: "قبله بـ 15 دقيقة" },
  { value: 30, label: "قبله بـ 30 دقيقة" },
  { value: 60, label: "قبله بساعة" },
  { value: 180, label: "قبله بـ 3 ساعات" },
  { value: 1440, label: "قبله بيوم" },
  { value: 2880, label: "قبله بيومين" },
  { value: 10080, label: "قبله بأسبوع" }
];
const reminderLabel = (m) => REMINDER_OPTIONS.find((o) => o.value === m)?.label || `${m} دقيقة`;

const STATUS = {
  scheduled: { label: "مجدول", tone: "info" },
  done: { label: "تم", tone: "success" },
  cancelled: { label: "ملغي", tone: "default" }
};

const pad = (n) => String(n).padStart(2, "0");
// الوقت الحالي بتوقيت السعودية بصيغة datetime-local
const saudiNowLocal = (addMinutes = 0) => {
  const d = new Date(Date.now() + (new Date().getTimezoneOffset() + 180 + addMinutes) * 60000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const timeOf = (iso) => iso.slice(11, 16);
const dateOf = (iso) => iso.slice(0, 10);

const emptyForm = () => ({ title: "", companyGuid: null, location: "", appointmentAt: saudiNowLocal(60), notes: "", reminders: [60, 1440] });

function AppointmentDialog({ open, appointment, companies, onClose, onSaved }) {
  const ui = useUi();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      appointment
        ? { title: appointment.title || "", companyGuid: appointment.companyGuid, location: appointment.location || "", appointmentAt: appointment.appointmentAt, notes: appointment.notes || "", reminders: appointment.reminders || [] }
        : emptyForm()
    );
  }, [open, appointment]);

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const toggleReminder = (value) =>
    setForm((p) => ({ ...p, reminders: p.reminders.includes(value) ? p.reminders.filter((x) => x !== value) : [...p.reminders, value] }));

  const save = async () => {
    if (!form.title.trim()) return toast("warning", "مطلوب", "اكتب عنوان الموعد");
    if (!form.appointmentAt) return toast("warning", "مطلوب", "حدد تاريخ ووقت الموعد");
    setSaving(true);
    try {
      const body = { ...form, appointmentAt: `${form.appointmentAt}:00`.slice(0, 19) };
      const result = appointment
        ? await p2pApi(`/appointments/${appointment.guid}`, { method: "PUT", body })
        : await p2pApi("/appointments", { method: "POST", body });
      toast("success", "تم", result?.message);
      onSaved?.();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth dir="rtl" PaperProps={{ sx: ui.dialogPaper }}>
      <DialogTitle sx={{ fontWeight: 900, color: "#fff", background: `linear-gradient(135deg,${GREEN},${GREEN_DARK})` }}>
        {appointment ? "تعديل الموعد" : "موعد جديد"}
      </DialogTitle>
      <DialogContent sx={{ pt: "18px !important" }}>
        <Stack spacing={1.5}>
          <TextField label="عنوان الموعد *" value={form.title} onChange={set("title")} placeholder="مثال: اجتماع لعرض برامج التدريب" fullWidth inputProps={{ maxLength: 200 }} />
          <Autocomplete
            options={companies}
            getOptionLabel={(c) => c?.name || ""}
            value={companies.find((c) => c.guid === form.companyGuid) || null}
            onChange={(_, c) => setForm((p) => ({ ...p, companyGuid: c?.guid || null }))}
            isOptionEqualToValue={(a, b) => a.guid === b.guid}
            renderInput={(params) => <TextField {...params} label="الشركة (اختياري)" />}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField type="datetime-local" label="التاريخ والوقت *" value={form.appointmentAt} onChange={set("appointmentAt")} InputLabelProps={{ shrink: true }} sx={{ minWidth: 230 }} />
            <TextField label="المكان" value={form.location} onChange={set("location")} fullWidth inputProps={{ maxLength: 300 }} />
          </Stack>
          <TextField label="ملاحظات" value={form.notes} onChange={set("notes")} multiline minRows={2} fullWidth inputProps={{ maxLength: 1000 }} />
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 0.5, display: "flex", alignItems: "center", gap: 0.6 }}>
              <NotificationsActiveRoundedIcon fontSize="small" sx={{ color: ui.greenText }} /> التذكير في جرس الإشعارات
            </Typography>
            <Grid container>
              {REMINDER_OPTIONS.map((o) => (
                <Grid item xs={6} sm={3} key={o.value}>
                  <FormControlLabel control={<Checkbox size="small" checked={form.reminders.includes(o.value)} onChange={() => toggleReminder(o.value)} />} label={<Typography sx={{ fontSize: 13 }}>{o.label}</Typography>} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} disabled={saving} color="inherit">إلغاء</Button>
        <Button variant="contained" onClick={save} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={ui.primaryBtn}>حفظ</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function P2PAppointments({ me, focusGuid }) {
  const ui = useUi();
  const isManager = me?.role === "manager";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState("");
  const [view, setView] = useState("upcoming");
  const [dialog, setDialog] = useState({ open: false, appointment: null });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await p2pApi("/appointments", { query: { employeeGuid: employee } });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    } finally {
      setLoading(false);
    }
  }, [employee]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isManager) p2pApi("/employees").then(setEmployees).catch(() => {});
    else p2pApi("/companies").then((r) => setCompanies((r || []).filter((c) => c.isActive))).catch(() => {});
  }, [isManager]);

  // فتح الموعد من الإشعار
  useEffect(() => {
    if (!focusGuid || !rows.length) return;
    const row = rows.find((r) => String(r.guid).toLowerCase() === String(focusGuid).toLowerCase());
    if (row) {
      setView(row.status === "scheduled" ? (row.overdue ? "overdue" : "upcoming") : "history");
      setTimeout(() => document.getElementById(`appt-${row.guid}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 200);
    }
  }, [focusGuid, rows]);

  const groups = useMemo(() => {
    const upcoming = rows.filter((r) => r.status === "scheduled" && !r.overdue);
    const overdue = rows.filter((r) => r.status === "scheduled" && r.overdue);
    const history = rows.filter((r) => r.status !== "scheduled").sort((a, b) => b.appointmentAt.localeCompare(a.appointmentAt));
    return { upcoming, overdue, history };
  }, [rows]);

  const today = saudiNowLocal().slice(0, 10);
  const list = groups[view] || [];
  const byDay = useMemo(() => {
    const map = new Map();
    list.forEach((r) => {
      const d = dateOf(r.appointmentAt);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(r);
    });
    return [...map.entries()];
  }, [list]);

  const setStatus = async (row, status) => {
    const label = status === "done" ? "تسجيل الموعد كمنجز" : status === "cancelled" ? "إلغاء الموعد" : "إعادة الموعد للجدول";
    if (!(await confirmBox(label, `${row.title} — ${row.appointmentAt.replace("T", " ")}`, "تأكيد"))) return;
    try {
      const r = await p2pApi(`/appointments/${row.guid}/status`, { method: "POST", body: { status } });
      toast("success", "تم", r.message);
      load();
    } catch (e) {
      toast("error", "حدث خطأ", e.message);
    }
  };

  const dayTitle = (d) => (d === today ? "اليوم" : `${dayName(d)} ${d}`);
  const tabs = [
    { key: "upcoming", label: "القادمة", count: groups.upcoming.length },
    { key: "overdue", label: "فات موعدها ولم تُسجَّل", count: groups.overdue.length },
    { key: "history", label: "المنجزة والملغاة", count: groups.history.length }
  ];

  return (
    <Stack spacing={1.5}>
      <Paper elevation={0} sx={{ ...ui.card, p: 1.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
            {tabs.map((t) => (
              <Chip
                key={t.key}
                label={`${t.label} (${t.count})`}
                onClick={() => setView(t.key)}
                color={view === t.key ? (t.key === "overdue" ? "warning" : "success") : "default"}
                variant={view === t.key ? "filled" : "outlined"}
                sx={{ fontWeight: 800 }}
              />
            ))}
          </Stack>
          {isManager ? (
            <TextField select size="small" label="الموظف" value={employee} onChange={(e) => setEmployee(e.target.value)} sx={{ minWidth: 260 }}>
              <MenuItem value="">كل الموظفين</MenuItem>
              {employees.map((x) => <MenuItem key={x.guid} value={x.guid}>{x.name}</MenuItem>)}
            </TextField>
          ) : (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setDialog({ open: true, appointment: null })} sx={ui.primaryBtn}>
              موعد جديد
            </Button>
          )}
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box>
      ) : !byDay.length ? (
        <Paper elevation={0} sx={{ ...ui.card, p: 5, textAlign: "center" }}>
          <EventRoundedIcon sx={{ fontSize: 46, color: "text.disabled" }} />
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {view === "upcoming" ? (isManager ? "لا توجد مواعيد قادمة للفريق" : "لا توجد مواعيد قادمة — أضف موعدك القادم ليصلك تذكير به") : "لا توجد مواعيد هنا"}
          </Typography>
        </Paper>
      ) : (
        byDay.map(([day, items]) => (
          <Paper key={day} elevation={0} sx={{ ...ui.card, p: 1.5 }}>
            <Typography sx={{ ...ui.sectionTitle, mb: 1, fontSize: 15 }}>{dayTitle(day)}</Typography>
            <Stack spacing={1}>
              {items.map((row) => {
                const focused = focusGuid && String(row.guid).toLowerCase() === String(focusGuid).toLowerCase();
                return (
                  <Box
                    id={`appt-${row.guid}`}
                    key={row.guid}
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "flex-start",
                      p: 1.3,
                      borderRadius: 2.5,
                      border: `1px solid ${focused ? ui.greenText : ui.dark ? "rgba(255,255,255,.08)" : alpha(GREEN, 0.12)}`,
                      bgcolor: focused ? ui.soft : "transparent",
                      opacity: row.status === "cancelled" ? 0.65 : 1
                    }}
                  >
                    <Box sx={{ minWidth: 62, textAlign: "center", py: 0.5, borderRadius: 2, bgcolor: ui.soft }}>
                      <Typography sx={{ fontWeight: 900, fontSize: 18, color: ui.greenText, direction: "ltr" }}>{timeOf(row.appointmentAt)}</Typography>
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography sx={{ fontWeight: 900 }}>{row.title}</Typography>
                        <P2PToneChip size="small" label={row.overdue ? "فات موعده" : STATUS[row.status]?.label} tone={row.overdue ? "warning" : STATUS[row.status]?.tone} />
                        {isManager ? <Chip size="small" variant="outlined" label={row.employeeName} sx={{ fontWeight: 700 }} /> : null}
                      </Stack>
                      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.4, color: "text.secondary", fontSize: 13 }}>
                        {row.companyName ? <Stack direction="row" spacing={0.4} alignItems="center"><BusinessRoundedIcon sx={{ fontSize: 16 }} /><span>{row.companyName}</span></Stack> : null}
                        {row.location ? <Stack direction="row" spacing={0.4} alignItems="center"><PlaceRoundedIcon sx={{ fontSize: 16 }} /><span>{row.location}</span></Stack> : null}
                        {row.reminders?.length ? (
                          <Stack direction="row" spacing={0.4} alignItems="center"><NotificationsActiveRoundedIcon sx={{ fontSize: 16 }} /><span>{row.reminders.map(reminderLabel).join("، ")}</span></Stack>
                        ) : null}
                      </Stack>
                      {row.notes ? <Typography sx={{ fontSize: 13, mt: 0.5, whiteSpace: "pre-wrap" }}>{row.notes}</Typography> : null}
                      {row.outcome ? <Typography sx={{ fontSize: 13, mt: 0.5, color: ui.greenText }}>النتيجة: {row.outcome}</Typography> : null}
                    </Box>
                    {row.isMine ? (
                      <Stack direction="row" spacing={0.3}>
                        {row.status === "scheduled" ? (
                          <>
                            <Tooltip title="تم"><IconButton size="small" color="success" onClick={() => setStatus(row, "done")} aria-label="تم"><CheckCircleRoundedIcon /></IconButton></Tooltip>
                            <Tooltip title="تعديل"><IconButton size="small" onClick={() => setDialog({ open: true, appointment: row })} aria-label="تعديل"><EditRoundedIcon /></IconButton></Tooltip>
                            <Tooltip title="إلغاء الموعد"><IconButton size="small" color="error" onClick={() => setStatus(row, "cancelled")} aria-label="إلغاء الموعد"><CancelRoundedIcon /></IconButton></Tooltip>
                          </>
                        ) : (
                          <Tooltip title="إعادة للجدول"><IconButton size="small" onClick={() => setStatus(row, "scheduled")} aria-label="إعادة للجدول"><ReplayRoundedIcon /></IconButton></Tooltip>
                        )}
                      </Stack>
                    ) : null}
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        ))
      )}

      <AppointmentDialog
        open={dialog.open}
        appointment={dialog.appointment}
        companies={companies}
        onClose={() => setDialog({ open: false, appointment: null })}
        onSaved={() => {
          setDialog({ open: false, appointment: null });
          load();
        }}
      />
    </Stack>
  );
}
